export type XahMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    delta?: { content?: string | null };
    message?: { role?: string; content?: string | null };
  }>;
  error?: { message?: string; code?: string | number; type?: string };
};

type ProviderId = "primary" | "fallback_1" | "fallback_2";
type ApiProvider = { id: ProviderId; label: string; baseUrl: string; apiKey: string; model: string };

class ProviderFailure extends Error {
  constructor(message: string, public retryable = true, public status?: number) {
    super(message);
    this.name = "ProviderFailure";
  }
}

function responseText(data: ChatCompletionResponse) {
  return data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content || "";
}

function cleanBaseUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/$/, "");
}

function readPositiveInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

const PRIMARY_BASE_URL = cleanBaseUrl(process.env.XAH_BASE_URL, "https://api.xah.io/v1");
const FIRST_BYTE_TIMEOUT_MS = readPositiveInt(process.env.XAH_FIRST_BYTE_TIMEOUT_MS, 25_000, 5_000, 120_000);
const STREAM_TIMEOUT_MS = readPositiveInt(process.env.XAH_STREAM_TIMEOUT_MS, 120_000, 30_000, 300_000);
const NON_STREAM_TIMEOUT_MS = readPositiveInt(process.env.XAH_NON_STREAM_TIMEOUT_MS, 60_000, 10_000, 180_000);
const FAILOVER_COOLDOWN_MS = readPositiveInt(process.env.XAH_FAILOVER_COOLDOWN_MS, 60_000, 5_000, 600_000);
let primaryDisabledUntil = 0;

export type XahModelTier = "free" | "premium";

export function getXahModel(tier: XahModelTier) {
  if (tier === "free") return process.env.XAH_FREE_MODEL?.trim() || "gpt-5.6-sol";
  return process.env.XAH_PREMIUM_MODEL?.trim() || process.env.XAH_MODEL?.trim() || "gpt-6-astra";
}

function tierForRequestedModel(model: string): XahModelTier {
  return model === getXahModel("free") ? "free" : "premium";
}

function fallbackModel(slot: 1 | 2, requestedModel: string) {
  const prefix = slot === 1 ? "XAH_FALLBACK_" : "XAH_FALLBACK_2_";
  const tier = tierForRequestedModel(requestedModel);
  return process.env[`${prefix}${tier === "free" ? "FREE_MODEL" : "PREMIUM_MODEL"}`]?.trim()
    || process.env[`${prefix}MODEL`]?.trim()
    || requestedModel;
}

function configuredProviders(requestedModel: string) {
  const providers: ApiProvider[] = [];
  const primaryKey = process.env.XAH_API_KEY?.trim();
  const fallbackKey = process.env.XAH_FALLBACK_API_KEY?.trim();
  const fallback2Key = process.env.XAH_FALLBACK_2_API_KEY?.trim();
  if (primaryKey) providers.push({ id: "primary", label: "API chính", baseUrl: PRIMARY_BASE_URL, apiKey: primaryKey, model: requestedModel });
  if (fallbackKey) providers.push({
    id: "fallback_1", label: "API dự phòng 1",
    baseUrl: cleanBaseUrl(process.env.XAH_FALLBACK_BASE_URL, PRIMARY_BASE_URL),
    apiKey: fallbackKey, model: fallbackModel(1, requestedModel)
  });
  if (fallback2Key) providers.push({
    id: "fallback_2", label: "API dự phòng 2",
    baseUrl: cleanBaseUrl(process.env.XAH_FALLBACK_2_BASE_URL, PRIMARY_BASE_URL),
    apiKey: fallback2Key, model: fallbackModel(2, requestedModel)
  });
  if (!providers.length) throw new Error("Thiếu XAH_API_KEY và chưa cấu hình API dự phòng trên máy chủ.");
  if (Date.now() < primaryDisabledUntil && providers.length > 1) {
    return [...providers.filter((item) => item.id !== "primary"), ...providers.filter((item) => item.id === "primary")];
  }
  return providers;
}

function isRetryableStatus(status: number) {
  return status === 401 || status === 403 || status === 404 || status === 408 || status === 425 || status === 429 || status >= 500;
}

function friendlyProviderError(status: number, detail: string, provider: ApiProvider) {
  if (status === 401) return `${provider.label}: API key không hợp lệ.`;
  if (status === 403) return `${provider.label}: không có quyền sử dụng model ${provider.model}.`;
  if (status === 404) return `${provider.label}: không tìm thấy model ${provider.model} hoặc endpoint chat/completions.`;
  if (status === 408) return `${provider.label}: phản hồi quá chậm.`;
  if (status === 429) return `${provider.label}: đang giới hạn lượt gọi hoặc tài khoản không đủ số dư.`;
  if (status >= 500) return `${provider.label}: máy chủ đang gặp sự cố HTTP ${status}.`;
  return `${provider.label}: ${detail || `HTTP ${status}`}`;
}

function markFailure(provider: ApiProvider, failure: ProviderFailure) {
  if (provider.id === "primary" && failure.retryable) primaryDisabledUntil = Date.now() + FAILOVER_COOLDOWN_MS;
}

function markSuccess(provider: ApiProvider) {
  if (provider.id === "primary") primaryDisabledUntil = 0;
}

function normalizeFailure(error: unknown, provider: ApiProvider) {
  if (error instanceof ProviderFailure) return error;
  if (error instanceof Error && error.name === "AbortError") return new ProviderFailure(`${provider.label}: phản hồi quá chậm.`, true, 408);
  return new ProviderFailure(`${provider.label}: ${error instanceof Error ? error.message : "không thể kết nối."}`, true);
}

function allProvidersFailed(failures: ProviderFailure[]) {
  return new Error(`Không thể kết nối API chính hoặc API dự phòng. ${failures.map((failure) => failure.message).filter(Boolean).join(" ")}`.trim());
}

async function errorFromResponse(response: Response, provider: ApiProvider) {
  const raw = await response.text();
  let data: ChatCompletionResponse = {};
  try { data = raw ? JSON.parse(raw) as ChatCompletionResponse : {}; } catch { /* Dùng raw bên dưới. */ }
  const detail = data.error?.message || raw || `HTTP ${response.status}`;
  return new ProviderFailure(friendlyProviderError(response.status, detail, provider), isRetryableStatus(response.status), response.status);
}

export async function xahChat(messages: XahMessage[], model = getXahModel("premium")) {
  const providers = configuredProviders(model);
  const failures: ProviderFailure[] = [];
  for (const provider of providers) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), NON_STREAM_TIMEOUT_MS);
    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: provider.model, messages }),
        cache: "no-store",
        signal: abortController.signal
      });
      if (!response.ok) throw await errorFromResponse(response, provider);
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) as ChatCompletionResponse : {};
      if (data.error?.message) throw new ProviderFailure(`${provider.label}: ${data.error.message}`, true);
      const text = responseText(data).trim();
      if (!text) throw new ProviderFailure(`${provider.label}: phản hồi không có nội dung.`, true);
      markSuccess(provider);
      return text;
    } catch (error) {
      const failure = normalizeFailure(error, provider);
      failures.push(failure);
      markFailure(provider, failure);
      if (!failure.retryable) throw failure;
    } finally { clearTimeout(timeout); }
  }
  throw allProvidersFailed(failures);
}

type OpenStream = {
  provider: ApiProvider;
  response: Response;
  abortController: AbortController;
  firstByteTimeout: ReturnType<typeof setTimeout>;
};

async function openProviderStream(provider: ApiProvider, messages: XahMessage[]): Promise<OpenStream> {
  const abortController = new AbortController();
  const firstByteTimeout = setTimeout(() => abortController.abort(), FIRST_BYTE_TIMEOUT_MS);
  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: provider.model, messages, stream: true }),
      cache: "no-store",
      signal: abortController.signal
    });
    if (!response.ok) {
      clearTimeout(firstByteTimeout);
      throw await errorFromResponse(response, provider);
    }
    if (!response.body) {
      clearTimeout(firstByteTimeout);
      throw new ProviderFailure(`${provider.label}: không tạo được luồng nội dung.`, true);
    }
    return { provider, response, abortController, firstByteTimeout };
  } catch (error) {
    clearTimeout(firstByteTimeout);
    abortController.abort();
    throw normalizeFailure(error, provider);
  }
}

export async function xahChatStream(messages: XahMessage[], model = getXahModel("premium")) {
  const providers = configuredProviders(model);
  const failures: ProviderFailure[] = [];
  let firstOpen: OpenStream | null = null;
  let firstIndex = -1;
  for (let index = 0; index < providers.length; index += 1) {
    try {
      firstOpen = await openProviderStream(providers[index], messages);
      firstIndex = index;
      break;
    } catch (error) {
      const failure = normalizeFailure(error, providers[index]);
      failures.push(failure);
      markFailure(providers[index], failure);
      if (!failure.retryable) throw failure;
    }
  }
  if (!firstOpen || firstIndex < 0) throw allProvidersFailed(failures);

  const encoder = new TextEncoder();
  let activeOpen: OpenStream | null = firstOpen;
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let nextIndex = firstIndex;
      let opened: OpenStream | null = firstOpen;
      while (opened && !cancelled) {
        activeOpen = opened;
        const { provider, response, abortController, firstByteTimeout } = opened;
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let streamTimeout: ReturnType<typeof setTimeout> | null = null;
        let buffer = "";
        let emitted = false;
        let receivedSseEvent = false;
        let finished = false;

        const markFirstContent = () => {
          if (emitted) return;
          emitted = true;
          clearTimeout(firstByteTimeout);
          streamTimeout = setTimeout(() => abortController.abort(), STREAM_TIMEOUT_MS);
          markSuccess(provider);
        };
        const emitEvent = (eventBlock: string) => {
          const payload = eventBlock.split(/\r?\n/).filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart()).join("\n").trim();
          if (!payload) return false;
          receivedSseEvent = true;
          if (payload === "[DONE]") return true;
          const data = JSON.parse(payload) as ChatCompletionResponse;
          if (data.error?.message) throw new ProviderFailure(`${provider.label}: ${data.error.message}`, true);
          const text = responseText(data);
          if (text) { markFirstContent(); controller.enqueue(encoder.encode(text)); }
          return false;
        };

        try {
          while (!finished && !cancelled) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.search(/\r?\n\r?\n/);
            while (boundary >= 0) {
              const eventBlock = buffer.slice(0, boundary);
              const separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] || "\n\n";
              buffer = buffer.slice(boundary + separator.length);
              if (emitEvent(eventBlock)) { finished = true; break; }
              boundary = buffer.search(/\r?\n\r?\n/);
            }
          }
          buffer += decoder.decode();
          if (!finished && buffer.trim()) {
            if (buffer.trimStart().startsWith("data:")) emitEvent(buffer);
            else if (!receivedSseEvent) {
              const data = JSON.parse(buffer) as ChatCompletionResponse;
              const text = responseText(data);
              if (!text) throw new ProviderFailure(`${provider.label}: phản hồi không có nội dung.`, true);
              markFirstContent();
              controller.enqueue(encoder.encode(text));
            }
          }
          if (!emitted) throw new ProviderFailure(`${provider.label}: luồng phản hồi không có nội dung.`, true);
          controller.close();
          return;
        } catch (error) {
          const failure = normalizeFailure(error, provider);
          failures.push(failure);
          markFailure(provider, failure);
          if (emitted || !failure.retryable) { controller.error(failure); return; }
        } finally {
          clearTimeout(firstByteTimeout);
          if (streamTimeout) clearTimeout(streamTimeout);
          reader.releaseLock();
          activeOpen = null;
        }

        opened = null;
        nextIndex += 1;
        while (nextIndex < providers.length && !opened && !cancelled) {
          try { opened = await openProviderStream(providers[nextIndex], messages); }
          catch (error) {
            const failure = normalizeFailure(error, providers[nextIndex]);
            failures.push(failure);
            markFailure(providers[nextIndex], failure);
            if (!failure.retryable) { controller.error(failure); return; }
            nextIndex += 1;
          }
        }
      }
      if (!cancelled) controller.error(allProvidersFailed(failures));
    },
    cancel() {
      cancelled = true;
      if (activeOpen) {
        clearTimeout(activeOpen.firstByteTimeout);
        activeOpen.abortController.abort();
      }
    }
  });
}
