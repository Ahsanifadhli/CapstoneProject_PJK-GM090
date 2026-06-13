import React, { useState } from "react"

export default function Login({ onLogin, onAdminLogin }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const t = name.trim()
    if (!t || submitting) return
    setSubmitting(true)
    // Brief delay for visual feedback
    await new Promise(r => setTimeout(r, 180))
    onLogin(t)
  }

  return (
    <div className="login-split">

      {/* ── LEFT: Hero / Branding ── */}
      <div className="login-hero">
        {/* Decorative background shapes */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        <div className="hero-content">
          {/* Logo */}
          <div className="hero-logo">
            <div className="hero-logo-icon">🛡</div>
            <div className="hero-logo-text">
              AI <span>SHIELD</span>
            </div>
          </div>

          {/* Tagline */}
          <p className="hero-tagline">
            Smart Handling of Integrity in<br />Ethical Live Dialogue
          </p>
          <p className="hero-sub">
            Platform forum akademik yang aman, berintegritas, dan termoderasi secara real-time oleh kecerdasan buatan.
          </p>

          {/* Feature list */}
          <ul className="hero-features">
            <li className="hero-feat">
              <span className="feat-icon">🛡</span>
              <div>
                <strong>Moderasi Real-Time</strong>
                <p>Didukung model IndoBERT yang dilatih khusus untuk teks akademik Indonesia</p>
              </div>
            </li>
            <li className="hero-feat">
              <span className="feat-icon">⚡</span>
              <div>
                <strong>Deteksi Otomatis</strong>
                <p>Bahasa tidak pantas terdeteksi sebelum pesan terkirim ke forum</p>
              </div>
            </li>
            <li className="hero-feat">
              <span className="feat-icon">📊</span>
              <div>
                <strong>Dashboard Admin</strong>
                <p>Pemantauan pelanggaran, statistik, dan analitik moderasi real-time</p>
              </div>
            </li>
          </ul>

          {/* Accuracy badge */}
          <div className="hero-badge-row">
            <div className="hero-acc-badge">
              <span className="acc-dot" />
              <span>Accuracy <strong>90.33%</strong></span>
              <div className="acc-sep" />
              <span>F1 Score <strong>91.39%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="login-form-panel">

        {/* Tombol admin di pojok kanan atas */}
        <button
          className="btn-admin-corner"
          onClick={onAdminLogin}
          type="button"
          title="Akses Admin Dashboard"
        >
          🔐 Admin
        </button>

        <div className="login-form-inner">

          {/* Small brand mark */}
          <div className="form-brand">
            <div className="form-brand-icon">🛡</div>
            <span>AI SHIELD</span>
          </div>

          <div className="form-heading">
            <h1 className="form-title">Masuk sebagai Mahasiswa</h1>
            <p className="form-desc">Bergabung ke ruang diskusi akademik yang termoderasi AI</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="form-label" htmlFor="username-input">Nama Pengguna</label>
            <input
              id="username-input"
              className="form-input"
              type="text"
              placeholder="Masukkan nama Anda..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              autoFocus
              autoComplete="off"
              spellCheck="false"
              disabled={submitting}
            />
            <button
              className="btn-primary"
              type="submit"
              disabled={!name.trim() || submitting}
            >
              {submitting ? (
                <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                  <span className="admin-login-spinner" style={{ width:16, height:16, borderWidth:2 }} />
                  Memuat...
                </span>
              ) : (
                'Mulai Simulasi →'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="form-footer-note">
            Sistem simulasi akademik · Tidak memerlukan registrasi
          </p>
        </div>
      </div>

    </div>
  )
}
