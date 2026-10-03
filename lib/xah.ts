import { randomInt } from "node:crypto";

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

export type XahProviderId = "primary" | "fallback_1" | "fallback_2";
export type ReaderProviderId = "ckey" | "apiz";
type ApiProvider = { id: XahProviderId | ReaderProviderId; label: string; baseUrl: string; apiKey: string; model: string };

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

export function getPromptLabModel() {
  return process.env.PROMPT_LAB_MODEL?.trim()
    || process.env.XAH_FALLBACK_PREMIUM_MODEL?.trim()
    || "santiagosgrantp/gpt-6-astra";
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

async function openProviderStream(provider: ApiProvider, messages: XahMessage[], onOpen?: (controller: AbortController) => void): Promise<OpenStream> {
  const abortController = new AbortController();
  const firstByteTimeout = setTimeout(() => abortController.abort(), FIRST_BYTE_TIMEOUT_MS);
  onOpen?.(abortController);
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

type ReaderRoutingLog = {
  provider_selected: ReaderProviderId;
  provider_used: ReaderProviderId | null;
  fallback_used: boolean;
  first_provider_error: { name: string; status: number | null } | null;
};

function logReaderRouting(log: ReaderRoutingLog) {
  console.info(`[AI Router] selected=${log.provider_selected} used=${log.provider_used ?? "none"} fallback=${log.fallback_used}`, { ...log });
}

function readProviderWeight(value: string | undefined) {
  if (!value?.trim()) return 50;
  const weight = Number(value);
  return Number.isFinite(weight) && weight >= 0 ? weight : 50;
}

/** Server-only selection. Zero weight excludes the initial pick, not fallback. */
export function selectProviderByWeight(
  weights: Record<ReaderProviderId, number>,
  sample = randomInt(0, 0x100000000) / 0x100000000
): ReaderProviderId {
  const total = weights.ckey + weights.apiz;
  if (!Number.isFinite(total) || total <= 0 || weights.ckey < 0 || weights.apiz < 0) {
    throw new Error("AI_CKEY_WEIGHT và AI_APIZ_WEIGHT phải có tổng lớn hơn 0.");
  }
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error("Mẫu chọn provider không hợp lệ.");
  return sample * total < weights.ckey ? "ckey" : "apiz";
}

/** Tarot only: pick before any outbound request; at most one sequential fallback. */
export async function tarotReaderChatStream(messages: XahMessage[]) {
  const model = "gpt-6-astra";
  const providers: ApiProvider[] = [];
  const ckeyKey = process.env.XAH_API_KEY?.trim();
  const apizKey = process.env.APIZ_API_KEY?.trim();
  if (ckeyKey) {
    if ((process.env.XAH_PREMIUM_MODEL?.trim() || model) !== model) throw new Error("Tarot AI Router yêu cầu XAH_PREMIUM_MODEL=gpt-6-astra.");
    providers.push({ id: "ckey", label: "AI CKEY", baseUrl: cleanBaseUrl(process.env.XAH_BASE_URL, "https://api.xah.io/v1"), apiKey: ckeyKey, model });
  }
  if (apizKey) {
    if ((process.env.APIZ_MODEL?.trim() || model) !== model) throw new Error("Tarot AI Router yêu cầu APIZ_MODEL=gpt-6-astra.");
    providers.push({ id: "apiz", label: "AI APIZ", baseUrl: cleanBaseUrl(process.env.APIZ_BASE_URL, "https://api.apiz.vn/v1"), apiKey: apizKey, model });
  }
  if (!providers.length) throw new Error("Thiếu XAH_API_KEY và APIZ_API_KEY trên máy chủ.");
  const selected = selectProviderByWeight({
    ckey: ckeyKey ? readProviderWeight(process.env.AI_CKEY_WEIGHT) : 0,
    apiz: apizKey ? readProviderWeight(process.env.AI_APIZ_WEIGHT) : 0
  });
  const ordered = [...providers.filter(p => p.id === selected), ...providers.filter(p => p.id !== selected)];
  const log: ReaderRoutingLog = { provider_selected: selected, provider_used: null, fallback_used: false, first_provider_error: null };
  logReaderRouting(log);
  return streamWithProviders(messages, ordered, log);
}

export async function xahChatStream(
  messages: XahMessage[],
  model = getXahModel("premium"),
  onlyProvider?: XahProviderId
) {
  const configured = configuredProviders(model);
  const providers = onlyProvider
    ? configured.filter((provider) => provider.id === onlyProvider)
    : configured;
  if (!providers.length) {
    const label = onlyProvider === "fallback_1"
      ? "XAH_FALLBACK_API_KEY"
      : onlyProvider === "fallback_2"
        ? "XAH_FALLBACK_2_API_KEY"
        : "API key";
    throw new Error(`Prompt Lab thiếu ${label} trên máy chủ.`);
  }
  return streamWithProviders(messages, providers);
}

async function streamWithProviders(messages: XahMessage[], providers: ApiProvider[], routingLog?: ReaderRoutingLog) {
  const recordFailure = (provider: ApiProvider, failure: ProviderFailure) => {
    markFailure(provider, failure);
    if (routingLog && provider.id === routingLog.provider_selected && !routingLog.first_provider_error) {
      // Never log credentials, prompts, cards or raw upstream error bodies.
      routingLog.first_provider_error = { name: failure.name, status: failure.status ?? null };
      logReaderRouting(routingLog);
    }
  };
  let pendingAbortController: AbortController | null = null;
  const open = async (index: number) => {
    if (routingLog && index > 0) {
      routingLog.fallback_used = true;
      logReaderRouting(routingLog);
    }
    try {
      return await openProviderStream(providers[index], messages, routingLog ? controller => { pendingAbortController = controller; } : undefined);
    } finally { pendingAbortController = null; }
  };
  const failures: ProviderFailure[] = [];
  let firstOpen: OpenStream | null = null;
  let firstIndex = -1;
  for (let index = 0; index < providers.length; index += 1) {
    try {
      firstOpen = await open(index);
      firstIndex = index;
      break;
    } catch (error) {
      const failure = normalizeFailure(error, providers[index]);
      failures.push(failure);
      recordFailure(providers[index], failure);
      if (!routingLog && !failure.retryable) throw failure;
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
          if (routingLog) {
            routingLog.provider_used = provider.id as ReaderProviderId;
            logReaderRouting(routingLog);
          }
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
          recordFailure(provider, failure);
          if (cancelled) return;
          if (emitted || (!routingLog && !failure.retryable)) { controller.error(failure); return; }
        } finally {
          clearTimeout(firstByteTimeout);
          if (streamTimeout) clearTimeout(streamTimeout);
          if (routingLog) {
            abortController.abort();
            try { await reader.cancel(); } catch { /* Upstream may already have errored. */ }
          }
          reader.releaseLock();
          activeOpen = null;
        }

        opened = null;
        nextIndex += 1;
        while (nextIndex < providers.length && !opened && !cancelled) {
          try { opened = await open(nextIndex); }
          catch (error) {
            if (cancelled) return;
            const failure = normalizeFailure(error, providers[nextIndex]);
            failures.push(failure);
            recordFailure(providers[nextIndex], failure);
            if (!routingLog && !failure.retryable) { controller.error(failure); return; }
            nextIndex += 1;
          }
        }
      }
      if (!cancelled) controller.error(allProvidersFailed(failures));
    },
    cancel() {
      cancelled = true;
      pendingAbortController?.abort();
      if (activeOpen) {
        clearTimeout(activeOpen.firstByteTimeout);
        activeOpen.abortController.abort();
      }
    }
  });
}
