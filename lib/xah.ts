export type XahMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
    message?: {
      role?: string;
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    code?: string | number;
    type?: string;
  };
};

function responseText(data: ChatCompletionResponse) {
  return (
    data.choices?.[0]?.delta?.content ||
    data.choices?.[0]?.message?.content ||
    ""
  );
}

const XAH_BASE_URL = (
  process.env.XAH_BASE_URL?.trim() || "https://api.xah.io/v1"
).replace(/\/$/, "");

export type XahModelTier = "free" | "premium";

export function getXahModel(tier: XahModelTier) {
  if (tier === "free") {
    return process.env.XAH_FREE_MODEL?.trim() || "gpt-5.6-sol";
  }
  return process.env.XAH_PREMIUM_MODEL?.trim()
    || process.env.XAH_MODEL?.trim()
    || "gpt-6-astra";
}

function friendlyXahError(status: number, detail: string, model: string) {
  if (status === 401) {
    return "API key không hợp lệ. Hãy kiểm tra XAH_API_KEY trong file .env.local.";
  }
  if (status === 403) {
    return "API từ chối quyền truy cập. Hãy kiểm tra API key và quyền sử dụng model.";
  }
  if (status === 404) {
    return `Không tìm thấy model ${model} trên XAH hoặc endpoint /chat/completions không tồn tại.`;
  }
  if (status === 429) {
    return "API đang giới hạn lượt gọi hoặc tài khoản không đủ số dư. Hãy kiểm tra tài khoản API rồi thử lại.";
  }
  return detail || `API trả về lỗi HTTP ${status}.`;
}

export async function xahChat(messages: XahMessage[], model = getXahModel("premium")) {
  const apiKey = process.env.XAH_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Thiếu XAH_API_KEY trong file .env.local.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(`${XAH_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await response.text();
    let data: ChatCompletionResponse = {};

    try {
      data = raw ? (JSON.parse(raw) as ChatCompletionResponse) : {};
    } catch {
      // Giữ raw để hiển thị lỗi provider rõ hơn ở dưới.
    }

    if (!response.ok) {
      const detail = data.error?.message || raw || `HTTP ${response.status}`;
      throw new Error(friendlyXahError(response.status, detail, model));
    }

    const text = responseText(data).trim();
    if (!text) {
      throw new Error("GPT đã phản hồi nhưng không có nội dung để hiển thị.");
    }

    return text;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("GPT phản hồi quá chậm. Hãy thử lại.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function xahChatStream(messages: XahMessage[], model = getXahModel("premium")) {
  const apiKey = process.env.XAH_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Thiếu XAH_API_KEY trong file .env.local.");
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 120_000);

  let response: Response;
  try {
    response = await fetch(`${XAH_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      cache: "no-store",
      signal: abortController.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("GPT phản hồi quá chậm. Hãy thử lại.");
    }
    throw error;
  }

  if (!response.ok) {
    clearTimeout(timeout);
    const raw = await response.text();
    let data: ChatCompletionResponse = {};
    try {
      data = raw ? (JSON.parse(raw) as ChatCompletionResponse) : {};
    } catch {
      // Giữ raw để trả lỗi provider rõ hơn.
    }
    const detail = data.error?.message || raw || `HTTP ${response.status}`;
    throw new Error(friendlyXahError(response.status, detail, model));
  }

  if (!response.body) {
    clearTimeout(timeout);
    throw new Error("GPT đã kết nối nhưng không tạo được luồng nội dung.");
  }

  const upstreamReader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let finished = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let receivedSseEvent = false;

      const emitEvent = (eventBlock: string) => {
        const payload = eventBlock
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n")
          .trim();

        if (!payload) return false;
        receivedSseEvent = true;
        if (payload === "[DONE]") return true;

        const data = JSON.parse(payload) as ChatCompletionResponse;
        if (data.error?.message) throw new Error(data.error.message);
        const text = responseText(data);
        if (text) controller.enqueue(encoder.encode(text));
        return false;
      };

      try {
        while (!finished) {
          const { done, value } = await upstreamReader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.search(/\r?\n\r?\n/);
          while (boundary >= 0) {
            const eventBlock = buffer.slice(0, boundary);
            const separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] || "\n\n";
            buffer = buffer.slice(boundary + separator.length);
            if (emitEvent(eventBlock)) {
              finished = true;
              break;
            }
            boundary = buffer.search(/\r?\n\r?\n/);
          }
        }

        buffer += decoder.decode();
        if (!finished && buffer.trim()) {
          if (buffer.trimStart().startsWith("data:")) {
            emitEvent(buffer);
          } else if (!receivedSseEvent) {
            const data = JSON.parse(buffer) as ChatCompletionResponse;
            const text = responseText(data);
            if (!text) throw new Error("GPT đã phản hồi nhưng không có nội dung để hiển thị.");
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (error) {
        controller.error(
          error instanceof Error && error.name === "AbortError"
            ? new Error("GPT phản hồi quá chậm. Hãy thử lại.")
            : error
        );
      } finally {
        finished = true;
        clearTimeout(timeout);
        upstreamReader.releaseLock();
      }
    },
    cancel() {
      finished = true;
      clearTimeout(timeout);
      abortController.abort();
      void upstreamReader.cancel();
    },
  });
}
