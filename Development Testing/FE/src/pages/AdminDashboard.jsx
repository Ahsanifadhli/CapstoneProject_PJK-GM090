import React, { useEffect, useState, useRef, useMemo } from 'react'
import { getViolations, getStats, resetAll, deleteViolation, reviewViolation, getUsers, deleteUser } from '../services/api'

// ── Fallback data (dipakai saat BE offline) ──────────────────────────────────
const DAILY_FALLBACK = [
  { day:'Sen', total:210, viol:12 }, { day:'Sel', total:185, viol:9  },
  { day:'Rab', total:230, viol:15 }, { day:'Kam', total:198, viol:11 },
  { day:'Jum', total:267, viol:18 }, { day:'Sab', total:124, viol:8  },
  { day:'Min', total:70,  viol:10 },
]

// ── Distribusi proporsional per hari dari stats real ────────────────────────
function buildDaily(stats) {
  const days    = ['Sen','Sel','Rab','Kam','Jum','Sab','Min']
  const weights = [0.18, 0.16, 0.19, 0.17, 0.15, 0.09, 0.06]
  return days.map((day, i) => ({
    day,
    total: Math.round((stats.total_messages || 0) * weights[i]),
    viol:  Math.round((stats.tidak_pantas   || 0) * weights[i]),
  }))
}

// ── Skeleton widths statis (bukan Math.random() agar tidak flicker) ──────
const SKELETON_WIDTHS = [60, 80, 45, 72, 55, 38, 65]

// ── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ violation, onClose, onDecision }) {
  const [loading, setLoading]   = useState(false)
  const [decided, setDecided]   = useState(null)  // "approve" | "reject"

  const handleDecision = async (decision) => {
    setLoading(true)
    setDecided(decision)
    try {
      await reviewViolation(violation.id, decision)
      onDecision(violation.id, decision)
    } catch (e) {
      console.error("[ReviewModal] error:", e)
      setLoading(false)
      setDecided(null)
    }
  }

  // Tutup modal saat klik overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const confPct = Math.round((violation.confidence || 0) * 100)

  return (
    <div className="review-modal-overlay" onClick={handleOverlayClick}>
      <div className="review-modal" role="dialog" aria-modal="true" aria-label="Review Pelanggaran">

        {/* Header */}
        <div className="review-modal-header">
          <div className="review-modal-title">
            <span className="review-modal-icon">📋</span>
            Tinjauan Pesan Meragukan
          </div>
          <button className="review-modal-close" onClick={onClose} type="button" title="Tutup">✕</button>
        </div>

        {/* Meta info */}
        <div className="review-modal-meta">
          <div className="review-meta-chip">
            <span className="review-meta-label">Pengirim</span>
            <span className="review-meta-val">{violation.username || '—'}</span>
          </div>
          <div className="review-meta-chip">
            <span className="review-meta-label">Room</span>
            <span className="review-meta-val">{violation.room_id || '—'}</span>
          </div>
          <div className="review-meta-chip">
            <span className="review-meta-label">Confidence AI</span>
            <span className="review-meta-val" style={{
              color: confPct > 85 ? 'var(--red)' : confPct > 70 ? 'var(--gold-dk)' : 'var(--green)',
              fontWeight: 700,
            }}>
              {confPct}%
            </span>
          </div>
          <div className="review-meta-chip">
            <span className="review-meta-label">Waktu</span>
            <span className="review-meta-val">{violation.created_at || '—'}</span>
          </div>
        </div>

        {/* Pesan */}
        <div className="review-modal-msg-label">Isi Pesan:</div>
        <div className="review-modal-msg">
          {`"${violation.text || '—'}"`}
        </div>

        {/* Panduan keputusan */}
        <div className="review-modal-guide">
          <div className="review-guide-approve">
            <strong>Setujui</strong> — jika pesan ini sebenarnya pantas dan AI salah klasifikasi.
            Pesan akan dihapus dari log pelanggaran.
          </div>
          <div className="review-guide-reject">
            <strong>Tolak</strong> — jika pesan ini memang tidak pantas.
            Pesan tetap tercatat sebagai pelanggaran (label: DITOLAK).
          </div>
        </div>

        {/* Aksi */}
        <div className="review-modal-actions">
          <button
            className="btn-review-approve"
            onClick={() => handleDecision("approve")}
            disabled={loading}
          >
            {loading && decided === "approve" ? (
              <span className="admin-login-spinner" style={{ width: 14, height: 14, borderWidth: 2, marginRight: 6 }} />
            ) : "✅ "}
            Setujui (Pantas)
          </button>
          <button
            className="btn-review-reject"
            onClick={() => handleDecision("reject")}
            disabled={loading}
          >
            {loading && decided === "reject" ? (
              <span className="admin-login-spinner" style={{ width: 14, height: 14, borderWidth: 2, marginRight: 6 }} />
            ) : "❌ "}
            Tolak (Tidak Pantas)
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard({ onBack }) {
  const MOCK_STATS = { total_messages:1284, pantas:1201, tidak_pantas:83, meragukan:12, moderation_rate:7.4 }
  const MOCK_V = [
    { id:5, username:'user_anonim', text:'dasar anjing lo, ga bisa kerja kelompok!', room_id:'forum-umum',     confidence:0.95, can_review:0, created_at:'03/06/26 09:17', label: 'TIDAK PANTAS' },
    { id:4, username:'budi123',     text:'tolol banget sih, baca dulu sebelum nanya', room_id:'forum-umum',     confidence:0.87, can_review:0, created_at:'03/06/26 08:54', label: 'TIDAK PANTAS' },
    { id:3, username:'rizal_dev',   text:'goblok, masa tugas segini ga kelar',        room_id:'forum-tugas',    confidence:0.76, can_review:1, created_at:'03/06/26 08:31', label: 'MERAGUKAN' },
    { id:2, username:'anon_user2',  text:'brengsek lo, ngumpulin tugas mepet mulu',  room_id:'forum-aishield', confidence:0.91, can_review:0, created_at:'03/06/26 07:58', label: 'TIDAK PANTAS' },
    { id:1, username:'mhs99',       text:'sialan, ngerti ga sih penjelasan dosen?',  room_id:'forum-tanya',    confidence:0.69, can_review:1, created_at:'02/06/26 22:10', label: 'DILAPORKAN' },
  ]

  const [stats, setStats]           = useState(MOCK_STATS)
  const [violations, setViolations] = useState([])
  const [violationsLoading, setViolationsLoading] = useState(true)
  const [daily, setDaily]           = useState(DAILY_FALLBACK)
  const [loadingChart, setLoadingChart] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reviewModal, setReviewModal] = useState(null)  // null | violation object
  const [activeTab, setActiveTab] = useState('violations') // 'violations' | 'users'
  const [users, setUsers]         = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  const [filterWaktu, setFilterWaktu] = useState('semua')
  const [filterRoom,  setFilterRoom]  = useState('semua')
  const [filterLabel, setFilterLabel] = useState('semua')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredViolations = useMemo(() => {
    const now = new Date()
    return violations.filter(v => {
      if (filterWaktu !== 'semua') {
        let d = new Date(v.created_at)
        if (isNaN(d)) {
          const [datePart, timePart] = (v.created_at || '').split(' ')
          const [dd, mm, yy] = (datePart || '').split('/')
          d = new Date(`20${yy}-${mm}-${dd}T${timePart || '00:00'}`)
        }
        if (!isNaN(d)) {
          const diffDays = (now - d) / (1000 * 60 * 60 * 24)
          if (filterWaktu === 'hari'   && diffDays > 1)  return false
          if (filterWaktu === 'minggu' && diffDays > 7)  return false
          if (filterWaktu === 'bulan'  && diffDays > 30) return false
        }
      }
      if (filterRoom  !== 'semua' && v.room_id !== filterRoom)  return false
      if (filterLabel !== 'semua' && v.label   !== filterLabel) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchText     = (v.text     || '').toLowerCase().includes(q)
        const matchUsername = (v.username || '').toLowerCase().includes(q)
        if (!matchText && !matchUsername) return false
      }
      return true
    })
  }, [violations, filterWaktu, filterRoom, filterLabel, searchQuery])

  const roomList = useMemo(() => {
    const ids = [...new Set(violations.map(v => v.room_id).filter(Boolean))]
    return ids.sort()
  }, [violations])

  useEffect(() => {
    getStats()
      .then(r => { setStats(r.data); setDaily(buildDaily(r.data)); setLoadingChart(false) })
      .catch(() => { setLoadingChart(false) })

    const labelParam = filterLabel !== 'semua' ? filterLabel : undefined
    getViolations({ label: labelParam })
      .then(r => { setViolations(r.data?.length ? r.data : MOCK_V); setViolationsLoading(false) })
      .catch(() => { setViolations(MOCK_V); setViolationsLoading(false) })
  }, [filterLabel])

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const r = await getUsers()
      setUsers(r.data)
    } catch { setUsers([]) }
    finally { setUsersLoading(false) }
  }

  const refresh = () => {
    if (refreshing) return
    setRefreshing(true)
    setLoadingChart(true)
    getStats()
      .then(r => { setStats(r.data); setDaily(buildDaily(r.data)); setLoadingChart(false); setRefreshing(false) })
      .catch(() => { setLoadingChart(false); setRefreshing(false) })
    
    if (activeTab === 'users') {
      fetchUsers()
    }
    
    const labelParam = filterLabel !== 'semua' ? filterLabel : undefined
    getViolations({ label: labelParam })
      .then(r => { setViolations(r.data?.length ? r.data : MOCK_V); setViolationsLoading(false) })
      .catch(() => { setViolations(MOCK_V); setViolationsLoading(false) })
  }

  const handleReset = async () => {
    if (!window.confirm('Hapus semua data pesan dan pelanggaran? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      await resetAll()
      // Refresh semua data setelah reset
      setViolations([])
      setStats({ total_messages:0, pantas:0, tidak_pantas:0, meragukan:0, moderation_rate:0 })
      setDaily(DAILY_FALLBACK)
      alert('Semua data berhasil direset.')
    } catch {
      alert('Gagal mereset data. Pastikan server berjalan.')
    }
  }

  const handleDeleteViolation = (id) => {
    if (!window.confirm('Hapus entri pelanggaran ini?')) return
    setViolations(prev => prev.filter(v => v.id !== id))
    deleteViolation(id).catch(() => {
      getViolations().then(r => { if (r.data?.length) setViolations(r.data) })
    })
  }

  // Callback saat admin memutuskan review
  const handleReviewDecision = (violationId, decision) => {
    if (decision === 'approve') {
      // Hapus dari state lokal (backend juga menghapus record)
      setViolations(prev => prev.filter(v => v.id !== violationId))
    } else {
      // Update label di state lokal
      setViolations(prev => prev.map(v =>
        v.id === violationId ? { ...v, label: 'DITOLAK', can_review: 0, reviewed: 1 } : v
      ))
    }
    setReviewModal(null)
  }

  const safeStats = stats || MOCK_STATS
  const pct    = safeStats.total_messages > 0
    ? Math.round(safeStats.pantas / safeStats.total_messages * 100)
    : 94
  const maxBar = Math.max(...daily.map(d => d.total), 1)

  const AVATARS = ['#eff6ff,#1d4ed8','#fef3c7,#d97706','#f0fdf4,#16a34a','#faf5ff,#7c3aed','#fff1f2,#dc2626']

  return (
    <div className="admin-layout">

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          violation={reviewModal}
          onClose={() => setReviewModal(null)}
          onDecision={handleReviewDecision}
        />
      )}

      <div className="admin-topbar">
        <div className="admin-title-block">
          <div className="admin-title">
            Admin Dashboard
            <span className="admin-pill">AI SHIELD</span>
          </div>
          <div className="admin-sub">Pantau aktivitas moderasi sistem AI SHIELD secara real-time</div>
        </div>
        <div className="admin-acts">
          <button className="btn-act" onClick={onBack}>← Kembali</button>
          <button
            className="btn-act primary"
            onClick={refresh}
            disabled={refreshing}
            style={{ opacity: refreshing ? .65 : 1 }}
          >
            {refreshing ? '↻ Memuat...' : '↻ Refresh'}
          </button>
          <button className="btn-act warn" onClick={handleReset}>🗑 Reset Data</button>
        </div>
      </div>

      <div className="admin-body">
        {/* Stats */}
        <div className="stats-row">
          <div className="scard" style={{ animationDelay: '0ms' }}>
            <div className="scard-icon si-blue">💬</div>
            <div className="scard-lbl">Total Pesan</div>
            <div className="scard-val">{safeStats.total_messages.toLocaleString()}</div>
            <div className="scard-sub sc-muted">Semua waktu</div>
          </div>

          <div className="scard" style={{ animationDelay: '70ms' }}>
            <div className="scard-icon si-green">✅</div>
            <div className="scard-lbl">Pesan Pantas</div>
            <div className="scard-val">{safeStats.pantas.toLocaleString()}</div>
            <div className="scard-sub sc-ok">Lolos moderasi</div>
          </div>

          <div className="scard" style={{ animationDelay: '140ms' }}>
            <div className="scard-icon si-red">🚫</div>
            <div className="scard-lbl">Pesan Disembunyikan</div>
            <div className="scard-val">{safeStats.tidak_pantas.toLocaleString()}</div>
            <div className="scard-sub sc-warn">Diblokir AI</div>
          </div>

          <div className="stat-card" style={{ borderTop: '3px solid #d97706', animationDelay: '210ms' }}>
            <div className="stat-icon" style={{ background:'var(--gold-bg)', color:'var(--gold-dk)' }}>⚠</div>
            <div className="stat-body">
              <div className="stat-val">{stats.meragukan ?? 0}</div>
              <div className="stat-label">Meragukan</div>
              <div className="stat-sub">Perlu tinjauan admin</div>
            </div>
          </div>

          <div className="scard" style={{ animationDelay: '280ms' }}>
            <div className="scard-icon si-gold">📊</div>
            <div className="scard-lbl">Tingkat Moderasi</div>
            <div className="scard-val">{`${safeStats.moderation_rate ?? 0}%`}</div>
            <div className="scard-sub sc-gold">Dari total</div>
          </div>
        </div>

        {/* Charts */}
        <div className="chart-row">
          <div className="ccrd">
            <div className="ccrd-title">Distribusi Pesan</div>
            <div className="donut-row">
              <div className="donut" style={{ '--pct': pct }} />
              <div className="donut-legend-list">
                <div className="dleg">
                  <div className="dleg-dot" style={{ background:'var(--green)' }} />
                  Pantas — <strong>{pct}%</strong>
                </div>
                <div className="dleg">
                  <div className="dleg-dot" style={{ background:'var(--red)' }} />
                  Tidak Pantas — <strong>{100-pct}%</strong>
                </div>
                <div style={{ marginTop:6, fontSize:11, color:'var(--text-4)' }}>
                  Total: {safeStats.total_messages.toLocaleString()} pesan
                </div>
              </div>
            </div>
          </div>

          <div className="ccrd">
            <div className="ccrd-title">Aktivitas 7 Hari Terakhir</div>
            {loadingChart ? (
              <div className="bars">
                {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d, idx) => (
                  <div className="bar-row" key={d}>
                    <div className="bar-label">
                      <span style={{ fontWeight:600, color:'var(--text-4)' }}>{d}</span>
                      <span style={{
                        width:90, height:12, borderRadius:6, display:'inline-block',
                        background:'var(--bg-3)', animation:'pulse 1.4s ease infinite',
                      }} />
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{
                        width:`${SKELETON_WIDTHS[idx]}%`,
                        background:'var(--bg-3)',
                        animation:'pulse 1.4s ease infinite',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bars">
                {daily.map(d => (
                  <div className="bar-row" key={d.day}>
                    <div className="bar-label">
                      <span style={{ fontWeight:600 }}>{d.day}</span>
                      <span>
                        <span style={{ color:'var(--text-2)' }}>{d.total} pesan</span>
                        {'  ·  '}
                        <span style={{ color:'var(--red)', fontWeight:600 }}>{d.viol} flagged</span>
                      </span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{
                        width:`${Math.round(d.total / maxBar * 100)}%`,
                        background:'linear-gradient(90deg,var(--blue-2),var(--gold))',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div>
          <div className="sec-hdr" style={{ marginBottom: 12 }}>
            <div className="sec-title">
              {activeTab === 'violations' ? 'Log Pelanggaran Terbaru' : 'Kelola Pengguna'}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>
              {activeTab === 'violations'
                ? `${filteredViolations.length} dari ${violations.length} entri`
                : `${users.length} pengguna`}
            </span>
          </div>

          {/* Tab toggle */}
          <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
            {[
              { key:'violations', label:'📋 Log Pelanggaran' },
              { key:'users',      label:'👥 Kelola Pengguna' },
            ].map(t => (
              <button key={t.key}
                onClick={() => { setActiveTab(t.key); if(t.key==='users') fetchUsers() }}
                style={{
                  padding:'8px 18px', border:'none', borderBottom: activeTab===t.key ? '2px solid var(--blue-2)' : '2px solid transparent',
                  background:'none', color: activeTab===t.key ? 'var(--blue-2)' : 'var(--text-3)',
                  fontWeight: activeTab===t.key ? 600 : 400, cursor:'pointer', fontSize:13,
                  fontFamily:'var(--font-sans)', transition:'all .15s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Tab konten */}
          {activeTab === 'violations' && (
            <>
              {/* Filter bar */}
              <div className="filter-bar">
                <div className="filter-search-wrap">
                  <span className="filter-search-icon">🔍</span>
                  <input
                    className="filter-search"
                    type="text"
                    placeholder="Cari pesan atau pengguna..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="filter-clear-btn" onClick={() => setSearchQuery('')} title="Hapus pencarian">✕</button>
                  )}
                </div>

                <div className="filter-group">
                  <span className="filter-label">Waktu:</span>
                  <div className="filter-tabs">
                    {[
                      { key: 'hari',   label: 'Hari Ini' },
                      { key: 'minggu', label: 'Minggu Ini' },
                      { key: 'bulan',  label: 'Bulan Ini' },
                      { key: 'semua',  label: 'Semua' },
                    ].map(f => (
                      <button
                        key={f.key}
                        className={`filter-tab ${filterWaktu === f.key ? 'active' : ''}`}
                        onClick={() => setFilterWaktu(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <span className="filter-label">Room:</span>
                  <select
                    className="filter-select"
                    value={filterRoom}
                    onChange={e => setFilterRoom(e.target.value)}
                  >
                    <option value="semua">Semua Room</option>
                    {roomList.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Label */}
                <div className="filter-group">
                  <span className="filter-label">Label:</span>
                  <div className="filter-tabs">
                    {[
                      { key: 'semua',        label: 'Semua' },
                      { key: 'MERAGUKAN',    label: '⚠ Meragukan' },
                      { key: 'TIDAK PANTAS', label: '⛔ Tidak Pantas' },
                      { key: 'DILAPORKAN',   label: '🚩 Dilaporkan' },
                    ].map(f => (
                      <button
                        key={f.key}
                        className={`filter-tab ${filterLabel === f.key ? 'active' : ''}`}
                        onClick={() => setFilterLabel(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(filterWaktu !== 'semua' || filterRoom !== 'semua' || filterLabel !== 'semua' || searchQuery) && (
                  <button
                    className="filter-reset-btn"
                    onClick={() => { setFilterWaktu('semua'); setFilterRoom('semua'); setFilterLabel('semua'); setSearchQuery('') }}
                  >
                    ✕ Reset Filter
                  </button>
                )}
              </div>

              {/* Tabel */}
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Pengguna</th><th>Isi Pesan</th><th>Label</th>
                      <th>Room</th><th>Confidence AI</th><th>Waktu</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violationsLoading ? (
                      <tr>
                        <td colSpan={8}>
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                            <span className="sdot wait" style={{ marginRight: 8 }} />
                            Memuat log pelanggaran...
                          </div>
                        </td>
                      </tr>
                    ) : violations.length === 0 ? (
                      <tr><td colSpan={8}><div className="empty-tbl">✅ Belum ada pelanggaran tercatat</div></td></tr>
                    ) : filteredViolations.length === 0 ? (
                      <tr><td colSpan={8}><div className="empty-tbl">🔍 Tidak ada hasil untuk filter ini</div></td></tr>
                    ) : filteredViolations.map((v, i) => {
                        const [bg, fg]  = AVATARS[i % AVATARS.length].split(',')
                        const confPct   = Math.round((v.confidence || 0) * 100)
                        const confColor = v.confidence > .85 ? 'var(--red)' : v.confidence > .7 ? 'var(--gold-dk)' : 'var(--green)'
                        return (
                          <tr key={v.id ?? i}>
                            <td style={{ fontWeight:700, color:'var(--text-3)' }}>{v.id}</td>
                            <td>
                              <div className="uchip">
                                <div className="uavatar" style={{ background:bg, color:fg }}>
                                  {(v.username || '?').slice(0,2).toUpperCase()}
                                </div>
                                {v.username || '—'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500, color: 'var(--text-2)', fontSize: 13 }}>
                                "{v.text?.length > 60 ? v.text.slice(0, 60) + '…' : (v.text || '—')}"
                              </div>
                              {/* Badge Review Diminta — sekarang tombol yang bisa diklik */}
                              {v.can_review === 1 && (
                                <button
                                  className="review-badge-btn"
                                  onClick={() => setReviewModal(v)}
                                  title="Klik untuk meninjau pesan ini"
                                >
                                  📋 Review Diminta
                                </button>
                              )}
                            </td>
                            <td>
                              <span className={`badge-label ${v.label === 'MERAGUKAN' ? 'badge-warn' : v.label === 'DILAPORKAN' ? 'badge-flag' : v.label === 'DITOLAK' ? 'badge-reject' : 'badge-viol'}`}>
                                {v.label === 'MERAGUKAN'   ? '⚠ Meragukan'
                                 : v.label === 'DILAPORKAN' ? '🚩 Dilaporkan'
                                 : v.label === 'DITOLAK'    ? '🚫 Ditolak'
                                 :                           '⛔ Tidak Pantas'}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600,
                                background:'var(--bg-3)', color:'var(--text-2)', border:'1px solid var(--border)',
                              }}>{v.room_id || '—'}</span>
                            </td>
                            <td>
                              <div className="conf-row">
                                <div className="conf-track">
                                  <div className="conf-fill" style={{ width:`${confPct}%`, background:confColor }} />
                                </div>
                                <span style={{ fontWeight:700, fontSize:12, color:confColor }}>{confPct}%</span>
                              </div>
                            </td>
                            <td style={{ color:'var(--text-3)', whiteSpace:'nowrap', fontSize:12 }}>{v.created_at || '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn-delete-row"
                                onClick={() => handleDeleteViolation(v.id)}
                                title="Hapus entri ini"
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="tbl-wrap">
              <table className="viol-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Tanggal Daftar</th>
                    <th style={{textAlign:'center'}}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'var(--text-4)'}}>Memuat data pengguna...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5}><div className="empty-tbl">Belum ada pengguna terdaftar</div></td></tr>
                  ) : users.map((u, i) => (
                    <tr key={u.id}>
                      <td style={{color:'var(--text-4)',fontSize:12}}>{i+1}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{
                            width:28,height:28,borderRadius:'50%',
                            background:'var(--blue-bg)',color:'var(--blue-2)',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:11,fontWeight:700,flexShrink:0,
                          }}>
                            {(u.username||'?').slice(0,2).toUpperCase()}
                          </div>
                          <span style={{fontWeight:500}}>{u.username}</span>
                        </div>
                      </td>
                      <td style={{color:'var(--text-3)',fontSize:12}}>{u.email}</td>
                      <td style={{color:'var(--text-4)',fontSize:12}}>{u.created_at}</td>
                      <td style={{textAlign:'center'}}>
                        <button
                          className="btn-delete-row"
                          title="Hapus akun pengguna ini"
                          onClick={async () => {
                            if (!window.confirm(`Hapus akun "${u.username}"? Tindakan ini tidak dapat dibatalkan.`)) return
                            try {
                              await deleteUser(u.id)
                              setUsers(p => p.filter(x => x.id !== u.id))
                            } catch { alert('Gagal menghapus akun.') }
                          }}
                        >🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
