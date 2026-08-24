export type XahMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
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

const XAH_BASE_URL = (
  process.env.XAH_BASE_URL?.trim() || "https://api.xah.io/v1"
).replace(/\/$/, "");

const XAH_MODEL =
  process.env.XAH_MODEL?.trim() || "stableai/gpt-5.6-sol";

function friendlyXahError(status: number, detail: string) {
  if (status === 401) {
    return "API key không hợp lệ. Hãy kiểm tra XAH_API_KEY trong file .env.local.";
  }
  if (status === 403) {
    return "API từ chối quyền truy cập. Hãy kiểm tra API key và quyền sử dụng model.";
  }
  if (status === 404) {
    return `Không tìm thấy model ${XAH_MODEL} hoặc endpoint API không tồn tại.`;
  }
  if (status === 429) {
    return "API đang giới hạn lượt gọi hoặc tài khoản không đủ số dư. Hãy kiểm tra tài khoản API rồi thử lại.";
  }
  return detail || `API trả về lỗi HTTP ${status}.`;
}

export async function xahChat(messages: XahMessage[]) {
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
        model: XAH_MODEL,
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
      throw new Error(friendlyXahError(response.status, detail));
    }

    const text = data.choices?.[0]?.message?.content?.trim();
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
