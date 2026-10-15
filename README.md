# Lộ trình học — web trên Cloudflare Pages + D1

Bản chuyển từ Google Sheet + Apps Script sang web miễn phí.

```
lo-trinh-hoc/
├── public/
│   ├── index.html        ← giao diện (dán Index.html cũ vào đây)
│   └── api-shim.js       ← giả lập google.script.run bằng API mới
├── functions/api/[fn].js ← backend, thay cho Code.gs + Config.gs
└── database/
    ├── schema.sql        ← tạo bảng
    └── seed.sql          ← dữ liệu chuyển từ Google Sheet
```

## Bước 1. Tạo database D1 và nạp dữ liệu

Mở CMD trong thư mục `lo-trinh-hoc` rồi chạy:

```bash
npx wrangler login
npx wrangler d1 create lo-trinh-hoc
npx wrangler d1 execute lo-trinh-hoc --remote --file=database/schema.sql
npx wrangler d1 execute lo-trinh-hoc --remote --file=database/seed.sql
```

Kiểm tra: `npx wrangler d1 execute lo-trinh-hoc --remote --command "SELECT COUNT(*) FROM bai_hoc"` → phải ra 135.

## Bước 2. Đưa giao diện cũ vào

1. Mở Apps Script, copy toàn bộ file **Index.html**.
2. Dán đè vào `public/index.html`.
3. Thêm đúng 1 dòng ngay sau `<head>`:

```html
<head>
<script src="/api-shim.js"></script>
```

Không cần sửa gì khác: mọi lời gọi `google.script.run...` sẽ tự chuyển sang API mới.

## Bước 3. Đưa lên GitHub

```bash
git init
git add .
git commit -m "Chuyển Lộ trình học sang Cloudflare"
git branch -M main
git remote add origin https://github.com/TEN_BAN/lo-trinh-hoc.git
git push -u origin main
```

## Bước 4. Tạo project Cloudflare Pages

Dashboard → **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git** → chọn repo.

- Framework preset: **None**
- Build command: *(để trống)*
- Build output directory: `public`

Bấm **Save and Deploy**.

## Bước 5. Gắn database và đặt mật khẩu

Trong project vừa tạo → **Settings**:

1. **Bindings** → **Add** → **D1 database** → Variable name: `DB`, chọn database `lo-trinh-hoc`.
2. **Variables and Secrets** → **Add** → Type: **Secret**, Name: `ADMIN_PASSWORD`, Value: mật khẩu bạn tự đặt.

Sau đó vào **Deployments** → bản mới nhất → **Retry deployment** (cấu hình chỉ có hiệu lực từ lần deploy kế tiếp).

Web của bạn: `https://<ten-project>.pages.dev`

## Cách dùng

- Ai có link cũng **xem** được.
- Lần đầu bạn **lưu/sửa/xóa**, trang hỏi mật khẩu (ADMIN_PASSWORD) và nhớ trong trình duyệt đó.
- Muốn quên mật khẩu trên máy lạ: mở Console (F12) gõ `logoutAdmin()`.
- Sửa code → `git add . && git commit -m "..." && git push` → khoảng 1 phút sau web tự cập nhật.

## Sao lưu dữ liệu

```bash
npx wrangler d1 export lo-trinh-hoc --remote --output=backup.sql
```
