"""
evaluasi_model.py — Evaluasi Komprehensif AI SHIELD Classifier
================================================================
Mengevaluasi classifier.py (keyword-based) menggunakan berbagai metrik
yang direkomendasikan mentor, termasuk perbandingan antar konfigurasi model.

Metrik yang dihitung:
  - Accuracy
  - F1-Score (Macro, Weighted, per kelas)
  - Precision (Macro, Weighted, per kelas)
  - Recall (Macro, Weighted, per kelas)
  - Confusion Matrix (3x3 untuk label PANTAS, MERAGUKAN, TIDAK PANTAS)
  - Cohen's Kappa (mengukur kesepakatan vs tebakan acak)
  - Matthews Correlation Coefficient (MCC)

Cara pakai:
  python evaluasi_model.py
  python evaluasi_model.py --export  <- simpan hasil ke CSV

Ketika IndoBERT selesai di-fine-tune, ganti fungsi `predict()` yang diimport
di atas tanpa mengubah kode evaluasi ini.
"""

import argparse
import csv
import json
import os
import sys
from datetime import datetime

# Paksa stdout menggunakan UTF-8 agar karakter non-ASCII tidak error di Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# --- Cek scikit-learn ---
try:
    from sklearn.metrics import (
        accuracy_score,
        classification_report,
        cohen_kappa_score,
        confusion_matrix,
        f1_score,
        matthews_corrcoef,
        precision_score,
        recall_score,
    )
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print(
        "[PERINGATAN] scikit-learn tidak terinstal.\n"
        "Jalankan: pip install scikit-learn\n"
        "Sebagian metrik tidak akan tersedia.\n"
    )

# Import classifier dari file yang sama direktori
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from classifier import predict

# ===========================================================================
# Dataset Uji (Ground Truth)
# ===========================================================================
# Format: (teks, label_benar)
# Label valid: "PANTAS", "MERAGUKAN", "TIDAK PANTAS"
# ---------------------------------------------------------------------------
# Catatan:
# Dataset ini adalah data uji buatan untuk mengevaluasi classifier berbasis
# keyword. Saat IndoBERT selesai, ganti dengan test_set.csv asli.
# ---------------------------------------------------------------------------

TEST_DATASET = [
    # ---- PANTAS (30 contoh) ----
    ("Halo semuanya, bagaimana kabar kalian?",                  "PANTAS"),
    ("Diskusi ini sangat menarik dan informatif.",               "PANTAS"),
    ("Terima kasih atas penjelasannya yang sangat jelas.",       "PANTAS"),
    ("Saya setuju dengan pendapat kamu.",                        "PANTAS"),
    ("Mari kita selesaikan masalah ini bersama-sama.",           "PANTAS"),
    ("Presentasi hari ini sangat bagus dan inspiratif.",         "PANTAS"),
    ("Tolong bantu saya memahami materi ini.",                   "PANTAS"),
    ("Saya akan berusaha lebih keras lagi.",                     "PANTAS"),
    ("Selamat ulang tahun, semoga panjang umur!",                "PANTAS"),
    ("Terima kasih sudah membantu saya kemarin.",                "PANTAS"),
    ("Anjing peliharaan saya lucu sekali.",                      "PANTAS"),
    ("Babi ternak di peternakan itu gemuk-gemuk.",               "PANTAS"),
    ("Saya punya anjing herder yang sangat jinak.",              "PANTAS"),
    ("Kebun binatang di kota ini memiliki banyak monyet.",       "PANTAS"),
    ("Selamat pagi, semoga harimu menyenangkan!",                "PANTAS"),
    ("Apakah ada yang bisa bantu jelaskan tugas ini?",           "PANTAS"),
    ("Hari ini cuacanya sangat cerah dan menyenangkan.",         "PANTAS"),
    ("Saya sangat menikmati diskusi kelompok tadi.",             "PANTAS"),
    ("Buku ini sangat bermanfaat untuk studi saya.",             "PANTAS"),
    ("Mantap sekali cara kamu menjelaskan konsep ini.",          "PANTAS"),
    ("Peternakan babi itu dikelola dengan sangat modern.",       "PANTAS"),
    ("Anjing saya suka bermain di taman setiap pagi.",           "PANTAS"),
    ("Vaksin rabies untuk anjing sangat penting.",               "PANTAS"),
    ("Program ini sangat bermanfaat bagi mahasiswa.",            "PANTAS"),
    ("Kami berterima kasih atas dukungan semua pihak.",          "PANTAS"),
    ("Semangat belajar untuk ujian besok!",                      "PANTAS"),
    ("Ide kamu sangat kreatif dan out of the box.",              "PANTAS"),
    ("Saya bangga dengan pencapaian tim kita.",                  "PANTAS"),
    ("Kolaborasi yang baik menghasilkan karya terbaik.",         "PANTAS"),
    ("Gilss parah banget mainnya, gokil!",                       "PANTAS"),

    # ---- MERAGUKAN (20 contoh) ----
    ("Anjir keren banget presentasinya!",                        "MERAGUKAN"),
    ("Gokil banget sih, anjing lo pro!",                         "MERAGUKAN"),
    ("Anjir, beneran kece banget itu!",                          "MERAGUKAN"),
    ("Buset dah, mantap banget kerjanya!",                       "MERAGUKAN"),
    ("Asuuu keren banget lu!",                                   "MERAGUKAN"),
    ("Cok, legend banget dia main!",                             "MERAGUKAN"),
    ("Wah anjir, bagus banget hasilnya!",                        "MERAGUKAN"),
    ("Gila, the best banget tim ini!",                           "MERAGUKAN"),
    ("Anjir mantul banget sih idenya!",                          "MERAGUKAN"),
    ("Buset, hebat banget cak!",                                 "MERAGUKAN"),
    ("PA*K KAU PUK*MA*",                                        "MERAGUKAN"),
    ("dasar k*mpang lu",                                         "MERAGUKAN"),
    ("Kau ini a**ing banget",                                    "MERAGUKAN"),
    ("lo emang b*ngsat ya",                                      "MERAGUKAN"),
    ("s**l banget kelakuan lo",                                  "MERAGUKAN"),
    ("p-u-k-i-m-a-k kau ini",                                   "MERAGUKAN"),
    ("Anjrit, amazing banget karya lo!",                         "MERAGUKAN"),
    ("Jancok, luar biasa banget si dia!",                        "MERAGUKAN"),
    ("Asu, mantap banget hasilnya bro!",                         "MERAGUKAN"),
    ("Brengsek, keren banget itu cara mainnya!",                 "MERAGUKAN"),

    # ---- TIDAK PANTAS (30 contoh) ----
    ("Anjing banget sih lo!",                                    "TIDAK PANTAS"),
    ("Dasar bodoh, tidak tahu apa-apa.",                         "TIDAK PANTAS"),
    ("Dasar goblok kamu!",                                       "TIDAK PANTAS"),
    ("4nj1rrr lo ngomong gitu ke aku",                           "TIDAK PANTAS"),
    ("anjiiinggg parah banget nih",                              "TIDAK PANTAS"),
    ("Dasar t0l0l banget si dia",                                "TIDAK PANTAS"),
    ("Sialan kamu!",                                             "TIDAK PANTAS"),
    ("Bangsat betul kau ini!",                                   "TIDAK PANTAS"),
    ("Keparat, berani kamu!",                                    "TIDAK PANTAS"),
    ("Kamu memang idiot!",                                       "TIDAK PANTAS"),
    ("Ngentot kau!",                                             "TIDAK PANTAS"),
    ("jancok kamu betul!",                                       "TIDAK PANTAS"),
    ("Dasar maneh goblog!",                                      "TIDAK PANTAS"),
    ("Haram jadah betul dia ini.",                               "TIDAK PANTAS"),
    ("Kau ini bajingan!",                                        "TIDAK PANTAS"),
    ("Brengsek banget kelakuannya.",                             "TIDAK PANTAS"),
    ("Tolol sekali kamu ini.",                                   "TIDAK PANTAS"),
    ("Memang kampret si dia!",                                   "TIDAK PANTAS"),
    ("Dasar babi kamu!",                                         "TIDAK PANTAS"),
    ("Bodoh sekali pertanyaannya.",                              "TIDAK PANTAS"),
    ("Pelacur kau!",                                             "TIDAK PANTAS"),
    ("Sundal betul si dia.",                                     "TIDAK PANTAS"),
    ("Bajingan, lancang sekali!",                                "TIDAK PANTAS"),
    ("Kurang ajar banget kamu!",                                 "TIDAK PANTAS"),
    ("Goblog, mikir dulu sebelum ngomong!",                      "TIDAK PANTAS"),
    ("isi ngentod kau",                                          "TIDAK PANTAS"),
    ("Dancok, berani kau!",                                      "TIDAK PANTAS"),
    ("Sia goblog pisan!",                                        "TIDAK PANTAS"),
    ("Pantek kau bah!",                                          "TIDAK PANTAS"),
    ("Mati aja lo!",                                             "TIDAK PANTAS"),
]

LABEL_ORDER = ["PANTAS", "MERAGUKAN", "TIDAK PANTAS"]


# ===========================================================================
# Utilitas tampilan
# ===========================================================================

RESET  = "\033[0m"
BOLD   = "\033[1m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BLUE   = "\033[94m"
MAGENTA = "\033[95m"
WHITE  = "\033[97m"

def _c(text, color): return f"{color}{text}{RESET}"
def _b(text):        return f"{BOLD}{text}{RESET}"

def _print_section(title: str):
    line = "-" * 70
    print(f"\n{_c(line, CYAN)}")
    print(f"  {_b(_c(title, WHITE))}")
    print(f"{_c(line, CYAN)}")


def _label_color(lbl: str) -> str:
    return {
        "PANTAS": GREEN,
        "MERAGUKAN": YELLOW,
        "TIDAK PANTAS": RED,
    }.get(lbl, RESET)


# ===========================================================================
# Evaluasi utama
# ===========================================================================

def run_evaluation(dataset: list, config_name: str = "classifier_v3") -> dict:
    """
    Jalankan evaluasi lengkap pada dataset yang diberikan.

    Args:
        dataset: List of (text, true_label) tuples
        config_name: Nama konfigurasi untuk laporan

    Returns:
        dict berisi semua metrik
    """
    y_true = []
    y_pred = []
    errors = []

    print(f"\n{_b('Menjalankan prediksi pada')} {len(dataset)} sampel ...\n")

    for text, true_label in dataset:
        result = predict(text)
        pred_label = result["label"]
        y_true.append(true_label)
        y_pred.append(pred_label)

        if pred_label != true_label:
            errors.append({
                "text": text,
                "true": true_label,
                "pred": pred_label,
                "confidence": result["confidence"],
                "raw_score": result.get("_debug", {}).get("raw_score", "N/A"),
                "matched": result.get("_debug", {}).get("matched_word", "N/A"),
            })

    # Hitung metrik
    metrics = {}
    metrics["config_name"]  = config_name
    metrics["timestamp"]    = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    metrics["total_samples"] = len(dataset)

    # --- Distribusi data ---
    from collections import Counter
    true_dist = Counter(y_true)
    pred_dist = Counter(y_pred)
    metrics["true_distribution"] = dict(true_dist)
    metrics["pred_distribution"] = dict(pred_dist)

    if not SKLEARN_AVAILABLE:
        # Hitung manual jika scikit-learn tidak ada
        correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
        metrics["accuracy"] = round(correct / len(y_true), 4)
        metrics["note"] = "scikit-learn tidak tersedia, hanya accuracy yang dihitung"
        return metrics

    # --- Accuracy ---
    metrics["accuracy"] = round(accuracy_score(y_true, y_pred), 4)

    # --- F1-Score ---
    metrics["f1_macro"]    = round(f1_score(y_true, y_pred, average="macro",    labels=LABEL_ORDER, zero_division=0), 4)
    metrics["f1_weighted"] = round(f1_score(y_true, y_pred, average="weighted", labels=LABEL_ORDER, zero_division=0), 4)
    metrics["f1_per_kelas"] = {
        lbl: round(f1_score(y_true, y_pred, average=None, labels=LABEL_ORDER, zero_division=0)[i], 4)
        for i, lbl in enumerate(LABEL_ORDER)
    }

    # --- Precision ---
    metrics["precision_macro"]    = round(precision_score(y_true, y_pred, average="macro",    labels=LABEL_ORDER, zero_division=0), 4)
    metrics["precision_weighted"] = round(precision_score(y_true, y_pred, average="weighted", labels=LABEL_ORDER, zero_division=0), 4)
    metrics["precision_per_kelas"] = {
        lbl: round(precision_score(y_true, y_pred, average=None, labels=LABEL_ORDER, zero_division=0)[i], 4)
        for i, lbl in enumerate(LABEL_ORDER)
    }

    # --- Recall ---
    metrics["recall_macro"]    = round(recall_score(y_true, y_pred, average="macro",    labels=LABEL_ORDER, zero_division=0), 4)
    metrics["recall_weighted"] = round(recall_score(y_true, y_pred, average="weighted", labels=LABEL_ORDER, zero_division=0), 4)
    metrics["recall_per_kelas"] = {
        lbl: round(recall_score(y_true, y_pred, average=None, labels=LABEL_ORDER, zero_division=0)[i], 4)
        for i, lbl in enumerate(LABEL_ORDER)
    }

    # --- Cohen's Kappa ---
    metrics["cohens_kappa"] = round(cohen_kappa_score(y_true, y_pred), 4)

    # --- Matthews Correlation Coefficient ---
    metrics["mcc"] = round(matthews_corrcoef(y_true, y_pred), 4)

    # --- Confusion Matrix ---
    cm = confusion_matrix(y_true, y_pred, labels=LABEL_ORDER)
    metrics["confusion_matrix"] = cm.tolist()

    # --- Classification Report (raw) ---
    metrics["classification_report"] = classification_report(
        y_true, y_pred, labels=LABEL_ORDER, zero_division=0
    )

    # --- Error cases ---
    metrics["errors"] = errors
    metrics["error_count"] = len(errors)
    metrics["error_rate"] = round(len(errors) / len(dataset), 4)

    return metrics


# ===========================================================================
# Tampilan laporan
# ===========================================================================

def _print_confusion_matrix(cm_list: list):
    """Cetak confusion matrix dengan format tabel ASCII."""
    n = len(LABEL_ORDER)
    col_w = 16
    short = ["PANTAS", "MRGKN", "TDK_PNT"]  # singkatan kolom agar pas

    # Header kolom
    header = " " * 15
    for s in short:
        header += f"| {s:^12} "
    header += "|"
    print(f"\n  {'Aktual \\ Prediksi':15}", end="")
    for s in short:
        print(f"| {s:^12} ", end="")
    print("|")
    print("  " + "-" * (15 + (14) * n + 1))

    colors = [GREEN, YELLOW, RED]
    for i, row_label in enumerate(LABEL_ORDER):
        print(f"  {row_label:15}", end="")
        for j, val in enumerate(cm_list[i]):
            col = GREEN if i == j else RED
            print(f"| {_c(str(val), col):^20} ", end="")
        print("|")
    print("  " + "-" * (15 + 14 * n + 1))


def print_report(metrics: dict):
    """Cetak laporan evaluasi lengkap ke terminal."""
    _print_section(f"LAPORAN EVALUASI - {metrics['config_name']}")
    print(f"  Waktu       : {metrics['timestamp']}")
    print(f"  Total Sampel: {metrics['total_samples']}")

    # Distribusi
    _print_section("Distribusi Dataset")
    print(f"  {'':16} {'Aktual':>8} {'Prediksi':>10}")
    print(f"  {'-'*38}")
    for lbl in LABEL_ORDER:
        t = metrics["true_distribution"].get(lbl, 0)
        p = metrics["pred_distribution"].get(lbl, 0)
        col = _label_color(lbl)
        print(f"  {_c(lbl, col):<24} {t:>8} {p:>10}")

    # Metrik utama
    _print_section("Metrik Utama")
    acc      = metrics.get("accuracy", "N/A")
    f1_mac   = metrics.get("f1_macro", "N/A")
    f1_wgt   = metrics.get("f1_weighted", "N/A")
    kappa    = metrics.get("cohens_kappa", "N/A")
    mcc_val  = metrics.get("mcc", "N/A")

    _fmt = lambda v: f"{v:.4f} ({v*100:.2f}%)" if isinstance(v, float) else str(v)

    print(f"  {'Accuracy':<28} : {_c(_fmt(acc), GREEN)}")
    print(f"  {'F1-Score (Macro)':<28} : {_c(_fmt(f1_mac), CYAN)}")
    print(f"  {'F1-Score (Weighted)':<28} : {_c(_fmt(f1_wgt), CYAN)}")
    print(f"  {'Cohen Kappa':<28} : {_c(_fmt(kappa), MAGENTA)}")
    print(f"  {'Matthews Corr. Coef (MCC)':<28} : {_c(_fmt(mcc_val), MAGENTA)}")

    # Metrik per kelas
    _print_section("Metrik per Kelas")
    print(f"  {'Label':<16} {'Precision':>10} {'Recall':>10} {'F1-Score':>10}")
    print(f"  {'-'*50}")
    for lbl in LABEL_ORDER:
        prec = metrics.get("precision_per_kelas", {}).get(lbl, "N/A")
        rec  = metrics.get("recall_per_kelas", {}).get(lbl, "N/A")
        f1   = metrics.get("f1_per_kelas", {}).get(lbl, "N/A")
        col  = _label_color(lbl)
        _f = lambda v: f"{v:.4f}" if isinstance(v, float) else "N/A"
        print(f"  {_c(lbl, col):<24} {_f(prec):>10} {_f(rec):>10} {_f(f1):>10}")

    # Confusion Matrix
    _print_section("Confusion Matrix")
    if "confusion_matrix" in metrics:
        _print_confusion_matrix(metrics["confusion_matrix"])
        print(f"\n  Diagonal = prediksi benar | {_c('off-diagonal', RED)} = salah prediksi")

    # Kesalahan prediksi
    errors = metrics.get("errors", [])
    if errors:
        _print_section(f"Kesalahan Prediksi ({len(errors)} dari {metrics['total_samples']})")
        for i, e in enumerate(errors[:10], 1):  # tampilkan maks 10
            tc = _label_color(e['true'])
            pc = _label_color(e['pred'])
            print(f"\n  [{i}] Teks    : {e['text']}")
            print(f"       Aktual  : {_c(e['true'], tc)}")
            print(f"       Prediksi: {_c(e['pred'], pc)}  (conf={e['confidence']}, raw_score={e['raw_score']}, matched='{e['matched']}')")
        if len(errors) > 10:
            print(f"\n  ... dan {len(errors) - 10} kesalahan lainnya (lihat file CSV untuk detail lengkap)")

    print(f"\n{_c('-' * 70, CYAN)}\n")


# ===========================================================================
# Perbandingan antar konfigurasi
# ===========================================================================

KONFIGURASI = [
    {
        "name": "Classifier_v3_default",
        "description": "Keyword-based + Leet + Fuzzy + Sensor Pattern",
        "dataset": TEST_DATASET,
    },
    # Konfigurasi kedua: hanya subset data (simulasi distribusi berbeda)
    {
        "name": "Classifier_v3_toxic_heavy",
        "description": "Dataset dengan proporsi toxic lebih tinggi",
        "dataset": [d for d in TEST_DATASET if d[1] != "PANTAS"] + [
            ("Halo apa kabar?",             "PANTAS"),
            ("Diskusi yang produktif.",      "PANTAS"),
            ("Terima kasih banyak!",         "PANTAS"),
        ],
    },
]


def run_comparison(configs: list) -> list:
    """
    Jalankan evaluasi untuk setiap konfigurasi dan tampilkan tabel perbandingan.

    Returns:
        List of metrics dict untuk setiap konfigurasi
    """
    all_metrics = []
    for cfg in configs:
        print(f"\n{_b('-'*70)}")
        print(f"  Konfigurasi: {_c(cfg['name'], BLUE)}")
        print(f"  Deskripsi  : {cfg['description']}")
        m = run_evaluation(cfg["dataset"], config_name=cfg["name"])
        print_report(m)
        all_metrics.append(m)

    # Tabel perbandingan
    _print_section("TABEL PERBANDINGAN ANTAR KONFIGURASI")
    headers = ["Config", "Accuracy", "F1 Macro", "F1 Weighted", "Kappa", "MCC", "Error Rate"]
    col_w = [28, 10, 10, 12, 8, 8, 12]

    header_line = ""
    for h, w in zip(headers, col_w):
        header_line += f"{h:<{w}}"
    print(f"\n  {_b(header_line)}")
    print(f"  {'-' * sum(col_w)}")

    for m in all_metrics:
        _f = lambda k: f"{m.get(k, 0):.4f}" if isinstance(m.get(k), float) else "N/A"
        row = (
            f"{m['config_name']:<28}"
            f"{_f('accuracy'):<10}"
            f"{_f('f1_macro'):<10}"
            f"{_f('f1_weighted'):<12}"
            f"{_f('cohens_kappa'):<8}"
            f"{_f('mcc'):<8}"
            f"{_f('error_rate'):<12}"
        )
        print(f"  {row}")

    # Tentukan pemenang berdasarkan F1 Macro
    best = max(all_metrics, key=lambda m: m.get("f1_macro", 0))
    print(f"\n  {_b('== Model Terbaik (F1 Macro):')} {_c(best['config_name'], GREEN)}")
    print(f"     F1 Macro    = {best.get('f1_macro', 'N/A'):.4f}")
    print(f"     F1 Weighted = {best.get('f1_weighted', 'N/A'):.4f}")
    print(f"     Accuracy    = {best.get('accuracy', 'N/A'):.4f}")
    print(f"     Kappa       = {best.get('cohens_kappa', 'N/A'):.4f}")

    return all_metrics


# ===========================================================================
# Export ke CSV
# ===========================================================================

def export_to_csv(all_metrics: list, filename: str = None):
    """Simpan ringkasan metrik semua konfigurasi ke file CSV."""
    if filename is None:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            f"evaluasi_hasil_{ts}.csv"
        )

    rows = []
    for m in all_metrics:
        row = {
            "config_name":       m.get("config_name", ""),
            "timestamp":         m.get("timestamp", ""),
            "total_samples":     m.get("total_samples", ""),
            "accuracy":          m.get("accuracy", ""),
            "f1_macro":          m.get("f1_macro", ""),
            "f1_weighted":       m.get("f1_weighted", ""),
            "f1_pantas":         m.get("f1_per_kelas", {}).get("PANTAS", ""),
            "f1_meragukan":      m.get("f1_per_kelas", {}).get("MERAGUKAN", ""),
            "f1_tidak_pantas":   m.get("f1_per_kelas", {}).get("TIDAK PANTAS", ""),
            "precision_macro":   m.get("precision_macro", ""),
            "precision_pantas":  m.get("precision_per_kelas", {}).get("PANTAS", ""),
            "precision_meragukan": m.get("precision_per_kelas", {}).get("MERAGUKAN", ""),
            "precision_tidak_pantas": m.get("precision_per_kelas", {}).get("TIDAK PANTAS", ""),
            "recall_macro":      m.get("recall_macro", ""),
            "recall_pantas":     m.get("recall_per_kelas", {}).get("PANTAS", ""),
            "recall_meragukan":  m.get("recall_per_kelas", {}).get("MERAGUKAN", ""),
            "recall_tidak_pantas": m.get("recall_per_kelas", {}).get("TIDAK PANTAS", ""),
            "cohens_kappa":      m.get("cohens_kappa", ""),
            "mcc":               m.get("mcc", ""),
            "error_count":       m.get("error_count", ""),
            "error_rate":        m.get("error_rate", ""),
        }
        rows.append(row)

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n  [SAVED] Hasil evaluasi disimpan ke: {_c(filename, GREEN)}\n")
    return filename


def export_errors_to_csv(all_metrics: list, filename: str = None):
    """Simpan semua kesalahan prediksi ke CSV terpisah."""
    if filename is None:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            f"evaluasi_errors_{ts}.csv"
        )

    all_errors = []
    for m in all_metrics:
        for e in m.get("errors", []):
            e["config_name"] = m["config_name"]
            all_errors.append(e)

    if not all_errors:
        print("  [OK] Tidak ada kesalahan prediksi untuk diexport.")
        return None

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["config_name", "text", "true", "pred", "confidence", "raw_score", "matched"])
        writer.writeheader()
        writer.writerows(all_errors)

    print(f"  [SAVED] Detail kesalahan disimpan ke: {_c(filename, YELLOW)}\n")
    return filename


# ===========================================================================
# Main
# ===========================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Evaluasi komprehensif AI SHIELD Classifier"
    )
    parser.add_argument(
        "--export", action="store_true",
        help="Simpan hasil evaluasi ke file CSV"
    )
    parser.add_argument(
        "--single", action="store_true",
        help="Hanya jalankan evaluasi konfigurasi pertama (lebih cepat)"
    )
    args = parser.parse_args()

    print(f"\n{'='*70}")
    print(f"  {_b(_c('AI SHIELD — Evaluasi Model Komprehensif', CYAN))}")
    print(f"  Versi Classifier : v3 (keyword-based)")
    print(f"  Jumlah Label     : 3 (PANTAS | MERAGUKAN | TIDAK PANTAS)")
    print(f"  scikit-learn     : {'tersedia [OK]' if SKLEARN_AVAILABLE else 'tidak tersedia [!]'}")
    print(f"{'='*70}")

    configs = [KONFIGURASI[0]] if args.single else KONFIGURASI
    all_metrics = run_comparison(configs)

    if args.export:
        export_to_csv(all_metrics)
        export_errors_to_csv(all_metrics)

    print(f"\n{_b('Selesai.')} Jalankan dengan --export untuk menyimpan hasil ke CSV.\n")


if __name__ == "__main__":
    main()
