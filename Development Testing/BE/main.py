import importlib.util
import os
import sys
import json
import sqlite3
import hashlib
import secrets
from datetime import datetime
from typing import Dict, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

load_dotenv()

CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
ADMIN_PASS  = os.getenv("ADMIN_PASSWORD", "admin123")

def load_classifier():
    """
    Cari inference.py dari AI Engineer (prioritas 1),
    fallback ke classifier.py placeholder (prioritas 2).
    """
    base = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base, "..", "AI", "inference.py"),
        os.path.join(base, "..", "Development Testing", "AI", "inference.py"),
        os.path.join(base, "..", "AI", "classifier.py"),
        os.path.join(base, "..", "Development Testing", "AI", "classifier.py"),
        # Fallback terakhir: classifier.py di folder yang sama dengan main.py
        os.path.join(base, "classifier.py"),
    ]
    for path in candidates:
        norm = os.path.normpath(path)
        if os.path.exists(norm):
            spec = importlib.util.spec_from_file_location("classifier", norm)
            mod  = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            print(f"[AI SHIELD] Classifier loaded: {norm}")
            return mod.predict
    raise FileNotFoundError(
        "Tidak ada classifier yang ditemukan. "
        "Pastikan inference.py atau classifier.py ada di folder AI/"
    )

predict = load_classifier()

def sanitize(text: str) -> str:
    """Strip whitespace; di masa depan bisa tambah HTML-escape dll."""
    return text.strip() if text else ""

def classify_with_context(text: str) -> dict:
    """
    Wrapper tipis untuk predict() dari classifier.py v3 (Ammie).
    classifier.py sudah menangani logika 3-label secara internal:
      - PANTAS       : teks aman
      - MERAGUKAN    : plesetan, kata kasar dalam konteks pujian, bahasa daerah tidak dikenal
      - TIDAK PANTAS : ujaran kebencian jelas
    BE cukup percaya hasil dari classifier.py tanpa logika threshold tambahan.
    """
    result = predict(text)
    return {
        "label":             result["label"],        # "PANTAS" | "MERAGUKAN" | "TIDAK PANTAS"
        "confidence":        result["confidence"],   # float 0.0-1.0
        "prob_pantas":       result.get("prob_pantas", 0.0),
        "prob_meragukan":    result.get("prob_meragukan", 0.0),
        "prob_tidak_pantas": result.get("prob_tidak_pantas", 0.0),
    }

app = FastAPI(title="AI SHIELD API", version="1.0.0")

# CORS — izinkan juga localhost:5174 dan localhost:3000 untuk fleksibilitas dev
allowed_origins = [CORS_ORIGIN, "http://localhost:5174", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOTIFIKASI_EDUKATIF = (
    "Pesanmu telah disembunyikan karena mengandung bahasa yang tidak sesuai "
    "standar komunikasi akademik. Coba sampaikan kembali dengan pilihan kata yang lebih tepat."
)

ROOMS = [
    {"id": "forum-umum",     "name": "Forum Umum",           "desc": "Diskusi akademik umum & pengumuman kampus",       "icon": "🏛"},
    {"id": "forum-tugas",    "name": "Forum Tugas & Proyek",  "desc": "Kolaborasi tugas, capstone, dan proyek kelompok", "icon": "📚"},
    {"id": "forum-aishield", "name": "Forum AI SHIELD",       "desc": "Demo sistem moderasi AI secara langsung",         "icon": "🛡"},
    {"id": "forum-tanya",    "name": "Tanya Jawab Akademik",  "desc": "Pertanyaan kuliah, ujian, dan materi perkuliahan","icon": "💡"},
    {"id": "forum-riset",    "name": "Forum Riset & Inovasi", "desc": "Diskusi penelitian, jurnal, dan inovasi teknologi","icon": "🔬"},
    {"id": "forum-karir",    "name": "Forum Karir & Magang",  "desc": "Info lowongan, tips karir, dan peluang magang",   "icon": "💼"},
]

DB_PATH = os.path.join(os.path.dirname(__file__), "aishield.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS messages (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id    TEXT    NOT NULL,
            username   TEXT    NOT NULL,
            text       TEXT    NOT NULL,
            confidence REAL    NOT NULL,
            created_at TEXT    NOT NULL
        );
        CREATE TABLE IF NOT EXISTS violations (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id    TEXT    NOT NULL,
            username   TEXT    NOT NULL,
            text       TEXT    NOT NULL,
            confidence REAL    NOT NULL,
            label      TEXT    DEFAULT 'TIDAK PANTAS',
            reviewed   INTEGER DEFAULT 0,
            can_review INTEGER DEFAULT 0,
            created_at TEXT    NOT NULL
        );
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT    NOT NULL UNIQUE,
            email      TEXT    NOT NULL UNIQUE,
            password   TEXT    NOT NULL,
            created_at TEXT    NOT NULL
        );
    """)
    conn.commit()
    # Migrasi untuk database lama yang belum punya kolom baru
    for migration in [
        "ALTER TABLE violations ADD COLUMN can_review INTEGER DEFAULT 0",
        "ALTER TABLE violations ADD COLUMN label TEXT DEFAULT 'TIDAK PANTAS'",
    ]:
        try:
            conn.execute(migration)
            conn.commit()
        except Exception:
            pass  # kolom sudah ada
    conn.close()
    print("[AI SHIELD] Database initialized.")

init_db()

class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, username: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        self.rooms[room_id][username] = websocket

    def disconnect(self, room_id: str, username: str):
        if room_id in self.rooms:
            self.rooms[room_id].pop(username, None)

    def get_online_count(self, room_id: str) -> int:
        return len(self.rooms.get(room_id, {}))

    async def send_to(self, room_id: str, username: str, data: dict):
        ws = self.rooms.get(room_id, {}).get(username)
        if ws:
            try:
                await ws.send_text(json.dumps(data, ensure_ascii=False))
            except Exception:
                pass  # koneksi sudah tertutup

    async def broadcast(self, room_id: str, data: dict, exclude: Optional[str] = None):
        dead = []
        for uname, ws in list(self.rooms.get(room_id, {}).items()):
            if uname != exclude:
                try:
                    await ws.send_text(json.dumps(data, ensure_ascii=False))
                except Exception:
                    dead.append(uname)
        # Bersihkan koneksi mati
        for uname in dead:
            self.rooms.get(room_id, {}).pop(uname, None)

manager = ConnectionManager()

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "app": "AI SHIELD API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ── Rooms ─────────────────────────────────────────────────────────────────────
@app.get("/api/rooms")
def get_rooms():
    return [{**r, "online": manager.get_online_count(r["id"])} for r in ROOMS]

# ── Messages ──────────────────────────────────────────────────────────────────
@app.get("/api/messages/{room_id}")
def get_messages(room_id: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM messages WHERE room_id=? ORDER BY id ASC LIMIT 100",
        (room_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

class MessageRequest(BaseModel):
    room_id: str
    username: str
    text: str

class RegisterRequest(BaseModel):
    username: str
    email:    str
    password: str

class LoginRequest(BaseModel):
    email:    str
    password: str

# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/api/auth/register")
def register(req: RegisterRequest):
    # Validasi input
    if not req.username or len(req.username) < 3:
        raise HTTPException(status_code=400, detail="Username minimal 3 karakter")
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Format email tidak valid")
    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter")

    hashed = pwd_context.hash(req.password)
    now    = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn   = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, email, password, created_at) VALUES (?,?,?,?)",
            (req.username.strip(), req.email.strip().lower(), hashed, now)
        )
        conn.commit()
        conn.close()
        return {"success": True, "message": "Registrasi berhasil", "username": req.username}
    except sqlite3.IntegrityError as e:
        conn.close()
        if "username" in str(e):
            raise HTTPException(status_code=409, detail="Username sudah digunakan")
        if "email" in str(e):
            raise HTTPException(status_code=409, detail="Email sudah terdaftar")
        raise HTTPException(status_code=409, detail="Data sudah terdaftar")

@app.post("/api/auth/login")
def login(req: LoginRequest):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email dan password wajib diisi")

    conn = get_db()
    row  = conn.execute(
        "SELECT * FROM users WHERE email=?",
        (req.email.strip().lower(),)
    ).fetchone()
    conn.close()

    if not row or not pwd_context.verify(req.password, row["password"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    return {
        "success":  True,
        "username": row["username"],
        "email":    row["email"],
        "user_id":  row["id"],
    }

class ChangePasswordRequest(BaseModel):
    email: str
    old_password: str
    new_password: str

@app.patch("/api/auth/change-password")
def change_password(req: ChangePasswordRequest):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password baru minimal 6 karakter")
    conn = get_db()
    row  = conn.execute("SELECT * FROM users WHERE email=?", (req.email.strip().lower(),)).fetchone()
    if not row or not pwd_context.verify(req.old_password, row["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Password lama salah")
    hashed = pwd_context.hash(req.new_password)
    conn.execute("UPDATE users SET password=? WHERE email=?", (hashed, req.email.strip().lower()))
    conn.commit(); conn.close()
    return {"success": True, "message": "Password berhasil diubah"}

@app.get("/api/auth/check-username/{username}")
def check_username(username: str):
    conn = get_db()
    row  = conn.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()
    conn.close()
    return {"available": row is None}

@app.post("/api/messages")
def post_message(req: MessageRequest):
    text = sanitize(req.text)
    if not text:
        raise HTTPException(status_code=400, detail="Pesan tidak boleh kosong")
    result     = classify_with_context(text)
    label      = result["label"]
    confidence = result["confidence"]
    now        = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn       = get_db()

    if label == "PANTAS":
        conn.execute(
            "INSERT INTO messages (room_id,username,text,confidence,created_at) VALUES (?,?,?,?,?)",
            (req.room_id, req.username, text, confidence, now)
        )
        conn.commit(); conn.close()
        return {
            "status":     "PANTAS",
            "confidence": round(confidence, 3),
            "probabilities": {
                "pantas":       round(result["prob_pantas"], 3),
                "meragukan":    round(result["prob_meragukan"], 3),
                "tidak_pantas": round(result["prob_tidak_pantas"], 3),
            },
        }

    elif label == "MERAGUKAN":
        conn.execute(
            "INSERT INTO violations (room_id,username,text,confidence,label,can_review,created_at) VALUES (?,?,?,?,?,?,?)",
            (req.room_id, req.username, text, confidence, "MERAGUKAN", 1, now)
        )
        conn.commit(); conn.close()
        return {
            "status":     "MERAGUKAN",
            "confidence": round(confidence, 3),
            "probabilities": {
                "pantas":       round(result["prob_pantas"], 3),
                "meragukan":    round(result["prob_meragukan"], 3),
                "tidak_pantas": round(result["prob_tidak_pantas"], 3),
            },
            "notifikasi": (
                "Pesanmu perlu ditinjau lebih lanjut. Sistem mendeteksi kemungkinan "
                "bahasa yang tidak sesuai, namun belum dapat memastikannya. "
                "Admin akan memeriksa pesanmu."
            ),
        }

    else:  # TIDAK PANTAS
        conn.execute(
            "INSERT INTO violations (room_id,username,text,confidence,label,can_review,created_at) VALUES (?,?,?,?,?,?,?)",
            (req.room_id, req.username, text, confidence, "TIDAK PANTAS", 0, now)
        )
        conn.commit(); conn.close()
        return {
            "status":     "TIDAK PANTAS",
            "confidence": round(confidence, 3),
            "probabilities": {
                "pantas":       round(result["prob_pantas"], 3),
                "meragukan":    round(result["prob_meragukan"], 3),
                "tidak_pantas": round(result["prob_tidak_pantas"], 3),
            },
            "notifikasi": NOTIFIKASI_EDUKATIF,
        }

# ── Admin ──────────────────────────────────────────────────────────────────────
@app.get("/api/admin/violations")
def get_violations(room_id: Optional[str] = None):
    conn = get_db()
    if room_id:
        rows = conn.execute(
            "SELECT * FROM violations WHERE room_id=? ORDER BY id DESC LIMIT 200", (room_id,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM violations ORDER BY id DESC LIMIT 200").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.delete("/api/admin/violations/{violation_id}")
def delete_violation(violation_id: int):
    conn = get_db()
    conn.execute("DELETE FROM violations WHERE id = ?", (violation_id,))
    conn.commit(); conn.close()
    return {"success": True}

@app.delete("/api/admin/reset")
def reset_all():
    conn = get_db()
    conn.execute("DELETE FROM messages")
    conn.execute("DELETE FROM violations")
    conn.commit(); conn.close()
    return {"message": "Semua data berhasil dihapus"}

@app.post("/api/admin/verify")
def verify_admin(body: dict = Body(...)):
    if body.get("password") == ADMIN_PASS:
        return {"success": True}
    return {"success": False}

@app.get("/api/admin/users")
def get_users():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, username, email, created_at FROM users ORDER BY id DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db()
    row = conn.execute("SELECT id FROM users WHERE id=?", (user_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    conn.execute("DELETE FROM users WHERE id=?", (user_id,))
    conn.commit(); conn.close()
    return {"success": True}


class ReviewRequest(BaseModel):
    decision: str  # "approve" | "reject"

@app.patch("/api/admin/violations/{violation_id}/review")
async def review_violation(violation_id: int, req: ReviewRequest):
    if req.decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="decision harus 'approve' atau 'reject'")
    
    conn = get_db()
    row  = conn.execute("SELECT * FROM violations WHERE id=?", (violation_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Pelanggaran tidak ditemukan")
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if req.decision == "approve":
        # Pindahkan pesan dari violations ke messages agar tampil di chat
        conn.execute(
            "INSERT INTO messages (room_id,username,text,confidence,created_at) VALUES (?,?,?,?,?)",
            (row["room_id"], row["username"], row["text"], row["confidence"], now)
        )
        msg_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.execute("DELETE FROM violations WHERE id=?", (violation_id,))
        conn.commit()
        conn.close()
        
        # Kirim pesan ke semua user di room via WebSocket
        await manager.broadcast(row["room_id"], {
            "type":      "message",
            "id":        msg_id,
            "username":  row["username"],
            "text":      row["text"],
            "timestamp": now,
        })
        # Kirim notifikasi ke pengirim bahwa pesannya disetujui
        await manager.send_to(row["room_id"], row["username"], {
            "type":   "system",
            "text":   "✅ Pesanmu telah ditinjau dan disetujui oleh admin. Pesan kini tampil di room.",
        })
    else:
        # Tolak: tandai reviewed=1 dan label DITOLAK
        conn.execute(
            "UPDATE violations SET reviewed=1, label='DITOLAK' WHERE id=?",
            (violation_id,)
        )
        conn.commit()
        conn.close()
        
        # Kirim notifikasi penolakan ke pengirim via WebSocket
        await manager.send_to(row["room_id"], row["username"], {
            "type":   "moderation",
            "status": "TIDAK PANTAS",
            "text":   "Pesanmu telah ditinjau oleh admin dan dinyatakan tidak sesuai standar komunikasi akademik. Coba sampaikan kembali dengan pilihan kata yang lebih tepat.",
        })
    
    return {"success": True, "decision": req.decision}


@app.patch("/api/violations/{violation_id}/request-review")
def request_review(violation_id: int):
    """User meminta admin untuk me-review pesan MERAGUKAN mereka."""
    conn = get_db()
    row  = conn.execute("SELECT * FROM violations WHERE id=?", (violation_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Pelanggaran tidak ditemukan")
    conn.execute(
        "UPDATE violations SET can_review=1 WHERE id=?",
        (violation_id,)
    )
    conn.commit(); conn.close()
    return {"success": True, "message": "Permintaan review terkirim ke admin"}


@app.get("/api/admin/stats")
def get_stats():
    conn  = get_db()
    p     = conn.execute("SELECT COUNT(*) as c FROM messages").fetchone()["c"]
    v     = conn.execute("SELECT COUNT(*) as c FROM violations WHERE label='TIDAK PANTAS'").fetchone()["c"]
    m     = conn.execute("SELECT COUNT(*) as c FROM violations WHERE label='MERAGUKAN'").fetchone()["c"]
    per_room = []
    for r in ROOMS:
        pm  = conn.execute("SELECT COUNT(*) as c FROM messages WHERE room_id=?", (r["id"],)).fetchone()["c"]
        pv  = conn.execute("SELECT COUNT(*) as c FROM violations WHERE room_id=? AND label='TIDAK PANTAS'", (r["id"],)).fetchone()["c"]
        pmr = conn.execute("SELECT COUNT(*) as c FROM violations WHERE room_id=? AND label='MERAGUKAN'", (r["id"],)).fetchone()["c"]
        per_room.append({
            "room_id": r["id"], "name": r["name"],
            "pantas": pm, "tidak_pantas": pv, "meragukan": pmr
        })
    conn.close()
    total = p + v + m
    return {
        "total_messages":  total,
        "pantas":          p,
        "tidak_pantas":    v,
        "meragukan":       m,
        "moderation_rate": round((v + m) / total * 100, 1) if total > 0 else 0,
        "per_room":        per_room,
    }

@app.post("/api/flag")
def flag_message(body: dict = Body(...)):
    conn = get_db()
    now  = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute(
        "INSERT INTO violations (room_id,username,text,confidence,label,can_review,created_at) VALUES (?,?,?,?,?,?,?)",
        (body.get("room_id",""), body.get("reporter",""),
         f"[DILAPORKAN] {body.get('text','')}", 0.5, "DILAPORKAN", 1, now)
    )
    conn.commit(); conn.close()
    return {"success": True}

# ── WebSocket ──────────────────────────────────────────────────────────────────
@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):
    # Validasi room_id
    valid_ids = {r["id"] for r in ROOMS}
    if room_id not in valid_ids:
        await websocket.close(code=4004)
        return

    await manager.connect(websocket, room_id, username)
    await manager.broadcast(
        room_id,
        {"type": "system", "text": f"{username} telah bergabung ke room"},
        exclude=username
    )
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if payload.get("type") != "message":
                continue
            text = sanitize(payload.get("text", ""))
            if not text:
                continue

            result     = classify_with_context(text)
            label      = result["label"]
            confidence = result["confidence"]
            now        = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            conn       = get_db()

            if label == "PANTAS":
                conn.execute(
                    "INSERT INTO messages (room_id,username,text,confidence,created_at) VALUES (?,?,?,?,?)",
                    (room_id, username, text, confidence, now)
                )
                msg_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                conn.commit(); conn.close()
                await manager.broadcast(room_id, {
                    "type":      "message",
                    "id":        msg_id,
                    "username":  username,
                    "text":      text,
                    "timestamp": now,
                    "probabilities": {
                        "pantas":       round(result["prob_pantas"], 3),
                        "meragukan":    round(result["prob_meragukan"], 3),
                        "tidak_pantas": round(result["prob_tidak_pantas"], 3),
                    },
                })

            elif label == "MERAGUKAN":
                conn.execute(
                    "INSERT INTO violations (room_id,username,text,confidence,label,can_review,created_at) VALUES (?,?,?,?,?,?,?)",
                    (room_id, username, text, confidence, "MERAGUKAN", 1, now)
                )
                violation_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                conn.commit(); conn.close()
                await manager.send_to(room_id, username, {
                    "type":         "moderation",
                    "status":       "MERAGUKAN",
                    "violation_id": violation_id,
                    "text": (
                        "Pesanmu perlu ditinjau lebih lanjut. Sistem mendeteksi kemungkinan "
                        "bahasa yang tidak sesuai, namun belum dapat memastikannya. "
                        "Admin akan memeriksa pesanmu."
                    ),
                    "can_review": True,
                    "confidence": round(confidence, 3),
                    "probabilities": {
                        "pantas":       round(result["prob_pantas"], 3),
                        "meragukan":    round(result["prob_meragukan"], 3),
                        "tidak_pantas": round(result["prob_tidak_pantas"], 3),
                    },
                })

            else:  # TIDAK PANTAS
                conn.execute(
                    "INSERT INTO violations (room_id,username,text,confidence,label,can_review,created_at) VALUES (?,?,?,?,?,?,?)",
                    (room_id, username, text, confidence, "TIDAK PANTAS", 0, now)
                )
                conn.commit(); conn.close()
                await manager.send_to(room_id, username, {
                    "type":       "moderation",
                    "status":     "TIDAK PANTAS",
                    "text":       NOTIFIKASI_EDUKATIF,
                    "can_review": False,
                    "confidence": round(confidence, 3),
                    "probabilities": {
                        "pantas":       round(result["prob_pantas"], 3),
                        "meragukan":    round(result["prob_meragukan"], 3),
                        "tidak_pantas": round(result["prob_tidak_pantas"], 3),
                    },
                })
    except WebSocketDisconnect:
        manager.disconnect(room_id, username)
        await manager.broadcast(
            room_id,
            {"type": "system", "text": f"{username} telah meninggalkan room"}
        )
    except Exception as e:
        print(f"[WS ERROR] {room_id}/{username}: {e}")
        manager.disconnect(room_id, username)
