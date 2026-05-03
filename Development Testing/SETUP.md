# Panduan Menjalankan Development Testing — AI SHIELD

Prototype ini membuktikan bahwa arsitektur AI + BE + FE bekerja end-to-end.
Jalankan **dua terminal** secara bersamaan: satu untuk BE, satu untuk FE.

---

## Prasyarat

| Software | Versi Minimum | Link Download |
|----------|---------------|---------------|
| Python   | 3.10+         | https://www.python.org/downloads/ |
| Node.js  | 18+           | https://nodejs.org/ |

Setelah install, verifikasi dengan membuka terminal dan ketik:
```
python --version
node --version
npm --version
```

---

## Terminal 1 — Menjalankan Backend (BE)

```bash
# Masuk ke folder BE
cd "Development Testing/BE"

# Buat virtual environment (hanya perlu sekali)
python -m venv venv

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependency (hanya perlu sekali)
pip install -r requirements.txt

# Jalankan server
uvicorn main:app --reload --port 8000
```

Server berjalan di: http://localhost:8000
Dokumentasi API otomatis: http://localhost:8000/docs

---

## Terminal 2 — Menjalankan Frontend (FE)

```bash
# Masuk ke folder FE
cd "Development Testing/FE"

# Install dependency (hanya perlu sekali)
npm install

# Jalankan dev server
npm run dev
```

Aplikasi berjalan di: http://localhost:5173

---

## Cara Menggunakan

1. Buka http://localhost:5173 di browser
2. Masukkan nama pengguna → klik "Masuk ke Forum"
3. Pilih salah satu room (Forum Umum / Diskusi Akademik)
4. Kirim pesan biasa → pesan muncul normal
5. Kirim pesan mengandung kata kasar → pesan disembunyikan, notifikasi edukatif muncul
6. Buka tab/browser baru dengan nama berbeda untuk simulasi percakapan multi-pengguna
7. Klik "Buka Admin Dashboard" di halaman pemilihan room untuk melihat log pelanggaran

---

## Catatan Penting

- Database SQLite (`aishield.db`) dibuat otomatis di folder BE saat pertama kali server dijalankan
- Classifier saat ini berbasis kata kunci sebagai placeholder — akan diganti IndoBERT setelah model selesai di-fine-tune
- Untuk reset database, hapus file `BE/aishield.db` lalu restart server
