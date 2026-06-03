import React from "react"
import { useEffect, useState } from 'react'
import { getRooms } from '../services/api'

const ROOM_META = {
  'forum-umum':     { icon:'🏛', color:'#eff6ff', iconBg:'linear-gradient(135deg,#1d4ed8,#4338ca)' },
  'forum-tugas':    { icon:'📚', color:'#f0fdf4', iconBg:'linear-gradient(135deg,#15803d,#16a34a)' },
  'forum-aishield': { icon:'🛡', color:'#fffbeb', iconBg:'linear-gradient(135deg,#d97706,#f59e0b)' },
  'forum-tanya':    { icon:'💡', color:'#faf5ff', iconBg:'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
}
const DEFAULT_ROOMS = [
  { id:'forum-umum',     name:'Forum Umum',           desc:'Diskusi akademik umum & pengumuman kampus', online:12 },
  { id:'forum-tugas',    name:'Forum Tugas & Proyek',  desc:'Kolaborasi tugas, capstone, dan proyek kelompok', online:8 },
  { id:'forum-aishield', name:'Forum AI SHIELD',       desc:'Demo sistem moderasi AI secara langsung', online:5 },
  { id:'forum-tanya',    name:'Tanya Jawab Akademik',  desc:'Pertanyaan kuliah, ujian, dan materi perkuliahan', online:3 },
]

export default function RoomList({ username, onJoinRoom, onAdmin, onLogout }) {
  const [rooms, setRooms] = useState(DEFAULT_ROOMS)

  useEffect(() => {
    getRooms().then(r => { if (r.data?.length) setRooms(r.data) }).catch(() => {})
  }, [])

  const totalOnline = rooms.reduce((a, r) => a + (r.online || 0), 0)

  return (
    <div className="rooms-page">
      <div className="rooms-header">
        <div className="brand">
          <div className="brand-icon">🛡</div>
          <div className="brand-name">AI <span>SHIELD</span></div>
        </div>
        <div className="header-actions">
          <div className="user-pill">
            <div className="user-pill-avatar">{username.slice(0,2).toUpperCase()}</div>
            <span className="user-pill-name">{username}</span>
          </div>
          <button className="btn-sm accent" onClick={onAdmin}>⚙ Admin</button>
          <button className="btn-sm" onClick={onLogout}>Keluar</button>
        </div>
      </div>

      <div className="rooms-body">
        <div className="rooms-welcome">
          <h2>Halo, {username}! 👋</h2>
          <p>Pilih ruang diskusi yang ingin Anda masuki. Semua percakapan dimoderasi AI secara otomatis.</p>
        </div>

        <div className="stats-mini-grid">
          <div className="stat-mini">
            <div className="stat-mini-icon">🏛</div>
            <div className="stat-mini-val">{rooms.length}</div>
            <div className="stat-mini-lbl">Room Tersedia</div>
          </div>
          <div className="stat-mini">
            <div className="stat-mini-icon">🟢</div>
            <div className="stat-mini-val" style={{ color:'var(--green)' }}>{totalOnline}</div>
            <div className="stat-mini-lbl">Pengguna Online</div>
          </div>
          <div className="stat-mini">
            <div className="stat-mini-icon">🤖</div>
            <div className="stat-mini-val" style={{ color:'var(--gold-dk)' }}>Aktif</div>
            <div className="stat-mini-lbl">Status AI Moderasi</div>
          </div>
        </div>

        <div className="section-label">Pilih Room Diskusi</div>
        <div className="rooms-grid">
          {rooms.map((room, i) => {
            const meta = ROOM_META[room.id] || ROOM_META['forum-umum']
            return (
              <div
                key={room.id}
                className="room-card"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => onJoinRoom({ ...room, ...meta })}
              >
                <div className="room-icon-wrap" style={{ background: meta.iconBg }}>
                  {meta.icon}
                </div>
                <div className="room-info">
                  <div className="room-name">{room.name}</div>
                  <div className="room-desc">{room.desc}</div>
                </div>
                <div className="room-right">
                  <div className="online-badge">
                    <span className="online-dot" />
                    {room.online || 0} online
                  </div>
                  <span className="room-arrow">›</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

