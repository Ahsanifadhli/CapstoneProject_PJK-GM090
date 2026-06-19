# Panduan Deployment — AI SHIELD

Sistem ini terdiri dari 2 bagian yang di-deploy dengan cara berbeda:

- **Backend** (`backend/`) — FastAPI + WebSocket → dijalankan **lokal di komputer Anda**, diakses publik lewat **Cloudflare Tunnel** (gratis, tanpa akun, tanpa kartu)
- **Frontend** (`Development Testing/FE/`) — React/Vite → di-deploy ke **Vercel** (gratis, tanpa kartu)

> **Kenapa begini?** Per Juni 2026, hampir semua platform cloud hosting backend gratis (Render, Railway, Fly.io, dst.) mewajibkan verifikasi kartu kredit, dan Glitch (yang dulu tidak perlu kartu) sudah tutup permanen sejak Juli 2025. Cloudflare Tunnel adalah cara paling realistis untuk dapat link publik ke backend **tanpa kartu sama sekali** — trade-off-nya backend harus tetap berjalan di komputer Anda (tidak benar-benar "di cloud").

---

## 1. Jalankan Backend + Cloudflare Tunnel (lokal)

**Sekali saja**, install `cloudflared`:
```powershell
winget install --id Cloudflare.cloudflared -e
```

**Setiap kali mau demo/online-kan sistem:**

1. Jalankan backend seperti biasa:
   ```bash
   cd backend
   venv\Scripts\python.exe -m uvicorn main:app --port 8000
   ```
2. Di terminal/PowerShell **lain** (biarkan backend tetap jalan di terminal pertama), jalankan:
   ```powershell
   cloudflared tunnel --url http://localhost:8000
   ```
3. Tunggu beberapa detik, akan muncul log seperti ini:
   ```
   Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
   https://kata-acak-acak.trycloudflare.com
   ```
   **Catat URL ini** — ini link publik backend Anda.

### ⚠️ Penting: URL berubah setiap restart

Karena ini "quick tunnel" gratis tanpa akun, **URL akan berbeda setiap kali Anda menjalankan ulang `cloudflared`**. Setiap kali URL berubah, Anda perlu update environment variable di Vercel (langkah 3 di bawah) dan redeploy frontend. Kalau butuh URL backend yang permanen/tidak berubah-ubah, beri tahu saya — ada opsi pakai domain gratis (DuckDNS) + Cloudflare named tunnel, tapi setup-nya lebih panjang.

**Backend & tunnel harus tetap berjalan** (jangan tutup kedua terminal itu) selama sistem mau diakses orang lain.

---

## 2. Deploy Frontend ke Vercel

1. Buka [vercel.com](https://vercel.com) → login dengan GitHub → **Add New** → **Project**.
2. Pilih repo ini. Saat konfigurasi:
   - **Root Directory**: klik Edit → pilih `Development Testing/FE`
   - Framework Preset: Vercel otomatis mendeteksi **Vite**
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)
3. Tambahkan Environment Variables (Project Settings → Environment Variables), pakai URL tunnel dari langkah 1:
   - `VITE_API_URL` = `https://kata-acak-acak.trycloudflare.com`
   - `VITE_WS_URL` = `wss://kata-acak-acak.trycloudflare.com` (pakai `wss://`, bukan `ws://`)
4. Klik **Deploy**. Setelah selesai, catat URL frontend, contoh:
   `https://ai-shield.vercel.app`

---

## 3. Update CORS Backend

Backend butuh tahu domain frontend yang boleh akses. Buka `backend/.env` (buat dari `backend/.env.example` kalau belum ada), isi:

```
CORS_ORIGIN=https://ai-shield.vercel.app
```

Restart backend (`Ctrl+C` lalu jalankan ulang `uvicorn main:app --port 8000`) agar perubahan `.env` terbaca.

---

## Setiap Kali URL Tunnel Berubah (restart `cloudflared`)

1. Jalankan ulang `cloudflared tunnel --url http://localhost:8000`, catat URL baru
2. Buka Vercel → Project Settings → Environment Variables → update `VITE_API_URL` dan `VITE_WS_URL` ke URL baru
3. Buka tab **Deployments** di Vercel → klik **Redeploy** pada deployment terakhir (env var Vite hanya terbaca ulang saat build, bukan otomatis)

---

## Troubleshooting

| Masalah | Kemungkinan sebab |
|---|---|
| FE muncul tapi gagal fetch rooms/messages | URL tunnel sudah berubah/expired tapi `VITE_API_URL` di Vercel belum diupdate + redeploy |
| WebSocket gagal connect | `VITE_WS_URL` masih `ws://` (harus `wss://`), atau backend/tunnel sedang tidak berjalan di komputer Anda |
| Tunnel tiba-tiba putus | Quick tunnel Cloudflare tanpa akun memang "best effort", tidak ada garansi uptime — kalau sering putus, restart `cloudflared` lagi |
| Build FE gagal di Vercel | Pastikan Root Directory di-set ke `Development Testing/FE`, bukan root repo |
