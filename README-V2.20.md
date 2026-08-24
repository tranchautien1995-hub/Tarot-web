# Tarot Practice V2.20

Phát triển từ V2.19. Giao diện, Rider–Waite assets, Supabase Auth, lịch sử trải bài, cách bốc/chọn bài, kích thước ô 4.5 × 7 cm và hiệu ứng sao/sao băng được giữ nguyên.

## Thay đổi chính

### 1. Gemini → GPT-5.4 qua XAH

Backend AI hiện dùng OpenAI-compatible Chat Completions:

- Base URL mặc định: `https://api.xah.io/v1`
- Endpoint: `/chat/completions`
- Model mặc định: `gpt-5.4`
- `/api/read`: đọc trải bài.
- `/api/chat`: hỏi tiếp về chính trải bài đó.

API key chỉ nằm ở server trong `.env.local`.

Ví dụ:

```env
XAH_API_KEY=YOUR_KEY_HERE
XAH_BASE_URL=https://api.xah.io/v1
XAH_MODEL=gpt-5.4
```

Không dùng `NEXT_PUBLIC_XAH_API_KEY`.

### 2. Prompt mới gần phong cách ChatGPT Plus hơn

Bản V2.20 bỏ kiểu ép AI phải trả lời đủ 4 mục cố định và không còn gửi keyword của từng lá vào request chính.

Prompt mới ưu tiên:

- đọc toàn spread như một câu chuyện;
- bám đúng câu hỏi và vị trí lá;
- phân tích hỗ trợ / mâu thuẫn / chuyển tiếp giữa các lá;
- giải thích vì sao một lá mang sắc thái đó trong tổ hợp hiện tại;
- không coi lá ngược đơn giản là nghĩa xấu;
- giữ những mâu thuẫn thật sự trong trải bài thay vì ép mọi lá về một kết luận;
- tránh văn phong sách tra cứu;
- không khẳng định chắc chắn tương lai.

Kết quả có thể dùng `## 🔮 Tổng hợp trải bài` và chỉ tách thêm `## 🔗 Mạch nổi bật` khi có ích, thay vì luôn phải sinh 4 phần như trước.

### 3. Hỏi tiếp AI

`/api/chat` vẫn giữ:

- câu hỏi gốc;
- trải bài gốc;
- bài đọc ban đầu;
- tối đa 10 tin nhắn hội thoại gần nhất;
- câu hỏi mới.

AI được yêu cầu trả lời tiếp theo mạch hiện tại, không khởi động lại một bài giải mới và không tự rút thêm lá.

### 4. Ghi chú học Tarot cá nhân

Vẫn giữ hệ thống `lib/knowledge.ts` để ưu tiên các ghi chú học của người dùng khi lá liên quan xuất hiện. V2.20 bổ sung ghi chú cho The Hierophant.

## Chạy local

```cmd
npm install
npm run typecheck
npm run dev
```

Mở `http://localhost:3000`.

Sau khi sửa `.env.local`, hãy dừng dev server bằng `Ctrl + C` rồi chạy lại `npm run dev` để Next.js đọc biến môi trường mới.
