# Proposal Capstone Project
## AI Moderasi Pesan — Simulasi Aplikasi Chat Berbasis Web
**Program:** PIJAK in collaboration with IBM SkillsBuild — Dicoding
**Tema:** AI for Productivity and Automation

---

## 1. Ringkasan Eksekutif

Proyek ini membangun sistem moderasi konten berbasis AI yang diintegrasikan ke dalam **simulasi aplikasi chat berbasis web** (menyerupai antarmuka WhatsApp). AI mendeteksi pesan tidak pantas — mencakup ujaran kebencian, pelecehan seksual, bahasa kasar, dan slang tidak baku akademik — secara real-time menggunakan model NLP IndoBERT yang di-fine-tune pada dataset bahasa Indonesia. Sistem menerapkan kebijakan **zero-tolerance**: setiap pesan yang terklasifikasi `TIDAK PANTAS` langsung disembunyikan dan pengirim mendapat notifikasi edukatif agar terbiasa berkomunikasi dengan standar bahasa akademik.

Solusi ini menjawab masalah nyata: kasus viral percakapan grup mahasiswa UI (April 2026) yang menunjukkan kegagalan moderasi manual dalam mencegah penyebaran konten merusak secara real-time.

---

## 2. Problem Statement

Moderasi konten secara manual oleh admin grup terbukti tidak efektif karena:
- Admin tidak bisa memantau 24/7
- Pesan menyebar dalam hitungan detik sebelum sempat dihapus
- Tidak ada mekanisme pencegahan — hanya reaktif
- Tidak ada standar etika bahasa yang ditegakkan secara konsisten, sehingga kebiasaan berkomunikasi secara kasar terus terbawa ke forum akademik

**Solusi yang dibutuhkan:** Sistem otomatis berbasis AI yang mendeteksi dan menindak pesan tidak pantas **segera setelah** pesan dikirim tanpa campur tangan manual, sekaligus mendidik pengguna untuk berkomunikasi sesuai standar bahasa akademik.

---

## 3. Research Questions

1. Seberapa akurat model IndoBERT yang di-fine-tune dalam mengklasifikasikan pesan sebagai `PANTAS` atau `TIDAK PANTAS` dalam konteks percakapan grup berbahasa Indonesia?
2. Berapa confidence threshold yang optimal untuk klasifikasi biner agar sistem tidak salah menghapus pesan yang ambigu?
3. Bagaimana merancang notifikasi moderasi yang bersifat edukatif sehingga pengguna memahami alasan pesannya disembunyikan dan terdorong memperbaiki cara berkomunikasi?
4. Apakah penerapan kebijakan zero-tolerance terhadap bahasa kasar secara konsisten dapat membentuk kebiasaan komunikasi akademik yang lebih baik pada pengguna?

---

## 4. Latar Belakang

- **Kasus Nyata:** Chat mahasiswa UI yang viral (April 2026) memperlihatkan bagaimana percakapan internal bisa menjadi konsumsi publik dan merusak reputasi individu serta institusi.
- **Skala Masalah:** WhatsApp digunakan oleh >100 juta pengguna Indonesia. Grup-grup komunitas, kampus, dan organisasi sangat rentan terhadap penyebaran konten tidak pantas.
- **Keterbatasan Teknis:** API resmi WhatsApp Business sangat terbatas aksesnya dan tidak mendukung aksi moderasi otomatis pada level pesan individual di grup. Karena itu, **simulasi aplikasi chat berbasis web** menjadi pendekatan paling praktis untuk proof-of-concept ini.
- **Potensi AI:** Model NLP seperti IndoBERT (BERT pre-trained pada corpus bahasa Indonesia) mampu memahami konteks kalimat dengan baik, termasuk bahasa gaul dan eufemisme yang umum digunakan.

---

## 5. Solusi yang Diusulkan

### Arsitektur Sistem

```
[Pengguna] → [Frontend (React/Next.js)] → [Backend API (FastAPI)]
                                                    ↓
                                         [AI Moderasi Engine]
                                         (IndoBERT fine-tuned)
                                                    ↓
                                    [Database Log + Dashboard Admin]
```

### Alur Moderasi

1. Pengguna mengetik dan mengirim pesan di simulasi chat
2. Backend menerima pesan dan mengirimkannya ke AI engine
3. AI mengklasifikasikan: `PANTAS` atau `TIDAK PANTAS` beserta confidence score (0–1)
4. Jika `PANTAS` → pesan ditampilkan normal ke semua anggota room
5. Jika `TIDAK PANTAS` (confidence ≥ 0.75) → pesan langsung disembunyikan, pengirim menerima notifikasi edukatif, pelanggaran dicatat ke log admin
6. Jika `TIDAK PANTAS` (confidence < 0.75) → pesan tetap disembunyikan sebagai bentuk kehati-hatian, namun pengirim dapat mengajukan review ke admin

### Aksi Moderasi Otomatis

| Label | Confidence | Tindakan |
|-------|-----------|----------|
| `PANTAS` | Berapapun | Tampilkan pesan normal |
| `TIDAK PANTAS` | ≥ 0.75 | Sembunyikan pesan + kirim notifikasi edukatif ke pengirim + catat pelanggaran |
| `TIDAK PANTAS` | < 0.75 | Sembunyikan pesan + beri opsi review ke admin |

### Notifikasi Edukatif ke Pengirim

Setiap pesan yang disembunyikan disertai pesan kontekstual yang **mendidik, bukan sekadar menyensor**:

> *"Pesanmu telah disembunyikan karena mengandung bahasa yang tidak sesuai standar komunikasi akademik. Coba sampaikan kembali dengan pilihan kata yang lebih tepat dan sopan."*

---

## 6. Komponen AI / Machine Learning

### Model
- **Base model:** IndoBERT (`indobenchmark/indobert-base-p1`) dari HuggingFace
- **Task:** Binary Text Classification (`PANTAS` / `TIDAK PANTAS`)
- **Framework:** PyTorch + HuggingFace Transformers

### Dataset & Strategi Pelabelan Ulang

Dataset yang tersedia umumnya berlabel multi-kelas. Berikut strategi konversi ke label biner:

| Label Asli Dataset | Label Baru |
|-------------------|------------|
| `non-hate`, `non-abusive`, bahasa formal/santai | `PANTAS` |
| `hate speech`, `abusive`, `offensive`, bahasa kasar/slang negatif | `TIDAK PANTAS` |

- **Primary:** Indonesian Hate Speech & Abusive Language (GitHub — okkyibrohim) ~13.000 tweet
- **Secondary:** IndoNLU Benchmark / Satu Data Indonesia
- **Augmentasi:** Tambah contoh bahasa gaul positif (misal: *"anjir keren!"*) berlabel `TIDAK PANTAS` untuk menguatkan pemahaman model bahwa konteks tidak mempengaruhi kebijakan

### Pipeline ML
1. Data collection & relabeling ke 2 kelas (PANTAS / TIDAK PANTAS)
2. Preprocessing: lowercasing, hapus URL/emoji, normalisasi slang dengan kamus alay
3. Tokenisasi dengan IndoBERT tokenizer (max_length=128)
4. Fine-tuning binary classification, learning rate 2e-5, batch size 16, epoch 5
5. Evaluasi: Accuracy, Precision, Recall, F1-Score, Confusion Matrix
6. Kalibrasi confidence threshold optimal (default 0.75)
7. Export model → simpan ke Google Drive (link dicantumkan di README)

### Target Performa
- Accuracy ≥ 85%
- F1-Score kelas `TIDAK PANTAS` ≥ 82% (lebih tinggi dari multi-kelas karena data lebih terfokus)

---

## 7. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React.js (Vite) + Tailwind CSS |
| Backend | FastAPI (Python 3.11) |
| AI Engine | IndoBERT + HuggingFace Transformers |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Real-time | WebSocket (via FastAPI) |
| Demo Endpoint | Streamlit (endpoint interaktif sesuai syarat PIJAK) |
| Model Storage | Google Drive (link di README) |
| Repo | GitHub (private) |

---

## 8. Deliverables (sesuai syarat PIJAK)

| No | Deliverable | Keterangan |
|----|-------------|------------|
| 1 | Project Plan | Dokumen perencanaan (template PIJAK) |
| 2 | Project Brief | Dokumentasi implementasi lengkap |
| 3 | Source Code | GitHub repo (ZIP, private) |
| 4 | Streamlit Demo | Endpoint interaktif model moderasi |
| 5 | Web App | Simulasi chat dengan AI moderasi terintegrasi |
| 6 | Slide Presentasi | PPTX/PDF maks 10 MB |
| 7 | Video Presentasi | YouTube, 10 menit, wajah semua anggota |
| 8 | Panduan Penggunaan | PDF atau video tutorial |
| 9 | README lengkap | Instalasi, cara jalankan, link model |

---

## 9. Timeline (mengikuti jadwal PIJAK)

| Fase | Periode | Target |
|------|---------|--------|
| Project Plan | 20 Apr – 7 Mei 2026 | Dokumen project plan selesai |
| Checkpoint 1 | 7 Mei 2026 | Pengumpulan project plan |
| Implementasi | 11 Mei – 19 Jun 2026 | Development FE + BE + AI |
| Mentoring | 12 Mei – 14 Jun 2026 | Sesi dengan Advisor AI |
| Laporan Kemajuan | 1–3 Jun 2026 | Form laporan kemajuan individu |
| Checkpoint 2 | 3 Jun 2026 | Progress ~60–70% |
| Final Deliverables | 19 Jun 2026 | Semua dokumen & kode dikumpulkan |
| 360 Feedback | 19–22 Jun 2026 | Penilaian antar anggota |
| Final Score | 23 Jun 2026 | Pengumuman nilai akhir |

---

## 10. Task List

### FASE 0 — Persiapan (20–30 Apr 2026)
- [ ] Finalisasi tech stack dan pembagian peran tim
- [ ] Setup GitHub repo private
- [ ] Buat project board (GitHub Projects / Notion)
- [ ] Kumpulkan dan review dataset
- [ ] Setup environment (Python venv, Node.js)

---

### FASE 1 — AI / ML (1–25 Mei 2026)

| # | Task | PIC | Status |
|---|------|-----|--------|
| ML-01 | Download & review dataset hate speech Indonesia | AI Dev | [ ] |
| ML-02 | EDA (Exploratory Data Analysis) + visualisasi distribusi label | AI Dev | [ ] |
| ML-03 | Preprocessing: cleaning, normalisasi slang, tokenisasi | AI Dev | [ ] |
| ML-04 | Split dataset (train/val/test = 70/15/15) | AI Dev | [ ] |
| ML-05 | Relabeling dataset ke 2 kelas (PANTAS / TIDAK PANTAS) | AI Dev | [ ] |
| ML-05b | Fine-tuning IndoBERT untuk klasifikasi biner | AI Dev | [ ] |
| ML-06 | Evaluasi model (Accuracy, F1, Confusion Matrix) | AI Dev | [ ] |
| ML-07 | Simpan model ke Google Drive + cantumkan link di README | AI Dev | [ ] |
| ML-08 | Buat inference function (input teks → output label + confidence) | AI Dev | [ ] |

---

### FASE 2 — BACKEND / BE (5–31 Mei 2026)

| # | Task | PIC | Status |
|---|------|-----|--------|
| BE-01 | Setup FastAPI project structure | BE Dev | [ ] |
| BE-02 | Desain database schema (Users, Messages, Violations, Groups) | BE Dev | [ ] |
| BE-03 | Endpoint POST `/api/messages` — kirim pesan + trigger moderasi | BE Dev | [ ] |
| BE-04 | Integrasi AI inference ke endpoint moderasi | BE Dev | [ ] |
| BE-05 | WebSocket `/ws/{room_id}` — real-time chat | BE Dev | [ ] |
| BE-06 | Endpoint GET `/api/messages/{room_id}` — ambil riwayat pesan | BE Dev | [ ] |
| BE-07 | Logika aksi moderasi biner: `PANTAS` → tampil, `TIDAK PANTAS` → sembunyikan + notifikasi edukatif + log | BE Dev | [ ] |
| BE-08 | Endpoint GET `/api/admin/violations` — log pelanggaran | BE Dev | [ ] |
| BE-09 | Endpoint GET `/api/admin/stats` — statistik moderasi | BE Dev | [ ] |
| BE-10 | CORS setup + validasi input | BE Dev | [ ] |
| BE-11 | Unit test endpoint utama | BE Dev | [ ] |
| BE-12 | Buat `.env.example` (tanpa credential sensitif) | BE Dev | [ ] |

---

### FASE 3 — FRONTEND / FE (10 Mei – 10 Jun 2026)

| # | Task | PIC | Status |
|---|------|-----|--------|
| FE-01 | Setup React (Vite) + Tailwind CSS | FE Dev | [ ] |
| FE-02 | Komponen `ChatBubble` — 2 varian: tampil normal (`PANTAS`) atau tersembunyi dengan notifikasi edukatif (`TIDAK PANTAS`) | FE Dev | [ ] |
| FE-03 | Komponen `ChatInput` — input teks + tombol kirim | FE Dev | [ ] |
| FE-04 | Komponen `ChatHeader` — nama grup, jumlah anggota | FE Dev | [ ] |
| FE-05 | Halaman `ChatRoom` — gabungkan semua komponen chat | FE Dev | [ ] |
| FE-06 | Halaman `Login` — pilih nama pengguna simulasi | FE Dev | [ ] |
| FE-07 | Integrasi WebSocket untuk real-time chat | FE Dev | [ ] |
| FE-08 | Notifikasi edukatif personal ke pengirim saat pesan disembunyikan | FE Dev | [ ] |
| FE-09 | Tampilan placeholder pesan tersembunyi: *"Pesan ini disembunyikan oleh sistem moderasi"* yang terlihat oleh semua anggota room | FE Dev | [ ] |
| FE-10 | Halaman `AdminDashboard` — tabel log pelanggaran + statistik | FE Dev | [ ] |
| FE-11 | Grafik statistik moderasi (chart pie/bar) | FE Dev | [ ] |
| FE-12 | Halaman `RoomList` — daftar room/grup simulasi | FE Dev | [ ] |
| FE-13 | Responsif design (mobile-friendly) | FE Dev | [ ] |
| FE-14 | Integrasi penuh dengan BE API | FE Dev | [ ] |

---

### FASE 4 — STREAMLIT DEMO ENDPOINT (20–31 Mei 2026)

| # | Task | PIC | Status |
|---|------|-----|--------|
| ST-01 | Setup Streamlit app terpisah | AI/BE Dev | [ ] |
| ST-02 | Input teks bebas → tampilkan hasil klasifikasi + confidence score | AI/BE Dev | [ ] |
| ST-03 | Tampilkan confusion matrix & metrics model | AI/BE Dev | [ ] |
| ST-04 | Deploy Streamlit (Streamlit Cloud / Hugging Face Spaces) | AI/BE Dev | [ ] |

---

### FASE 5 — Integrasi & Testing (1–15 Jun 2026)

| # | Task | PIC | Status |
|---|------|-----|--------|
| INT-01 | End-to-end testing alur chat + moderasi | Semua | [ ] |
| INT-02 | Test edge cases (kalimat ambigu, bahasa campur, emoji) | Semua | [ ] |
| INT-03 | Bug fixing FE ↔ BE | Semua | [ ] |
| INT-04 | Optimasi response time moderasi (<500ms target) | BE/AI Dev | [ ] |

---

### FASE 6 — Dokumentasi & Final Deliverables (10–19 Jun 2026)

| # | Task | PIC | Status |
|---|------|-----|--------|
| DOC-01 | Tulis README lengkap (instalasi, cara jalankan, link model) | Semua | [ ] |
| DOC-02 | Susun dokumen Project Brief (template PIJAK) | Semua | [ ] |
| DOC-03 | Buat slide presentasi (latar belakang, solusi, demo, hasil) | Semua | [ ] |
| DOC-04 | Rekam video presentasi 10 menit + upload YouTube | Semua | [ ] |
| DOC-05 | Buat panduan penggunaan (PDF atau video tutorial) | Semua | [ ] |
| DOC-06 | Download GitHub repo sebagai ZIP untuk dikumpulkan | Semua | [ ] |
| DOC-07 | Isi formulir 360 Feedback (individu, 19–22 Jun 2026) | Individu | [ ] |

---

## 11. Pembagian Peran Tim (rekomendasi, 4–5 orang)

| Peran | Tanggung Jawab Utama |
|-------|---------------------|
| AI/ML Engineer (1–2 orang) | Dataset, preprocessing, fine-tuning IndoBERT, evaluasi, Streamlit demo |
| Backend Engineer (1 orang) | FastAPI, database, WebSocket, endpoint, integrasi model |
| Frontend Engineer (1 orang) | React UI, chat components, admin dashboard, integrasi BE |
| Project Lead / Full-stack (1 orang) | Koordinasi, dokumentasi, testing, README, slide, video |

---

## 12. Batasan & Kepatuhan PIJAK

| Aturan PIJAK | Status Kepatuhan |
|--------------|-----------------|
| Proyek dibuat dari awal | ✅ Semua kode ditulis sendiri |
| Boleh merujuk & memodifikasi referensi | ✅ |
| Dilarang bantuan pihak eksternal | ✅ Hanya anggota tim |
| AutoML dilarang | ✅ Fine-tuning manual dengan HuggingFace |
| Dataset dari sumber publik | ✅ Kaggle / GitHub open dataset |
| Antarmuka web + minimal 1 fitur ML/DL | ✅ Web app + Streamlit endpoint |
| GitHub private + README lengkap | ✅ |
| Model AI upload ke Google Drive | ✅ Link di README |
| Tidak ada credential sensitif di repo | ✅ Pakai `.env.example` |

---

## 13. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Akurasi model rendah | Augmentasi data, coba threshold berbeda, tambah epoch |
| Response time moderasi lambat | Cache hasil, gunakan model yang di-quantize |
| WebSocket tidak stabil | Fallback ke polling HTTP setiap 2 detik |
| Dataset tidak cukup bervariasi | Gabungkan beberapa dataset + augmentasi manual |
| Keterbatasan waktu | Streamlit demo sebagai MVP minimum jika web app belum sempurna |
