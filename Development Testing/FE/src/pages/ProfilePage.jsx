import React, { useState } from 'react'
import { api } from '../services/api'

export default function ProfilePage({ username, email, onBack, onLogout, onUpdateUsername }) {
  const storageKey = `aishield_profile_${username}`
  const saved = (() => { try { return JSON.parse(localStorage.getItem(storageKey)) || {} } catch { return {} } })()

  const [tab, setTab]      = useState('profil')
  const [nama, setNama]    = useState(saved.nama || username || '')
  const [univ, setUniv]    = useState(saved.univ || '')
  const [tglLahir, setTgl] = useState(saved.tglLahir || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]      = useState('')

  // Password
  const [pwLama, setPwLama]       = useState('')
  const [pwBaru, setPwBaru]       = useState('')
  const [pwKonfirm, setPwKonfirm] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [pwMsg, setPwMsg]         = useState('')
  const [pwErr, setPwErr]         = useState(false)

  const handleSaveProfil = () => {
    setSaving(true)
    setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ nama, univ, tglLahir }))
      // Notifikasi App.jsx agar displayName & sessionStorage terupdate
      if (onUpdateUsername && nama.trim()) onUpdateUsername(nama.trim())
      setSaving(false)
      setMsg('Profil berhasil disimpan.')
      setTimeout(() => setMsg(''), 3000)
    }, 800)
  }

  const handleChangePassword = async () => {
    setPwMsg(''); setPwErr(false)
    if (!pwLama || !pwBaru || !pwKonfirm) { setPwErr(true); return setPwMsg('Semua field wajib diisi.') }
    if (pwBaru.length < 6) { setPwErr(true); return setPwMsg('Password baru minimal 6 karakter.') }
    if (pwBaru !== pwKonfirm) { setPwErr(true); return setPwMsg('Konfirmasi password tidak cocok.') }
    try {
      await api.patch('/api/auth/change-password', {
        email, old_password: pwLama, new_password: pwBaru,
      })
      setPwMsg('Password berhasil diubah.')
      setPwErr(false)
      setPwLama(''); setPwBaru(''); setPwKonfirm('')
    } catch (e) {
      setPwErr(true)
      setPwMsg(e.response?.data?.detail || 'Gagal mengubah password.')
    }
  }

  const EyeIcon = ({ show }) => show ? (
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
  )

  /* Inisial 1 huruf */
  const initials = (nama || username || '?').slice(0, 1).toUpperCase()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 40%, #faf5ff 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Orbs dekoratif (light) */}
      <div style={{
        position: 'fixed', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        width: 480, height: 480,
        background: 'radial-gradient(circle, rgba(99,102,241,.07) 0%, transparent 70%)',
        top: -120, right: -80,
      }} />
      <div style={{
        position: 'fixed', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        width: 340, height: 340,
        background: 'radial-gradient(circle, rgba(245,158,11,.05) 0%, transparent 70%)',
        bottom: -60, left: -60,
      }} />

      {/* Topbar */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,.7)',
        backdropFilter: 'blur(12px)',
      }}>
        <button className="btn-sm" onClick={onBack}>← Kembali</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Profil Saya</div>
        <button className="btn-sm" onClick={onLogout}
          style={{ borderColor: 'rgba(220,38,38,.3)', color: '#dc2626' }}>
          Keluar
        </button>
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 620, margin: '0 auto',
        padding: '32px 20px 60px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* Hero card */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          boxShadow: '0 4px 24px rgba(99,102,241,.08)',
          animation: 'fadeUp .4s ease both',
        }}>
          {/* Avatar dengan ring animasi */}
          <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            {/* Ring luar */}
            <div style={{
              position: 'absolute', inset: -4,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #6366f1, #f59e0b)',
              backgroundSize: '200% 200%',
              animation: 'ringRotate 3s linear infinite',
            }} />
            {/* Avatar */}
            <div style={{
              position: 'relative', zIndex: 1,
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1d4ed8, #4338ca)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 800, color: '#fff',
              border: '3px solid #fff',
            }}>
              {initials}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>
              {nama || username}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>{email}</div>
            {univ && (
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 6 }}>🏫 {univ}</div>
            )}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 12px', borderRadius: 99,
              background: 'rgba(34,197,94,.08)',
              border: '1px solid rgba(34,197,94,.25)',
              color: '#16a34a', fontSize: 11, fontWeight: 600,
            }}>🎓 Mahasiswa</div>
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,.06)',
          animation: 'fadeUp .4s ease .08s both',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
            {[
              { key: 'profil',   label: '👤 Informasi Profil' },
              { key: 'password', label: '🔐 Ubah Password'    },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: '14px',
                  border: 'none',
                  borderBottom: tab === t.key ? '2px solid #1d4ed8' : '2px solid transparent',
                  background: tab === t.key ? '#fff' : 'none',
                  color: tab === t.key ? '#1d4ed8' : 'var(--text-3)',
                  fontWeight: tab === t.key ? 600 : 400,
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all .15s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Tab: Profil */}
          {tab === 'profil' && (
            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">Nama Lengkap</label>
                  <input className="form-input" value={nama}
                    onChange={e => setNama(e.target.value)}
                    placeholder="Masukkan nama lengkap" />
                </div>
                <div>
                  <label className="form-label">Asal Universitas / Kampus</label>
                  <input className="form-input" value={univ}
                    onChange={e => setUniv(e.target.value)}
                    placeholder="Contoh: Universitas Indonesia" />
                </div>
                <div>
                  <label className="form-label">Tanggal Lahir</label>
                  <input className="form-input" type="date" value={tglLahir}
                    onChange={e => setTgl(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-input" value={email} disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                    Email tidak dapat diubah
                  </div>
                </div>
                {msg && <div className="auth-alert auth-alert-ok">{msg}</div>}
                <button className="btn-primary" onClick={handleSaveProfil} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Password */}
          {tab === 'password' && (
            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Password Lama',            val: pwLama,    set: setPwLama    },
                  { label: 'Password Baru',            val: pwBaru,    set: setPwBaru    },
                  { label: 'Konfirmasi Password Baru', val: pwKonfirm, set: setPwKonfirm },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="form-label">{label}</label>
                    <div className="password-wrap">
                      <input
                        className="form-input"
                        type={showPw ? 'text' : 'password'}
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        className="password-toggle"
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        tabIndex={-1}
                      >
                        <EyeIcon show={showPw} />
                      </button>
                    </div>
                  </div>
                ))}
                {pwMsg && (
                  <div className={`auth-alert ${pwErr ? 'auth-alert-err' : 'auth-alert-ok'}`}>
                    {pwMsg}
                  </div>
                )}
                <button className="btn-primary" onClick={handleChangePassword}>
                  Ubah Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
