import React from "react"
import { useEffect, useRef, useState } from 'react'
import { getMessages, createWebSocket } from '../services/api'
import ChatBubble from '../components/ChatBubble'
import ChatInput  from '../components/ChatInput'

export default function ChatRoom({ username, room, onBack, onAdmin }) {
  const [messages, setMessages] = useState([])
  const [wsReady,  setWsReady]  = useState(false)
  const [beError,  setBeError]  = useState(false)
  const wsRef     = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    getMessages(room.id)
      .then(r => {
        setMessages(r.data.map(m => ({
          id: m.id, type: 'message', username: m.username,
          text: m.text, timestamp: m.created_at, self: m.username === username,
        })))
        setBeError(false)
      })
      .catch(() => setBeError(true))

    const ws = createWebSocket(room.id, username)
    wsRef.current = ws
    ws.onopen    = () => { setWsReady(true); setBeError(false) }
    ws.onerror   = () => setBeError(true)
    ws.onclose   = () => setWsReady(false)
    ws.onmessage = e => {
      const d = JSON.parse(e.data)
      if (d.type === 'message')
        setMessages(p => [...p, { id:d.id, type:'message', username:d.username, text:d.text, timestamp:d.timestamp, self:d.username===username }])
      if (d.type === 'moderation' || d.type === 'system')
        setMessages(p => [...p, { id:Date.now(), type:d.type, text:d.text }])
    }
    return () => ws.close()
  }, [room.id, username])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = text => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type:'message', text }))
  }

  const sdot  = beError ? 'err' : wsReady ? 'ok' : 'wait'
  const stext = beError ? '⚠ Backend tidak terhubung — jalankan server BE' : wsReady ? `Terhubung sebagai ${username}` : 'Menghubungkan...'

  return (
    <div className="chat-layout">
      <div className="chat-topbar">
        <button className="back-btn" onClick={onBack} title="Kembali">‹</button>
        <div className="room-chip" style={{ background: room.iconBg || 'linear-gradient(135deg,#1d4ed8,#4338ca)' }}>
          {room.icon || '💬'}
        </div>
        <div className="topbar-info">
          <div className="topbar-name">{room.name}</div>
          <div className="topbar-status">
            <span className={`sdot ${sdot}`} />
            <span className={`stext ${sdot}`}>{stext}</span>
          </div>
        </div>
        <button className="btn-sm accent" onClick={onAdmin}>⚙ Admin</button>
      </div>

      {beError && (
        <div className="error-bar">
          <span>⚠</span>
          <span>Backend belum berjalan. Masuk ke folder <code>BE/</code> lalu jalankan: <code>uvicorn main:app --reload --port 8000</code></span>
        </div>
      )}

      <div className="messages">
        <div className="sys-msg">🛡 Semua pesan dimoderasi secara real-time oleh AI SHIELD</div>
        <div className="date-sep">Hari ini</div>
        {messages.length === 0 && !beError && (
          <div className="sys-msg" style={{ marginTop:16 }}>Belum ada pesan · Jadilah yang pertama! 👋</div>
        )}
        {messages.map(m => <ChatBubble key={m.id} message={m} />)}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={send} disabled={!wsReady} />
    </div>
  )
}

