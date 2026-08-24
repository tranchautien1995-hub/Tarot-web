# Tarot Practice V2.24 — 6-Card Synthesis Refinement

V2.24 được tinh chỉnh từ việc so sánh trực tiếp một trải 6 lá về khả năng đi du học giữa ChatGPT Plus và web. Mục tiêu là làm cho GPT-5.6 Sol trên web bám cấu trúc spread tốt hơn, ít suy diễn thủ tục hơn và đọc các cặp đối lập/hỗ trợ giống một Reader hơn.

## Các thay đổi chính

### 1. Trả lời câu hỏi có/không rõ hơn
AI mở bằng mức độ xác suất phù hợp, nhưng vẫn giữ ngôn ngữ không tuyệt đối. Outcome mạnh được dùng để định hướng câu trả lời, không dùng như bảo đảm chắc chắn.

### 2. Không tự suy diễn timing
Từ “sắp tới” không đủ để kết luận có trì hoãn, phải sửa lịch hoặc mất bao nhiêu thời gian. Chỉ đọc timing khi spread có tín hiệu đủ rõ.

### 3. Không bỏ vị trí trong trải 4–6 lá
Mỗi vị trí phải góp một ý vào mạch chung. Có thể gộp các lá trong cùng đoạn, nhưng Gốc rễ hay Điều hỗ trợ không được biến mất khỏi tổng hợp.

### 4. Đọc theo cặp/trục
AI chủ động tìm 1–3 cặp nổi bật, ví dụ:
- lá mở đầu ↔ lá kết thúc;
- tự chủ ↔ thiếu hụt;
- chiến lược kín kẽ ↔ trưởng thành cảm xúc.

### 5. Trở ngại như “cửa ải”
Nếu spread có vị trí Trở ngại rõ, AI xác định điều kiện cần xử lý trước khi outcome tích cực có thể phát huy.

### 6. Giới hạn suy diễn thực tế
Ví dụ thực tế vẫn được phép nhưng chỉ ở dạng khả năng. Không biến một lá thành checklist hồ sơ/thủ tục dài nếu người dùng không hỏi hướng dẫn thực hành.

### 7. Kết luận không được thêm khái niệm mới
Đoạn tổng hợp chỉ được cô đọng những gì phần phân tích đã xây dựng.

V2.24 giữ nguyên GPT-5.6 Sol, XAH `/chat/completions`, reasoning effort và Reader Mode của V2.23.
