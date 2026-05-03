import { useState } from 'react'

export default function Login({ onLogin, onAdmin }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onLogin(trimmed)
  }

  return (
    <div className="page-center">
      <div className="card">
        <h1>AI SHIELD</h1>
        <p className="subtitle">
          Forum komunikasi akademik yang aman dan berintegritas
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Masukkan nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim()}
          >
            Masuk ke Forum
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn btn-ghost" onClick={onAdmin}>
            Buka Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
