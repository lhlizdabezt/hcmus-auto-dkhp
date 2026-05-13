# HCMUS Auto DKHP Userscript

Userscript hỗ trợ thao tác đăng ký học phần trên HCMUS Portal.

Script được viết theo hướng hỗ trợ thao tác thủ công nhanh hơn: tự kiểm tra thời gian mở đăng ký, tự chuyển trang sau đăng nhập, tự tick các lớp mục tiêu, tự submit nếu cấu hình cho phép và tự reload theo chu kỳ. Script **không bypass CAPTCHA**; người dùng vẫn phải tự hoàn tất CAPTCHA khi portal yêu cầu.

## File chính

```text
tricker/HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js
```

## Chức năng

- Auto login helper cho trang HCMUS Portal.
- Chờ tới thời điểm mở đăng ký theo `START_AT`.
- Tự tìm bảng học phần theo mã môn, lớp và lịch học.
- Tự tick danh sách học phần trong `TARGET_COURSES`.
- Có thể tự bấm đăng ký nếu `AUTO_SUBMIT = true`.
- Tự reload/F5 để retry khi portal tải lỗi hoặc chưa tới giờ.
- Có badge điều khiển trên trang để dừng hoặc reset script.
- Không tự giải CAPTCHA và không bypass cơ chế xác thực của portal.

## Cấu hình nhanh

Mở file userscript và chỉnh các hằng số ở đầu file:

```js
const START_AT = "2026-05-12T09:00:00+07:00";
const AUTO_SUBMIT = true;
const AUTO_RELOAD = true;
const RELOAD_SECONDS = 3;
```

Danh sách học phần mục tiêu nằm trong:

```js
const TARGET_COURSES = [
  { code: "ETC10123", cls: "23DTV_CLC1", name: "...", time: "T2(1-6)" },
];
```

Mỗi dòng nên có:

- `code`: mã môn học.
- `cls`: tên lớp.
- `name`: tên môn để dễ đọc log.
- `time`: lịch học đúng như hiển thị trên portal.

## Cài đặt

1. Cài extension userscript như Tampermonkey hoặc Violentmonkey.
2. Tạo script mới.
3. Dán nội dung file `.user.js`.
4. Chỉnh `START_AT`, `TARGET_COURSES`, `AUTO_SUBMIT` theo nhu cầu.
5. Mở HCMUS Portal và đăng nhập.
6. Nếu portal yêu cầu CAPTCHA, tự hoàn tất CAPTCHA rồi để script tiếp tục.

## Ghi chú bảo mật

Repo này cố ý không đưa các file HTML đã lưu từ portal, vì chúng có thể chứa `__VIEWSTATE`, MSSV, họ tên, mã người dùng, dữ liệu học phần và trạng thái phiên. Các file tải xuống từ portal trong thư mục gốc được ignore bằng `.gitignore`.

Nếu dùng auto-login, thông tin đăng nhập chỉ nên lưu trong localStorage của trình duyệt cá nhân. Không commit credential, cookie, token hoặc snapshot HTML có dữ liệu phiên lên GitHub.

## Trách nhiệm sử dụng

Tool này chỉ hỗ trợ thao tác cá nhân và không thay thế quy trình chính thức của nhà trường. Người dùng tự chịu trách nhiệm tuân thủ quy định của HCMUS Portal khi sử dụng.
