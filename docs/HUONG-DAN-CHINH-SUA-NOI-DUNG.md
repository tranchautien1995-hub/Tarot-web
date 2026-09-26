# Hướng dẫn chỉnh nội dung TTarot WebVer1.8 thủ công

Hướng dẫn này dành cho Windows, Visual Studio Code, GitHub Desktop và website triển khai tự động từ GitHub.

## 1. Mở dự án và chạy thử

1. Giải nén `WebVer1.8-full-2.7.56.zip`.
2. Mở Visual Studio Code.
3. Chọn **File → Open Folder** và chọn thư mục vừa giải nén.
4. Chọn **Terminal → New Terminal**.
5. Lần đầu tiên, chạy:

```bash
npm install
```

6. Mỗi lần muốn xem web trên máy, chạy:

```bash
npm run dev
```

7. Mở địa chỉ `http://localhost:3000`.

Muốn dừng máy chủ thử nghiệm, bấm `Ctrl + C` trong Terminal.

> Không đưa `.env.local`, API key, Supabase Secret Key hoặc SePay Secret Key lên GitHub.

## 2. Chỉnh tên, mô tả, quyền lợi và giá hiển thị của các gói

Mở file:

```text
lib/plans.ts
```

Tìm phần `export const PLANS`. Mỗi gói có các trường:

- `name`: tên gói.
- `shortDescription`: mô tả ngắn.
- `weeklyPriceLabel`: giá tuần hiển thị trên web.
- `monthlyPriceLabel`: giá tháng hiển thị trên web.
- `modelLabel`: dòng model bên dưới giá.
- `features`: các quyền lợi có dấu ✓.
- `unavailable`: các quyền lợi chưa có, hiển thị dấu ×.
- `featured: true`: gắn nhãn “PHỔ BIẾN”. Chỉ nên đặt cho một gói.

Ví dụ đổi giá hiển thị của Plus:

```ts
weeklyPriceLabel: "35.000đ/tuần",
monthlyPriceLabel: "69.000đ/tháng",
```

### Rất quan trọng khi đổi giá

Giá thanh toán VietQR thật nằm trong:

```text
lib/billing.ts
```

Phải sửa cùng lúc với `lib/plans.ts`. Ví dụ:

```ts
plus: { week: 35_000, month: 69_000 },
```

- `lib/plans.ts` chỉ quyết định chữ người dùng nhìn thấy.
- `lib/billing.ts` quyết định số tiền thực tế tạo trên VietQR.
- Hai file không khớp sẽ làm giá hiển thị khác số tiền thanh toán.

## 3. Chỉnh quyền sử dụng thực tế của từng gói

Vẫn trong:

```text
lib/plans.ts
```

Tìm `export const PLAN_ACCESS`:

- `allowedPresets`: các kiểu trải được phép dùng.
  - `three`: 3 lá.
  - `six`: 6 lá.
  - `celtic`: 10 lá.
  - `future_love`: Người yêu tương lai, 6 lá.
  - `zodiac_houses`: 12 Nhà Hoàng Đạo, 12 lá.
  - `health_overview`: Tổng quan sức khỏe, 6 lá.
  - `tree_of_life`: Cây Sự Sống, 10 lá.
  - `matrix_3x3`: Ma trận 3×3, 9 lá.
- `canUseReadingStyles`: cho phép dùng phong cách đọc bài.
- `historyLimit`: số lịch sử được lưu; `null` là không giới hạn.
- `modelTier`: `free` dùng model tiêu chuẩn, `premium` dùng model cao cấp.

Ví dụ cho Plus dùng thêm trải Người yêu tương lai:

```ts
allowedPresets: ["three", "six", "celtic", "future_love"],
```

Không chỉ sửa danh sách `features`; danh sách đó là chữ quảng cáo, không tự cấp quyền.

### Chỉnh tên, mô tả và vị trí của trải bài

Mở `app/page.tsx`:

- `MORE_PRESETS`: tên và mô tả hiển thị trong “Xem thêm”.
- `questionMode: "required"`: cho phép người dùng nhập câu hỏi.
- `questionMode: "none"`: khóa ô câu hỏi và để web tự đọc theo cấu trúc trải bài.
- `positionsFor(...)`: tên từng vị trí lá bài.

Mở `lib/prompts.ts`:

- `SPREAD_NAMES`: tên kiểu trải gửi cho AI.
- `spreadSpecificInstruction(...)`: cách AI kết nối và suy luận từng kiểu trải.

Khi thêm kiểu trải mới, phải cập nhật đồng thời `app/page.tsx`, `lib/plans.ts`, `lib/prompts.ts` và số lá trong `validatePlanReading`. Nếu chỉ thêm nút giao diện mà không cập nhật API, máy chủ sẽ từ chối đọc bài.

## 4. Chỉnh tiêu đề và nội dung trang nâng cấp

Mở:

```text
components/PricingModal.tsx
```

Dùng `Ctrl + F` để tìm trực tiếp các câu:

- `Chọn cách bạn muốn dùng TTarot`
- `Nâng cấp model, kiểu trải và dung lượng lịch sử theo nhu cầu của bạn.`
- `Đăng ký gói`
- `Thanh toán qua VietQR`
- `GÓI DỊCH VỤ`

Chỉ thay phần chữ nằm giữa dấu ngoặc kép hoặc giữa thẻ HTML. Không xóa dấu ngoặc, dấu `{}`, thẻ mở hoặc thẻ đóng.

## 5. Chỉnh cỡ chữ và màu của trang nâng cấp

Mở:

```text
app/globals.css
```

Dùng `Ctrl + F` tìm:

- `.pricing-action`: nút đăng ký gói.
- `.pricing-card`: khung từng gói.
- `.pricing-price`: giá tiền.
- `.pricing-card-head h3`: tên gói.
- `.theme-light .pricing-card`: màu thẻ Light.
- `.upgrade-page`: nền trang nâng cấp Dark.

Ví dụ đổi chữ nút thành 16px:

```css
.pricing-action {
  font-size: 16px;
  font-weight: 400;
}
```

Không xóa toàn bộ khối CSS; chỉ đổi giá trị nằm sau dấu `:`.

## 6. Chỉnh câu hỏi gợi ý trên trang chủ

Mở:

```text
app/page.tsx
```

Tìm:

```ts
const QUESTION_SUGGESTIONS = [
```

Mỗi câu phải nằm trong dấu ngoặc kép, có dấu phẩy ở cuối, ví dụ:

```ts
"Người yêu cũ còn nghĩ gì về tôi?",
```

## 7. Chỉnh tên tab, tiêu đề và câu chữ trang chủ

Mở `app/page.tsx`, bấm `Ctrl + F`, tìm đúng câu đang hiển thị rồi thay chữ. Ví dụ:

- `TTarot Home`
- `Tự trải, tự bốc.`
- `Hiểu sâu hơn.`
- `PHONG CÁCH ĐỌC BÀI`
- `CÁCH LẤY BÀI`
- `KIỂU TRẢI`

Nếu câu nằm giữa dấu `>` và `<`, chỉ thay phần chữ ở giữa.

## 8. Kiểm tra trước khi đưa lên web

Sau khi chỉnh xong, chạy lần lượt:

```bash
npm run typecheck
npm run build
```

Chỉ cập nhật website khi cả hai lệnh hoàn tất và không có dòng lỗi màu đỏ.

## 9. Đưa thay đổi lên website bằng GitHub Desktop

Nếu website hiện tại được Vercel kết nối với GitHub:

1. Mở đúng thư mục repository bằng GitHub Desktop.
2. Chép các file đã sửa vào đúng vị trí trong repository, hoặc chỉnh trực tiếp trong repository ngay từ đầu.
3. GitHub Desktop sẽ liệt kê file thay đổi ở cột trái.
4. Nhập mô tả vào ô **Summary**, ví dụ `Cập nhật nội dung bảng giá`.
5. Bấm **Commit to main**.
6. Bấm **Push origin**.
7. Mở Vercel → dự án TTarot → **Deployments**.
8. Chờ deployment mới hiện trạng thái **Ready**.
9. Mở website và bấm `Ctrl + F5` để tải lại không dùng cache.

Nếu Vercel chưa kết nối tự động với GitHub, vào Vercel → dự án → **Settings → Git** và kiểm tra repository cùng nhánh Production đang là `main`.

## 10. Cách quay lại nếu sửa lỗi

Trong GitHub Desktop:

- Chưa Commit: nhấp phải file → **Discard changes**.
- Đã Commit nhưng chưa Push: vào **History**, nhấp phải commit → **Revert changes in commit**.
- Đã lên Vercel: vào **Deployments**, mở deployment ổn định trước đó và chọn **Promote to Production**; sau đó sửa lại mã nguồn và Push lần nữa.
