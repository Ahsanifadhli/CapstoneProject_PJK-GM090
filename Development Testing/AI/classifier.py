"""
Keyword-based classifier sebagai placeholder sebelum model IndoBERT.
Interface identik dengan model asli: predict(text) -> {label, confidence}
"""

KATA_BERAT = [
    "anjing", "babi", "bangsat", "kontol", "memek", "ngentot", "ngewe",
    "pelacur", "jablay", "sundal", "puki", "kimak", "jancok", "dancok",
]

KATA_SEDANG = [
    "tolol", "idiot", "bodoh", "goblok", "sialan", "keparat", "bajingan",
    "asu", "cok", "kampret", "tai", "tahi", "brengsek", "monyet",
    "celeng", "kurang ajar", "anjir", "kepala batu",
]

def predict(text: str) -> dict:
    """
    Klasifikasi teks: PANTAS atau TIDAK PANTAS.
    Confidence bervariasi berdasarkan berat dan jumlah kata kasar.

    Returns:
        dict: {"label": str, "confidence": float}
    """
    text_lower = text.lower()
    
    berat_count  = sum(1 for k in KATA_BERAT  if k in text_lower)
    sedang_count = sum(1 for k in KATA_SEDANG if k in text_lower)
    total_kasar  = berat_count + sedang_count

    if total_kasar == 0:
        # PANTAS — confidence tinggi tapi sedikit bervariasi
        base = 0.96
        # Turunkan sedikit untuk teks sangat pendek (mungkin tidak kontekstual)
        if len(text.split()) < 3:
            base = 0.88
        return {"label": "PANTAS", "confidence": round(base, 2)}

    # Hitung confidence berdasarkan berat kata dan frekuensi
    if berat_count >= 2:
        confidence = 0.97
    elif berat_count == 1:
        confidence = 0.93 if sedang_count == 0 else 0.96
    elif sedang_count >= 3:
        confidence = 0.91
    elif sedang_count == 2:
        confidence = 0.85
    else:
        # 1 kata sedang — ambiguous, confidence lebih rendah
        confidence = 0.78

    return {"label": "TIDAK PANTAS", "confidence": round(confidence, 2)}


if __name__ == "__main__":
    tests = [
        "Halo semuanya, bagaimana kabar kalian?",
        "Anjing banget sih lo!",
        "ok",
        "Dasar bodoh, tidak tahu apa-apa.",
        "jancok babi tolol semua!",
        "sialan dikit, tapi masih oke lah",
        "Terima kasih atas penjelasannya yang sangat jelas.",
    ]
    print("=== Test Classifier ===\n")
    for t in tests:
        r = predict(t)
        print(f"Input     : {t}")
        print(f"Label     : {r['label']} ({r['confidence']*100:.0f}%)")
        print("-" * 50)
