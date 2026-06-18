import React, { useState } from "react"
import { registerUser } from "../services/api"

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export default function Register({ onRegistered, onGoLogin }) {
  const [username, setUsername]         = useState("")
  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [confirmPassword, setConfirm]   = useState("")
  const [showPass, setShowPass]         = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState("")

  const validate = () => {
    if (!username.trim() || !email.trim() || !password || !confirmPassword)
      return "Semua field wajib diisi."
    if (username.trim().length < 3)
      return "Username minimal 3 karakter."
    if (!email.includes("@"))
      return "Format email tidak valid."
    if (password.length < 6)
      return "Password minimal 6 karakter."
    if (password !== confirmPassword)
      return "Konfirmasi password tidak cocok."
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const validationError = validate()
    if (validationError) return setError(validationError)
    setSubmitting(true)
    try {
      await registerUser({
        username: username.trim(),
        email:    email.trim().toLowerCase(),
        password,
      })
      onRegistered("Akun berhasil dibuat! Silakan masuk dengan akun Anda.")
    } catch (err) {
      setError(err.response?.data?.detail || "Registrasi gagal. Coba lagi.")
      setSubmitting(false)
    }
  }

  return (
    <div className="login-split">

      {/* ── LEFT: Hero / Branding ── */}
      <div className="login-hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        <div className="hero-content">
          <div className="hero-logo">
            <div className="hero-logo-icon">🛡</div>
            <div className="hero-logo-text">AI <span>SHIELD</span></div>
          </div>

          <p className="hero-tagline">
            Smart Handling of Integrity in<br />Ethical Live Dialogue
          </p>
          <p className="hero-sub">
            Platform forum akademik yang aman, berintegritas, dan termoderasi secara real-time oleh kecerdasan buatan.
          </p>

          <ul className="hero-features">
            <li className="hero-feat">
              <span className="feat-icon">🛡</span>
              <div>
                <strong>Moderasi Real-Time</strong>
                <p>IndoBERT dilatih khusus untuk teks akademik Indonesia</p>
              </div>
            </li>
            <li className="hero-feat">
              <span className="feat-icon">⚡</span>
              <div>
                <strong>3-Label Detection</strong>
                <p>PANTAS · MERAGUKAN · TIDAK PANTAS dengan confidence score</p>
              </div>
            </li>
            <li className="hero-feat">
              <span className="feat-icon">🔒</span>
              <div>
                <strong>Data Aman</strong>
                <p>Password dienkripsi dengan bcrypt, tidak pernah disimpan plaintext</p>
              </div>
            </li>
          </ul>

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
        <div className="login-form-inner">

          {/* Brand mark */}
          <div className="form-brand">
            <div className="form-brand-icon">🛡</div>
            <span>AI SHIELD</span>
          </div>

          <div className="form-heading">
            <h1 className="form-title">Buat Akun Baru</h1>
            <p className="form-desc">Daftar untuk bergabung ke forum akademik AI SHIELD</p>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-alert auth-alert-err">⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form">

            {/* Username */}
            <label className="form-label" htmlFor="reg-username">Nama Pengguna</label>
            <input
              id="reg-username"
              className="form-input"
              type="text"
              placeholder="minimal 3 karakter"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={submitting}
              autoFocus
              autoComplete="username"
              maxLength={30}
            />

            {/* Email */}
            <label className="form-label" htmlFor="reg-email" style={{ marginTop: 14 }}>Email</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              placeholder="email@kampus.ac.id"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
            />

            {/* Password */}
            <label className="form-label" htmlFor="reg-password" style={{ marginTop: 14 }}>Password</label>
            <div className="password-wrap">
              <input
                id="reg-password"
                className="form-input"
                type={showPass ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
                title={showPass ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Confirm Password */}
            <label className="form-label" htmlFor="reg-confirm" style={{ marginTop: 14 }}>Konfirmasi Password</label>
            <div className="password-wrap">
              <input
                id="reg-confirm"
                className="form-input"
                type={showConfirm ? "text" : "password"}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={e => setConfirm(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                tabIndex={-1}
                title={showConfirm ? "Sembunyikan" : "Tampilkan"}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <button
              className="btn-primary"
              type="submit"
              style={{ marginTop: 22 }}
              disabled={submitting || !username || !email || !password || !confirmPassword}
            >
              {submitting ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="admin-login-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Mendaftarkan...
                </span>
              ) : "Daftar →"}
            </button>
          </form>

          {/* Link ke Login */}
          <p className="form-footer-link">
            Sudah punya akun?{" "}
            <button className="link-btn" type="button" onClick={onGoLogin}>
              Masuk
            </button>
          </p>

          <p className="form-footer-note">
            Sistem forum akademik · Data aman &amp; tidak dibagikan
          </p>
        </div>
      </div>

    </div>
  )
}
