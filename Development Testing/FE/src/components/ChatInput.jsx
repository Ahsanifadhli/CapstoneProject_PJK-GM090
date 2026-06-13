import React, { useState, useRef } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  const submit = e => {
    e.preventDefault()
    const t = text.trim()
    if (!t || disabled) return
    onSend(t)
    setText('')
    // Kembalikan fokus ke input setelah kirim
    inputRef.current?.focus()
  }

  return (
    <form className="input-bar" onSubmit={submit}>
      <input
        ref={inputRef}
        className="chat-input"
        type="text"
        placeholder={disabled ? 'Menghubungkan ke server...' : 'Tulis pesan... (Enter untuk kirim)'}
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={disabled}
        maxLength={500}
        autoFocus
        autoComplete="off"
        spellCheck="false"
      />
      <button
        className="send-btn"
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Kirim pesan"
        title="Kirim pesan"
      >
        ➤
      </button>
    </form>
  )
}
