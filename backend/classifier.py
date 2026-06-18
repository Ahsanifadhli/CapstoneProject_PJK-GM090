"""
Keyword-based classifier sebagai placeholder sebelum model IndoBERT selesai di-fine-tune.
Interface-nya identik dengan model asli:
  predict(text) -> {label, confidence, prob_pantas, prob_meragukan, prob_tidak_pantas}
Saat IndoBERT selesai, file ini cukup diganti tanpa mengubah kode BE.
"""

KATA_TIDAK_PANTAS = [
    "anjing", "babi", "bangsat", "kontol", "memek", "tolol", "idiot",
    "bodoh", "goblok", "sialan", "keparat", "bajingan", "asu", "cok",
    "jancok", "dancok", "kampret", "tai", "tahi", "puki", "kimak",
    "anjir", "brengsek", "ngentot", "ngewe", "pelacur", "jablay",
    "sundal", "kepala batu", "monyet", "celeng", "kurang ajar",
    "goblog", "sinting", "edan", "gila", "dasar",
]

# Kata-kata yang ambigu/sering false-positive (konteks penting)
KATA_MERAGUKAN = [
    "bego", "males", "malas", "payah", "lemot", "mati", "bunuh",
    "sebel", "kesel", "stress", "stres", "capek", "lelah",
]


def predict(text: str) -> dict:
    """
    Mengklasifikasikan teks ke dalam tiga kategori:
      PANTAS, MERAGUKAN, atau TIDAK PANTAS.

    Returns:
        dict: {
            "label": str,           # "PANTAS" | "MERAGUKAN" | "TIDAK PANTAS"
            "confidence": float,    # float 0.0-1.0
            "prob_pantas": float,
            "prob_meragukan": float,
            "prob_tidak_pantas": float,
        }
    """
    if not text or not text.strip():
        return {
            "label": "PANTAS",
            "confidence": 0.99,
            "prob_pantas": 0.99,
            "prob_meragukan": 0.005,
            "prob_tidak_pantas": 0.005,
        }

    text_lower = text.lower()

    for kata in KATA_TIDAK_PANTAS:
        if kata in text_lower:
            return {
                "label": "TIDAK PANTAS",
                "confidence": 0.95,
                "prob_pantas": 0.03,
                "prob_meragukan": 0.02,
                "prob_tidak_pantas": 0.95,
            }

    for kata in KATA_MERAGUKAN:
        if kata in text_lower:
            return {
                "label": "MERAGUKAN",
                "confidence": 0.65,
                "prob_pantas": 0.20,
                "prob_meragukan": 0.65,
                "prob_tidak_pantas": 0.15,
            }

    return {
        "label": "PANTAS",
        "confidence": 0.98,
        "prob_pantas": 0.98,
        "prob_meragukan": 0.01,
        "prob_tidak_pantas": 0.01,
    }


if __name__ == "__main__":
    test_cases = [
        "Halo semuanya, bagaimana kabar kalian?",
        "Anjing banget sih lo!",
        "Diskusi ini sangat menarik dan informatif.",
        "Dasar bodoh, tidak tahu apa-apa.",
        "Terima kasih atas penjelasannya yang sangat jelas.",
        "males banget ngerjain tugasnya",
        "",
    ]

    print("=== Test Classifier ===\n")
    for text in test_cases:
        result = predict(text)
        print(f"Input         : {repr(text)}")
        print(f"Label         : {result['label']}")
        print(f"Confidence    : {result['confidence']}")
        print(f"prob_pantas   : {result['prob_pantas']}")
        print(f"prob_meragukan: {result['prob_meragukan']}")
        print(f"prob_tidak    : {result['prob_tidak_pantas']}")
        print("-" * 50)

