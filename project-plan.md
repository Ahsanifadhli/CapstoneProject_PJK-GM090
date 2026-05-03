# Dokumen Project Plan
## AI SHIELD — Smart Handling of Integrity in Ethical Live Dialogue

**Nama Tim:** [ID Tim Capstone]
**Program:** PIJAK in collaboration with IBM SkillsBuild — Dicoding
**Tema:** AI for Productivity and Automation
**Tanggal Penyusunan:** 20 April 2026

---

## A. Ringkasan Eksekutif

Digitalisasi komunikasi telah mengubah cara komunitas akademik berinteraksi. Ruang obrolan digital kini menjadi medium utama pertukaran gagasan di lingkungan kampus, namun di balik kemudahannya muncul permasalahan serius. Berbagai kasus pelecehan seksual verbal yang beredar di ruang digital membuktikan bahwa platform komunikasi masih rentan terhadap perilaku merusak. Pesan bermuatan ujaran kebencian menyebar sebelum siapa pun sempat bertindak, meninggalkan dampak psikologis pada korban dan mencoreng nama baik institusi.

Permasalahan intinya adalah tidak adanya mekanisme otomatis yang mampu mendeteksi konten tidak pantas secara real-time dalam percakapan berbahasa Indonesia. Moderasi manual bergantung pada reaksi manusia yang tidak konsisten sehingga banyak pesan berbahaya lolos sebelum sempat dihapus. Kami merumuskan tiga pertanyaan penelitian: seberapa akurat IndoBERT yang di-fine-tune dalam mengklasifikasikan pesan sebagai pantas atau tidak pantas, berapa confidence threshold yang optimal, dan apakah notifikasi edukatif dapat mendorong perubahan kebiasaan berbahasa pengirim menuju standar komunikasi akademik.

Untuk menjawab permasalahan tersebut, kami membangun AI SHIELD, sistem moderasi pesan berbasis kecerdasan buatan yang terintegrasi dalam simulasi forum chat berbasis web. Model IndoBERT di-fine-tune menggunakan dataset ujaran kebencian bahasa Indonesia untuk mengklasifikasikan pesan menjadi dua kategori: pantas dan tidak pantas. Pesan yang terdeteksi tidak pantas langsung disembunyikan, dan pengirimnya menerima notifikasi edukatif yang mendorong mereka menyampaikan ulang gagasan dengan pilihan kata yang lebih baik.

Kami memilih proyek ini karena keamanan ruang komunikasi akademik adalah kebutuhan nyata yang belum terpenuhi. AI SHIELD bukan sekadar penyaring konten, melainkan alat edukasi untuk membangun kebiasaan berbahasa santun sejak dini, agar nilai kesantunan yang seharusnya menjadi ciri khas dunia akademik terwujud dalam komunikasi sehari-hari.

---

## B. Cakupan Proyek dan Hasil Kerja

### B.1 Batas-Batas Proyek

**Yang dikerjakan (In Scope):**
- Fine-tuning model IndoBERT untuk klasifikasi teks biner (`PANTAS` / `TIDAK PANTAS`) dengan kebijakan zero-tolerance bahasa kasar
- Backend API (FastAPI) dengan endpoint moderasi dan WebSocket real-time
- Simulasi aplikasi chat web (React.js) terintegrasi penuh dengan AI moderasi
- Dashboard admin untuk memantau log pelanggaran dan statistik moderasi
- Endpoint demo interaktif berbasis Streamlit sesuai syarat deliverable PIJAK

**Yang tidak dikerjakan (Out of Scope):**
- Integrasi langsung ke aplikasi WhatsApp asli (akses API resmi sangat terbatas)
- Moderasi konten berupa gambar, audio, atau video (hanya teks)
- Sistem autentikasi pengguna yang kompleks
- Deployment ke server produksi berbayar

### B.2 Hasil Kerja (Deliverables)

| No | Deliverable | Deskripsi |
|----|-------------|-----------|
| 1 | Model IndoBERT | Model binary classification fine-tuned, tersimpan di Google Drive, accuracy ≥ 85%, F1 `TIDAK PANTAS` ≥ 82% |
| 2 | Backend API | FastAPI + WebSocket, endpoint moderasi berfungsi |
| 3 | Frontend Web App | Simulasi chat terintegrasi AI, dashboard admin |
| 4 | Streamlit Demo | Endpoint interaktif publik untuk uji model secara langsung |
| 5 | Source Code | GitHub repo private, README lengkap, `.env.example` |
| 6 | Project Brief | Dokumentasi implementasi sesuai template PIJAK |
| 7 | Slide Presentasi | PPTX/PDF maks 10 MB |
| 8 | Video Presentasi | YouTube, 10 menit, semua anggota mempresentasikan bagiannya |
| 9 | Panduan Penggunaan | PDF atau video tutorial singkat |

### B.3 Tanggung Jawab Individu

| Anggota | Peran | Tanggung Jawab Utama |
|---------|-------|---------------------|
| Anggota 1 | AI/ML Engineer | Dataset collection, preprocessing, fine-tuning IndoBERT, evaluasi model, Streamlit demo |
| Anggota 2 | AI/ML Engineer | EDA, augmentasi data, inference function, optimasi model |
| Anggota 3 | Backend Engineer | FastAPI, database schema, endpoint API, WebSocket, integrasi model |
| Anggota 4 | Frontend Engineer | React UI, komponen chat, dashboard admin, integrasi BE |
| Anggota 5 | Project Lead | Koordinasi tim, testing end-to-end, README, Project Brief, slide, video |

> *Seluruh anggota berkontribusi pada fase integrasi, testing, dan dokumentasi akhir.*

---

## C. Jadwal Pengerjaan

> **Periode Implementasi:** 11 Mei – 19 Juni 2026 (5 minggu, sesuai jadwal PIJAK)

### C.1 Gantt Chart

```
TUGAS                          | Ming 1 | Ming 2 | Ming 3 | Ming 4 | Ming 5 |
                               |11-17/5 |18-24/5 |25-31/5 | 1-7/6  | 8-19/6 |
-------------------------------|--------|--------|--------|--------|--------|
[AI] Dataset & EDA             |████████|        |        |        |        |
[AI] Preprocessing & Cleaning  |████████|████    |        |        |        |
[AI] Fine-tuning IndoBERT      |        |████████|████████|        |        |
[AI] Evaluasi & Optimasi Model |        |        |████████|        |        |
[AI] Streamlit Demo Endpoint   |        |        |████████|        |        |
[BE] Setup FastAPI & Database  |████████|        |        |        |        |
[BE] Endpoint Moderasi API     |        |████████|        |        |        |
[BE] WebSocket Real-time       |        |████████|████    |        |        |
[BE] Integrasi Model ke BE     |        |        |████████|        |        |
[BE] Endpoint Admin Dashboard  |        |        |    ████|████    |        |
[FE] Setup React & Komponen    |████████|        |        |        |        |
[FE] Chat UI & Komponen Pesan  |        |████████|        |        |        |
[FE] Label Moderasi & Notif    |        |        |████████|        |        |
[FE] Dashboard Admin           |        |        |    ████|████    |        |
[INT] Integrasi FE ↔ BE ↔ AI  |        |        |        |████████|        |
[TEST] Testing End-to-End      |        |        |        |████████|████    |
[DOC] README & Project Brief   |        |        |        |        |████████|
[DOC] Slide & Video            |        |        |        |        |████████|
-------------------------------|--------|--------|--------|--------|--------|
CHECKPOINT PIJAK               |        |        |        |CP2(3/6)|        |
DEADLINE FINAL                 |        |        |        |        |19 Jun  |
```

### C.2 Milestone Per Minggu

| Minggu | Tanggal | Target Pencapaian |
|--------|---------|-------------------|
| **Minggu 1** | 11–17 Mei | Setup repo GitHub, environment dev, dataset terkumpul, EDA selesai, skeleton FastAPI & React jalan |
| **Minggu 2** | 18–24 Mei | Fine-tuning IndoBERT iterasi pertama, endpoint API moderasi berfungsi, komponen chat UI selesai |
| **Minggu 3** | 25–31 Mei | Model dievaluasi & dioptimasi, WebSocket real-time berfungsi, Streamlit demo online, integrasi AI→BE selesai |
| **Minggu 4** | 1–7 Jun | Integrasi penuh FE↔BE↔AI, dashboard admin berfungsi, laporan kemajuan PIJAK diisi (deadline 3 Jun) |
| **Minggu 5** | 8–19 Jun | Testing end-to-end, bug fixing, README lengkap, Project Brief, slide, rekam & upload video (deadline 19 Jun) |

### C.3 Kegiatan Koordinasi Tim

- **Daily standup:** Pesan singkat di grup tim setiap pagi (progress kemarin, rencana hari ini, blocker)
- **Weekly sync:** Meeting 30–60 menit setiap Senin via Google Meet untuk review progress minggu berjalan
- **Google Calendar:** Semua deadline PIJAK dan milestone dicatat sebagai reminder bersama
- **GitHub Projects:** Semua task dilacak dengan board Kanban (To Do → In Progress → Done)

---

## D. Uraian Rencana Penugasan / Job Desk Setiap Learning Path

### D.1 Machine Learning / AI Engineering

**Anggota:** Anggota 1 & Anggota 2

**Deskripsi Peran:**
Tim AI bertanggung jawab atas seluruh siklus pengembangan model, mulai dari pengumpulan data hingga model siap digunakan oleh backend.

**Job Desk Detail:**

| Task | Deskripsi | Minggu |
|------|-----------|--------|
| Pengumpulan Dataset | Mengumpulkan dataset hate speech & abusive language berbahasa Indonesia dari GitHub (okkyibrohim), Kaggle, dan sumber publik lainnya | 1 |
| EDA (Exploratory Data Analysis) | Menganalisis distribusi label, panjang teks, frekuensi kata, dan potensi bias pada dataset | 1 |
| Preprocessing Teks | Lowercasing, hapus URL/emoji/karakter khusus, normalisasi slang menggunakan kamus alay, tokenisasi | 1–2 |
| Split Dataset | Membagi data menjadi train/validation/test (70/15/15) dengan stratified split | 2 |
| Relabeling Dataset | Mengonversi label multi-kelas dataset ke 2 kelas biner: `PANTAS` dan `TIDAK PANTAS`. Semua bentuk bahasa kasar, slang negatif, dan pelecehan digabung ke label `TIDAK PANTAS` | 1–2 |
| Fine-tuning IndoBERT | Melatih model `indobert-base-p1` untuk **binary classification** menggunakan PyTorch + HuggingFace, dengan kebijakan zero-tolerance (termasuk bahasa gaul kasar meski konteksnya positif) | 2–3 |
| Evaluasi Model | Menghitung Accuracy, Precision, Recall, F1-Score, plot Confusion Matrix, kalibrasi confidence threshold optimal (default 0.75) | 3 |
| Optimasi Model | Tuning hyperparameter (learning rate, batch size, epoch), augmentasi data kelas `TIDAK PANTAS` jika F1 < 82% | 3 |
| Inference Function | Membuat fungsi `predict(text)` → mengembalikan `{label, confidence}` yang dipanggil oleh backend | 3 |
| Streamlit Demo | Membangun endpoint demo interaktif: input teks bebas → tampilkan label `PANTAS`/`TIDAK PANTAS` + confidence score + contoh notifikasi edukatif + visualisasi metrik model | 3 |
| Simpan & Dokumentasi Model | Upload model ke Google Drive, cantumkan link di README, dokumentasikan cara mengunduh & memuat model | 3–4 |

---

### D.2 Backend Engineering

**Anggota:** Anggota 3

**Deskripsi Peran:**
Backend Engineer bertanggung jawab membangun server API yang menjadi jembatan antara model AI, database, dan frontend.

**Job Desk Detail:**

| Task | Deskripsi | Minggu |
|------|-----------|--------|
| Setup Project | Inisialisasi FastAPI, struktur folder, virtual environment, konfigurasi `.env` | 1 |
| Desain Database | Merancang schema tabel: `users`, `messages`, `rooms`, `violations` menggunakan SQLAlchemy | 1 |
| Endpoint POST `/api/messages` | Menerima pesan dari FE, memanggil AI inference, menyimpan hasil ke database, mengembalikan respons | 2 |
| Integrasi AI | Memuat model IndoBERT ke memori saat server start, memanggil fungsi inference di setiap pesan masuk | 3 |
| WebSocket `/ws/{room_id}` | Mengelola koneksi real-time antar pengguna dalam satu room chat | 2–3 |
| Endpoint GET `/api/messages/{room_id}` | Mengambil riwayat pesan sebuah room (dengan pagination) | 2 |
| Logika Aksi Moderasi | Mengimplementasikan aturan biner: `PANTAS` → tampil normal; `TIDAK PANTAS` → sembunyikan pesan + kirim notifikasi edukatif ke pengirim + catat ke log pelanggaran. Confidence < 0.75 tetap disembunyikan namun pengirim dapat ajukan review ke admin | 3 |
| Endpoint Admin | `GET /api/admin/violations` (log pelanggaran) dan `GET /api/admin/stats` (statistik agregat) | 4 |
| Validasi & Keamanan | CORS setup, validasi input request, sanitasi teks sebelum dikirim ke model | 2 |
| Testing & Dokumentasi | Unit test endpoint utama, buat `.env.example`, dokumentasi API (FastAPI auto-docs) | 4–5 |

---

### D.3 Frontend Engineering

**Anggota:** Anggota 4

**Deskripsi Peran:**
Frontend Engineer bertanggung jawab membangun antarmuka pengguna simulasi chat yang intuitif, responsif, dan terintegrasi penuh dengan backend.

**Job Desk Detail:**

| Task | Deskripsi | Minggu |
|------|-----------|--------|
| Setup Project | Inisialisasi React (Vite) + Tailwind CSS, konfigurasi folder `components`, `pages`, `services` | 1 |
| Komponen `ChatBubble` | Menampilkan pesan dengan 2 varian: tampil normal (`PANTAS`) atau tersembunyi dengan placeholder edukatif (`TIDAK PANTAS`) | 2 |
| Komponen `ChatInput` | Input teks dengan tombol kirim, validasi input tidak kosong | 2 |
| Komponen `ChatHeader` | Header ruang chat (nama grup, jumlah anggota aktif) | 2 |
| Halaman `Login` | Form sederhana untuk memilih nama pengguna simulasi sebelum masuk ke room chat | 2 |
| Halaman `ChatRoom` | Menggabungkan semua komponen chat, mengelola state pesan, scroll otomatis ke pesan terbaru | 2–3 |
| Integrasi WebSocket | Menghubungkan FE ke WebSocket BE untuk penerimaan pesan real-time | 3 |
| Notifikasi Moderasi | Pesan edukatif personal yang muncul hanya untuk pengirim saat pesannya disembunyikan: *"Pesanmu disembunyikan karena tidak sesuai standar komunikasi akademik. Coba sampaikan kembali dengan pilihan kata yang lebih tepat."* | 3 |
| Halaman `RoomList` | Daftar room/grup yang tersedia untuk dipilih pengguna | 3 |
| Halaman `AdminDashboard` | Tabel log pelanggaran (nama pengguna, pesan, label, waktu) + grafik statistik (pie/bar chart) | 4 |
| Responsif Design | Memastikan tampilan berfungsi baik di layar mobile (≥ 375px) dan desktop | 4–5 |
| Integrasi Penuh dengan BE | Menghubungkan semua komponen dengan endpoint API backend yang sudah selesai | 4 |

---

### D.4 Project Lead / Full-Stack Support

**Anggota:** Anggota 5

**Deskripsi Peran:**
Project Lead memastikan seluruh tim bergerak sesuai jadwal, mengkoordinasikan integrasi antar komponen, dan bertanggung jawab atas semua deliverable dokumen PIJAK.

**Job Desk Detail:**

| Task | Deskripsi | Minggu |
|------|-----------|--------|
| Koordinasi Tim | Memimpin daily standup dan weekly sync, memantau progress via GitHub Projects | 1–5 |
| Setup GitHub Repo | Inisialisasi repo private, buat struktur folder, setup `.gitignore`, buat branch strategy | 1 |
| Integrasi & Testing | Memimpin fase integrasi FE↔BE↔AI, menulis test case end-to-end, koordinasi bug fixing | 4 |
| README | Menulis dokumentasi instalasi, cara menjalankan, link model, referensi dataset | 5 |
| Project Brief | Menyusun dokumen Project Brief sesuai template PIJAK berdasarkan hasil implementasi | 5 |
| Slide Presentasi | Membuat slide yang mencakup latar belakang, solusi, demo, dan hasil evaluasi model | 5 |
| Video Presentasi | Mengkoordinasikan rekaman video 10 menit, memastikan semua anggota hadir dan mempresentasikan bagiannya | 5 |
| Panduan Penggunaan | Membuat panduan PDF atau video tutorial singkat cara menggunakan aplikasi | 5 |

---

## E. Sumber Daya Proyek

### E.1 Bahasa Pemrograman

| Bahasa | Digunakan Pada | Fungsi |
|--------|---------------|--------|
| **Python 3.11** | Backend, AI/ML, Streamlit | Bahasa utama untuk pengembangan model AI dan server backend karena ekosistem library ML yang lengkap |
| **JavaScript (ES2022)** | Frontend (React) | Bahasa utama frontend untuk membangun antarmuka pengguna yang interaktif |
| **SQL** | Database | Query dan manajemen data pesan, pengguna, dan log pelanggaran |

### E.2 Framework & Library

| Framework/Library | Layer | Fungsi |
|-------------------|-------|--------|
| **FastAPI** | Backend | Framework Python modern untuk membangun REST API berkecepatan tinggi dengan dukungan async dan dokumentasi otomatis |
| **SQLAlchemy** | Backend | ORM untuk manajemen database secara programatik tanpa menulis SQL mentah |
| **HuggingFace Transformers** | AI/ML | Menyediakan model IndoBERT pre-trained dan pipeline fine-tuning yang siap pakai |
| **PyTorch** | AI/ML | Framework deep learning sebagai engine pelatihan model IndoBERT |
| **Scikit-learn** | AI/ML | Digunakan untuk evaluasi model (classification report, confusion matrix, split dataset) |
| **React.js (Vite)** | Frontend | Framework JavaScript untuk membangun antarmuka pengguna berbasis komponen yang cepat dan reaktif |
| **Tailwind CSS** | Frontend | Framework CSS utility-first untuk desain antarmuka yang konsisten dan responsif |
| **Streamlit** | Demo Endpoint | Membangun antarmuka demo interaktif model AI hanya dengan Python, sesuai syarat deliverable PIJAK |
| **WebSockets (FastAPI)** | Backend | Protokol komunikasi dua arah untuk fitur chat real-time tanpa perlu refresh halaman |

### E.3 Dataset

| Dataset | Sumber | Jumlah Data | Fungsi |
|---------|--------|-------------|--------|
| **Indonesian Hate Speech & Abusive Language** | GitHub — okkyibrohim/id-multi-label-hate-speech | ~13.000 tweet | Dataset utama; label multi-kelas dikonversi ke biner (`PANTAS`/`TIDAK PANTAS`) sebelum fine-tuning |
| **IndoNLU Benchmark** | IndoNLU.org / HuggingFace | Bervariasi | Dataset tambahan untuk memperkaya variasi kalimat |
| **Satu Data Indonesia** | data.go.id | Bervariasi | Sumber sekunder jika diperlukan augmentasi |

> Seluruh dataset bersifat publik dan akan dicantumkan sumbernya secara lengkap di README dan Project Brief.

### E.4 Tools Pengembangan & Kolaborasi

| Tool | Fungsi |
|------|--------|
| **GitHub (Private Repo)** | Version control, kolaborasi kode, tracking task via GitHub Projects |
| **Google Colab / Kaggle Notebooks** | Platform training model dengan GPU gratis (T4/P100) untuk fine-tuning IndoBERT |
| **Google Drive** | Penyimpanan file model AI (ukuran > 400MB, tidak bisa disimpan di GitHub) |
| **Streamlit Cloud / HuggingFace Spaces** | Hosting gratis untuk deploy endpoint demo Streamlit agar dapat diakses publik |
| **Postman** | Pengujian endpoint API backend secara manual selama development |
| **Google Meet + Google Calendar** | Koordinasi meeting tim dan pengingat deadline PIJAK |
| **Notion / GitHub Projects** | Manajemen task dan progress tracking harian |

### E.5 Referensi Ilmiah

| Referensi | Fungsi dalam Proyek |
|-----------|---------------------|
| Ibrohim & Budi (2019) — *Multi-label Hate Speech Detection in Indonesian Twitter* | Dasar metodologi klasifikasi dan penggunaan dataset |
| Wilie et al. (2020) — *IndoNLU: Benchmark for Indonesian NLU* | Acuan benchmark performa model bahasa Indonesia |
| Devlin et al. (2018) — *BERT: Pre-training of Deep Bidirectional Transformers* | Landasan teori arsitektur model yang digunakan |
| HuggingFace Docs — *Fine-tuning a pretrained model* | Panduan teknis implementasi fine-tuning |

---

## F. Rencana Manajemen Risiko dan Isu

### F.1 Analisis SWOT Proyek

| | **Positif** | **Negatif** |
|---|---|---|
| **Internal** | **Strengths:** Dataset publik tersedia, IndoBERT terbukti efektif untuk bahasa Indonesia, tim memiliki pembagian peran yang jelas, tech stack open-source tanpa biaya | **Weaknesses:** Tim baru pertama kali mengerjakan proyek AI end-to-end berskala ini, keterbatasan GPU (bergantung Colab gratis), waktu pengerjaan hanya 5 minggu |
| **Eksternal** | **Opportunities:** Kasus viral UI menjadikan isu ini sangat relevan dan mudah dipresentasikan, potensi dikembangkan lebih lanjut untuk platform lain (forum kampus, media sosial), ekosistem HuggingFace yang kaya | **Threats:** Perubahan mendadak pada kuota Colab gratis, dataset mungkin tidak merepresentasikan slang terbaru, framework/library bisa mengalami breaking change |

### F.2 Risk Register

| # | Risiko | Kemungkinan | Dampak | Strategi Mitigasi | PIC |
|---|--------|:-----------:|:------:|-------------------|-----|
| R-01 | **Akurasi model < 85%** — dataset kurang bervariasi atau fine-tuning tidak optimal | Sedang | Tinggi | Tambah augmentasi data khususnya kelas `TIDAK PANTAS`, tuning hyperparameter, coba `indobert-large` sebagai alternatif | AI Eng |
| R-00 | **False positive tinggi akibat zero-tolerance** — kata kasar dalam konteks positif ikut dihapus | Tinggi | Sedang | Pastikan dataset mencakup contoh berlabel `TIDAK PANTAS` yang kaya konteks; ini adalah keputusan desain yang disengaja untuk tujuan pendidikan, bukan bug | AI Eng |
| R-02 | **Response time moderasi > 500ms** — model terlalu besar untuk inferensi cepat | Sedang | Sedang | Terapkan model *quantization* (INT8), batasi panjang input maksimal 256 token, cache hasil untuk teks identik | BE + AI |
| R-03 | **Dataset tidak merepresentasikan bahasa gaul terkini** | Tinggi | Sedang | Buat kamus normalisasi slang secara manual, gabungkan minimal 2 dataset berbeda | AI Eng |
| R-04 | **Anggota tim tidak aktif / mengundurkan diri** | Rendah | Tinggi | Redistribusi task ke anggota lain, laporkan ke Tim PIJAK via formulir resmi jika sudah tidak bisa diatasi internal | Project Lead |
| R-05 | **WebSocket tidak stabil pada jaringan lambat** | Sedang | Sedang | Implementasikan fallback ke HTTP polling setiap 2 detik, tampilkan indikator koneksi di UI | BE + FE |
| R-06 | **Keterlambatan salah satu komponen menghambat integrasi** | Sedang | Tinggi | Buat mock API response di FE agar FE dan BE bisa dikembangkan paralel; tetapkan prioritas: Streamlit Demo → BE API → Web App | Project Lead |
| R-07 | **Konflik merge kode di GitHub** | Sedang | Rendah | Gunakan branch per fitur (`feature/nama-fitur`), wajib review 1 orang sebelum merge ke `main` | Semua |
| R-08 | **Model terlalu besar untuk di-deploy di platform gratis** | Rendah | Sedang | Simpan model di Google Drive, muat via link di README; Streamlit Cloud mendukung hingga 1GB | AI Eng |
| R-09 | **Quota GPU Google Colab habis di tengah training** | Sedang | Tinggi | Simpan checkpoint model setiap epoch, gunakan Kaggle Notebooks sebagai alternatif (30 jam GPU/minggu) | AI Eng |

### F.3 Rencana Kontingensi

Jika terjadi keterlambatan signifikan yang mengancam deadline **19 Juni 2026**, berikut urutan pengurangan fitur yang telah disepakati tim:

| Prioritas | Fitur | Keputusan |
|-----------|-------|-----------|
| **Wajib selesai** | Model IndoBERT berfungsi + Streamlit demo + 1 endpoint API moderasi | Tidak dapat dikurangi |
| **Penting** | WebSocket real-time + chat UI dasar + label moderasi | Dikurangi hanya jika benar-benar tidak ada waktu |
| **Opsional** | Dashboard admin dengan grafik statistik | Dapat diganti dengan halaman log sederhana (tabel teks) |
| **Nice to have** | Multi-room chat, animasi UI, dark mode | Dilepas jika waktu tidak mencukupi |

