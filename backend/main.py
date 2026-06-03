import os
import json
import sqlite3
from datetime import datetime
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from classifier import predict

app = FastAPI(title="AI SHIELD API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOTIFIKASI_EDUKATIF = (
    "Pesanmu telah disembunyikan karena mengandung bahasa yang tidak sesuai "
    "standar komunikasi akademik. Coba sampaikan kembali dengan pilihan kata yang lebih tepat."
)

ROOMS = [
    {"id": "forum-umum",     "name": "Forum Umum",           "desc": "Diskusi akademik umum & pengumuman kampus",        "icon": "🏛"},
    {"id": "forum-tugas",    "name": "Forum Tugas & Proyek",  "desc": "Kolaborasi tugas, capstone, dan proyek kelompok",  "icon": "📚"},
    {"id": "forum-aishield", "name": "Forum AI SHIELD",       "desc": "Demo sistem moderasi AI secara langsung",          "icon": "🛡"},
    {"id": "forum-tanya",    "name": "Tanya Jawab Akademik",  "desc": "Pertanyaan kuliah, ujian, dan materi perkuliahan", "icon": "💡"},
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL, username TEXT NOT NULL,
            text TEXT NOT NULL, confidence REAL NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL, username TEXT NOT NULL,
            text TEXT NOT NULL, confidence REAL NOT NULL,
            reviewed INTEGER DEFAULT 0, created_at TEXT NOT NULL
        );
    """)
    conn.commit(); conn.close()

init_db()

class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}
    async def connect(self, websocket, room_id, username):
        await websocket.accept()
        if room_id not in self.rooms: self.rooms[room_id] = {}
        self.rooms[room_id][username] = websocket
    def disconnect(self, room_id, username):
        if room_id in self.rooms: self.rooms[room_id].pop(username, None)
    def get_online_count(self, room_id):
        return len(self.rooms.get(room_id, {}))
    async def send_to(self, room_id, username, data):
        ws = self.rooms.get(room_id, {}).get(username)
        if ws: await ws.send_text(json.dumps(data, ensure_ascii=False))
    async def broadcast(self, room_id, data, exclude=None):
        for uname, ws in self.rooms.get(room_id, {}).items():
            if uname != exclude:
                await ws.send_text(json.dumps(data, ensure_ascii=False))

manager = ConnectionManager()

@app.get("/api/rooms")
def get_rooms():
    return [{**r, "online": manager.get_online_count(r["id"])} for r in ROOMS]

@app.get("/api/messages/{room_id}")
def get_messages(room_id: str):
    conn = get_db()
    rows = conn.execute("SELECT * FROM messages WHERE room_id=? ORDER BY id ASC LIMIT 100",(room_id,)).fetchall()
    conn.close(); return [dict(r) for r in rows]

@app.get("/api/admin/violations")
def get_violations():
    conn = get_db()
    rows = conn.execute("SELECT * FROM violations ORDER BY id DESC LIMIT 200").fetchall()
    conn.close(); return [dict(r) for r in rows]

@app.delete("/api/admin/reset")
def reset_all():
    conn = get_db()
    conn.execute("DELETE FROM messages"); conn.execute("DELETE FROM violations")
    conn.commit(); conn.close()
    return {"message": "Semua data berhasil dihapus"}

@app.get("/api/admin/stats")
def get_stats():
    conn = get_db()
    p = conn.execute("SELECT COUNT(*) as c FROM messages").fetchone()["c"]
    v = conn.execute("SELECT COUNT(*) as c FROM violations").fetchone()["c"]
    conn.close()
    total = p + v
    return {"total_messages": total, "pantas": p, "tidak_pantas": v,
            "moderation_rate": round(v/total*100,1) if total > 0 else 0}

@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):
    await manager.connect(websocket, room_id, username)
    await manager.broadcast(room_id, {"type":"system","text":f"{username} telah bergabung ke room"}, exclude=username)
    try:
        while True:
            raw = await websocket.receive_text()
            payload = json.loads(raw)
            if payload.get("type") != "message": continue
            text = payload.get("text","").strip()
            if not text: continue
            result = predict(text)
            label, confidence = result["label"], result["confidence"]
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            conn = get_db()
            if label == "PANTAS":
                conn.execute("INSERT INTO messages (room_id,username,text,confidence,created_at) VALUES (?,?,?,?,?)",
                             (room_id,username,text,confidence,now))
                msg_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                conn.commit(); conn.close()
                await manager.broadcast(room_id,{"type":"message","id":msg_id,"username":username,"text":text,"timestamp":now})
            else:
                conn.execute("INSERT INTO violations (room_id,username,text,confidence,created_at) VALUES (?,?,?,?,?)",
                             (room_id,username,text,confidence,now))
                conn.commit(); conn.close()
                await manager.send_to(room_id,username,{"type":"moderation","text":NOTIFIKASI_EDUKATIF})
    except WebSocketDisconnect:
        manager.disconnect(room_id, username)
        await manager.broadcast(room_id,{"type":"system","text":f"{username} telah meninggalkan room"})
