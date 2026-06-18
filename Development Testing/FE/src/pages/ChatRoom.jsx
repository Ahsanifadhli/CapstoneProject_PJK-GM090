import React, { useEffect, useRef, useState, useCallback } from 'react'
import { getMessages, createWebSocket, requestReview } from '../services/api'
import ChatBubble from '../components/ChatBubble'
import ChatInput  from '../components/ChatInput'

// ── Tombol Ajukan Review ke Admin ─────────────────────────────────────────────
function ReviewButton({ violationId }) {
  const [status, setStatus] = useState('idle') // idle | loading | sent | error

  const handleClick = async () => {
    if (status !== 'idle') return
    setStatus('loading')
    try {
      if (violationId) {
        await requestReview(violationId)
      }
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent')
    return (
      <div style={{
        marginTop: 6, padding: '6px 14px', borderRadius: 8,
        background: 'var(--green-bg)', border: '1px solid #bbf7d0',
        fontSize: 12, color: 'var(--green)', fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        ✅ Permintaan review terkirim ke admin
      </div>
    )

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      style={{
        marginTop: 6,
        padding: '6px 14px',
        borderRadius: 8,
        border: '1px solid #d97706',
        background: status === 'error' ? 'var(--red-bg)' : 'var(--gold-bg)',
        color: status === 'error' ? 'var(--red)' : 'var(--gold-dk)',
        fontSize: 12,
        fontWeight: 600,
        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: status === 'loading' ? 0.7 : 1,
        transition: 'all .18s',
      }}
    >
      {status === 'loading' ? '⏳ Mengirim...' : status === 'error' ? '⚠ Gagal, coba lagi' : '📋 Ajukan Review ke Admin'}
    </button>
  )
}

export default function ChatRoom({ username, room, onBack }) {
  const [messages, setMessages] = useState([])
  const [wsReady,  setWsReady]  = useState(false)
  const [beError,  setBeError]  = useState(false)
  const wsRef       = useRef(null)
  const bottomRef   = useRef(null)
  const timeoutRef  = useRef(null)
  const mountedRef  = useRef(true)   // Mencegah setState setelah unmount

  const fetchMessages = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    getMessages(room.id)
      .then(r => {
        if (!mountedRef.current) return
        setMessages(r.data.map(m => ({
          id: m.id, type: 'message', username: m.username,
          text: m.text, timestamp: m.created_at, self: m.username === username,
        })))
        setBeError(false)
      })
      .catch(() => {
        if (!mountedRef.current) return
        // Retry sekali setelah 2 detik
        timeoutRef.current = setTimeout(() => {
          getMessages(room.id)
            .then(r => {
              if (!mountedRef.current) return
              setMessages(r.data.map(m => ({
                id: m.id, type: 'message', username: m.username,
                text: m.text, timestamp: m.created_at, self: m.username === username,
              })))
              setBeError(false)
            })
            .catch(() => { if (mountedRef.current) setBeError(true) })
        }, 2000)
      })
  }, [room.id, username])

  useEffect(() => {
    mountedRef.current = true
    fetchMessages()

    const ws = createWebSocket(room.id, username)
    wsRef.current = ws

    ws.onopen    = () => { if (mountedRef.current) { setWsReady(true); setBeError(false) } }
    ws.onerror   = () => { if (mountedRef.current) setBeError(true) }
    ws.onclose   = () => { if (mountedRef.current) setWsReady(false) }
    ws.onmessage = e => {
      if (!mountedRef.current) return
      try {
        const d = JSON.parse(e.data)
        if (d.type === 'message')
          setMessages(p => [...p, {
            id: d.id ?? Date.now(),
            type: 'message',
            username: d.username,
            text: d.text,
            timestamp: d.timestamp,
            self: d.username === username,
          }])
        if (d.type === 'moderation' || d.type === 'system')
          setMessages(p => [...p, {
            id: Date.now() + Math.random(),
            type: d.type,
            text: d.text,
            status: d.status || null,       // MERAGUKAN | TIDAK PANTAS
            violation_id: d.violation_id ?? null,
            can_review: d.can_review ?? false,
          }])
      } catch {
        // JSON parse error — abaikan frame tidak valid
      }
    }

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      // Null-out semua handler terlebih dahulu agar tidak ada state update
      // dari WebSocket yang sedang ditutup (penting untuk React StrictMode)
      ws.onopen    = null
      ws.onerror   = null
      ws.onclose   = null
      ws.onmessage = null
      // Hanya tutup jika sudah OPEN; jangan tutup saat CONNECTING
      // (menutup saat CONNECTING menyebabkan error browser di dev mode)
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [room.id, username, fetchMessages])

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = text => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: 'message', text }))
  }

  const handleRetry = () => {
    setBeError(false)
    fetchMessages()
    // Coba buat ulang WebSocket jika sudah tertutup
    const ws = wsRef.current
    if (!ws || ws.readyState === WebSocket.CLOSED) {
      const newWs = createWebSocket(room.id, username)
      wsRef.current = newWs
      newWs.onopen  = () => { if (mountedRef.current) { setWsReady(true); setBeError(false) } }
      newWs.onerror = () => { if (mountedRef.current) setBeError(true) }
      newWs.onclose = () => { if (mountedRef.current) setWsReady(false) }
      newWs.onmessage = e => {
        if (!mountedRef.current) return
        try {
          const d = JSON.parse(e.data)
          if (d.type === 'message')
            setMessages(p => [...p, {
              id: d.id ?? Date.now(),
              type: 'message',
              username: d.username,
              text: d.text,
              timestamp: d.timestamp,
              self: d.username === username,
            }])
          if (d.type === 'moderation' || d.type === 'system')
            setMessages(p => [...p, {
              id: Date.now() + Math.random(),
              type: d.type,
              text: d.text,
              status: d.status || null,
              violation_id: d.violation_id ?? null,
              can_review: d.can_review ?? false,
            }])
        } catch {
          // JSON parse error — abaikan frame tidak valid
        }
      }
    }
  }

  const handleFlag = async (msg) => {
    if (!window.confirm('Laporkan pesan ini ke admin?')) return
    try {
      await import('../services/api').then(m => m.flagMessage({
        room_id: room.id,
        reporter: username,
        text: msg.text,
      }))
      alert('Laporan terkirim ke admin. Terima kasih!')
    } catch {
      alert('Gagal mengirim laporan. Coba lagi.')
    }
  }

  return (
    <div className="chat-layout">
      <div className="chat-topbar">
        <button className="back-btn" onClick={onBack} title="Kembali ke daftar room">‹</button>
        <div className="room-chip" style={{ background: room.iconBg || 'linear-gradient(135deg,#1d4ed8,#4338ca)' }}>
          {room.icon || '💬'}
        </div>

        {/* Room info: name + desc */}
        <div className="topbar-info">
          <div className="topbar-name">{room.name}</div>
          {room.desc && (
            <div style={{ fontSize:11, color:'var(--text-4)', marginTop:1, lineHeight:1.3 }}>
              {room.desc}
            </div>
          )}
        </div>

        {/* AI moderation status badge */}
        {beError ? (
          <div style={{
            display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99,
            background:'var(--red-bg)', border:'1px solid var(--red-border)',
            fontSize:11, fontWeight:600, color:'var(--red)', flexShrink:0, cursor:'pointer',
            transition:'all .18s',
          }}
            onClick={handleRetry}
            title="Klik untuk coba sambung ulang"
          >
            <span className="sdot err" />
            Tidak Terhubung · Coba Lagi
          </div>
        ) : wsReady ? (
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'5px 12px', borderRadius:99,
            background:'var(--green-bg)', border:'1px solid #bbf7d0',
            fontSize:11, fontWeight:600, color:'var(--green)', flexShrink:0,
          }}>
            <span className="online-dot" style={{ width:7, height:7 }} />
            🛡 AI Moderasi Aktif
          </div>
        ) : (
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'5px 12px', borderRadius:99,
            background:'var(--gold-bg)', border:'1px solid var(--gold-border)',
            fontSize:11, fontWeight:600, color:'var(--gold-dk)', flexShrink:0,
          }}>
            <span className="sdot wait" />
            Menghubungkan...
          </div>
        )}

      </div>

      {beError && (
        <div className="error-bar">
          <span>⚠</span>
          <span>Tidak dapat terhubung ke server. Pastikan server sudah berjalan, lalu{' '}
            <button
              style={{ background:'none', border:'none', color:'inherit', textDecoration:'underline', cursor:'pointer', padding:0, font:'inherit' }}
              onClick={handleRetry}
            >coba lagi</button>.
          </span>
        </div>
      )}

      <div className="messages">
        <div className="sys-msg">🛡 Semua pesan dimoderasi secara real-time oleh AI SHIELD</div>
        <div className="date-sep">Hari ini</div>
        {messages.length === 0 && !beError && (
          <div className="sys-msg" style={{ marginTop:16 }}>Belum ada pesan · Jadilah yang pertama! 👋</div>
        )}
        {messages.map(m => (
          <div key={m.id} className="bubble-wrap">
            <ChatBubble message={m} />
            {m.type === 'message' && !m.self && (
              <button
                className="btn-flag"
                title="Laporkan pesan ini"
                onClick={() => handleFlag(m)}
              >🚩</button>
            )}
            {/* Tombol Ajukan Review — muncul di bawah notifikasi MERAGUKAN milik user sendiri */}
            {m.type === 'moderation' && m.status === 'MERAGUKAN' && (
              <ReviewButton violationId={m.violation_id} />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={send} disabled={!wsReady} />
    </div>
  )
}
