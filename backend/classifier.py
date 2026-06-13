"""
Keyword-based classifier sebagai placeholder sebelum model IndoBERT selesai di-fine-tune.
Interface-nya identik dengan model asli: predict(text) -> {label, confidence}
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


def predict(text: str) -> dict:
    """
    Mengklasifikasikan teks ke dalam dua kategori: PANTAS atau TIDAK PANTAS.

    Returns:
        dict: {"label": str, "confidence": float}
    """
    if not text or not text.strip():
        return {"label": "PANTAS", "confidence": 0.99}

    text_lower = text.lower()

    for kata in KATA_TIDAK_PANTAS:
        if kata in text_lower:
            return {"label": "TIDAK PANTAS", "confidence": 0.95}

    return {"label": "PANTAS", "confidence": 0.98}


if __name__ == "__main__":
    test_cases = [
        "Halo semuanya, bagaimana kabar kalian?",
        "Anjing banget sih lo!",
        "Diskusi ini sangat menarik dan informatif.",
        "Dasar bodoh, tidak tahu apa-apa.",
        "Terima kasih atas penjelasannya yang sangat jelas.",
        "",
    ]

    print("=== Test Classifier ===\n")
    for text in test_cases:
        result = predict(text)
        print(f"Input    : {repr(text)}")
        print(f"Label    : {result['label']}")
        print(f"Confidence: {result['confidence']}")
        print("-" * 50)
