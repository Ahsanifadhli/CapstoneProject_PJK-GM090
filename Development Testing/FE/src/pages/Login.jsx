import React from "react"
import { useState } from 'react'

export default function Login({ onLogin, onAdmin }) {
  const [name, setName] = useState('')

  return (
    <div className="login-page">
      {/* Decorative blobs */}
      <div className="login-deco">
        <div className="login-deco-circle" style={{
          width: 400, height: 400, top: -100, left: -100,
          background: 'radial-gradient(circle, #dbeafe, transparent)',
        }}/>
        <div className="login-deco-circle" style={{
          width: 300, height: 300, bottom: -80, right: -60,
          background: 'radial-gradient(circle, #fef3c7, transparent)',
        }}/>
      </div>

      <div className="login-card">
        <div className="login-badge">🛡 AI-Powered Academic Moderation</div>

        <div className="login-logo">
          <div className="login-logo-icon">🛡</div>
          <div className="login-logo-text">AI <span>SHIELD</span></div>
        </div>

        <p className="login-tagline">
          Smart Handling of Integrity in Ethical Live Dialogue —
          platform forum akademik yang aman, berintegritas, dan termoderasi secara real-time oleh kecerdasan buatan.
        </p>

        <form onSubmit={e => { e.preventDefault(); const t = name.trim(); if (t) onLogin(t) }}>
          <label className="form-label">Nama Pengguna</label>
          <input
            className="form-input"
            type="text"
            placeholder="Masukkan nama Anda..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <button className="btn-primary" type="submit" disabled={!name.trim()}>
            Masuk ke Forum →
          </button>
        </form>

        <div className="login-divider">atau</div>
        <button className="btn-outline" onClick={onAdmin}>⚙ Buka Admin Dashboard</button>

        <div className="login-footer">
          <div className="login-footer-dot" />
          <span className="login-footer-text">Sistem AI moderasi aktif · IndoBERT online</span>
        </div>
      </div>
    </div>
  )
}

