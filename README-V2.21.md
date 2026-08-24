# Tarot Practice V2.21 — Plus-like Reading

V2.21 tập trung làm chất lượng bài đọc trên web gần phong cách ChatGPT Plus hơn khi dùng GPT-5.6 Sol qua XAH/OpenAI-compatible Chat Completions.

## Thay đổi chính

- Giữ nghĩa tự nhiên của lá trước khi xét vị trí; không tự biến lá tích cực thành "rào cản" chỉ vì câu hỏi đang nói về khó khăn.
- Phân biệt rõ "Bản chất vấn đề" với "Trở ngại" và các vị trí khác.
- Ưu tiên mắt xích giữa các lá và mạch A → B → C.
- Hạn chế suy diễn thêm tình huống cụ thể không có dữ kiện trong spread.
- Bài 3 lá được hướng tới độ dài vừa phải, ít lặp, tập trung vào logic.
- Không tự chèn keyword hoặc ghi chú học của từng lá vào prompt chính.
- Hỏi tiếp AI được gửi dưới dạng hội thoại thật với role system/user/assistant.
- Mặc định `reasoning_effort=medium`; nếu gateway không hỗ trợ tham số này, server tự retry không có tham số thay vì làm hỏng bài đọc.

## .env.local

```env
XAH_API_KEY=KEY_CUA_BAN
XAH_BASE_URL=https://api.xah.io/v1
XAH_MODEL=stableai/gpt-5.6-sol
XAH_REASONING_EFFORT=medium
```

Nếu project đang dùng Supabase, giữ nguyên các biến Supabase hiện có.
