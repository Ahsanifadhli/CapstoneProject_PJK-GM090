# Flowchart Alur Sistem — AI SHIELD

> Semua diagram menggunakan standar flowchart formal dengan simbol Start/End, proses, keputusan, input/output, dan database (silinder).

---

## 1. Alur Sistem Utama

Menggambarkan alur lengkap dari pesan dikirim pengguna hingga keputusan moderasi ditampilkan di antarmuka.

```mermaid
flowchart TD
    Start([START])

    Start --> A[/Pengguna mengetik pesan di kolom chat/]
    A --> B[Pesan dikirim ke Backend via WebSocket]
    B --> C[Backend menerima teks mentah]
    C --> D[Preprocessing teks\nlowercase · normalisasi slang · hapus karakter khusus]
    D --> E[Tokenisasi dengan IndoBERT Tokenizer]
    E --> F[Inferensi model IndoBERT fine-tuned]
    F --> G{Hasil klasifikasi?}

    G -->|PANTAS| H[(DB: messages\nSimpan pesan)]
    G -->|TIDAK PANTAS| I[(DB: violations\nSimpan · status: hidden)]

    H --> J[Broadcast pesan ke semua user\ndi room via WebSocket]
    I --> K[Sembunyikan pesan untuk semua user di room]
    I --> L[Kirim notifikasi edukatif\nkhusus ke pengirim via WebSocket]
    I --> M[(DB: violations\nCatat entri pelanggaran baru)]

    J --> N[/ChatBubble tampil normal\ndi layar semua user/]
    K --> O[/Slot pesan kosong atau\ntersembunyi di semua layar/]
    L --> P[/Notifikasi edukatif muncul\nhanya di layar pengirim/]
    M --> Q[/Data tersedia di halaman\nAdmin Dashboard/]

    N --> End([END])
    O --> End
    P --> End
    Q --> End
```

---

## 2. Alur Role: Pengguna Biasa

Menggambarkan langkah-langkah yang dialami oleh pengguna reguler saat berinteraksi dalam ruang chat.

```mermaid
flowchart TD
    Start([START])

    Start --> A[/Buka aplikasi AI SHIELD di browser/]
    A --> B[Masukkan nama pengguna di halaman Login]
    B --> C[Pilih room chat yang tersedia]
    C --> D[Membaca riwayat pesan di room]
    D --> E{Ingin mengirim pesan?}

    E -->|Tidak| D
    E -->|Ya| F[/Ketik pesan di kolom ChatInput/]
    F --> G[Tekan tombol Kirim]
    G --> H[Sistem AI SHIELD memproses pesan]
    H --> I{Hasil moderasi?}

    I -->|PANTAS| J[/Pesan muncul di chat\nterlihat oleh semua user/]
    I -->|TIDAK PANTAS| K[/Pesan disembunyikan\nNotifikasi edukatif muncul di layar pengirim/]

    J --> L{Ingin terus\nbercakap?}
    K --> M{Ingin mencoba\nkirim ulang?}

    L -->|Ya| F
    L -->|Tidak| End([END])
    M -->|Ya| F
    M -->|Tidak| End
```

---

## 3. Alur Role: Admin

Menggambarkan langkah-langkah yang dilakukan oleh admin dalam memantau dan meninjau hasil moderasi sistem.

```mermaid
flowchart TD
    Start([START])

    Start --> A[/Buka halaman Admin Dashboard/]
    A --> B[Sistem menampilkan ringkasan statistik moderasi]
    B --> C{Ada notifikasi\npelanggaran baru?}

    C -->|Tidak| D[Pantau grafik statistik\njumlah pesan · persentase moderasi]
    C -->|Ya| E[(DB: violations\nBaca tabel log pelanggaran)]

    E --> F[/Pilih entri pelanggaran\nuntuk ditinjau detailnya/]
    F --> G[/Lihat detail: nama pengirim · isi pesan\nlabel · waktu · confidence score/]
    G --> H{Keputusan admin?}

    H -->|Pelanggaran valid,\ntidak perlu tindakan lanjut| I[(DB: violations\nTandai entri sebagai sudah ditinjau)]
    H -->|Perlu tindakan\nlanjut ke pengguna| J[Catat tindakan di luar sistem\nberi peringatan manual jika diperlukan]

    I --> K{Masih ada entri\nlain yang perlu ditinjau?}
    J --> K

    K -->|Ya| F
    K -->|Tidak| D

    D --> L{Selesai\nmemantau?}
    L -->|Tidak| B
    L -->|Ya| End([END])
```

---

## 4. Alur Proses Pengembangan: AI/ML Engineer

Menggambarkan alur kerja tim AI dalam membangun model IndoBERT dari pengumpulan data hingga model siap digunakan backend.

```mermaid
flowchart TD
    Start([START])

    Start --> A[Kumpulkan dataset ujaran kebencian\nbahasa Indonesia dari sumber publik]
    A --> B[Lakukan Exploratory Data Analysis\ndistribusi label · panjang teks · bias]
    B --> C[Preprocessing teks\nlowercase · hapus URL/emoji · normalisasi slang]
    C --> D[Relabeling dataset\nkonversi label multi-kelas ke 2 kelas biner:\nPANTAS dan TIDAK PANTAS]
    D --> E[Split dataset\ntrain 70% · validation 15% · test 15%]
    E --> F[Fine-tuning IndoBERT\nmenggunakan PyTorch + HuggingFace Trainer]
    F --> G[Evaluasi model pada test set\nAccuracy · Precision · Recall · F1-Score · Confusion Matrix]
    G --> H{Accuracy >= 85%\ndan F1 TIDAK PANTAS >= 82%?}

    H -->|Tidak| I[Analisis kesalahan model\naugmentasi data · tuning hyperparameter]
    I --> F

    H -->|Ya| J[Kalibrasi confidence threshold\nnilai default: 0.75]
    J --> K[Bangun fungsi inferensi\npredict teks mengembalikan label dan confidence]
    K --> L[Bangun Streamlit Demo\ninput teks bebas · tampilkan label + confidence + metrik]
    L --> M[(Google Drive\nUpload file model · catat link di README)]
    M --> N[/Model siap digunakan\noleh Backend Engineer/]
    N --> End([END])
```

---

## 5. Alur Proses Pengembangan: Backend Engineer

Menggambarkan alur kerja Backend Engineer dalam membangun server API, WebSocket, dan integrasi model AI.

```mermaid
flowchart TD
    Start([START])

    Start --> A[Setup project FastAPI\nstruktur folder · virtual environment · konfigurasi .env]
    A --> B[Desain schema database]
    B --> B2[(DB: users · messages\nrooms · violations)]
    B2 --> C[Implementasi endpoint POST /api/messages\nterima pesan dari FE]
    C --> C2[(DB: messages\nSimpan pesan masuk)]
    C2 --> D[Implementasi WebSocket /ws/room_id\nkelola koneksi real-time antar pengguna]
    D --> E{Model AI sudah\ntersedia dari AI Engineer?}

    E -->|Belum| F[Gunakan mock response sementara\nlabel: PANTAS untuk semua pesan]
    F --> G[Lanjutkan pengembangan endpoint lain]
    E -->|Ya| H[Muat model IndoBERT ke memori\nsaat server start]

    G --> H
    H --> I[Implementasi logika moderasi biner\nPANTAS: broadcast · TIDAK PANTAS: sembunyikan + notifikasi edukatif + log]
    I --> I2[(DB: violations\nSimpan hasil moderasi TIDAK PANTAS)]
    I2 --> J[Implementasi endpoint admin\nGET /api/admin/violations · GET /api/admin/stats]
    J --> K[Setup CORS · validasi input · sanitasi teks]
    K --> L[Tulis unit test untuk endpoint utama]
    L --> M{Semua test\nberhasil?}

    M -->|Tidak| N[Identifikasi dan perbaiki bug]
    N --> L

    M -->|Ya| O[Buat dokumentasi API\nFastAPI auto-docs · .env.example]
    O --> P[/Backend siap untuk\ndiintegrasikan dengan Frontend/]
    P --> End([END])
```

---

## 6. Alur Proses Pengembangan: Frontend Engineer

Menggambarkan alur kerja Frontend Engineer dalam membangun antarmuka chat dan dashboard admin.

```mermaid
flowchart TD
    Start([START])

    Start --> A[Setup project React dengan Vite\nkonfigurasi Tailwind CSS · struktur folder]
    A --> B[Bangun komponen dasar\nChatBubble · ChatInput · ChatHeader]
    B --> C[Bangun halaman Login\nform masukkan nama pengguna simulasi]
    C --> D[Bangun halaman RoomList\ndaftar room chat yang tersedia]
    D --> E[Bangun halaman ChatRoom\ngabungkan semua komponen chat · scroll otomatis]
    E --> F{Backend WebSocket\nsudah tersedia?}

    F -->|Belum| G[Gunakan mock data statis\nsimulasi pesan dan respons moderasi]
    F -->|Ya| H[Integrasi WebSocket\nhubungkan FE ke backend real-time]

    G --> H
    H --> I[Implementasi 2 varian ChatBubble\nPANTAS: tampil normal · TIDAK PANTAS: tersembunyi + notifikasi edukatif]
    I --> J[Bangun halaman AdminDashboard\ntabel log pelanggaran · grafik statistik]
    J --> K[Uji responsivitas tampilan\nlayar mobile >= 375px dan desktop]
    K --> L{Tampilan responsif\ndan berfungsi?}

    L -->|Tidak| M[Perbaiki layout dan komponen bermasalah]
    M --> K

    L -->|Ya| N[Integrasi penuh dengan semua endpoint Backend]
    N --> O{Semua fitur\nberfungsi?}

    O -->|Tidak| P[Identifikasi dan perbaiki bug integrasi]
    P --> N

    O -->|Ya| Q[/Frontend siap untuk\ntesting end-to-end/]
    Q --> End([END])
```
