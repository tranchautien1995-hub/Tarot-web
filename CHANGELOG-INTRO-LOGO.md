# Logo intro

Thay chữ TTAROT trong scene identity bằng SVG outline do người dùng cung cấp (`logo copy(1).svg`). Giữ màu cyan/trắng và toàn bộ hình học; chỉ thu viewBox để bỏ khoảng trắng thừa. Giữ slogan, background, timing và chuyển cảnh.

Sửa components/TarotEntryExperience.tsx, app/globals.css.
Thêm public/entry-v3/ttarot-logo.svg và tài liệu này.

Logo không có text/font phụ thuộc, raster hoặc request ngoài. Render responsive giữ aspect ratio. Typecheck và production build PASS. Không thay Reader/API/auth/quota/TTS hay các scene khác.
