"""
Keyword-based classifier sebagai placeholder sebelum model IndoBERT selesai di-fine-tune.
Interface-nya identik dengan model asli: predict(text) -> {label, confidence}
Saat IndoBERT selesai, file ini cukup diganti tanpa mengubah kode BE.

Revisi v3 (berdasarkan catatan mentor — perbaikan lanjutan):
1. Kamus kata toxic diperluas: bahasa daerah Jawa, Sunda, Melayu, Batak, dll.
2. Leet Map lebih lengkap + deteksi asterisk wildcard (p*ki, puk*mak)
3. Fuzzy matching lebih sensitif untuk kata pendek (>=4 karakter)
4. Konteks harfiah & kosakata pujian diperluas (slang kekinian)
5. Confidence scoring diperbaiki: distribusi 3-label yang adil & bebas bug
6. Kembalikan prob_pantas / prob_meragukan / prob_tidak_pantas
"""

import re
from difflib import SequenceMatcher

# ---------------------------------------------------------------------------
# 1. Kamus kata tidak pantas
#    Sudah dalam bentuk ternormalisasi (lowercase, tanpa simbol/spasi ganda).
#    Dikelompokkan berdasarkan asal bahasa untuk kemudahan pemeliharaan.
# ---------------------------------------------------------------------------
KATA_TIDAK_PANTAS = [
    # --- Indonesia Umum ---
    "anjing", "babi", "bangsat", "kontol", "memek", "tolol", "idiot",
    "bodoh", "goblok", "sialan", "keparat", "bajingan", "tai", "tahi",
    "brengsek", "ngentot", "ngewe", "pelacur", "jablay", "sundal",
    "monyet", "celeng", "kampret", "kurang ajar", "kepala batu",
    "bego", "bebal", "dungu", "pandir", "sinting", "gila",

    # --- Variasi & Singkatan Umum ---
    "asu", "cok", "cuk", "anjir", "anjrit", "anjer",
    "wtf", "stfu", "fck", "fuk",

    # --- Bahasa Jawa ---
    "jancok", "dancok", "jancuk", "dancuk", "matamu", "matane",
    "mbokmu", "jiancok", "j4ncok", "asu",
    "ngaceng", "jangkrik", "semprul",

    # --- Bahasa Sunda ---
    "maneh", "sia", "goblog", "belegug", "dodol",
    "sieur", "bajigur", "cocote",

    # --- Bahasa Melayu / Riau ---
    "pukimak", "puki", "kimak", "pantek", "pukima",
    "kampang", "sial", "haram jadah", "bedebah",
    "babi buta",

    # --- Bahasa Batak ---
    "parjolo", "horas naso", "iblis",

    # --- Campuran / Gaul Kasar ---
    "lonte", "lacur", "perek", "bejat", "bangke", "mayat",
    "mati aja", "mati lo", "matilah",
]

# Hilangkan duplikat tanpa mengubah urutan
_seen = set()
_dedup = []
for _k in KATA_TIDAK_PANTAS:
    if _k not in _seen:
        _seen.add(_k)
        _dedup.append(_k)
KATA_TIDAK_PANTAS = _dedup

# ---------------------------------------------------------------------------
# 2. Peta normalisasi leet speak / plesetan angka-simbol -> huruf
#    Karakter yang TIDAK ada di peta dibiarkan apa adanya.
# ---------------------------------------------------------------------------
LEET_MAP = {
    "4": "a", "@": "a",
    "1": "i", "!": "i", "|": "i",
    "3": "e",
    "0": "o",
    "5": "s", "$": "s",
    "7": "t",
    "8": "b",
    "9": "g",
    "#": "h",
    "+": "t",
    "6": "g",
    "2": "z",
}

# ---------------------------------------------------------------------------
# 3. Pola sensor dengan asterisk — hanya aktif ketika terdapat MINIMAL SATU
#    karakter sensor (*-_.) di antara huruf-huruf kata kasar.
#    Ini mencegah false positive pada kata biasa yang tidak mengandung simbol.
#    Format: (pola_regex, kata_canonical)
# ---------------------------------------------------------------------------
# Regex helper: huruf wajib diikuti minimal 1 simbol di antara minimal 1 pasang huruf
_SYM = r"[\*\-_\.]+"   # satu atau lebih simbol sensor
_L   = r"[a-zA-Z]"     # satu huruf

def _make_sensor_pattern(letters: str) -> re.Pattern:
    """
    Buat regex yang mencocokkan kata yang MENGANDUNG SIMBOL SENSOR di tengahnya.
    letters: string huruf-huruf kata (e.g. 'anjing')
    Pola: tiap huruf bisa dipisahkan oleh simbol sensor (*-_.),
          tapi MINIMAL satu simbol harus ada.
    Pendekatan: gunakan lookahead untuk memastikan ada simbol di dalam kata.
    """
    # Buat pola fleksibel huruf[simbol?]huruf[simbol?]...
    flex = (_SYM + "?").join(re.escape(ch) for ch in letters)
    # Tambah lookahead: pastikan minimal 1 simbol sensor ada di dalam teks token ini
    # Digabung: kata yang mengandung simbol sensor
    pattern_str = r"(?=\S*[\*\-_\.]\S*)" + flex
    return re.compile(pattern_str, re.I)

SENSOR_PATTERNS = [
    (_make_sensor_pattern("puki"),        "puki"),
    (_make_sensor_pattern("pukimak"),     "pukimak"),
    (_make_sensor_pattern("kimak"),       "kimak"),
    (_make_sensor_pattern("anjing"),      "anjing"),
    (_make_sensor_pattern("kontol"),      "kontol"),
    (_make_sensor_pattern("bangsat"),     "bangsat"),
    (_make_sensor_pattern("kampang"),     "kampang"),
    (_make_sensor_pattern("kampret"),     "kampret"),
    (_make_sensor_pattern("jancok"),      "jancok"),
    (_make_sensor_pattern("ngentot"),     "ngentot"),
    (_make_sensor_pattern("pantek"),      "pantek"),
    (_make_sensor_pattern("bajingan"),    "bajingan"),
    (_make_sensor_pattern("tolol"),       "tolol"),
    (_make_sensor_pattern("goblok"),      "goblok"),
    (_make_sensor_pattern("bodoh"),       "bodoh"),
    (_make_sensor_pattern("memek"),       "memek"),
    (_make_sensor_pattern("babi"),        "babi"),
    (_make_sensor_pattern("tai"),         "tai"),
    (_make_sensor_pattern("lonte"),       "lonte"),
    (_make_sensor_pattern("pukima"),      "pukima"),
    (_make_sensor_pattern("anjir"),       "anjir"),
    (_make_sensor_pattern("brengsek"),    "brengsek"),
    (_make_sensor_pattern("sialan"),      "sialan"),
]

# ---------------------------------------------------------------------------
# 4. Konteks "harfiah" — kata-kata ini di sekitar kata toxic mengindikasikan
#    makna literal (bukan hinaan). Makin banyak konteks, makin besar reduksi skor.
# ---------------------------------------------------------------------------
KONTEKS_HARFIAH = {
    "anjing": [
        "peliharaan", "herder", "poodle", "golden", "labrador", "bulldog",
        "kucing", "binatang", "hewan", "satwa", "fauna",
        "menggonggong", "gonggong", "gigit", "rabies", "kandang", "vaksin",
        "anjingnya", "anjingku", "anjing saya", "anjing kami",
        "adopsi", "veteriner", "dokter hewan",
    ],
    "babi": [
        "ternak", "kandang", "daging", "hewan", "peliharaan",
        "beternak", "peternak", "peternakan", "masak", "dimasak",
        "babi panggang", "sate babi",
    ],
    "monyet": [
        "kebun binatang", "primata", "kera", "satwa", "hewan",
        "simpanse", "gorila", "orangutan", "lutung",
        "atraksi", "pertunjukan",
    ],
    "gila": [
        "rumah sakit", "psikiatri", "psikolog", "gangguan", "terapi",
        "jiwa", "mental", "sakit jiwa",
    ],
    "celeng": [
        "hutan", "berburu", "babi hutan", "hewan liar",
    ],
    "kampret": [
        "kelelawar", "hewan", "satwa", "malam",
    ],
}

# ---------------------------------------------------------------------------
# 5. Kata pujian & ekspresi informal positif — kalau muncul bersama kata kasar,
#    kemungkinan kalimatnya pujian atau ekspresi antusias, bukan ujaran kebencian.
# ---------------------------------------------------------------------------
KATA_PUJIAN = [
    # Ekspresi kagum umum
    "keren", "mantap", "gokil", "top", "mantul", "bagus", "hebat", "sip",
    "juara", "the best", "luar biasa", "kece", "wow", "asik", "asyik",
    "cakep", "cantik", "ganteng", "lucu", "rapi", "kece", "kiyowo",
    # Slang kekinian
    "gils", "gilss", "parah", "paraaah", "parahh", "ngeri", "ngeriii",
    "gaskeun", "gas", "legend", "legendary", "sultan", "pro", "goat",
    "mastah", "master", "dewa", "boss", "bossku",
    "keren banget", "mantap banget", "gokil banget", "kece banget",
    "parah bagus", "seru banget", "seru abis",
    # Ekspresi positif lain
    "sukses", "selamat", "congrats", "congrat", "respect", "salut",
    "bangga", "proud", "amazing", "awesome", "perfect",
]

# ---------------------------------------------------------------------------
# Helper untuk deteksi pujian multi-kata
# ---------------------------------------------------------------------------
_KATA_PUJIAN_SORTED = sorted(KATA_PUJIAN, key=len, reverse=True)  # cek frasa dulu


def _normalize_leet(token: str) -> str:
    """
    Ganti karakter leet (angka/simbol) -> huruf menggunakan LEET_MAP,
    lalu rapatkan huruf berulang 3x atau lebih menjadi 1.
    Contoh: '4nj1rrr' -> 'anjirrr' -> 'anjir'
             'anjiiinggg' -> 'anjiing' -> 'anjing'  (2x diperbolehkan, 3x+ dikurangi)
    """
    normalized = "".join(LEET_MAP.get(ch, ch) for ch in token.lower())
    # Rapatkan karakter berulang >=3 jadi 2 dulu, lalu jadi 1
    # (dua langkah agar 'anjiing' (double i normal) tidak ikut terpotong)
    normalized = re.sub(r"(.)\1{2,}", r"\1\1", normalized)  # >=3 -> 2
    normalized = re.sub(r"(.)\1{2,}", r"\1", normalized)    # >=3 -> 1 (jika masih ada)
    return normalized


def _strip_symbols_and_normalize(token: str) -> str:
    """
    Buang semua karakter non-alfanumerik, lalu leet-normalize.
    Berguna untuk kasus seperti 'k*mpang', 'pa0k', 'pukma*'.
    """
    only_alnum = re.sub(r"[^a-zA-Z0-9]", "", token)
    return _normalize_leet(only_alnum)


def _fuzzy_ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def _check_sensor_patterns(text: str) -> tuple:
    """
    Cek apakah teks mengandung pola kata yang disensor dengan simbol (*-_.).
    Mengembalikan (score, kata_canonical) atau (0.0, None).
    """
    for pattern, canonical in SENSOR_PATTERNS:
        if pattern.search(text):
            return 0.9, canonical
    return 0.0, None


def _detect_toxic(text_lower: str) -> tuple:
    """
    Mengembalikan tuple (raw_score, matched_word, match_type).
    match_type: 'sensor_pattern' | 'exact' | 'leet' | 'fuzzy' | None
    """
    best_score = 0.0
    best_word = None
    best_type = None

    def _update(score, word, mtype):
        nonlocal best_score, best_word, best_type
        if score > best_score:
            best_score, best_word, best_type = score, word, mtype

    # --- Periksa pola sensor (k*mpang, puk*mak, dll.) terlebih dahulu ---
    sensor_score, sensor_word = _check_sensor_patterns(text_lower)
    if sensor_score > 0:
        _update(sensor_score, sensor_word, "sensor_pattern")
        # Langsung kembalikan jika pola sensor terdeteksi jelas
        if sensor_score >= 0.9:
            return best_score, best_word, best_type

    raw_tokens = re.findall(r"[^\s]+", text_lower)

    for kata in KATA_TIDAK_PANTAS:
        # --- Exact match (substring langsung) ---
        if kata in text_lower:
            _update(1.0, kata, "exact")
            continue  # Tidak perlu cek lagi untuk kata ini

        for token in raw_tokens:
            # --- Leet-normalized match ---
            norm = _normalize_leet(token)
            if kata == norm or kata in norm:
                _update(0.88, kata, "leet")
                continue

            # --- Strip simbol + leet, lalu exact match ---
            stripped = _strip_symbols_and_normalize(token)
            if kata == stripped or kata in stripped:
                _update(0.85, kata, "leet")
                continue

            # --- Fuzzy match untuk kata bercampur simbol/angka ---
            # Threshold panjang diturunkan ke 4 (kata pendek seperti "puki" bisa terdeteksi)
            if min(len(stripped), len(kata)) >= 4:
                ratio = _fuzzy_ratio(stripped, kata)
                if ratio >= 0.80:
                    # Skor fuzzy: 0.55 - 0.80, di bawah threshold "TIDAK PANTAS" (0.7)
                    # sehingga masuk ke MERAGUKAN kecuali rasionya sangat tinggi
                    score = 0.55 + (ratio - 0.80) / 0.20 * 0.25  # 0.55 - 0.80
                    score = round(min(score, 0.80), 4)
                    _update(score, kata, "fuzzy")

    return best_score, best_word, best_type


def _has_context(text_lower: str, context_words: list) -> int:
    """
    Mengembalikan jumlah kata konteks yang ditemukan dalam teks.
    Lebih dari satu kata konteks menguatkan disambiguasi.
    """
    return sum(1 for ctx in context_words if ctx in text_lower)


def _has_praise(text_lower: str) -> int:
    """
    Mengembalikan jumlah kata/frasa pujian yang ditemukan dalam teks.
    Frasa lebih panjang dicek terlebih dahulu.
    """
    count = 0
    temp = text_lower
    for pujian in _KATA_PUJIAN_SORTED:
        if pujian in temp:
            count += 1
            # Tandai posisi agar tidak dihitung ganda
            temp = temp.replace(pujian, " ", 1)
    return count


def _compute_confidence_distribution(raw_score: float) -> tuple:
    """
    Mengubah raw_score (0.0 – 1.0) menjadi distribusi tiga label.

    Prinsip:
    - raw_score tinggi  (>= 0.72) -> TIDAK PANTAS dominan
    - raw_score sedang  (0.28 – 0.72) -> MERAGUKAN dominan
    - raw_score rendah  (< 0.28) -> PANTAS dominan

    Returns:
        (label, confidence, prob_pantas, prob_meragukan, prob_tidak_pantas)
    """
    s = max(0.0, min(raw_score, 1.0))

    # Distribusi probabilitas dengan fungsi sigmoid-like
    # prob_tidak_pantas naik seiring raw_score
    # prob_pantas turun seiring raw_score
    # prob_meragukan memuncak di tengah (sekitar s=0.5)

    prob_tidak_pantas = round(s ** 1.5, 4)                         # 0 -> 0, 1 -> 1, cembung di atas
    prob_pantas = round((1 - s) ** 1.5, 4)                        # 1 -> 1, 0 -> 0
    prob_meragukan_raw = 1.0 - prob_pantas - prob_tidak_pantas     # sisanya
    prob_meragukan = round(max(0.0, prob_meragukan_raw), 4)

    # Normalisasi agar total = 1.0
    total = prob_pantas + prob_meragukan + prob_tidak_pantas
    if total > 0:
        prob_pantas      = round(prob_pantas / total, 4)
        prob_meragukan   = round(prob_meragukan / total, 4)
        prob_tidak_pantas = round(1.0 - prob_pantas - prob_meragukan, 4)  # agar sum tepat 1

    # Tentukan label berdasarkan threshold raw_score
    if s >= 0.72:
        label = "TIDAK PANTAS"
        confidence = round(0.80 + (s - 0.72) / 0.28 * 0.18, 2)   # 0.80 – 0.98
        confidence = min(confidence, 0.98)
    elif s >= 0.28:
        label = "MERAGUKAN"
        # Confidence paling rendah di titik paling ambigu (s=0.5)
        # Naik secara linear mendekati 0.28 atau 0.72
        dist_from_center = abs(s - 0.5)                            # 0.0 – 0.22
        confidence = round(0.50 + dist_from_center / 0.22 * 0.20, 2)  # 0.50 – 0.70
        confidence = min(confidence, 0.70)
    else:
        label = "PANTAS"
        confidence = round(0.80 + (0.28 - s) / 0.28 * 0.18, 2)   # 0.80 – 0.98
        confidence = min(confidence, 0.98)

    return label, confidence, prob_pantas, prob_meragukan, prob_tidak_pantas


# ---------------------------------------------------------------------------
# Fungsi utama — interface yang digunakan oleh Backend Engineer
# ---------------------------------------------------------------------------

def predict(text: str) -> dict:
    """
    Mengklasifikasikan teks ke dalam tiga kategori:
    PANTAS, MERAGUKAN, atau TIDAK PANTAS.

    Strategi deteksi (urutan prioritas):
    1. Pola sensor (k*mpang, puk*mak, dsb.)    -> skor 0.90
    2. Exact match kata toxic dalam kamus       -> skor 1.00
    3. Leet/plesetan match (4nj1rrr, anjiiing)  -> skor 0.88
    4. Strip simbol + leet match                -> skor 0.85
    5. Fuzzy match (kata mirip, threshold 0.80) -> skor 0.55 – 0.80

    Disambiguasi (mengurangi skor):
    - Konteks harfiah (anjing peliharaan)   -> -0.40 per kata konteks (maks -0.55)
    - Konteks pujian (anjir keren banget)   -> -0.30 per kata pujian  (maks -0.45)

    Returns:
        dict berisi: label, confidence, prob_pantas, prob_meragukan,
                     prob_tidak_pantas, dan _debug (opsional untuk admin)
    """
    text_lower = text.lower()

    raw_score, matched_word, match_type = _detect_toxic(text_lower)

    if raw_score > 0:
        # --- Disambiguasi konteks harfiah ---
        if matched_word and matched_word in KONTEKS_HARFIAH:
            n_ctx = _has_context(text_lower, KONTEKS_HARFIAH[matched_word])
            if n_ctx > 0:
                reduction = min(0.40 * n_ctx, 0.55)  # maks pengurangan 0.55
                raw_score -= reduction

        # --- Disambiguasi konteks pujian ---
        n_pujian = _has_praise(text_lower)
        if n_pujian > 0:
            reduction = min(0.30 * n_pujian, 0.45)  # maks pengurangan 0.45
            raw_score -= reduction

    raw_score = max(0.0, min(raw_score, 1.0))

    label, confidence, prob_p, prob_m, prob_tp = _compute_confidence_distribution(raw_score)

    return {
        "label": label,
        "confidence": confidence,
        "prob_pantas": prob_p,
        "prob_meragukan": prob_m,
        "prob_tidak_pantas": prob_tp,
        # Info tambahan untuk debugging / admin dashboard (boleh diabaikan BE jika tidak dipakai)
        "_debug": {
            "raw_score": round(raw_score, 4),
            "matched_word": matched_word,
            "match_type": match_type,
        },
    }


# ---------------------------------------------------------------------------
# Test runner (jalankan: python classifier.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    test_cases = [
        # --- Normal ---
        ("Halo semuanya, bagaimana kabar kalian?",           "PANTAS"),
        ("Diskusi ini sangat menarik dan informatif.",        "PANTAS"),
        ("Terima kasih atas penjelasannya yang sangat jelas.", "PANTAS"),
        # --- Konteks harfiah ---
        ("Anjing peliharaan saya lucu sekali",               "PANTAS"),
        ("Saya punya anjing herder yang sangat jinak",        "PANTAS"),
        ("Babi ternak di peternakan itu gemuk-gemuk",         "PANTAS"),
        # --- Pujian informal ---
        ("Anjir keren banget presentasinya!",                 "MERAGUKAN"),
        ("Gokil banget sih, anjing lo pro!",                  "MERAGUKAN"),
        ("Gilss parah banget mainnya, gokil!",                "PANTAS"),
        # --- Kata kasar langsung ---
        ("Anjing banget sih lo!",                             "TIDAK PANTAS"),
        ("Dasar bodoh, tidak tahu apa-apa.",                  "TIDAK PANTAS"),
        ("Dasar goblok kamu!",                                "TIDAK PANTAS"),
        # --- Leet speak ---
        ("4nj1rrr lo ngomong gitu ke aku",                    "TIDAK PANTAS"),
        ("anjiiinggg parah banget nih",                        "TIDAK PANTAS"),
        ("Dasar t0l0l banget si dia",                          "TIDAK PANTAS"),
        # --- Simbol/sensor ---
        ("PA*K KAU PUK*MA*",                                  "MERAGUKAN/TIDAK PANTAS"),
        ("dasar k*mpang lu",                                   "TIDAK PANTAS"),
        ("kau ini p*k*mak",                                    "TIDAK PANTAS"),
        # --- Bahasa daerah ---
        ("jancok kamu!",                                       "TIDAK PANTAS"),
        ("dasar maneh goblog",                                  "TIDAK PANTAS"),
        ("haram jadah betul dia",                               "TIDAK PANTAS"),
        # --- Fuzzy / campuran ---
        ("isi ngentod kau",                                    "TIDAK PANTAS"),
        ("lo emang bngsat ya",                                  "TIDAK PANTAS"),
    ]

    RESET  = "\033[0m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    CYAN   = "\033[96m"

    color_map = {
        "PANTAS":       GREEN,
        "MERAGUKAN":    YELLOW,
        "TIDAK PANTAS": RED,
    }

    print("=" * 70)
    print("  AI SHIELD — Classifier v3  |  Test Suite")
    print("=" * 70)

    for text, expected in test_cases:
        result  = predict(text)
        dbg     = result.pop("_debug")
        label   = result["label"]
        conf    = result["confidence"]
        col     = color_map.get(label, RESET)

        print(f"\nInput      : {text}")
        print(f"Expected   : {CYAN}{expected}{RESET}")
        print(f"Label      : {col}{label}{RESET}   "
              f"(confidence={conf})")
        print(f"Distribusi : PANTAS={result['prob_pantas']} | "
              f"MERAGUKAN={result['prob_meragukan']} | "
              f"TIDAK PANTAS={result['prob_tidak_pantas']}")
        print(f"Debug      : raw_score={dbg['raw_score']} | "
              f"matched='{dbg['matched_word']}' | type={dbg['match_type']}")
        print("-" * 70)
