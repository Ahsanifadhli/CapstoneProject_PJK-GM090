import React from "react"
const COLORS = [
  ['#eff6ff','#1d4ed8'],['#faf5ff','#7c3aed'],['#f0fdf4','#15803d'],
  ['#fff7ed','#c2410c'],['#fdf4ff','#9333ea'],
]
const getColor = name => {
  let h = 0; for(const c of (name||'')) h += c.charCodeAt(0)
  return COLORS[h % COLORS.length]
}

export default function ChatBubble({ message }) {
  if (message.type === 'system')
    return <div className="sys-msg">{message.text}</div>

  if (message.type === 'moderation') {
    const isMeragukan = message.status === 'MERAGUKAN'
    return (
      <div className={`mod-toast ${isMeragukan ? 'mod-toast-warn' : 'mod-toast-err'}`}>
        <span className="mod-toast-icon">{isMeragukan ? '⚠️' : '🚫'}</span>
        <div className="mod-toast-body">
          <strong>{isMeragukan ? 'Pesan perlu ditinjau' : 'Pesan disembunyikan oleh AI SHIELD'}</strong>
          <br />{message.text}
          {isMeragukan && (
            <div style={{ marginTop:6, fontSize:11, color:'var(--gold-dk)', fontWeight:500 }}>
              Admin akan memeriksa pesanmu dalam waktu dekat.
            </div>
          )}
        </div>
      </div>
    )
  }

  const [bg, fg] = getColor(message.username)
  const initials = (message.username||'?').slice(0,2).toUpperCase()
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})
    : ''

  return (
    <div className={`brow ${message.self ? 'self' : 'other'}`}>
      {!message.self && (
        <div className="bmeta">
          <div className="bavatar" style={{ background:bg, color:fg }}>{initials}</div>
          <span className="buname">{message.username}</span>
          {time && <span className="btime">{time}</span>}
        </div>
      )}
      <div className={`bubble ${message.self ? 'self' : 'other'}`}>{message.text}</div>
      {message.self && time && <span className="btime" style={{ marginTop:3 }}>{time}</span>}
    </div>
  )
}

