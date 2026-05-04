# PanLink - Short URL & Media Tools

Website short URL untuk domain `panpan.biz.id` dengan tampilan simpel, animasi halus, dan fitur lengkap.

## Fitur

- Short URL otomatis
- Custom slug
- QR Code otomatis
- Statistik klik
- Password link
- Expired link
- Media Tools untuk TikTok/YouTube secara aman
- Download direct video file jika URL berupa file langsung seperti `.mp4`, `.webm`, `.mov`, atau `.m4v`

## Catatan Media Tools

Fitur media tidak dibuat untuk membypass YouTube/TikTok. Untuk YouTube dan TikTok, web akan memberi tombol buka sumber asli, QR, dan catatan resmi. Download langsung hanya aktif untuk direct video file yang kamu miliki atau memang punya izin untuk disimpan.

## Environment Variables Vercel

```env
NEXT_PUBLIC_SITE_URL=https://panpan.biz.id
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_key
SHORTENER_ADMIN_TOKEN=panpan-secret-123
LINK_PASSWORD_SECRET=panpan-secret-random-panjang
```

## Supabase SQL

Jalankan file ini di Supabase SQL Editor:

```text
supabase/schema.sql
```

## Jalankan lokal

```bash
npm install
npm run dev
```

## Deploy Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Upload GitHub dari Termux

```bash
cd /storage/emulated/0/Download/panpan-short-url-simple-animated

git config --global --add safe.directory /storage/emulated/0/Download/panpan-short-url-simple-animated
git config --global user.name "Panzqq"
git config --global user.email "EMAIL_GITHUB_KAMU"

git init
git branch -M main

git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Panzqq/panpan-short-url.git

git add .
git commit -m "Simplify UI and add media tools"
git push -u origin main --force
```
