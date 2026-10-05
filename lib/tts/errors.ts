export class TtsError extends Error {
  constructor(public readonly code: string, message: string, public readonly details: Record<string, string | number> = {}) {
    super(message);
    this.name = "TtsError";
  }
}

export function ttsFailure(error: unknown) {
  if (error instanceof TtsError) return { code: error.code, message: error.message, details: error.details };
  return { code: "TTS_STREAM_ERROR", message: "Kết nối tạo giọng đọc bị ngắt. Vui lòng thử lại.", details: {} };
}

export function providerFailure(status: number, providerStatus: string, detail: string): TtsError {
  const details = { http_status: status, provider_status: providerStatus, provider_message: detail };
  if (status === 429) return new TtsError("GEMINI_RATE_LIMIT", "Dịch vụ giọng đọc đang giới hạn lượt gọi hoặc hết hạn mức. Vui lòng thử lại sau.", details);
  if (status === 401 || status === 403) return new TtsError("GEMINI_ACCESS_DENIED", "Dịch vụ giọng đọc chưa được cấp quyền. Vui lòng liên hệ quản trị viên.", details);
  if (status === 404) return new TtsError("GEMINI_MODEL_UNAVAILABLE", "Model giọng đọc hiện chưa khả dụng cho hệ thống. Vui lòng liên hệ quản trị viên.", details);
  if (status === 400) return new TtsError("GEMINI_REQUEST_REJECTED", "Dịch vụ giọng đọc từ chối yêu cầu. Vui lòng liên hệ quản trị viên.", details);
  return new TtsError("GEMINI_UNAVAILABLE", "Dịch vụ giọng đọc đang gặp sự cố. Vui lòng thử lại sau.", details);
}
