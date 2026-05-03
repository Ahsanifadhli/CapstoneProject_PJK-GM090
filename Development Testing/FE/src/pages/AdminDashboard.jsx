import { useEffect, useState } from 'react'
import { getViolations, getStats, resetAll } from '../services/api'

export default function AdminDashboard({ onBack }) {
  const [stats, setStats] = useState(null)
  const [violations, setViolations] = useState([])

  useEffect(() => {
    getStats().then((res) => setStats(res.data))
    getViolations().then((res) => setViolations(res.data))
  }, [])

  const refresh = () => {
    getStats().then((res) => setStats(res.data))
    getViolations().then((res) => setViolations(res.data))
  }

  const handleReset = () => {
    if (!window.confirm('Hapus semua pesan dan log pelanggaran? Tindakan ini tidak bisa dibatalkan.')) return
    resetAll().then(() => {
      setStats({ total_messages: 0, pantas: 0, tidak_pantas: 0, moderation_rate: 0 })
      setViolations([])
    })
  }

  return (
    <div className="admin-layout">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Pantau aktivitas moderasi sistem AI SHIELD
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={refresh}>
            Refresh
          </button>
          <button
            className="btn btn-secondary"
            style={{ color: '#991b1b', borderColor: '#fca5a5' }}
            onClick={handleReset}
          >
            Hapus Semua Data
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            ← Kembali
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Pesan</div>
            <div className="stat-value">{stats.total_messages}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pesan Pantas</div>
            <div className="stat-value">{stats.pantas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pesan Disembunyikan</div>
            <div className="stat-value">{stats.tidak_pantas}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tingkat Moderasi</div>
            <div className="stat-value">{stats.moderation_rate}%</div>
          </div>
        </div>
      )}

      <div className="violations-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Pengguna</th>
              <th>Isi Pesan</th>
              <th>Room</th>
              <th>Confidence</th>
              <th>Waktu</th>
            </tr>
          </thead>
          <tbody>
            {violations.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">Belum ada pelanggaran tercatat.</div>
                </td>
              </tr>
            ) : (
              violations.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.username}</td>
                  <td>
                    <span className="badge badge-red">TIDAK PANTAS</span>{' '}
                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                      {v.text}
                    </span>
                  </td>
                  <td>{v.room_id}</td>
                  <td>{(v.confidence * 100).toFixed(0)}%</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{v.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
