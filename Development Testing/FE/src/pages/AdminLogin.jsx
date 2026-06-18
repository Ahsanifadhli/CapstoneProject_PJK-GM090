import React, { useState } from "react"
import { verifyAdmin } from "../services/api"

export default function AdminLogin({ onSuccess, onBack }) {
  const [password, setPassword] = useState("")
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(false)
    setLoading(true)
    try {
      const r = await verifyAdmin({ password })
      if (r.data?.success) {
        onSuccess()
      } else {
        setError(true)
        setPassword("")
      }
    } catch {
      setError(true)
      setPassword("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      {/* Subtle background blobs */}
      <div className="admin-login-blob admin-login-blob-1" />
      <div className="admin-login-blob admin-login-blob-2" />

      <div className="admin-login-card">

        {/* Icon + Title */}
        <div className="admin-login-header">
          <div className="admin-login-icon">🔐</div>
          <div>
            <h1 className="admin-login-title">Admin Dashboard</h1>
            <p className="admin-login-subtitle">AI SHIELD</p>
          </div>
        </div>

        <p className="admin-login-desc">
          Akses terbatas untuk tim pengembang dan moderator sistem.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="form-label" htmlFor="admin-password">
            Password Admin
          </label>
          <input
            id="admin-password"
            className={`form-input${error ? " input-error" : ""}`}
            type="password"
            placeholder="Masukkan password admin"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            autoFocus
            disabled={loading}
          />

          {/* Error message */}
          {error && (
            <div className="admin-error-msg">
              <span className="admin-error-icon">⚠</span>
              Password salah. Hubungi tim pengembang.
            </div>
          )}

          <button
            className="btn-primary admin-login-btn"
            type="submit"
            disabled={!password || loading}
          >
            {loading ? (
              <span className="admin-login-spinner" />
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        {/* Back link */}
        <button className="admin-back-link" onClick={onBack} type="button">
          ← Kembali ke halaman utama
        </button>
      </div>
    </div>
  )
}
