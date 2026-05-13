# HCMUS Auto DKHP

Userscript Tampermonkey hỗ trợ thao tác đăng ký học phần trên portal HCMUS: tự vào trang đăng ký, tự tick lớp học phần theo danh sách cấu hình, tự submit khi đến giờ và tự reload khi cần.

> Script này không bypass CAPTCHA. CAPTCHA vẫn phải được nhập hoặc xác nhận thủ công theo đúng giao diện portal.

## Tính năng chính

- Tự điều hướng từ portal sang trang đăng ký học phần.
- Tự tick môn/lớp học phần theo mã môn, lớp và ca học đã cấu hình.
- Có thể hẹn giờ bắt đầu đăng ký bằng `START_AT`.
- Có chế độ tự submit và tự reload trang theo chu kỳ.
- Có badge trạng thái trên màn hình với nút `Dừng` và `Reset`.
- Chạy trực tiếp bằng Tampermonkey, không cần cài Node.js hoặc chạy server.

## Cài đặt nhanh

### 1. Cài Tampermonkey

Vào trang chính thức của Tampermonkey:

https://www.tampermonkey.net/

Chọn đúng trình duyệt bạn đang dùng rồi cài extension Tampermonkey.

Sau khi cài xong, kiểm tra trên thanh extension của trình duyệt có biểu tượng Tampermonkey và trạng thái đang bật.

### 2. Cài userscript

Cách nhanh nhất:

1. Mở link raw của script:

   https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js

2. Nếu Tampermonkey hiện màn hình cài đặt script, bấm `Install`.
3. Vào `Tampermonkey Dashboard` để kiểm tra script `HCMUS Auto DKHP - HK3 23TC Safe` đang bật.

Nếu trình duyệt chỉ hiện file text:

1. Mở `Tampermonkey Dashboard`.
2. Bấm nút `+` hoặc `Create a new script`.
3. Xóa nội dung mặc định.
4. Copy toàn bộ nội dung trong file:

   `tricker/HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js`

5. Dán vào editor của Tampermonkey.
6. Bấm `Ctrl + S` để lưu.

## Cấu hình trước khi chạy

Mở script trong Tampermonkey Dashboard, sau đó chỉnh các biến cấu hình ở đầu file.

### Thời điểm bắt đầu

```js
const START_AT = "2026-06-01T08:00:00+07:00";
```

Đổi ngày giờ này thành thời điểm mở đăng ký thật. Nên giữ định dạng ISO và múi giờ `+07:00`.

### Danh sách môn cần đăng ký

Chỉnh trong `TARGET_COURSES`:

```js
const TARGET_COURSES = [
  {
    code: "CSC10001",
    cls: "22_1",
    name: "Tên môn học",
    time: "Thứ 2, tiết 1-3"
  }
];
```

Ý nghĩa:

- `code`: mã môn học.
- `cls`: mã lớp học phần hoặc nhóm lớp.
- `name`: tên môn để dễ đọc log.
- `time`: ca học, dùng để phân biệt khi có nhiều lớp trùng mã môn.

Nên copy mã môn, lớp và ca học trực tiếp từ portal để tránh lệch dấu cách hoặc sai ký tự.

### Tự submit

```js
const AUTO_SUBMIT = true;
```

- `true`: script sẽ tự bấm nút submit khi đã tick được môn phù hợp.
- `false`: script chỉ tick môn, bạn tự kiểm tra rồi bấm submit thủ công.

Khi test lần đầu, nên để `false`. Khi đã chắc cấu hình đúng thì đổi lại `true`.

### Tự reload

```js
const AUTO_RELOAD = true;
const RELOAD_SECONDS = 3;
```

- `AUTO_RELOAD = true`: tự refresh trang khi chưa tới lượt hoặc chưa thấy môn.
- `RELOAD_SECONDS`: số giây giữa các lần reload.

Nếu portal lag hoặc bị reload quá nhanh, tăng `RELOAD_SECONDS` lên `5`, `8` hoặc `10`.

### Tự login và tự chuyển trang

```js
const AUTO_LOGIN = true;
const AUTO_NAV_TO_DKHP = true;
```

- `AUTO_LOGIN`: hỗ trợ điền thông tin đăng nhập đã lưu trong trình duyệt/localStorage.
- `AUTO_NAV_TO_DKHP`: tự chuyển sang trang đăng ký học phần sau khi vào portal.

Không commit tài khoản, mật khẩu, cookie, file HTML portal hoặc dữ liệu session lên GitHub.

## Cách chạy khi tới giờ đăng ký

1. Mở portal HCMUS:

   https://new-portal2.hcmus.edu.vn/

2. Đăng nhập tài khoản sinh viên.
3. Nếu có CAPTCHA, xử lý CAPTCHA thủ công.
4. Vào trang đăng ký học phần.
5. Kiểm tra badge của script xuất hiện trên màn hình.
6. Giữ tab đang mở trước thời điểm `START_AT`.
7. Khi tới giờ, script sẽ reload/tick/submit theo cấu hình.

Nếu đã bấm `Dừng` trên badge, bấm `Reset` hoặc vào Tampermonkey tắt rồi bật lại script trước khi chạy lại.

## Kiểm tra sau khi cài

Trước ngày đăng ký thật, nên test theo quy trình an toàn:

1. Đặt `AUTO_SUBMIT = false`.
2. Đặt `START_AT` gần thời điểm hiện tại.
3. Vào trang đăng ký học phần.
4. Xem script có hiện badge và log trạng thái không.
5. Kiểm tra script có tick đúng môn/lớp không.
6. Khi mọi thứ đúng, đổi `AUTO_SUBMIT = true` cho lần chạy thật.

## Lỗi thường gặp

### Không thấy script chạy

- Kiểm tra Tampermonkey đã bật chưa.
- Kiểm tra script có đang `Enabled` trong Dashboard không.
- Refresh lại trang portal.
- Kiểm tra URL có đúng trang `new-portal2.hcmus.edu.vn` hoặc `DangKyHocPhan.aspx` không.

### Script không tick được môn

- Kiểm tra lại `code`, `cls`, `time` trong `TARGET_COURSES`.
- Copy lại thông tin trực tiếp từ portal.
- Nếu portal đổi giao diện HTML, script có thể cần cập nhật selector.

### Script bị reload quá nhanh

Tăng thời gian reload:

```js
const RELOAD_SECONDS = 8;
```

Hoặc tắt tự reload:

```js
const AUTO_RELOAD = false;
```

### Bị kẹt ở CAPTCHA

Script không giải CAPTCHA. Hãy xử lý CAPTCHA thủ công, sau đó để script tiếp tục chạy.

### Muốn dừng khẩn cấp

- Bấm nút `Dừng` trên badge của script.
- Hoặc tắt script trong Tampermonkey Dashboard.
- Hoặc đóng tab portal.

## Khuyến nghị an toàn

- Test trước với `AUTO_SUBMIT = false`.
- Không mở nhiều tab cùng chạy script nếu không cần thiết.
- Không đẩy file HTML tải từ portal lên GitHub.
- Không lưu cookie, token, tài khoản hoặc mật khẩu trong repo.
- Tự chịu trách nhiệm khi dùng script trên hệ thống thật của trường.

## Cấu trúc repo

```text
.
├── README.md
└── tricker/
    └── HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js
```

## License

Project cá nhân phục vụ học tập và tự động hóa thao tác lặp lại. Hãy dùng có trách nhiệm.
