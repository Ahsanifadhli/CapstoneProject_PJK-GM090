import { useState } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  return (
    <form className="chat-input-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={disabled ? 'Menghubungkan...' : 'Tulis pesan...'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        maxLength={500}
        autoFocus
      />
      <button
        type="submit"
        className="btn-send"
        disabled={disabled || !text.trim()}
      >
        ➤
      </button>
    </form>
  )
}
