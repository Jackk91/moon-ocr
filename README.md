# Moon OCR

Upload và quản lý file OCR với Google Drive, hỗ trợ xác thực Google OAuth và kiểm tra file trùng lặp.

## Tính năng

- Đăng nhập bằng tài khoản Google (OAuth 2.0 với PKCE)
- Upload file lên Google Drive (thư mục `OCR_Uploads`)
- Kiểm tra file trùng lặp trước khi upload
- Hiển thị danh sách file đã upload
- Reupload file nếu cần

## Công nghệ

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Cloudflare Pages Functions (Hono framework), Cloudflare KV
- **Auth:** Google OAuth 2.0 + PKCE, JWT (jose)
- **Storage:** Google Drive API

## Cài đặt

```bash
# Clone repository
git clone https://github.com/Jackk91/moon-ocr.git
cd moon-ocr

# Cài dependencies
npm install

# Tạo file .dev.vars từ template
cp .dev.vars.example .dev.vars

# Start dev server
npm run dev
```

### Biến môi trường (.dev.vars)

| Variable | Mô tả |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `JWT_SECRET` | Secret key cho JWT |
| `OAUTH_REDIRECT` | Redirect URL (VD: `https://example.com/api/auth/callback`) |
| `NOTEBOOK_DRIVE_ID` | Google Drive Folder ID cho notebook |

## Deploy

```bash
npm run pages:deploy
```

## License

Apache License 2.0 + Commons Clause — xem [LICENSE](LICENSE).
