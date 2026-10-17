# 🔄 Quy trình sửa code và cập nhật web "Lộ trình học"

> Dùng **Git Bash**. Dán lệnh: **Shift + Insert** hoặc chuột phải → **Paste**.
> Mọi thao tác trên trình duyệt: dùng **Chrome của ngocemtthn2003@gmail.com**.

---

## ⚡ Tóm tắt nhanh (mỗi lần chỉ cần nhớ)

```bash
cd /d/CODE/lo-trinh-hoc
git pull
code .
# ... sửa code trong VS Code, Ctrl + S ...
git add .
git commit -m "Ghi chu ban da sua gi"
git push
```

→ Đợi 1–2 phút → mở web → **Ctrl + F5**.

---

## Bước 1: Mở dự án

```bash
cd /d/CODE/lo-trinh-hoc
git pull
code .
```

| Lệnh | Tác dụng |
|---|---|
| `cd /d/CODE/lo-trinh-hoc` | Vào thư mục dự án |
| `git pull` | Lấy bản mới nhất từ GitHub về (nên chạy trước mỗi lần sửa) |
| `code .` | Mở cả thư mục trong VS Code |

Đúng chỗ khi dòng vàng hiện: `/d/CODE/lo-trinh-hoc (main)`

---

## Bước 2: Sửa code trong VS Code

| Muốn sửa | Mở file |
|---|---|
| Giao diện, màu sắc, nút bấm, chữ hiển thị | `public/index.html` |
| Logic lưu / đọc dữ liệu | `functions/api/[fn].js` |
| Cấu hình Worker, mã database | `wrangler.jsonc` |

Sửa xong nhấn **Ctrl + S** để lưu.

⚠️ **Không được xóa** 2 dòng đầu sau `<head>` trong `public/index.html`:

```html
<meta charset="utf-8">
<script src="/api-shim.js"></script>
```

---

## Bước 3 (không bắt buộc): Chạy thử trên máy

```bash
npx wrangler dev --remote
```

- Mở http://localhost:8787 để xem trước.
- Bản chạy thử dùng **database thật**, nên cẩn thận khi xóa/sửa dữ liệu.
- Xem xong: nhấn **Ctrl + C** trong Git Bash để tắt.

---

## Bước 4: Đẩy lên mạng

```bash
git add .
git commit -m "Ghi chu ban da sua gi"
git push
```

| Lệnh | Tác dụng |
|---|---|
| `git add .` | Chọn tất cả file đã thay đổi |
| `git commit -m "..."` | Lưu một phiên bản, kèm ghi chú |
| `git push` | Đẩy lên GitHub → Cloudflare tự build lại web |

Ví dụ ghi chú tốt: `"Doi mau nut luu"`, `"Them lo trinh BA"`, `"Sua loi hien thi ngay"`.

---

## Bước 5: Kiểm tra web

1. Cloudflare → **Workers & Pages** → `lo-trinh-hoc` → tab **Deployments**.
2. Đợi bản mới nhất có dấu ✅ (1–2 phút).
   - ❌ Lỗi → bấm vào bản build, xem phần **log**.
3. Mở web → nhấn **Ctrl + F5** để thấy bản mới.

> Link web: Cloudflare → `lo-trinh-hoc` → **Settings** → **Domains & Routes** (đuôi `.workers.dev`).

---

## 🆘 Khi lỡ tay

| Tình huống | Lệnh |
|---|---|
| Sửa hỏng 1 file, **chưa commit** | `git restore public/index.html` |
| Sửa hỏng nhiều file, **chưa commit** | `git restore .` |
| Đã commit nhưng **chưa push** | `git reset --soft HEAD~1` (bỏ commit, giữ code để sửa tiếp) |
| Đã **push bản hỏng** lên web | `git revert HEAD` rồi `git push` |
| Xem lịch sử các lần sửa | `git log --oneline` |

---

## 💾 Sao lưu dữ liệu (nên làm mỗi tuần)

```bash
npx wrangler d1 export lo-trinh-hoc --remote --output=backup-$(date +%Y-%m-%d).sql
```

→ Chuyển file `backup-....sql` ra thư mục khác, **không push lên GitHub** (repo đang Public).

---

## 🔐 Các lệnh hay dùng khác

```bash
npx wrangler whoami                       # kiểm tra đang đăng nhập email nào
npx wrangler secret put ADMIN_PASSWORD    # đổi mật khẩu quản trị
npx wrangler deploy                       # deploy thẳng từ máy (khi build tự động bị lỗi)
```

Đăng nhập lại khi cần (tránh nhầm tài khoản):

```bash
npx wrangler logout
npx wrangler login --browser=false
```

→ Copy link → dán vào **Chrome của ngocemtthn2003** → **Authorize**.

---

## ❗ Lỗi hay gặp

| Lỗi | Cách sửa |
|---|---|
| `warning: LF will be replaced by CRLF` | Vô hại, bỏ qua |
| `git push` bị `rejected` | Chạy `git pull` rồi `git push` lại |
| `Authentication error [code: 10000]` | `npx wrangler logout` → `npx wrangler login --browser=false` |
| `Couldn't find a D1 DB` | Đăng nhập nhầm tài khoản → kiểm tra `npx wrangler whoami` |
| Sửa code mà web không đổi | Build chưa xong, hoặc chưa nhấn **Ctrl + F5** |
| Chữ tiếng Việt bị vỡ | Thiếu `<meta charset="utf-8">` trong `index.html` |
| Web báo `Sai mật khẩu` | F12 → Console → gõ `logoutAdmin()` → thử lại |