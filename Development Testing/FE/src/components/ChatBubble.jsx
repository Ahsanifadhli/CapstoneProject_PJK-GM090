export default function ChatBubble({ message }) {
  if (message.type === 'system') {
    return <div className="system-msg">{message.text}</div>
  }

  if (message.type === 'moderation') {
    return <div className="moderation-toast">⚠️ {message.text}</div>
  }

  const side = message.self ? 'self' : 'other'
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <div className={`bubble-row ${side}`}>
      {!message.self && (
        <div className="bubble-username">{message.username}</div>
      )}
      <div className={`bubble ${side}`}>{message.text}</div>
      {time && <div className="bubble-time">{time}</div>}
    </div>
  )
}
