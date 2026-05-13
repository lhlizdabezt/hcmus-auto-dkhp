# HCMUS Auto DKHP

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=24&duration=2600&pause=700&color=0F766E&center=true&vCenter=true&width=900&lines=Tool+Dang+Ky+Hoc+Phan+HCMUS;Tampermonkey+%7C+JavaScript+%7C+Safe+Defaults;Auto+Reload+%E2%86%92+Match+Lop+%E2%86%92+Optional+Submit" alt="HCMUS Auto DKHP animated title" />
</p>

<p align="center">
  <a href="https://github.com/lhlizdabezt/hcmus-auto-dkhp/releases/latest">
    <img src="https://img.shields.io/github/v/release/lhlizdabezt/hcmus-auto-dkhp?style=for-the-badge&logo=github&label=Release" alt="Bản phát hành mới nhất" />
  </a>
  <a href="https://github.com/lhlizdabezt/hcmus-auto-dkhp/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/lhlizdabezt/hcmus-auto-dkhp?style=for-the-badge&color=0f766e" alt="Giấy phép" />
  </a>
  <a href="https://www.tampermonkey.net/">
    <img src="https://img.shields.io/badge/Tampermonkey-Userscript-00485B?style=for-the-badge&logo=tampermonkey&logoColor=white" alt="Tampermonkey userscript" />
  </a>
  <a href="https://new-portal2.hcmus.edu.vn/">
    <img src="https://img.shields.io/badge/HCMUS-Portal-2563EB?style=for-the-badge" alt="HCMUS portal" />
  </a>
</p>

<p align="center">
  <b>Userscript hỗ trợ thao tác đăng ký học phần trên portal HCMUS.</b><br/>
  Tự điều hướng, chờ đúng giờ cấu hình, reload có kiểm soát, dò lớp mục tiêu, tick đúng dòng và có thể submit nếu bạn bật chế độ tự submit.
</p>

> [!IMPORTANT]
> Project này **không bypass CAPTCHA**, không bypass đăng nhập, không bypass giới hạn slot, không can thiệp chính sách portal và không vượt qua bất kỳ kiểm tra nào từ phía nhà trường. CAPTCHA và đăng nhập vẫn phải xử lý theo luồng chính thức của portal.

## Vì Sao Repo Này Được Tổ Chức Như Vậy?

Repo được giữ nhỏ, rõ ràng và dễ review:

- chỉ track userscript Tampermonkey có thể tái sử dụng;
- không đưa HTML portal đã lưu, ViewState, CAPTCHA state, cookie, session hoặc snapshot test cá nhân lên GitHub;
- cấu hình public mặc định an toàn: `AUTO_SUBMIT = false` và `AUTO_LOGIN = false`;
- toàn bộ cấu hình quan trọng nằm ở đầu file script để người dùng đọc và chỉnh trước khi chạy.

## Điểm Kỹ Thuật Chính

| Mảng | Tín hiệu triển khai |
| --- | --- |
| Browser automation | Tampermonkey userscript, `document-start`, nhận diện DOM, vòng reload có trạng thái |
| Match lớp học phần | Chuẩn hóa mã môn, mã lớp và lịch học trước khi so khớp với bảng portal |
| An toàn vận hành | CAPTCHA thủ công, badge `Dừng`/`Reset`, heartbeat reload guard, submit dạng opt-in |
| Trải nghiệm dùng | Badge nổi hiển thị trạng thái, countdown, danh sách môn còn chờ và môn đã tick |
| Dễ bảo trì | JavaScript một file, không cần build, không cần server, không phụ thuộc runtime ngoài browser |

## Tính Năng

- 🚀 Tự điều hướng từ portal HCMUS sang trang đăng ký học phần.
- ⏱ Chờ đến đúng thời điểm `START_AT` mới bắt đầu thao tác.
- 🔁 Tự reload có jitter khi chưa thấy bảng lớp hoặc chưa thấy lớp mục tiêu.
- 🎯 Match lớp theo `code`, `cls` và `time`.
- ✅ Tự tick các dòng lớp học phần khớp cấu hình.
- 🧯 Hiển thị badge nổi với trạng thái, countdown, nút `Dừng` và `Reset`.
- 🔐 Có module hỗ trợ login bằng `localStorage`, nhưng mặc định tắt.
- 🧾 Có chế độ submit tự động, nhưng mặc định tắt để test an toàn trước.

## Cài Đặt Nhanh

1. Cài [Tampermonkey](https://www.tampermonkey.net/) cho trình duyệt đang dùng.
2. Mở link raw của userscript:

   [Cài HCMUS Auto DKHP](https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js)

3. Nếu Tampermonkey mở màn hình cài đặt, bấm `Install`.
4. Vào `Tampermonkey Dashboard` và kiểm tra script `HCMUS Auto DKHP - HK3 23TC Safe` đang bật.

Nếu trình duyệt chỉ hiện nội dung file text:

1. Mở `Tampermonkey Dashboard`.
2. Chọn `Create a new script`.
3. Xóa template mặc định.
4. Dán nội dung file [`tricker/HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js`](tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js).
5. Bấm `Ctrl + S` để lưu.

## Cấu Hình Trước Khi Chạy

Mở script trong Tampermonkey và chỉnh block cấu hình ở đầu file.

### Thời Điểm Bắt Đầu

```js
const START_AT = "2026-06-01T08:00:00+07:00";
```

Đổi giá trị này thành thời điểm mở đăng ký thật. Nên giữ định dạng ISO và múi giờ Việt Nam `+07:00`.

### Danh Sách Môn Mục Tiêu

```js
const TARGET_COURSES = [
  { code: "CSC10001", cls: "22_1", name: "Sample Course", time: "T2(1-3)" },
  { code: "ETC10001", cls: "23DTV_CLC1", name: "Sample Lab", time: "T4(7-9)" },
];
```

Nên copy trực tiếp `code`, `cls` và `time` từ portal để tránh sai khoảng trắng, sai dấu hoặc lệch format lịch học.

### Chế Độ Submit

```js
const AUTO_SUBMIT = false;
```

- `false`: script chỉ tick lớp phù hợp, bạn tự kiểm tra rồi submit thủ công.
- `true`: script tự bấm nút đăng ký sau khi tick đúng target.

Khuyến nghị: lần test đầu tiên luôn để `AUTO_SUBMIT = false`. Chỉ bật `true` khi đã chắc danh sách target đúng.

### Chế Độ Reload

```js
const AUTO_RELOAD = true;
const RELOAD_SECONDS = 3;
const RELOAD_JITTER_MS = 1200;
```

Nếu portal chậm hoặc bạn muốn giảm tần suất reload, tăng `RELOAD_SECONDS` lên `5`, `8` hoặc `10`.

### Hỗ Trợ Login

```js
const AUTO_LOGIN = false;
const AUTO_NAV_TO_DKHP = true;
```

`AUTO_LOGIN` mặc định tắt. Nếu bật, thông tin đăng nhập sẽ được lưu trong `localStorage` của trình duyệt ở dạng plain text. Không bật tính năng này trên máy dùng chung.

## Quy Trình Chạy

1. Mở portal chính thức: <https://new-portal2.hcmus.edu.vn/>.
2. Đăng nhập bằng tài khoản sinh viên.
3. Nếu portal yêu cầu CAPTCHA, xử lý CAPTCHA thủ công.
4. Vào trang `DangKyHocPhan.aspx`.
5. Kiểm tra badge của script có xuất hiện không.
6. Giữ một tab portal đang mở trước thời điểm `START_AT`.
7. Khi tới giờ, script sẽ reload, dò lớp, tick lớp và submit theo cấu hình bạn đã chọn.

## Checklist An Toàn

- [ ] `TARGET_COURSES` đã khớp chính xác với dòng trên portal.
- [ ] `START_AT` đúng thời gian mở đăng ký và có múi giờ `+07:00`.
- [ ] Lần test đầu tiên dùng `AUTO_SUBMIT = false`.
- [ ] Không commit tài khoản, mật khẩu, cookie, HTML portal, ViewState, CAPTCHA state hoặc session file.
- [ ] Không mở nhiều tab cùng chạy script nếu không có lý do rõ ràng.

## Xử Lý Lỗi Thường Gặp

### Script không chạy

- Kiểm tra Tampermonkey đã bật chưa.
- Kiểm tra userscript có đang `Enabled` trong `Tampermonkey Dashboard` không.
- Refresh lại trang portal.
- Kiểm tra URL có thuộc `new-portal2.hcmus.edu.vn` hoặc `DangKyHocPhan.aspx` không.

### Script không tick được môn

- Copy lại `code`, `cls` và `time` trực tiếp từ portal.
- Kiểm tra lớp đó có phải đã đăng ký rồi không.
- Nếu HCMUS đổi HTML của portal, selector trong script có thể cần cập nhật.

### Portal reload quá nhanh

Tăng thời gian reload:

```js
const RELOAD_SECONDS = 8;
```

Hoặc tắt reload tự động:

```js
const AUTO_RELOAD = false;
```

### Bị kẹt ở CAPTCHA

Đây là hành vi bình thường. Script sẽ tạm dừng reload ở cổng CAPTCHA để bạn nhập thủ công. Sau khi qua CAPTCHA, script tiếp tục chạy ở trang đăng ký học phần.

### Muốn dừng khẩn cấp

- Bấm `Dừng` trên badge.
- Hoặc tắt userscript trong Tampermonkey.
- Hoặc đóng tab portal.

## Cấu Trúc Repo

```text
.
├── .gitignore
├── CHANGELOG.md
├── LICENSE
├── README.md
└── tricker/
    └── HCMUS Auto DKHP - HK3 23TC Safe-2.0.user.js
```

## Release

Bản mới nhất: [v4.3.0](https://github.com/lhlizdabezt/hcmus-auto-dkhp/releases/tag/v4.3.0)

Link cài trực tiếp từ raw userscript:

```text
https://raw.githubusercontent.com/lhlizdabezt/hcmus-auto-dkhp/main/tricker/HCMUS%20Auto%20DKHP%20-%20HK3%2023TC%20Safe-2.0.user.js
```

## Tác Giả

**Lương Hải Long**  
Sinh viên ngành Điện tử Viễn thông, HCMUS  
GitHub: [@lhlizdabezt](https://github.com/lhlizdabezt)

## License

MIT License. Xem [LICENSE](LICENSE).

## Disclaimer

Đây là project automation cá nhân phục vụ học tập và thao tác lặp lại. Project không liên kết, không được bảo trợ và không được duy trì bởi HCMUS. Hãy dùng theo đúng quy định của nhà trường, chính sách portal và trách nhiệm cá nhân.
