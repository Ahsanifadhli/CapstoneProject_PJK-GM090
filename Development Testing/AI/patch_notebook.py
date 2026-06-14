"""
patch_notebook.py
=================
Script ini memodifikasi AI_SHIELD_IndoBERT_Training.ipynb sesuai catatan
revisi mentor:

1. Relabeling 3-kelas: PANTAS (0) / MERAGUKAN (1) / TIDAK PANTAS (2)
2. compute_metrics: tambah Cohen's Kappa, MCC, F1 Weighted, per-kelas lengkap
3. Evaluasi final: tampilkan semua metrik + classification_report
4. Inference function: output 3 label + confidence scoring yang adil
5. Verifikasi model: tampil 3 label
6. Final summary: ringkasan multi-metrik

Jalankan: python patch_notebook.py
"""

import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

NB_PATH = os.path.join(os.path.dirname(__file__), "AI_SHIELD_IndoBERT_Training.ipynb")

with open(NB_PATH, encoding="utf-8") as f:
    nb = json.load(f)

cells = nb.get("cells", [])

# ============================================================
# Helpers
# ============================================================

def src(code: str):
    """Convert kode Python (string) ke format source notebook."""
    lines = code.split("\n")
    result = []
    for i, line in enumerate(lines):
        if i < len(lines) - 1:
            result.append(line + "\n")
        else:
            if line:  # baris terakhir, hanya tambahkan jika tidak kosong
                result.append(line)
    return result


# ============================================================
# CELL: relabeling
# Ubah dari 2-label (biner) ke 3-label
# ============================================================

NEW_RELABELING = """\
# ============================================================
# LANGKAH 4: Relabeling ke 3 Kelas (PANTAS / MERAGUKAN / TIDAK PANTAS)
# ============================================================
# Revisi berdasarkan saran mentor:
# - Label MERAGUKAN ditambahkan untuk kasus ambiguitas
# - HS_Strong / HS_Moderate / (HS+Abusive berat) -> TIDAK PANTAS (2)
# - HS_Weak / HS tanpa kuat / Abusive tanpa HS   -> MERAGUKAN   (1)
# - Semua kolom 0                                 -> PANTAS      (0)

UNSAFE_COLS = [
    'HS','Abusive','HS_Individual','HS_Group',
    'HS_Religion','HS_Race','HS_Physical','HS_Gender',
    'HS_Other','HS_Weak','HS_Moderate','HS_Strong'
]

def create_three_class_label(row) -> int:
    def _get(col):
        try:
            return int(row[col]) if col in row.index else 0
        except (ValueError, TypeError):
            return 0

    hs        = _get('HS')
    abusive   = _get('Abusive')
    hs_weak   = _get('HS_Weak')
    hs_mod    = _get('HS_Moderate')
    hs_strong = _get('HS_Strong')
    hs_ind    = _get('HS_Individual')
    hs_grp    = _get('HS_Group')

    # TIDAK PANTAS: jelas berbahaya
    if hs_strong == 1 or hs_mod == 1:
        return 2
    if hs == 1 and (hs_ind == 1 or hs_grp == 1) and abusive == 1:
        return 2
    if hs == 1 and abusive == 1 and hs_weak == 0:
        return 2

    # MERAGUKAN: ada indikasi tapi lemah / tidak jelas
    if hs_weak == 1 or (hs == 1 and abusive == 0):
        return 1
    if abusive == 1 and hs == 0:
        return 1

    return 0


LABEL_MAP   = {0: 'PANTAS', 1: 'MERAGUKAN', 2: 'TIDAK PANTAS'}
LABEL_MAP_R = {v: k for k, v in LABEL_MAP.items()}

df_raw['label']      = df_raw.apply(create_three_class_label, axis=1)
df_raw['label_text'] = df_raw['label'].map(LABEL_MAP)

dist   = df_raw['label'].value_counts().sort_index()
total  = len(df_raw)

print("Relabeling 3-kelas selesai!\\n")
print("Distribusi Label (3 Kelas):")
for v, c in dist.items():
    name = LABEL_MAP[v]
    pct  = c / total * 100
    bar  = chr(9608) * int(pct / 2)
    print(f"  [{v}] {name:15s}: {c:,} ({pct:.1f}%) {bar}")

# Visualisasi
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
fig.suptitle('Distribusi Label 3-Kelas -- AI SHIELD', fontweight='bold')

clrs = ['#4CAF50', '#FF9800', '#f44336']
vals = [dist.get(0, 0), dist.get(1, 0), dist.get(2, 0)]
labs = ['PANTAS\\n(0)', 'MERAGUKAN\\n(1)', 'TIDAK\\nPANTAS\\n(2)']

bars = ax1.bar(labs, vals, color=clrs, edgecolor='black', linewidth=0.5)
ax1.set_title('Jumlah per Label')
ax1.set_ylabel('Count')
for bar in bars:
    ax1.text(bar.get_x() + bar.get_width()/2.,
             bar.get_height() + 20, f'{bar.get_height():,}',
             ha='center', va='bottom', fontweight='bold')

pie_vals  = [v for v in vals if v > 0]
pie_labs  = [f"{labs[i].replace(chr(10),' ')}\\n{vals[i]:,}" for i in range(3) if vals[i] > 0]
pie_clrs  = [clrs[i] for i in range(3) if vals[i] > 0]
ax2.pie(pie_vals, labels=pie_labs, colors=pie_clrs, autopct='%1.1f%%', startangle=90)
ax2.set_title('Proporsi')

plt.tight_layout()
plt.savefig('label_distribution.png', dpi=150, bbox_inches='tight')
plt.show()

max_c = max(vals)
min_c = min(v for v in vals if v > 0)
ratio = max_c / max(min_c, 1)
if ratio > 5:
    print(f"\\nPeringatan: Class imbalance (rasio {ratio:.1f}:1) -- pertimbangkan oversampling")
else:
    print(f"\\nDistribusi cukup seimbang (rasio {ratio:.1f}:1)")

NUM_LABELS = 3
print(f"\\nNUM_LABELS diset ke: {NUM_LABELS}")
"""

# ============================================================
# CELL: compute-metrics
# Tambah semua metrik: Kappa, MCC, Weighted, per 3 kelas
# ============================================================

NEW_COMPUTE_METRICS = """\
# ============================================================
# LANGKAH 6D: Fungsi metrik evaluasi (3 Label + lengkap)
# ============================================================
# Revisi berdasarkan saran mentor:
# Tambah Cohen's Kappa, MCC, F1 Weighted, per-kelas 3 label

from sklearn.metrics import cohen_kappa_score, matthews_corrcoef

LABEL_NAMES = ['PANTAS', 'MERAGUKAN', 'TIDAK PANTAS']

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)

    acc = accuracy_score(labels, preds)

    # Per-kelas: Precision, Recall, F1
    p_cls, r_cls, f1_cls, _ = precision_recall_fscore_support(
        labels, preds,
        average=None,
        labels=[0, 1, 2],
        zero_division=0
    )

    # Macro & Weighted
    p_mac, r_mac, f1_mac, _ = precision_recall_fscore_support(
        labels, preds, average='macro', zero_division=0
    )
    p_wgt, r_wgt, f1_wgt, _ = precision_recall_fscore_support(
        labels, preds, average='weighted', zero_division=0
    )

    # Cohen's Kappa & MCC
    try:
        kappa = cohen_kappa_score(labels, preds)
    except Exception:
        kappa = 0.0
    try:
        mcc = matthews_corrcoef(labels, preds)
    except Exception:
        mcc = 0.0

    return {
        'accuracy'               : acc,
        'f1_macro'               : f1_mac,
        'f1_weighted'            : f1_wgt,
        'precision_macro'        : p_mac,
        'recall_macro'           : r_mac,
        'f1_pantas'              : f1_cls[0],
        'f1_meragukan'           : f1_cls[1],
        'f1_tidak_pantas'        : f1_cls[2],
        'precision_tidak_pantas' : p_cls[2],
        'recall_tidak_pantas'    : r_cls[2],
        'cohens_kappa'           : kappa,
        'mcc'                    : mcc,
    }

print("Fungsi compute_metrics (3-label + lengkap) siap.")
print("  Metrik: Accuracy | F1 Macro | F1 Weighted | Precision | Recall")
print("          per kelas (PANTAS / MERAGUKAN / TIDAK PANTAS)")
print("          Cohen's Kappa | MCC")
"""

# ============================================================
# CELL: evaluation
# Evaluasi lengkap 3 label + classification_report
# ============================================================

NEW_EVALUATION = """\
# ============================================================
# LANGKAH 7: Evaluasi Final pada Test Set (3 Label)
# ============================================================

from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    classification_report, confusion_matrix,
    cohen_kappa_score, matthews_corrcoef
)

print("Mengevaluasi model pada test set (3 label)...")

test_pred = trainer.predict(test_dataset)
y_pred    = np.argmax(test_pred.predictions, axis=-1)
y_true    = test_pred.label_ids

# Metrik utama
acc                           = accuracy_score(y_true, y_pred)
p_mac, r_mac, f1_mac, _      = precision_recall_fscore_support(
    y_true, y_pred, average='macro', zero_division=0)
p_wgt, r_wgt, f1_wgt, _      = precision_recall_fscore_support(
    y_true, y_pred, average='weighted', zero_division=0)
p_cls, r_cls, f1_cls, support = precision_recall_fscore_support(
    y_true, y_pred, average=None, labels=[0, 1, 2], zero_division=0)

kappa = cohen_kappa_score(y_true, y_pred)
mcc   = matthews_corrcoef(y_true, y_pred)

LABEL_NAMES = ['PANTAS', 'MERAGUKAN', 'TIDAK PANTAS']

print()
print("=" * 68)
print("  HASIL EVALUASI MODEL -- AI SHIELD IndoBERT (3 Label)")
print("=" * 68)
print(f"  Accuracy             : {acc:.4f} ({acc*100:.2f}%) {'OK' if acc>=0.82 else 'target >=82%'}")
print(f"  F1-Score (Macro)     : {f1_mac:.4f}  {'OK' if f1_mac>=0.78 else 'target >=78%'}")
print(f"  F1-Score (Weighted)  : {f1_wgt:.4f}")
print(f"  Precision (Macro)    : {p_mac:.4f}")
print(f"  Recall (Macro)       : {r_mac:.4f}")
print(f"  Cohen Kappa          : {kappa:.4f}")
print(f"  MCC                  : {mcc:.4f}")
print()
print(f"  {'Kelas':<20} {'Precision':>10} {'Recall':>8} {'F1':>8} {'Support':>9}")
print("  " + "-" * 60)
for i, name in enumerate(LABEL_NAMES):
    print(f"  {name:<20} {p_cls[i]:>10.4f} {r_cls[i]:>8.4f} {f1_cls[i]:>8.4f} {int(support[i]):>9,}")
print("=" * 68)

# Classification Report lengkap
print("\\nClassification Report Lengkap:")
print(classification_report(y_true, y_pred, target_names=LABEL_NAMES, zero_division=0))

# Evaluasi target
print("\\nTarget Penelitian:")
print(f"  Accuracy >= 82%        : {'TERCAPAI' if acc>=0.82 else 'BELUM'}  ({acc*100:.2f}%)")
print(f"  F1 Macro >= 78%        : {'TERCAPAI' if f1_mac>=0.78 else 'BELUM'}  ({f1_mac*100:.2f}%)")
print(f"  F1 TIDAK PANTAS >= 78% : {'TERCAPAI' if f1_cls[2]>=0.78 else 'BELUM'}  ({f1_cls[2]*100:.2f}%)")

if acc < 0.82 or f1_mac < 0.78:
    print("\\nSaran perbaikan:")
    print("   - Tambah epoch (NUM_EPOCHS = 7-10)")
    print("   - Turunkan learning rate (1e-5)")
    print("   - Augmentasi data kelas MERAGUKAN (paling sedikit)")
    print("   - Coba focal loss untuk class imbalance")
    print("   - Coba indobert-large jika VRAM cukup")
"""

# ============================================================
# CELL: threshold
# Update untuk 3 label — tambah prob_meragukan
# ============================================================

NEW_THRESHOLD = """\
# ============================================================
# LANGKAH 8: Analisis Threshold vs Metrik (3 Label)
# ============================================================
# Untuk 3 label, kita analisis dua threshold:
#   THRESHOLD_TIDAK_PANTAS: P(TIDAK PANTAS) >= thr -> TIDAK PANTAS
#   THRESHOLD_PANTAS      : P(PANTAS)        >= thr -> PANTAS
#   Di antara keduanya                             -> MERAGUKAN

logits_t = torch.tensor(test_pred.predictions)
probs_all = F.softmax(logits_t, dim=-1).numpy()

prob_p  = probs_all[:, 0]   # PANTAS
prob_m  = probs_all[:, 1]   # MERAGUKAN
prob_tp = probs_all[:, 2]   # TIDAK PANTAS

# Analisis threshold TIDAK PANTAS (TP)
thresholds = np.arange(0.30, 0.96, 0.05)
rows = []
for thr in thresholds:
    # Terapkan threshold: TP jika prob_tp >= thr, else PANTAS jika prob_p >= thr, else MERAGUKAN
    pred_t = np.where(
        prob_tp >= thr, 2,
        np.where(prob_p >= thr, 0, 1)
    )
    p, r, f1, _ = precision_recall_fscore_support(
        y_true, pred_t, average=None, labels=[0, 1, 2], zero_division=0)
    f1_mac_t, _, _, _ = precision_recall_fscore_support(
        y_true, pred_t, average='macro', zero_division=0)
    rows.append({
        'threshold'       : round(float(thr), 2),
        'accuracy'        : accuracy_score(y_true, pred_t),
        'f1_macro'        : f1_mac_t,
        'f1_tidak_pantas' : f1[2],
        'f1_meragukan'    : f1[1],
        'precision_tp'    : p[2],
        'recall_tp'       : r[2]
    })

df_thr = pd.DataFrame(rows)

fig, ax = plt.subplots(figsize=(12, 6))
ax.plot(df_thr['threshold'], df_thr['accuracy'],        'b-o', lw=2, label='Accuracy')
ax.plot(df_thr['threshold'], df_thr['f1_macro'],        'k-D', lw=2, label='F1 Macro')
ax.plot(df_thr['threshold'], df_thr['f1_tidak_pantas'], 'r-s', lw=2, label='F1 TIDAK PANTAS')
ax.plot(df_thr['threshold'], df_thr['f1_meragukan'],    'y-^', lw=2, label='F1 MERAGUKAN')
ax.plot(df_thr['threshold'], df_thr['precision_tp'],    'g-^', lw=2, label='Precision TP')
ax.plot(df_thr['threshold'], df_thr['recall_tp'],       'm-v', lw=2, label='Recall TP')
ax.axvline(0.60, color='orange', ls='--', lw=2.5, label='Default threshold TP (0.60)')
ax.axhline(0.82, color='blue',   ls=':', alpha=0.5, label='Target Acc 82%')
ax.axhline(0.78, color='red',    ls=':', alpha=0.5, label='Target F1 78%')
ax.set_title('Metrik vs Threshold -- AI SHIELD (3 Label)', fontsize=13, fontweight='bold')
ax.set_xlabel('Threshold TIDAK PANTAS')
ax.set_ylabel('Score')
ax.legend(loc='lower left')
ax.grid(True, alpha=0.3)
ax.set_xlim(0.25, 1.0)
ax.set_ylim(0, 1.05)
plt.tight_layout()
plt.savefig('threshold_calibration.png', dpi=150, bbox_inches='tight')
plt.show()

THRESHOLD_TIDAK_PANTAS = 0.60
THRESHOLD_PANTAS       = 0.60

row_sel = df_thr[df_thr['threshold'] == THRESHOLD_TIDAK_PANTAS]
if not row_sel.empty:
    r60 = row_sel.iloc[0]
    print(f"\\nThreshold yang digunakan: TP={THRESHOLD_TIDAK_PANTAS} | P={THRESHOLD_PANTAS}")
    print(f"   Accuracy         : {r60['accuracy']:.4f}")
    print(f"   F1 Macro         : {r60['f1_macro']:.4f}")
    print(f"   F1 TIDAK PANTAS  : {r60['f1_tidak_pantas']:.4f}")
    print(f"   F1 MERAGUKAN     : {r60['f1_meragukan']:.4f}")
    print(f"   Precision TP     : {r60['precision_tp']:.4f}")
    print(f"   Recall TP        : {r60['recall_tp']:.4f}")

opt_idx = df_thr['f1_macro'].idxmax()
print(f"\\nThreshold optimal (F1 Macro max): {df_thr.iloc[opt_idx]['threshold']}")
print("Default 0.60 dipilih sebagai threshold konservatif untuk lingkungan akademik")
"""

# ============================================================
# CELL: inference
# Predict 3 label + confidence adil
# ============================================================

NEW_INFERENCE = """\
# ============================================================
# LANGKAH 9: Inference Function -- 3 Label
# ============================================================
# Revisi berdasarkan saran mentor:
# - Label MERAGUKAN: kata kasar + konteks pujian,
#                    kata disensor (k*mpang, puk*mak),
#                    ekspresi ambigu (anjir keren banget!)
# - Distribusi confidence yang adil untuk 3 label
# - Interface identik dengan classifier.py (placeholder backend)

model.eval()

THRESHOLD_TIDAK_PANTAS = 0.60
THRESHOLD_PANTAS       = 0.60

def predict(text: str) -> dict:
    \"\"\"
    Klasifikasikan teks ke 3 label:
      PANTAS       : Aman, tidak mengandung konten negatif
      MERAGUKAN    : Ambigu -- kata kasar untuk ekspresi/pujian,
                     kata disensor, atau kata daerah tidak ada di dataset
      TIDAK PANTAS : Jelas ujaran kebencian / kata toxic eksplisit

    Returns:
        dict berisi: label, confidence, prob_pantas,
                     prob_meragukan, prob_tidak_pantas
    \"\"\"
    text_clean = preprocess_text(text, alay_dict)
    if not text_clean:
        return {
            'label'             : 'PANTAS',
            'confidence'        : 0.50,
            'prob_pantas'       : 0.50,
            'prob_meragukan'    : 0.30,
            'prob_tidak_pantas' : 0.20,
        }

    inputs = tokenizer(
        text_clean,
        return_tensors='pt',
        max_length=MAX_LENGTH,
        padding='max_length',
        truncation=True
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        out   = model(**inputs)
        probs = F.softmax(out.logits, dim=-1).squeeze().cpu().numpy()

    prob_p  = float(probs[0])   # PANTAS
    prob_m  = float(probs[1])   # MERAGUKAN
    prob_tp = float(probs[2])   # TIDAK PANTAS

    # Tentukan label berdasarkan dominasi probability
    if prob_tp >= THRESHOLD_TIDAK_PANTAS:
        label      = 'TIDAK PANTAS'
        confidence = prob_tp
    elif prob_p >= THRESHOLD_PANTAS:
        label      = 'PANTAS'
        confidence = prob_p
    else:
        label      = 'MERAGUKAN'
        confidence = max(prob_m, prob_p, prob_tp)

    return {
        'label'             : label,
        'confidence'        : round(confidence, 4),
        'prob_pantas'       : round(prob_p, 4),
        'prob_meragukan'    : round(prob_m, 4),
        'prob_tidak_pantas' : round(prob_tp, 4),
    }


# --- Uji Inference ---
test_messages = [
    # PANTAS
    ("Selamat pagi, ada yang mau diskusi materi ujian?",       "PANTAS"),
    ("Terima kasih penjelasannya sangat membantu!",             "PANTAS"),
    ("Bagaimana cara implementasi rekursif di Python?",         "PANTAS"),
    # TIDAK PANTAS
    ("Anjing banget sih, ga ngerti-ngerti juga lo!",           "TIDAK PANTAS"),
    ("Dasar bodoh, mending ga usah masuk kuliah!",              "TIDAK PANTAS"),
    ("Goblok lo semua, otaknya isi apa?",                       "TIDAK PANTAS"),
    # MERAGUKAN -- pujian pakai kata kasar / disensor
    ("Wah anjir, presentasinya keren banget!",                  "MERAGUKAN"),
    ("PA*K KAU PUK*MA*",                                        "MERAGUKAN"),
    ("Asuuu keren banget lu mantap!",                           "MERAGUKAN"),
    ("Jancok, legend banget dia mainnya!",                      "MERAGUKAN"),
]

ICONS = {'PANTAS': '[P]', 'MERAGUKAN': '[M]', 'TIDAK PANTAS': '[TP]'}

print("Uji Inference Function (3 Label):")
print("=" * 92)
print(f"{'Pesan':<42} {'Pred':<14} {'Expected':<14} {'Conf':>6} {'P_TP':>6}")
print("-" * 92)
correct = 0
for msg, expected in test_messages:
    r   = predict(msg)
    chk = 'OK' if r['label'] == expected else 'X'
    if r['label'] == expected:
        correct += 1
    ico = ICONS.get(r['label'], '[ ]')
    print(f"{ico} {msg[:40]:<40} {r['label']:<14} {expected:<14} {r['confidence']:>6.4f} {r['prob_tidak_pantas']:>6.4f} {chk}")
print("=" * 92)
print(f"\\n  Akurasi quick test: {correct}/{len(test_messages)} ({correct/len(test_messages)*100:.0f}%)")
print(f"\\nFungsi predict() 3-label siap digunakan Backend Engineer!")
print(f"  Output: label | confidence | prob_pantas | prob_meragukan | prob_tidak_pantas")
"""

# ============================================================
# CELL: verify-model
# Update verifikasi untuk 3 label
# ============================================================

NEW_VERIFY = """\
# ============================================================
# LANGKAH 10C: Verifikasi Model (3 Label)
# ============================================================

print("Verifikasi model hasil simpan...")

tok_v = AutoTokenizer.from_pretrained(MODEL_SAVE_PATH)

model_v = AutoModelForSequenceClassification.from_pretrained(
    MODEL_SAVE_PATH
).to(device)

model_v.eval()

def predict_loaded(text, model_obj, tok_obj,
                   thr_tp=0.60, thr_p=0.60):

    clean_text = preprocess_text(text, alay_dict)

    inputs = tok_obj(
        clean_text,
        return_tensors="pt",
        max_length=MAX_LENGTH,
        truncation=True,
        padding="max_length"
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model_obj(**inputs)
        probs   = F.softmax(
            outputs.logits, dim=-1
        ).squeeze().cpu().numpy()

    prob_p  = float(probs[0])
    prob_m  = float(probs[1])
    prob_tp = float(probs[2])

    if prob_tp >= thr_tp:
        label      = "TIDAK PANTAS"
        confidence = prob_tp
    elif prob_p >= thr_p:
        label      = "PANTAS"
        confidence = prob_p
    else:
        label      = "MERAGUKAN"
        confidence = max(prob_m, prob_p, prob_tp)

    return {
        "text"              : text,
        "clean_text"        : clean_text,
        "label"             : label,
        "confidence"        : round(confidence, 4),
        "prob_pantas"       : round(prob_p, 4),
        "prob_meragukan"    : round(prob_m, 4),
        "prob_tidak_pantas" : round(prob_tp, 4),
    }


verify_samples = [
    ("Selamat pagi, semoga harimu menyenangkan",    "PANTAS"),
    ("Dasar bodoh kamu",                            "TIDAK PANTAS"),
    ("Terima kasih atas bantuannya",                "PANTAS"),
    ("Anjing lu ga berguna",                        "TIDAK PANTAS"),
    ("Ayo kita belajar bersama",                    "PANTAS"),
    ("Wah anjir, keren banget presentasinya!",      "MERAGUKAN"),
    ("PA*K KAU PUK*MA*",                           "MERAGUKAN"),
]

print("\\nUji model yang disimpan (3 Label)\\n")
print("=" * 72)

ICONS_V = {"PANTAS": "[P] ", "MERAGUKAN": "[M] ", "TIDAK PANTAS": "[TP]"}

for text, expected in verify_samples:
    result = predict_loaded(text, model_v, tok_v)
    ico    = ICONS_V.get(result["label"], "[ ] ")
    print(f"\\n{ico} TEXT     : {text}")
    print(f"      EXPECTED  : {expected}")
    print(f"      LABEL     : {result['label']}")
    print(f"      CONFIDENCE: {result['confidence']:.4f}")
    print(f"      PANTAS={result['prob_pantas']:.4f} | "
          f"MERAGUKAN={result['prob_meragukan']:.4f} | "
          f"TIDAK_PANTAS={result['prob_tidak_pantas']:.4f}")

print("\\n" + "=" * 72)
print("\\nVerifikasi selesai")
print("Model berhasil dimuat dari folder simpan")
print("Model mendukung 3 label: PANTAS | MERAGUKAN | TIDAK PANTAS")
print("Model siap digunakan Backend Engineer")
"""

# ============================================================
# CELL: final-print
# Update ringkasan dengan multi-metrik + 3 label
# ============================================================

NEW_FINAL_PRINT = """\
# ============================================================
# RINGKASAN AKHIR PROJECT AI SHIELD (Revisi Mentor v3 -- 3 Label)
# ============================================================

print("\\n" + "=" * 70)
print("AI SHIELD -- FINAL PROJECT SUMMARY (v3 -- 3 Label)")
print("=" * 70)

print("\\nINFORMASI MODEL")
print(f"   Model Name      : {MODEL_NAME}")
print(f"   Base Model      : IndoBERT")
print(f"   Task            : 3-Class Text Classification")
print(f"   Labels          : PANTAS | MERAGUKAN | TIDAK PANTAS")
print(f"   Threshold TP    : {THRESHOLD_TIDAK_PANTAS}")
print(f"   Threshold P     : {THRESHOLD_PANTAS}")
print(f"   Max Length      : {MAX_LENGTH}")

print("\\nINFORMASI DATASET")
print(f"   Source          : okkyibrohim/id-multi-label-hate-speech")
print(f"   Total Samples   : {len(df_model):,}")
print(f"   Split Ratio     : 70% Train | 15% Validation | 15% Test")

print("\\nKONFIGURASI TRAINING")
print(f"   Epochs          : {NUM_EPOCHS}")
print(f"   Batch Size      : {BATCH_SIZE}")
print(f"   Learning Rate   : 2e-5")
print(f"   Random Seed     : {SEED}")

_ok = lambda v, t: 'TERCAPAI' if v >= t else 'BELUM'

print("\\nHASIL EVALUASI (Multi-Metrik -- Revisi Mentor)")
print(f"   Accuracy              : {acc:.4f} ({acc*100:.2f}%) [{_ok(acc,0.82)}]")
print(f"   F1-Score (Macro)      : {f1_mac:.4f} [{_ok(f1_mac,0.78)}]")
print(f"   F1-Score (Weighted)   : {f1_wgt:.4f}")
print(f"   Precision (Macro)     : {p_mac:.4f}")
print(f"   Recall (Macro)        : {r_mac:.4f}")
print(f"   Cohen's Kappa         : {kappa:.4f}")
print(f"   MCC                   : {mcc:.4f}")
print()
print(f"   {'Kelas':<20} {'Precision':>10} {'Recall':>8} {'F1':>8}")
print("   " + "-" * 50)
for i, name in enumerate(['PANTAS', 'MERAGUKAN', 'TIDAK PANTAS']):
    print(f"   {name:<20} {p_cls[i]:>10.4f} {r_cls[i]:>8.4f} {f1_cls[i]:>8.4f}")

print("\\nTARGET PENELITIAN")
print(f"   Accuracy >= 82%        : {_ok(acc,0.82)}  ({acc*100:.2f}%)")
print(f"   F1 Macro >= 78%        : {_ok(f1_mac,0.78)}  ({f1_mac*100:.2f}%)")
print(f"   F1 TIDAK PANTAS >= 78% : {_ok(f1_cls[2],0.78)}  ({f1_cls[2]*100:.2f}%)")

print("\\nHASIL EXPORT")
print(f"   Model Folder    : {MODEL_SAVE_PATH}")
if 'ROOT_DRIVE' in globals():
    print(f"   Google Drive    : {ROOT_DRIVE}")

print("   Assets Saved    :")
assets = [
    "confusion_matrix.png",
    "eda_results.png",
    "label_distribution.png",
    "threshold_calibration.png",
    "training_history.png"
]
for asset in assets:
    if os.path.exists(asset):
        print(f"      {asset}")

print("\\nFILE UNTUK BACKEND")
for item in ["model/", "predict.py", "requirements.txt", "model_metadata.json"]:
    print(f"      {item}")

print("\\nFILE UNTUK FRONTEND")
for item in ["confusion_matrix.png", "label_distribution.png",
             "eda_results.png", "threshold_calibration.png"]:
    print(f"      {item}")

print("\\nSTATUS PROJECT")
if acc >= 0.82 and f1_mac >= 0.78:
    print("   MODEL SIAP DEPLOYMENT")
    print("   SIAP DIGUNAKAN BACKEND ENGINEER")
    print("   SIAP INTEGRASI FRONTEND")
    print("   MENDUKUNG 3 LABEL: PANTAS | MERAGUKAN | TIDAK PANTAS")
else:
    print("   Evaluasi ulang model direkomendasikan")

print("\\nPROJECT")
print("   AI SHIELD")
print("   PIJAK x IBM SkillsBuild x Dicoding")

print("\\n" + "=" * 70)
print("SELURUH PIPELINE BERHASIL DISELESAIKAN (Revisi Mentor v3 -- 3 Label)")
print("=" * 70)
"""

# ============================================================
# Terapkan patch ke semua cell yang relevan
# ============================================================

PATCH_MAP = {
    "relabeling"      : NEW_RELABELING,
    "compute-metrics" : NEW_COMPUTE_METRICS,
    "evaluation"      : NEW_EVALUATION,
    "threshold"       : NEW_THRESHOLD,
    "inference"       : NEW_INFERENCE,
    "verify-model"    : NEW_VERIFY,
    "final-print"     : NEW_FINAL_PRINT,
}

patched = []
for cell in cells:
    cid = cell.get("id", "")
    if cid in PATCH_MAP:
        cell["source"]          = src(PATCH_MAP[cid])
        cell["outputs"]         = []
        cell["execution_count"] = None
        patched.append(cid)

# ============================================================
# Simpan notebook
# ============================================================

with open(NB_PATH, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=2)

print(f"Notebook berhasil dipatch!")
print(f"File: {NB_PATH}")
print(f"Cells yang diubah ({len(patched)}):")
for c in patched:
    print(f"  - {c}")
