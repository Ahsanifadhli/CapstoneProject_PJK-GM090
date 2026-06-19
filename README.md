# AI SHIELD

**Smart Handling of Integrity in Ethical Live Dialogue**

Platform forum diskusi akademik dengan moderasi pesan otomatis secara real-time. Setiap pesan yang dikirim pengguna diklasifikasikan ke salah satu dari tiga label sebelum tampil di room:

- **PANTAS** — pesan aman, langsung tampil
- **MERAGUKAN** — terdeteksi mencurigakan (plesetan, bahasa daerah, dsb.), disembunyikan sementara dan bisa diajukan untuk ditinjau admin
- **TIDAK PANTAS** — ujaran kebencian/kasar yang jelas, disembunyikan permanen dengan notifikasi edukatif ke pengirim

## Arsitektur & Struktur Folder

```
CapstoneProject_PJK-GM090/
├── backend/                      ← Backend aktif (FastAPI + WebSocket + SQLite)
├── Development Testing/
│   ├── AI/                       ← Dataset, notebook training, classifier.py (dipakai backend/ di atas)
│   ├── BE/                       ← Prototype awal backend (LEGACY, sudah tidak sinkron dengan FE — jangan dipakai)
│   └── FE/                       ← Frontend aktif (React + Vite)
```

> **Penting:** backend yang aktif dan terhubung dengan frontend adalah folder **`backend/`** di root repo, bukan `Development Testing/BE`. Folder `Development Testing/BE` adalah prototype lama yang ditinggalkan dan tidak memiliki endpoint terbaru (token session, dsb.) — jangan dijalankan untuk development/deploy.

`backend/main.py` memuat classifier dari `Development Testing/AI/classifier.py` melalui path relatif, jadi struktur folder di atas harus tetap utuh (tidak bisa hanya copy folder `backend/` sendirian).

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18 + Vite, axios, WebSocket native |
| Backend | FastAPI, WebSocket, SQLite (sqlite3), bcrypt |
| AI Classifier | Keyword-based + fuzzy matching (placeholder), interface kompatibel untuk model IndoBERT di masa depan |

**Catatan status AI:** Model IndoBERT yang direncanakan di timeline proyek **belum diintegrasikan** — `predict()` saat ini masih classifier berbasis kamus kata kasar (`Development Testing/AI/classifier.py`). Begitu model IndoBERT selesai dilatih, cukup tambahkan file `inference.py` dengan fungsi `predict(text) -> {label, confidence}` di folder `Development Testing/AI/` — backend otomatis memprioritaskan file itu tanpa perlu ubah kode lain (lihat `load_classifier()` di `backend/main.py`).

## Menjalankan Secara Lokal

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\python.exe -m pip install -r requirements.txt
venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000

# Mac/Linux
venv/bin/python -m pip install -r requirements.txt
venv/bin/python -m uvicorn main:app --reload --port 8000
```

Salin `backend/.env.example` menjadi `backend/.env` lalu isi `ADMIN_PASSWORD` dan `CORS_ORIGIN` (default `http://localhost:5173`).

Server berjalan di `http://localhost:8000`, dokumentasi API otomatis di `http://localhost:8000/docs`.

### Frontend

```bash
cd "Development Testing/FE"
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

## Environment Variables

**Backend (`backend/.env`)**

| Variable | Default | Keterangan |
|---|---|---|
| `ADMIN_PASSWORD` | `admin123` | Password untuk masuk Admin Dashboard |
| `CORS_ORIGIN` | `http://localhost:5173` | URL frontend yang diizinkan mengakses API |

**Frontend (`Development Testing/FE/.env`, opsional untuk dev)**

| Variable | Default | Keterangan |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL REST API backend |
| `VITE_WS_URL` | `ws://localhost:8000` | Base URL WebSocket backend |

## Deployment

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk panduan lengkap: backend dijalankan lokal + diakses publik via Cloudflare Tunnel (gratis, tanpa kartu), frontend di-deploy ke Vercel.

## Fitur Utama

- Registrasi & login (bcrypt hash, session token)
- Forum multi-room dengan chat real-time (WebSocket)
- Moderasi otomatis 3-label dengan confidence score & probabilitas per label
- Pengguna bisa mengajukan review untuk pesan berstatus MERAGUKAN
- Admin Dashboard: log pelanggaran, statistik per room, kelola user, approve/reject review
- Fitur lapor pesan (flag) oleh pengguna

## Keterbatasan yang Diketahui

- Classifier AI masih placeholder keyword-based, belum model IndoBERT terlatih
- SQLite (`aishield.db`) bisa hilang saat redeploy kalau tidak memakai Volume persisten di hosting (lihat [DEPLOYMENT.md](DEPLOYMENT.md))
- Belum ada automated test suite
