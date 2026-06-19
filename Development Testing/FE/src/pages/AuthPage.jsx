import React, { useState } from 'react'
import { api } from '../services/api'

export default function AuthPage({ onLogin, onAdminLogin }) {
  const [tab, setTab]           = useState('login')   // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const reset = () => { setError(''); setSuccess('') }

  const handleLogin = async () => {
    reset()
    if (!email || !password) return setError('Email dan password wajib diisi.')
    setLoading(true)
    try {
      const r = await api.post('/api/auth/login', { email, password })
      onLogin(r.data.username, r.data.email, r.data.token)
    } catch (e) {
      setError(e.response?.data?.detail || 'Email atau password salah.')
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    reset()
    if (!username || !email || !password)
      return setError('Semua field wajib diisi.')
    if (password.length < 6)
      return setError('Password minimal 6 karakter.')
    setLoading(true)
    try {
      await api.post('/api/auth/register', { username, email, password })
      setSuccess('Akun berhasil dibuat! Silakan login.')
      setTab('login')
      setPassword('')
    } catch (e) {
      setError(e.response?.data?.detail || 'Registrasi gagal.')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-split">

      {/* ── KIRI: Hero (sama persis dengan Login.jsx lama) ── */}
      <div className="login-hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
        <div className="hero-content">
          <div className="hero-logo">
            <div className="hero-logo-icon">🛡</div>
            <div className="hero-logo-text">AI <span>SHIELD</span></div>
          </div>
          <p className="hero-tagline">Smart Handling of Integrity in<br />Ethical Live Dialogue</p>
          <p className="hero-sub">Platform forum akademik yang aman, berintegritas, dan termoderasi secara real-time oleh kecerdasan buatan.</p>
          <ul className="hero-features">
            <li className="hero-feat">
              <span className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              <div>
                <strong>Moderasi Real-Time</strong>
                <p>Didukung model IndoBERT yang dilatih khusus untuk teks akademik Indonesia</p>
              </div>
            </li>
            <li className="hero-feat">
              <span className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </span>
              <div>
                <strong>3-Label Detection</strong>
                <p>PANTAS · MERAGUKAN · TIDAK PANTAS dengan confidence score</p>
              </div>
            </li>
            <li className="hero-feat">
              <span className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </span>
              <div>
                <strong>Dashboard Admin</strong>
                <p>Pemantauan pelanggaran, statistik, dan analitik moderasi real-time</p>
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

      {/* ── KANAN: Form ── */}
      <div className="login-form-panel">

        <button className="btn-admin-corner" onClick={onAdminLogin} type="button">🔐 Admin</button>

        <div className="login-form-inner">
          <div className="form-brand">
            <div className="form-brand-icon">🛡</div>
            <span>AI SHIELD</span>
          </div>

          {/* Tab toggle Login / Register */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); reset() }}
            >
              Masuk
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); reset() }}
            >
              Daftar
            </button>
          </div>

          {error   && <div className="auth-alert auth-alert-err">⚠ {error}</div>}
          {success && <div className="auth-alert auth-alert-ok">✓ {success}</div>}

          {tab === 'login' ? (
            <div className="login-form">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="email@kampus.ac.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />

              <label className="form-label" style={{ marginTop: 12 }}>Password</label>
              <div className="password-wrap">
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              <button
                className="btn-primary"
                style={{ marginTop: 20 }}
                onClick={handleLogin}
                disabled={loading || !email || !password}
              >
                {loading ? 'Memuat...' : 'Masuk →'}
              </button>
            </div>
          ) : (
            <div className="login-form">
              <label className="form-label">Nama Pengguna</label>
              <input
                className="form-input"
                type="text"
                placeholder="nama_mahasiswa"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />

              <label className="form-label" style={{ marginTop: 12 }}>Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="email@kampus.ac.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />

              <label className="form-label" style={{ marginTop: 12 }}>Password</label>
              <div className="password-wrap">
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              <button
                className="btn-primary"
                style={{ marginTop: 20 }}
                onClick={handleRegister}
                disabled={loading || !username || !email || !password}
              >
                {loading ? 'Memuat...' : 'Buat Akun →'}
              </button>
            </div>
          )}

          <p className="form-footer-note">Sistem simulasi akademik · Data aman &amp; tidak dibagikan</p>
        </div>
      </div>
    </div>
  )
}
