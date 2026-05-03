import { useEffect, useRef, useState } from 'react'
import { getMessages, createWebSocket } from '../services/api'
import ChatBubble from '../components/ChatBubble'
import ChatInput from '../components/ChatInput'

export default function ChatRoom({ username, room, onBack, onAdmin }) {
  const [messages, setMessages] = useState([])
  const [wsReady, setWsReady] = useState(false)
  const [beError, setBeError] = useState(false)
  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    // Ambil riwayat pesan
    getMessages(room.id)
      .then((res) => {
        const history = res.data.map((m) => ({
          id: m.id,
          type: 'message',
          username: m.username,
          text: m.text,
          timestamp: m.created_at,
          self: m.username === username,
        }))
        setMessages(history)
        setBeError(false)
      })
      .catch(() => setBeError(true))

    // Buka koneksi WebSocket
    const ws = createWebSocket(room.id, username)
    wsRef.current = ws

    ws.onopen = () => {
      setWsReady(true)
      setBeError(false)
    }

    ws.onerror = () => setBeError(true)

    ws.onclose = () => {
      setWsReady(false)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'message') {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            type: 'message',
            username: data.username,
            text: data.text,
            timestamp: data.timestamp,
            self: data.username === username,
          },
        ])
      }

      if (data.type === 'moderation') {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), type: 'moderation', text: data.text },
        ])
      }

      if (data.type === 'system') {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), type: 'system', text: data.text },
        ])
      }
    }

    return () => ws.close()
  }, [room.id, username])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', text }))
    }
  }

  return (
    <div className="chat-layout">
      {/* Header */}
      <div className="chat-header">
        <button
          className="btn btn-ghost"
          style={{ color: '#fff', padding: '4px 10px', fontSize: '1.2rem' }}
          onClick={onBack}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div className="chat-header-title">{room.name}</div>
          <div className="chat-header-subtitle">
            {beError
              ? '⚠ Backend tidak terhubung — jalankan server terlebih dahulu'
              : wsReady
              ? `Terhubung sebagai ${username}`
              : 'Menghubungkan...'}
          </div>
        </div>
        <button
          className="btn btn-ghost"
          style={{ color: '#fff', fontSize: '0.8rem', padding: '4px 10px' }}
          onClick={onAdmin}
        >
          Admin
        </button>
      </div>

      {/* Error banner jika BE tidak jalan */}
      {beError && (
        <div style={{
          background: '#fef2f2',
          borderBottom: '1px solid #fca5a5',
          padding: '10px 20px',
          fontSize: '0.85rem',
          color: '#991b1b',
        }}>
          Backend belum berjalan. Buka terminal baru, masuk ke folder{' '}
          <code>BE/</code>, lalu jalankan:{' '}
          <code>uvicorn main:app --reload --port 8000</code>
        </div>
      )}

      {/* Area pesan */}
      <div className="chat-messages">
        {messages.length === 0 && !beError && (
          <div className="system-msg" style={{ marginTop: 20 }}>
            Belum ada pesan. Jadilah yang pertama memulai diskusi!
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={!wsReady} />
    </div>
  )
}
