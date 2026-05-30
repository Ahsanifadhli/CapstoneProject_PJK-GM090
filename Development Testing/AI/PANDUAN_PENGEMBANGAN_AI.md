# 🛡️ Panduan Pengembangan AI — AI SHIELD
**Smart Handling of Integrity in Ethical Live Dialogue**  
**Program:** PIJAK × IBM SkillsBuild — Dicoding

---

## 📌 Gambaran Umum

AI SHIELD menggunakan model **IndoBERT** (`indobenchmark/indobert-base-p1`) yang di-*fine-tune* untuk mendeteksi pesan tidak pantas dalam percakapan berbahasa Indonesia secara real-time. Model diklasifikasikan secara **biner**:

| Label | Kode | Keterangan |
|-------|------|------------|
| `PANTAS` | `0` | Pesan aman, ditampilkan ke semua pengguna |
| `TIDAK PANTAS` | `1` | Pesan disembunyikan + notifikasi edukatif dikirim ke pengirim |

---

## 🗺️ Alur Sistem AI (Referensi: `flowchart.md` Bagian 4)

```
[Dataset GitHub] 
      ↓
   EDA & Analisis
      ↓
  Preprocessing
  (lowercase, hapus URL, normalisasi slang)
      ↓
  Relabeling Multi-Label → Biner
  (PANTAS / TIDAK PANTAS)
      ↓
  Split Dataset 70/15/15
      ↓
  Fine-tuning IndoBERT
  (PyTorch + HuggingFace Trainer)
      ↓
  Evaluasi: Accuracy ≥ 85%, F1 TP ≥ 82%
      ↓
  [Target Tercapai?]
  ├── TIDAK → Augmentasi / Tuning Hyperparameter → kembali Fine-tuning
  └── YA  → Kalibrasi Threshold (default 0.75)
              ↓
          Fungsi Inference predict(text) → {label, confidence}
              ↓
          Upload Model ke Google Drive
              ↓
          Backend Engineer menggunakan model
```

---

## 📋 Langkah-Langkah Pengembangan AI

### LANGKAH 0 — Setup Environment
**Tujuan:** Mempersiapkan semua library yang diperlukan di Google Colab.

**Library yang diinstall:**
```
transformers==4.40.0    ← HuggingFace model & tokenizer
datasets==2.19.0        ← Dataset management
torch                   ← PyTorch (GPU-enabled)
scikit-learn==1.4.2     ← Evaluasi & split dataset
pandas, numpy           ← Manipulasi data
matplotlib, seaborn     ← Visualisasi
accelerate==0.29.3      ← Akselerasi training HuggingFace
evaluate==0.4.1         ← Metrik evaluasi
```

**Cek GPU:**
- Pastikan Colab menggunakan GPU T4 atau A100
- Menu: `Runtime` → `Change runtime type` → `T4 GPU`

---

### LANGKAH 1 — Pengumpulan Dataset

**Sumber:** GitHub `okkyibrohim/id-multi-label-hate-speech-and-abusive-language-detection`

| File | Fungsi |
|------|--------|
| `re_data.csv` | Dataset utama (~13.000 tweet berlabel) |
| `new_kamusalay.csv` | Kamus normalisasi kata slang/alay |
| `stopwordbahasa.csv` | Daftar stopword bahasa Indonesia |

**Struktur kolom dataset asli:**
```
Tweet          ← Teks tweet mentah
HS             ← Hate Speech (0/1)
Abusive        ← Abusive Language (0/1)
HS_Individual  ← Hate Speech ke individu
HS_Group       ← Hate Speech ke kelompok
HS_Religion    ← berbasis agama
HS_Race        ← berbasis ras
HS_Physical    ← berbasis fisik
HS_Gender      ← berbasis gender
HS_Other       ← kategori lain
HS_Weak/Moderate/Strong ← intensitas
```

**Referensi:** Ibrohim & Budi (2019) — *Multi-label Hate Speech Detection in Indonesian Twitter*

---

### LANGKAH 2 — EDA (Exploratory Data Analysis)

**Apa yang dianalisis:**

1. **Distribusi Label** — Berapa banyak tweet hate speech vs non-hate speech?
2. **Panjang Teks** — Rata-rata dan distribusi karakter/kata per tweet
3. **Class Imbalance** — Apakah kelas tidak seimbang? (jika rasio > 3:1, perlu augmentasi)

**Output visualisasi:**
- Bar chart distribusi setiap kolom label
- Histogram panjang teks (karakter & kata)
- Statistik deskriptif (min, max, mean, median)

**Insight penting:**
- Rata-rata tweet: ~15–30 kata → `max_length=128` sudah cukup
- Dataset biasanya tidak seimbang (lebih banyak non-hate)

---

### LANGKAH 3 — Preprocessing Teks

**Pipeline preprocessing (urutan penting):**

```python
def preprocess_text(text):
    1. Lowercase semua teks
    2. Hapus "RT" (retweet symbol)
    3. Hapus username Twitter (@username)
    4. Hapus URL (http://, https://, www.)
    5. Hapus hashtag (#topik)
    6. Hapus emoji & karakter non-ASCII
    7. Hapus karakter khusus (pertahankan huruf & angka)
    8. Normalisasi kata alay (menggunakan new_kamusalay.csv)
    9. Hapus spasi berlebih
```

**Mengapa TIDAK melakukan stemming/stopword removal untuk IndoBERT?**
> IndoBERT membutuhkan teks yang **lebih natural** untuk memahami konteks secara penuh. Stemming dapat merusak makna kontekstual yang justru dibutuhkan model transformer.

**Contoh hasil preprocessing:**
```
Input    : "RT @user: Anjing banget sih!! http://spam.com #politik 😡"
Processed: "anjing banget sih"
```

---

### LANGKAH 4 — Relabeling Dataset (Multi-Label → Biner)

**Kebijakan Zero-Tolerance AI SHIELD:**

| Kondisi | Label Baru | Keterangan |
|---------|-----------|------------|
| `HS=0` DAN `Abusive=0` | `PANTAS` (0) | Aman ditampilkan |
| `HS=1` ATAU `Abusive=1` | `TIDAK PANTAS` (1) | Disembunyikan |
| Kolom lain bernilai 1 | `TIDAK PANTAS` (1) | Zero-tolerance |

**Alasan desain:**
- Sistem ini untuk lingkungan **akademik** yang memerlukan standar tinggi
- Lebih baik **false positive** (pesan aman diblokir) daripada **false negative** (pesan kasar lolos)
- Pengirim dapat ajukan review ke admin jika confidence < 0.75

---

### LANGKAH 5 — Split Dataset

**Metode:** Stratified Split (mempertahankan proporsi label)

```
Total Dataset
      ↓ (70% train)
Training Set (untuk melatih model weights)
      ↓
      └── Temp 30%
           ├── 50% → Validation Set (memantau training, early stopping)
           └── 50% → Test Set (evaluasi final)
```

**Mengapa Stratified?**
- Memastikan proporsi PANTAS:TIDAK PANTAS sama di semua split
- Mencegah evaluasi yang bias jika data tidak seimbang

---

### LANGKAH 6 — Fine-tuning IndoBERT

**Model:** `indobenchmark/indobert-base-p1`
- BERT pre-trained pada corpus bahasa Indonesia (Wikipedia + Berita)
- 12 transformer layer, 768 hidden size, 12 attention heads
- ~111 juta parameter

**Hyperparameter yang digunakan:**

| Parameter | Nilai | Alasan |
|-----------|-------|--------|
| Learning rate | `2e-5` | Standar untuk fine-tuning BERT |
| Batch size (train) | `16` | Sesuai kapasitas GPU T4 |
| Batch size (eval) | `32` | Lebih cepat, tidak perlu gradient |
| Epochs | `5` | Cukup untuk konvergensi |
| Warmup steps | `10%` dari total | Mencegah perubahan mendadak di awal |
| Weight decay | `0.01` | Regularisasi L2 |
| Max token length | `128` | Cukup untuk tweet Indonesia |
| Early stopping | patience=2 | Stop jika tidak membaik 2 epoch |

**Metric untuk best model:** `f1_tidak_pantas`
> Model yang dipilih adalah yang menghasilkan F1 tertinggi untuk kelas TIDAK PANTAS, bukan sekadar accuracy tertinggi.

---

### LANGKAH 7 — Evaluasi Model

**Metrik yang dihitung pada Test Set:**

| Metrik | Target | Keterangan |
|--------|--------|------------|
| **Accuracy** | ≥ 85% | Proporsi prediksi benar keseluruhan |
| **F1 TIDAK PANTAS** | ≥ 82% | Harmonic mean Precision & Recall kelas negatif |
| **Precision** | - | Dari semua yang diprediksi TP, berapa yang benar |
| **Recall** | - | Dari semua yang benar TP, berapa yang terdeteksi |

**Confusion Matrix:**
```
                    Prediksi PANTAS  Prediksi TIDAK PANTAS
Aktual PANTAS       True Negative   False Positive (false alarm)
Aktual TIDAK PANTAS False Negative  True Positive
                    ↑ BERBAHAYA!
```

**Kasus paling berbahaya:** False Negative — konten tidak pantas yang **lolos**

**Jika target belum tercapai:**
1. Augmentasi data kelas TIDAK PANTAS
2. Tuning hyperparameter (learning rate lebih kecil: 1e-5)
3. Tambah epoch (7–10)
4. Coba model lebih besar (`indobert-large`)
5. Gunakan class weights untuk mengatasi imbalance

---

### LANGKAH 8 — Kalibrasi Confidence Threshold

**Default threshold: 0.75**

Analisis metrik vs threshold untuk memilih nilai optimal:

```python
# Logika klasifikasi
if prob_tidak_pantas >= 0.75:
    label = "TIDAK PANTAS"
    → Sembunyikan pesan + notifikasi edukatif + log pelanggaran
elif 0.5 <= prob_tidak_pantas < 0.75:
    label = "TIDAK PANTAS"  # tetap disembunyikan
    → Pengirim dapat ajukan review ke admin
else:
    label = "PANTAS"
    → Tampilkan pesan ke semua pengguna
```

**Mengapa 0.75 dan bukan 0.5?**
- Mengurangi false positive (pesan aman yang salah diblokir)
- Masih cukup konservatif untuk lingkungan akademik
- Kurva F1 biasanya memuncak di sekitar 0.65–0.80

---

### LANGKAH 9 — Inference Function

**Interface yang disepakati dengan Backend Engineer:**

```python
result = predict("pesan dari pengguna")
# Returns:
{
    "label": "PANTAS" | "TIDAK PANTAS",
    "confidence": 0.0 – 1.0,
    "prob_pantas": float,
    "prob_tidak_pantas": float
}
```

Pipeline di dalam fungsi `predict()`:
```
Input teks mentah
    ↓ preprocess_text()
Teks bersih
    ↓ tokenizer (max_length=128)
input_ids + attention_mask
    ↓ model forward pass
logits (2 nilai)
    ↓ softmax
prob_pantas, prob_tidak_pantas
    ↓ threshold check (0.75)
label + confidence
```

---

### LANGKAH 10 — Simpan & Export Model

**File yang dihasilkan:**
```
ai_shield_indobert_model/
├── config.json              ← Konfigurasi arsitektur model
├── pytorch_model.bin        ← Weights model (~420 MB)
├── tokenizer_config.json    ← Konfigurasi tokenizer
├── vocab.txt                ← Vocabulary (32.000+ token)
├── special_tokens_map.json  ← [CLS], [SEP], [PAD], [MASK]
└── model_metadata.json      ← Metrik evaluasi & konfigurasi training
```

**Upload ke Google Drive:**
- File model terlalu besar untuk GitHub (~420 MB)
- Simpan di Google Drive, cantumkan link di `README.md`
- Backend Engineer load model dari link Drive

---

## ⚠️ Risiko & Mitigasi

| Risiko | Kemungkinan | Mitigasi |
|--------|-------------|----------|
| Accuracy < 85% | Sedang | Augmentasi data, tuning hyperparameter |
| False positive tinggi | Tinggi | Desain yang disengaja (zero-tolerance akademik) |
| GPU Colab habis | Sedang | Simpan checkpoint tiap epoch, gunakan Kaggle |
| Dataset tidak representatif | Tinggi | Normalisasi slang manual, gabung 2+ dataset |

---

## 🔗 Referensi

| Referensi | Fungsi |
|-----------|--------|
| [okkyibrohim/id-multi-label-hate-speech](https://github.com/okkyibrohim/id-multi-label-hate-speech-and-abusive-language-detection) | Dataset utama |
| [indobenchmark/indobert-base-p1](https://huggingface.co/indobenchmark/indobert-base-p1) | Model pre-trained |
| Ibrohim & Budi (2019) | Metodologi klasifikasi |
| HuggingFace Docs — Fine-tuning | Panduan teknis |
| Devlin et al. (2018) — BERT | Landasan teori arsitektur |

---

*AI SHIELD — PIJAK × IBM SkillsBuild × Dicoding*
