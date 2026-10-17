# 📒 Ghi chú lệnh: Web "Lộ trình học"

> Dùng **Git Bash**. Dán lệnh: **Shift + Insert** hoặc chuột phải → **Paste**.
> Repo: https://github.com/NgocTTH2003/lo-trinh-hoc
> Cloudflare: https://dash.cloudflare.com → **Workers & Pages** → `lo-trinh-hoc`

---

## 1. Mỗi lần mở máy: vào thư mục dự án

```bash
cd /d/CODE/lo-trinh-hoc
```

Đúng chỗ khi dòng vàng hiện: `/d/CODE/lo-trinh-hoc (main)`

> Mẹo: gõ `cd /d/CO` rồi nhấn **Tab** để tự điền.

---

## 2. Quy trình sửa code → đưa lên web (dùng nhiều nhất)

```bash
git pull                          # (1) lấy bản mới nhất về (nếu có sửa trên GitHub)
# ... sửa code bằng VS Code ...
git status                        # (2) xem file nào đã thay đổi
git add .                         # (3) chọn tất cả thay đổi
git commit -m "Ghi chu da sua gi" # (4) lưu lại, kèm ghi chú
git push                          # (5) đẩy lên GitHub → Cloudflare tự cập nhật web
```

Sau khi `git push`:
1. Vào Cloudflare → `lo-trinh-hoc` → tab **Deployments**, đợi dấu ✅ xanh (1–2 phút).
2. Mở web, nhấn **Ctrl + F5** để tải bản mới (bỏ qua bản cũ trình duyệt đã lưu).

---

## 3. File nào để sửa cái gì

| Muốn sửa | File |
|---|---|
| Giao diện, màu sắc, nút bấm | `public/index.html` |
| Logic lưu/đọc dữ liệu (thay cho Code.gs) | `functions/api/[fn].js` |
| Cấu hình Worker, mã database | `wrangler.jsonc` |
| Cấu trúc bảng database | `database/schema.sql` |

⚠️ Đầu file `public/index.html` **luôn phải có** 2 dòng này ngay sau `<head>`:

```html
<meta charset="utf-8">
<script src="/api-shim.js"></script>
```

---

## 4. Đăng nhập Cloudflare (Wrangler)

```bash
npx wrangler whoami    # xem đang đăng nhập email nào
npx wrangler logout    # đăng xuất
npx wrangler login     # đăng nhập (trình duyệt mở ra → bấm Allow)
```

> Nếu đăng nhập nhầm email: đăng xuất Cloudflare trên **trình duyệt** trước, đăng nhập đúng email, rồi mới chạy `npx wrangler login`.

---

## 5. Làm việc với database

```bash
# Xem danh sách database (lấy uuid)
npx wrangler d1 list

# Đếm số bài học / khóa học
npx wrangler d1 execute lo-trinh-hoc --remote --command "SELECT COUNT(*) FROM bai_hoc"
npx wrangler d1 execute lo-trinh-hoc --remote --command "SELECT COUNT(*) FROM roadmap"

# Xem nhanh danh sách khóa học
npx wrangler d1 execute lo-trinh-hoc --remote --command "SELECT id, ten_khoa_hoc, trang_thai, tien_do FROM roadmap"
```

### 💾 Sao lưu dữ liệu (nên làm mỗi tuần)

```bash
npx wrangler d1 export lo-trinh-hoc --remote --output=backup-$(date +%Y-%m-%d).sql
```

→ Tạo file như `backup-2026-10-17.sql` trong thư mục dự án.

> Không nên `git push` file backup lên GitHub nếu repo đang để **Public** (ai cũng xem được dữ liệu). Nên chuyển file backup sang thư mục khác.

### ♻️ Khôi phục từ bản sao lưu (khi lỡ xóa nhầm)

```bash
npx wrangler d1 execute lo-trinh-hoc --remote --command "DROP TABLE IF EXISTS bai_hoc; DROP TABLE IF EXISTS roadmap;"
npx wrangler d1 execute lo-trinh-hoc --remote --file=backup-2026-10-17.sql
```

⚠️ Lệnh đầu **xóa sạch dữ liệu hiện tại**: chỉ chạy khi chắc chắn muốn quay về bản backup.

---

## 6. Mật khẩu quản trị

```bash
# Đổi mật khẩu (gõ mật khẩu mới khi được hỏi)
npx wrangler secret put ADMIN_PASSWORD
```

Hoặc trên web: Cloudflare → `lo-trinh-hoc` → **Settings** → **Variables and Secrets**.

Trên trình duyệt, muốn **quên mật khẩu đã lưu** (khi dùng máy người khác): nhấn **F12** → tab **Console** → gõ:

```js
logoutAdmin()
```

---

## 7. Lỡ tay sửa hỏng code

```bash
git log --oneline                  # xem lịch sử các lần commit
git restore public/index.html      # bỏ thay đổi CHƯA commit của 1 file
git restore .                      # bỏ TẤT CẢ thay đổi chưa commit
git revert HEAD                    # hủy lần commit gần nhất (an toàn, rồi git push)
```

---

## 8. Lỗi hay gặp

| Lỗi | Nguyên nhân → Cách sửa |
|---|---|
| `bash: cd: too many arguments` | Gõ sai đường dẫn → dùng `cd /d/CODE/lo-trinh-hoc` |
| `'node' is not recognized` | Mở CMD/Git Bash **mới** hoặc khởi động lại máy |
| `Authentication error [code: 10000]` | Phiên đăng nhập hết hạn → `npx wrangler logout` rồi `npx wrangler login` |
| `warning: LF will be replaced by CRLF` | Vô hại, bỏ qua |
| Chữ tiếng Việt bị vỡ (`Tiáº¿n Ä‘á»™`) | Thiếu `<meta charset="utf-8">` trong `index.html` |
| Web báo `Lỗi máy chủ 404` | Thiếu `wrangler.jsonc` hoặc `src/index.js` → kiểm tra rồi push lại |
| Web báo `Chưa gắn database D1` | Sai/thiếu `database_id` trong `wrangler.jsonc` |
| Web báo `Chưa cấu hình secret ADMIN_PASSWORD` | Thêm Secret `ADMIN_PASSWORD` trên Cloudflare |
| Web báo `Sai mật khẩu` | Nhập lại đúng mật khẩu, hoặc gõ `logoutAdmin()` trong Console rồi thử lại |
| Sửa code mà web không đổi | Chưa `git push`, build chưa xong, hoặc cần **Ctrl + F5** |
| `git push` bị từ chối (`rejected`) | Trên GitHub có thay đổi mới → chạy `git pull` rồi `git push` lại |

---

## 9. CMD và Git Bash khác nhau

| | CMD | Git Bash |
|---|---|---|
| Vào thư mục | `cd /d "D:\CODE\lo-trinh-hoc"` | `cd /d/CODE/lo-trinh-hoc` |
| Xem file trong thư mục | `dir` | `ls` |
| Dán lệnh | Ctrl + V | Shift + Insert |