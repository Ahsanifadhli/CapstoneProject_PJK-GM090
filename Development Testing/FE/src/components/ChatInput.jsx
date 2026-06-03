import React from "react"
import { useState } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const submit = e => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    onSend(t); setText('')
  }
  return (
    <form className="input-bar" onSubmit={submit}>
      <input
        className="chat-input"
        type="text"
        placeholder={disabled ? 'Menghubungkan ke server...' : 'Tulis pesan...'}
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={disabled}
        maxLength={500}
        autoFocus
      />
      <button className="send-btn" type="submit" disabled={disabled || !text.trim()} aria-label="Kirim">
        ➤
      </button>
    </form>
  )
}

