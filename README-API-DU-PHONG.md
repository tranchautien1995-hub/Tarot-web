# API chính và API dự phòng

Website hỗ trợ 1 API chính và tối đa 2 API dự phòng tương thích chuẩn OpenAI
`/chat/completions`.

## Biến môi trường bắt buộc cho API chính

```env
XAH_API_KEY=KEY_API_CHINH
XAH_BASE_URL=https://api.xah.io/v1
XAH_FREE_MODEL=gpt-5.6-sol
XAH_PREMIUM_MODEL=gpt-6-astra
```

## API dự phòng 1 — key và model riêng

```env
XAH_FALLBACK_API_KEY=KEY_API_MOI_TRONG_ANH
XAH_FALLBACK_BASE_URL=https://api.xah.io/v1
XAH_FALLBACK_FREE_MODEL=gpt-5.6-sol
XAH_FALLBACK_PREMIUM_MODEL=thanhnhan9023/gpt-6-astra
```

`XAH_API_KEY` và model chính của WebVer1.9 vẫn giữ nguyên. Chỉ khi API chính lỗi,
website mới gọi key mới và model `thanhnhan9023/gpt-6-astra` trong ảnh.

## API dự phòng 2 (không bắt buộc)

```env
XAH_FALLBACK_2_API_KEY=KEY_API_PHU_2
XAH_FALLBACK_2_BASE_URL=https://api-phu-2.example/v1
XAH_FALLBACK_2_FREE_MODEL=TEN_MODEL_FREE_CUA_API_PHU_2
XAH_FALLBACK_2_PREMIUM_MODEL=TEN_MODEL_PREMIUM_CUA_API_PHU_2
```

Không thêm `/chat/completions` vào cuối `BASE_URL`. API key tuyệt đối không có
tiền tố `NEXT_PUBLIC_`.

## Khi nào website tự đổi API?

- Không kết nối được máy chủ.
- Sau 25 giây vẫn chưa nhận được phản hồi đầu tiên.
- HTTP 401, 403, 404, 408, 425, 429 hoặc lỗi máy chủ 5xx.
- API trả luồng rỗng trước khi có nội dung.

Nếu API chính lỗi, máy chủ ưu tiên API phụ trong 60 giây tiếp theo để tránh mỗi
lượt đọc đều phải chờ API chính timeout. Nếu API đã bắt đầu trả nội dung rồi mới
đứt giữa chừng, website không ghép tiếp từ model khác vì làm vậy có thể lặp hoặc
mâu thuẫn nội dung; người dùng cần bấm thử lại.

## Cấu hình trên Vercel

Vào Project → Settings → Environment Variables, thêm các biến trên cho
Production và Preview, rồi Redeploy một lần để Vercel nạp cấu hình mới.
