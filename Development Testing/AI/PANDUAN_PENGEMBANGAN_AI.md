# 🛡️ PANDUAN PENGEMBANGAN AI — AI SHIELD

**Program:** PIJAK in Collaboration with IBM SkillsBuild — Dicoding  
**Model:** IndoBERT (`indobenchmark/indobert-base-p1`) — Klasifikasi Teks Biner  
**Dataset:** [id-multi-label-hate-speech-and-abusive-language-detection](https://github.com/okkyibrohim/id-multi-label-hate-speech-and-abusive-language-detection)

---

## 📋 Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Struktur File AI](#struktur-file-ai)
3. [Prasyarat & Dependensi](#prasyarat--dependensi)
4. [Panduan: AI_SHIELD_Complete_ML_Pipeline.ipynb](#panduan-ai_shield_complete_ml_pipelineipynb)
5. [Panduan: AI_SHIELD_IndoBERT_Training.ipynb](#panduan-ai_shield_indobert_trainingipynb)
6. [Konfigurasi Hyperparameter](#konfigurasi-hyperparameter)
7. [Hasil Evaluasi Model](#hasil-evaluasi-model)
8. [Integrasi dengan Backend](#integrasi-dengan-backend)
9. [Tips & Troubleshooting](#tips--troubleshooting)

---

## 🔍 Gambaran Umum

AI SHIELD adalah sistem deteksi ujaran kebencian dan bahasa kasar berbahasa Indonesia menggunakan model **IndoBERT** yang di-fine-tune untuk klasifikasi biner:

| Label | Deskripsi |
|-------|-----------|
| `PANTAS` (0) | Teks aman, tidak mengandung hate speech |
| `TIDAK PANTAS` (1) | Teks mengandung ujaran kebencian/bahasa kasar |

### Arsitektur Singkat

```
Tweet Input
    │
    ▼
Preprocessing (normalisasi alay, cleaning)
    │
    ▼
IndoBERT Tokenizer (max_length=128)
    │
    ▼
BertForSequenceClassification
    │
    ▼
Confidence Threshold (default: 0.75)
    │
    ▼
Label: PANTAS / TIDAK PANTAS
```

---

## 📁 Struktur File AI

```
Development Testing/AI/
├── AI_SHIELD_Complete_ML_Pipeline.ipynb   # Pipeline lengkap: EDA → Training → Evaluasi
├── AI_SHIELD_IndoBERT_Training.ipynb      # Notebook training versi alternatif/standalone
├── classifier.py                          # Placeholder classifier (keyword-based)
├── requirements.txt                       # Daftar dependensi
└── PANDUAN_PENGEMBANGAN_AI.md             # File ini
```

### Deskripsi File

| File | Fungsi |
|------|--------|
| `AI_SHIELD_Complete_ML_Pipeline.ipynb` | Notebook utama berisi 10 tahap pipeline dari setup hingga export model |
| `AI_SHIELD_IndoBERT_Training.ipynb` | Notebook training standalone (fine-tuning IndoBERT) |
| `classifier.py` | Placeholder keyword-based classifier; antarmuka identik dengan model asli (`predict(text) → {label, confidence}`) |
| `requirements.txt` | Dependensi Python yang diperlukan |

---

## ⚙️ Prasyarat & Dependensi

### Environment

> ⚠️ **WAJIB menggunakan GPU** untuk menjalankan kedua notebook ini.  
> Di Google Colab: **Runtime → Change runtime type → T4 GPU → Save**

### Versi Library yang Digunakan

```
transformers==4.46.3
accelerate==1.0.1
datasets==3.1.0
sentence-transformers==5.5.1
scikit-learn
pandas
numpy
matplotlib
seaborn
requests
torch>=2.0.0 (dengan CUDA)
```

### Instalasi

Notebook sudah menyertakan perintah instalasi otomatis. Jika ingin install manual:

```bash
pip install transformers==4.46.3
pip install accelerate==1.0.1
pip install datasets==3.1.0
pip install sentence-transformers==5.5.1
pip install scikit-learn pandas numpy matplotlib seaborn requests
```

> **Catatan:** Untuk `requirements.txt` lokal, tambahkan dependensi setelah model IndoBERT selesai di-fine-tune (lihat komentar di file `requirements.txt`).

---

## 📓 Panduan: `AI_SHIELD_Complete_ML_Pipeline.ipynb`

Notebook ini adalah **pipeline lengkap** dari awal hingga akhir. Jalankan cell secara **berurutan dari atas ke bawah**.

### Alur Pipeline (10 Tahap)

| Tahap | Nama | Deskripsi |
|-------|------|-----------|
| **TAHAP 1** | Install Library & Setup | Install dependensi, verifikasi versi, deteksi GPU/CPU |
| **TAHAP 2** | Download Dataset | Unduh dataset dari GitHub |
| **TAHAP 3** | EDA | Analisis distribusi label, statistik teks, visualisasi |
| **TAHAP 4** | Preprocessing & Relabeling | Normalisasi, cleaning, relabeling ke 2 kelas biner |
| **TAHAP 5** | Split Dataset | Train 70% · Val 15% · Test 15% (stratified) |
| **TAHAP 6** | Fine-tuning IndoBERT | Training model dengan Trainer API |
| **TAHAP 7** | Evaluasi Model | Accuracy, F1, Confusion Matrix, ROC Curve |
| **TAHAP 8** | Kalibrasi Threshold | Optimasi confidence threshold |
| **TAHAP 9** | Fungsi Inferensi | `predict()` siap pakai untuk backend |
| **TAHAP 10** | Simpan ke Google Drive | Export model untuk deployment |

---

### TAHAP 1 — Setup Lingkungan

Cell pertama melakukan **uninstall** library yang mungkin konflik, lalu **install ulang** versi yang spesifik:

```python
# Uninstall versi lama
!pip uninstall -y transformers accelerate datasets sentence-transformers

# Install versi yang kompatibel
!pip install transformers==4.46.3
!pip install accelerate==1.0.1
!pip install datasets==3.1.0
!pip install sentence-transformers==5.5.1
```

Verifikasi otomatis dilakukan:
```
=======================================================
🔧 KONFIGURASI LINGKUNGAN
=======================================================
  PyTorch versi  : 2.11.0+cu128
  Device         : cuda
  GPU            : Tesla T4
  VRAM           : 15.6 GB
=======================================================
```

> ❌ Jika output menampilkan `CPU` → Aktifkan GPU terlebih dahulu sebelum melanjutkan.

---

### TAHAP 2 — Download Dataset

**Dataset:** `Re_Dataset.csv` (~13.169 tweet) dari repositori okkyibrohim  
**File tambahan:** `new_kamusalay.csv` (kamus 15.167 kata alay/slang)

```python
df = pd.read_csv("data/re_dataset.csv", encoding="latin-1")
```

**Struktur Dataset:**

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `Tweet` | str | Teks tweet |
| `HS` | int | Hate Speech (0/1) → **Label utama** |
| `Abusive` | int | Bahasa kasar |
| `HS_Individual` | int | HS terhadap individu |
| `HS_Group` | int | HS terhadap kelompok |
| `HS_Religion` | int | HS berbasis agama |
| `HS_Race` | int | HS berbasis ras |
| `HS_Physical` | int | HS berbasis fisik |
| `HS_Gender` | int | HS berbasis gender |
| `HS_Other` | int | HS kategori lain |
| `HS_Weak` | int | Intensitas lemah |
| `HS_Moderate` | int | Intensitas sedang |
| `HS_Strong` | int | Intensitas kuat |

---

### TAHAP 3 — Exploratory Data Analysis (EDA)

Analisis yang dilakukan:
- Info dataset (shape, tipe data, missing values)
- Deteksi duplikat (ditemukan: 146 duplikat)
- Distribusi label (HS: 5.561 | Non-HS: 7.608)
- Visualisasi distribusi kelas:

```
HS               5.561  (42.23%)
Non-HS           7.608  (57.77%)
```

**Visualisasi yang dihasilkan:** Bar chart distribusi label, statistik panjang teks, word cloud (opsional).

---

### TAHAP 4 — Preprocessing & Relabeling

**Langkah preprocessing:**

1. **Normalisasi alay** — menggunakan kamus `new_kamusalay.csv`
2. **Cleaning teks:**
   - Hapus mention (`@USER`)
   - Hapus URL
   - Lowercase
   - Hapus karakter khusus
3. **Relabeling ke 2 kelas biner:**
   - `HS = 1` → `TIDAK PANTAS`
   - `HS = 0` → `PANTAS`
4. **Drop duplikat**

**Konfigurasi model:**

```python
MODEL_NAME    = 'indobenchmark/indobert-base-p1'
MAX_LENGTH    = 128
NUM_LABELS    = 2
MODEL_LABELS  = ['PANTAS', 'TIDAK PANTAS']
```

---

### TAHAP 5 — Split Dataset

```python
# Rasio split: 70% Train | 15% Val | 15% Test
train_df, temp_df = train_test_split(df, test_size=0.30, random_state=42, stratify=df['label'])
val_df, test_df   = train_test_split(temp_df, test_size=0.50, random_state=42, stratify=temp_df['label'])
```

**Hasil split (dari ~13.023 data setelah drop duplikat):**

| Set | Jumlah | Persentase |
|-----|--------|-----------|
| Train | ~9.116 | 70% |
| Val | ~1.977 | 15% |
| Test | ~1.930–1.976 | 15% |

---

### TAHAP 6 — Fine-tuning IndoBERT

**Load model:**
```python
model = BertForSequenceClassification.from_pretrained(
    'indobenchmark/indobert-base-p1',
    num_labels=2,
    id2label={0: 'PANTAS', 1: 'TIDAK PANTAS'},
    label2id={'PANTAS': 0, 'TIDAK PANTAS': 1}
)
model = model.to(DEVICE)
# Total parameter: 124.442.882
```

**Konfigurasi Training:**

```python
training_args = TrainingArguments(
    output_dir                  = './model_output',
    num_train_epochs            = 5,
    per_device_train_batch_size = 16,
    per_device_eval_batch_size  = 32,
    learning_rate               = 2e-5,
    warmup_steps                = 100,
    weight_decay                = 0.01,
    eval_strategy               = 'epoch',
    save_strategy               = 'epoch',
    load_best_model_at_end      = True,
    metric_for_best_model       = 'f1_tidak_pantas',
    fp16                        = True,   # Mixed precision (GPU only)
    seed                        = 42,
)
```

**Callback:**
```python
callbacks = [EarlyStoppingCallback(early_stopping_patience=2)]
```

**Estimasi waktu training:** ~9–10 menit dengan GPU T4.

---

### TAHAP 7 — Evaluasi Model (Test Set)

**Metrik yang dihitung:**
- Accuracy
- F1-Score (Binary: TIDAK PANTAS)
- F1-Score (Macro)
- Precision Macro
- Recall Macro
- Confusion Matrix (absolut & persentase)
- ROC Curve & AUC
- Precision-Recall Curve

**Target & Hasil Aktual:**

| Metrik | Target | Hasil |
|--------|--------|-------|
| Accuracy | ≥ 85% | ✅ 90.33% |
| F1 TIDAK PANTAS | ≥ 82% | ✅ 91.39% |
| F1 Macro | - | 90.19% |
| Precision Macro | - | 90.33% |
| Recall Macro | - | 90.07% |

---

### TAHAP 8 — Kalibrasi Confidence Threshold

Threshold dioptimalkan menggunakan precision-recall curve pada **validation set**:

```python
# Default threshold
CONFIDENCE_THRESHOLD = 0.75
```

Threshold bisa disesuaikan berdasarkan kebutuhan:
- **Threshold lebih tinggi** → Presisi lebih tinggi (lebih sedikit false positive)
- **Threshold lebih rendah** → Recall lebih tinggi (lebih sedikit false negative)

---

### TAHAP 9 — Fungsi Inferensi `predict()`

Fungsi inferensi siap pakai yang kompatibel dengan backend:

```python
def predict(text: str, threshold: float = 0.75) -> dict:
    """
    Input:  str — teks yang akan diklasifikasi
    Output: dict — {"label": str, "confidence": float}
    
    Label: "PANTAS" atau "TIDAK PANTAS"
    Confidence: probabilitas kelas yang diprediksi (0.0 – 1.0)
    """
```

**Contoh penggunaan:**
```python
result = predict("Teks yang ingin diklasifikasi")
# Output: {"label": "PANTAS", "confidence": 0.98}
```

---

### TAHAP 10 — Simpan Model

**Lokasi simpan:** `./indobert_aishield/`

**File yang disimpan:**

| File | Ukuran | Deskripsi |
|------|--------|-----------|
| `model.safetensors` | ~497.8 MB | Bobot model |
| `config.json` | <1 MB | Konfigurasi arsitektur |
| `model_config.json` | <1 MB | Konfigurasi khusus AI SHIELD |
| `tokenizer_config.json` | <1 MB | Konfigurasi tokenizer |
| `vocab.txt` | ~0.2 MB | Vocabulary IndoBERT |
| `special_tokens_map.json` | <1 MB | Peta token khusus |
| `training_args.bin` | <1 MB | Argumen training tersimpan |

**Load model yang telah disimpan:**
```python
from transformers import BertTokenizer, BertForSequenceClassification

tokenizer = BertTokenizer.from_pretrained('./indobert_aishield')
model     = BertForSequenceClassification.from_pretrained('./indobert_aishield')
```

---

## 📓 Panduan: `AI_SHIELD_IndoBERT_Training.ipynb`

Notebook ini adalah versi **standalone training** yang bisa dijalankan secara independen. Struktur dan konfigurasi serupa dengan `Complete_ML_Pipeline`, namun lebih fokus pada proses training dan menyimpan model.

### Perbedaan dari Complete ML Pipeline

| Aspek | Complete ML Pipeline | IndoBERT Training (Standalone) |
|-------|---------------------|-------------------------------|
| Cakupan | End-to-end (EDA → Deployment) | Fokus Fine-tuning & Evaluasi |
| EDA | Lengkap dengan visualisasi | Minimal |
| Export | Termasuk Google Drive | Termasuk |
| Kalibrasi | Threshold otomatis | Manual/default |

### Langkah Menjalankan

1. **Buka di Google Colab** — pastikan GPU T4 aktif
2. **Run All** atau jalankan cell satu per satu dari atas ke bawah
3. Model tersimpan otomatis di runtime Colab (`./indobert_aishield/`)
4. **Download model** dari Google Drive atau langsung dari runtime Colab

---

## 🔧 Konfigurasi Hyperparameter

Parameter yang bisa disesuaikan untuk eksperimen:

### Hyperparameter Utama

| Parameter | Default | Rentang Rekomendasi | Efek |
|-----------|---------|--------------------|----|
| `num_train_epochs` | 5 | 3–10 | Lebih tinggi → potensi overfit |
| `learning_rate` | 2e-5 | 1e-5 – 5e-5 | Lebih tinggi → konvergensi lebih cepat, risiko divergen |
| `per_device_train_batch_size` | 16 | 8–32 (tergantung VRAM) | Lebih besar → stabilitas lebih baik |
| `warmup_steps` | 100 | 50–500 | Stabilisasi awal training |
| `weight_decay` | 0.01 | 0.0 – 0.1 | Regularisasi |
| `MAX_LENGTH` | 128 | 64–512 | Token max per sampel |
| `early_stopping_patience` | 2 | 2–5 | Berapa epoch tanpa perbaikan sebelum stop |

### Konfigurasi Model

```python
MODEL_NAME   = 'indobenchmark/indobert-base-p1'  # Bisa diganti dengan IndoBERT-lite
NUM_LABELS   = 2
MODEL_LABELS = ['PANTAS', 'TIDAK PANTAS']
```

### Konfigurasi Inferensi

```python
CONFIDENCE_THRESHOLD = 0.75  # Sesuaikan berdasarkan kebutuhan aplikasi
```

---

## 📊 Hasil Evaluasi Model

### Training Progress (5 Epoch)

| Epoch | Train Loss | Val Loss | Accuracy | F1 TIDAK PANTAS |
|-------|-----------|---------|---------|-----------------|
| 1 | 0.3625 | 0.2677 | 89.22% | 90.34% |
| 2 | 0.1825 | 0.3504 | 89.06% | 90.33% |
| 3 | 0.0848 | 0.5255 | 89.72% | 90.69% |
| 4 | 0.0341 | 0.6691 | 89.77% | 90.70% |
| 5 | 0.0099 | 0.6909 | 89.77% | **90.86%** |

> Model terbaik dipilih berdasarkan **F1 TIDAK PANTAS** tertinggi pada validation set.

### Hasil Test Set

```
Classification Report:
              precision    recall  f1-score   support
      PANTAS     0.9028    0.8771    0.8898       879
TIDAK PANTAS     0.9037    0.9243    0.9139      1097
    accuracy                         0.9033      1976
   macro avg     0.9033    0.9007    0.9019      1976
weighted avg     0.9033    0.9033    0.9032      1976
```

---

## 🔗 Integrasi dengan Backend

### Antarmuka `classifier.py`

File `classifier.py` adalah placeholder yang **antarmukanya identik** dengan model IndoBERT:

```python
def predict(text: str) -> dict:
    """
    Returns:
        dict: {"label": str, "confidence": float}
        
    Contoh: {"label": "TIDAK PANTAS", "confidence": 0.95}
    """
```

> ✅ **Keunggulan desain ini:** Saat model IndoBERT selesai di-fine-tune, cukup **ganti `classifier.py`** dengan implementasi IndoBERT — **tanpa mengubah kode backend sama sekali**.

### Cara Ganti Classifier (Setelah Training Selesai)

1. Simpan model hasil training ke folder yang dapat diakses backend
2. Ganti isi `classifier.py` dengan:

```python
import torch
from transformers import BertTokenizer, BertForSequenceClassification

MODEL_PATH = './indobert_aishield'  # Sesuaikan path
THRESHOLD  = 0.75

tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
model     = BertForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model  = model.to(DEVICE)

def predict(text: str) -> dict:
    inputs = tokenizer(
        text,
        return_tensors='pt',
        max_length=128,
        truncation=True,
        padding=True
    ).to(DEVICE)
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    probs = torch.softmax(outputs.logits, dim=-1)[0]
    idx   = torch.argmax(probs).item()
    label = model.config.id2label[idx]
    conf  = probs[idx].item()
    
    if conf < THRESHOLD:
        label = 'PANTAS'
        conf  = probs[0].item()
    
    return {"label": label, "confidence": round(conf, 4)}
```

---

## 🛠️ Tips & Troubleshooting

### ❌ GPU tidak terdeteksi
```
⚠️ GPU tidak terdeteksi!
```
**Solusi:** Di Google Colab → **Runtime → Change runtime type → T4 GPU → Save** → **Runtime → Restart and Run All**

---

### ❌ `CUDA out of memory`
**Solusi:** Kurangi batch size:
```python
per_device_train_batch_size = 8   # dari 16 → 8
per_device_eval_batch_size  = 16  # dari 32 → 16
```

---

### ❌ Training sangat lambat
**Kemungkinan penyebab:** Running di CPU bukan GPU  
**Solusi:** Pastikan GPU aktif (lihat poin pertama)

---

### ❌ `ModuleNotFoundError: No module named 'transformers'`
**Solusi:** Jalankan ulang TAHAP 1 (cell instalasi library)

---

### ⚠️ Warning: `Some weights were not initialized`
```
Some weights of BertForSequenceClassification were not initialized...
```
**Ini NORMAL** — classification head diinisialisasi baru karena belum pernah di-fine-tune untuk task ini. Warning akan hilang setelah training selesai.

---

### 💡 Tips Optimasi

1. **Eksperimen learning rate:** Coba `1e-5` atau `3e-5` jika hasil kurang optimal
2. **Perpanjang training:** Naikkan `num_train_epochs` ke `7` atau `10` dengan `early_stopping_patience=3`
3. **Data augmentation:** Pertimbangkan augmentasi data untuk kelas minoritas
4. **Cross-validation:** Gunakan k-fold untuk evaluasi yang lebih robust
5. **Threshold tuning:** Sesuaikan `CONFIDENCE_THRESHOLD` berdasarkan trade-off precision/recall yang diinginkan

---

## 📌 Catatan Versi

| Tanggal | Versi | Catatan |
|---------|-------|---------|
| 2026-06-02 | 1.0.0 | Panduan awal dibuat |

---

*Dibuat untuk proyek AI SHIELD — PIJAK in Collaboration with IBM SkillsBuild*
