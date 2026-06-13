import React, { useEffect, useState, useRef, useMemo } from 'react'
import { getViolations, getStats, resetAll, deleteViolation } from '../services/api'

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

export default function AdminDashboard({ onBack }) {
  const MOCK_STATS = { total_messages:1284, pantas:1201, tidak_pantas:83, moderation_rate:6.5 }
  const MOCK_V = [
    { id:5, username:'user_anonim', text:'dasar anjing lo, ga bisa kerja kelompok!', room_id:'forum-umum',     confidence:0.95, can_review:0, created_at:'03/06/26 09:17' },
    { id:4, username:'budi123',     text:'tolol banget sih, baca dulu sebelum nanya', room_id:'forum-umum',     confidence:0.87, can_review:0, created_at:'03/06/26 08:54' },
    { id:3, username:'rizal_dev',   text:'goblok, masa tugas segini ga kelar',        room_id:'forum-tugas',    confidence:0.76, can_review:1, created_at:'03/06/26 08:31' },
    { id:2, username:'anon_user2',  text:'brengsek lo, ngumpulin tugas mepet mulu',  room_id:'forum-aishield', confidence:0.91, can_review:0, created_at:'03/06/26 07:58' },
    { id:1, username:'mhs99',       text:'sialan, ngerti ga sih penjelasan dosen?',  room_id:'forum-tanya',    confidence:0.69, can_review:1, created_at:'02/06/26 22:10' },
  ]

  const [stats, setStats]           = useState(MOCK_STATS)
  const [violations, setViolations] = useState([])
  const [violationsLoading, setViolationsLoading] = useState(true)
  const [daily, setDaily]           = useState(DAILY_FALLBACK)
  const [loadingChart, setLoadingChart] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [filterWaktu, setFilterWaktu] = useState('semua')   // 'hari' | 'minggu' | 'bulan' | 'semua'
  const [filterRoom,  setFilterRoom]  = useState('semua')   // 'semua' | 'forum-umum' | dll
  const [searchQuery, setSearchQuery] = useState('')

  const filteredViolations = useMemo(() => {
    const now = new Date()

    return violations.filter(v => {
      // ── Filter waktu ──
      if (filterWaktu !== 'semua') {
        // Format created_at dari BE: "2026-06-12 14:53:10" atau "03/06/26 09:17"
        let d = new Date(v.created_at)
        if (isNaN(d)) {
          // Format "DD/MM/YY HH:mm"
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

      // ── Filter room ──
      if (filterRoom !== 'semua' && v.room_id !== filterRoom) return false

      // ── Search ──
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchText     = (v.text     || '').toLowerCase().includes(q)
        const matchUsername = (v.username || '').toLowerCase().includes(q)
        if (!matchText && !matchUsername) return false
      }

      return true
    })
  }, [violations, filterWaktu, filterRoom, searchQuery])

  // Daftar room unik dari violations (untuk dropdown)
  const roomList = useMemo(() => {
    const ids = [...new Set(violations.map(v => v.room_id).filter(Boolean))]
    return ids.sort()
  }, [violations])

  useEffect(() => {
    getStats()
      .then(r => {
        setStats(r.data)
        setDaily(buildDaily(r.data))
        setLoadingChart(false)
      })
      .catch(() => { setLoadingChart(false) })

    getViolations()
      .then(r => {
        setViolations(r.data?.length ? r.data : MOCK_V)
        setViolationsLoading(false)
      })
      .catch(() => {
        setViolations(MOCK_V)
        setViolationsLoading(false)
      })
  }, [])

  const refresh = () => {
    if (refreshing) return
    setRefreshing(true)
    setLoadingChart(true)
    getStats()
      .then(r => { setStats(r.data); setDaily(buildDaily(r.data)); setLoadingChart(false); setRefreshing(false) })
      .catch(() => { setLoadingChart(false); setRefreshing(false) })
    getViolations()
      .then(r => {
        setViolations(r.data?.length ? r.data : MOCK_V)
        setViolationsLoading(false)
      })
      .catch(() => {
        setViolations(MOCK_V)
        setViolationsLoading(false)
      })
  }

  const handleReset = () => {
    if (!window.confirm('Hapus semua data? Tidak bisa dibatalkan.')) return
    resetAll()
      .then(() => {
        setStats({ total_messages:0, pantas:0, tidak_pantas:0, moderation_rate:0 })
        setViolations([])
        setDaily(DAILY_FALLBACK)
      })
      .catch(() => {})
  }

  const handleDeleteViolation = (id) => {
    if (!window.confirm('Hapus entri pelanggaran ini?')) return
    // Hapus dari state lokal langsung (optimistic update)
    setViolations(prev => prev.filter(v => v.id !== id))
    // Kirim ke BE untuk hapus dari DB
    deleteViolation(id).catch(() => {
      // Jika BE gagal, kembalikan data (refresh)
      getViolations().then(r => { if (r.data?.length) setViolations(r.data) })
    })
  }

  const safeStats = stats || MOCK_STATS
  const pct    = safeStats.total_messages > 0
    ? Math.round(safeStats.pantas / safeStats.total_messages * 100)
    : 94
  const maxBar = Math.max(...daily.map(d => d.total), 1)

  const AVATARS = ['#eff6ff,#1d4ed8','#fef3c7,#d97706','#f0fdf4,#16a34a','#faf5ff,#7c3aed','#fff1f2,#dc2626']

  return (
    <div className="admin-layout">
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
          {[
            { icon:'💬', cls:'si-blue',  lbl:'Total Pesan',        val:safeStats.total_messages.toLocaleString(), sub:'Semua waktu',    sc:'sc-muted' },
            { icon:'✅', cls:'si-green', lbl:'Pesan Pantas',        val:safeStats.pantas.toLocaleString(),         sub:'Lolos moderasi', sc:'sc-ok'    },
            { icon:'🚫', cls:'si-red',   lbl:'Pesan Disembunyikan', val:safeStats.tidak_pantas.toLocaleString(),   sub:'Diblokir AI',    sc:'sc-warn'  },
            { icon:'📊', cls:'si-gold',  lbl:'Tingkat Moderasi',    val:`${safeStats.moderation_rate ?? 0}%`,      sub:'Dari total',     sc:'sc-gold'  },
          ].map((s, i) => (
            <div className="scard" key={i} style={{ animationDelay:`${i*70}ms` }}>
              <div className={`scard-icon ${s.cls}`}>{s.icon}</div>
              <div className="scard-lbl">{s.lbl}</div>
              <div className="scard-val">{s.val}</div>
              <div className={`scard-sub ${s.sc}`}>{s.sub}</div>
            </div>
          ))}
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

            {/* Bar chart skeleton saat loading — lebar statis agar tidak flicker */}
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
          {/* ── Section header ── */}
          <div className="sec-hdr" style={{ marginBottom: 12 }}>
            <div className="sec-title">Log Pelanggaran Terbaru</div>
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>
              {filteredViolations.length} dari {violations.length} entri
            </span>
          </div>

          {/* ── Filter bar ── */}
          <div className="filter-bar">

            {/* Search */}
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

            {/* Filter Waktu */}
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

            {/* Filter Room */}
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

            {/* Reset filter */}
            {(filterWaktu !== 'semua' || filterRoom !== 'semua' || searchQuery) && (
              <button
                className="filter-reset-btn"
                onClick={() => { setFilterWaktu('semua'); setFilterRoom('semua'); setSearchQuery('') }}
              >
                ✕ Reset Filter
              </button>
            )}
          </div>

          {/* ── Tabel ── */}
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Pengguna</th><th>Isi Pesan</th>
                  <th>Room</th><th>Confidence AI</th><th>Waktu</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {violationsLoading ? (
                  <tr>
                    <td colSpan={7}>
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                        <span className="sdot wait" style={{ marginRight: 8 }} />
                        Memuat log pelanggaran...
                      </div>
                    </td>
                  </tr>
                ) : violations.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-tbl">✅ Belum ada pelanggaran tercatat</div></td></tr>
                ) : filteredViolations.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-tbl">🔍 Tidak ada hasil untuk filter ini</div></td></tr>
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
                          {/* Teks asli pesan — ini yang paling penting ditampilkan */}
                          <div style={{ fontWeight: 500, color: 'var(--text-2)', fontSize: 13, marginBottom: 4 }}>
                            "{v.text?.length > 60 ? v.text.slice(0, 60) + '\u2026' : (v.text || '\u2014')}"
                          </div>
                          {/* Label kategori di bawah teks */}
                          <span className="badge-viol" style={{ fontSize: 10 }}>
                            ⛔ Tidak Pantas
                          </span>
                          {v.can_review === 1 && (
                            <span style={{
                              marginLeft: 6, fontSize: 10, padding: '1px 6px',
                              borderRadius: 99, background: 'var(--gold-bg)',
                              color: 'var(--gold-dk)', border: '1px solid var(--gold-border)',
                              fontWeight: 600,
                            }}>
                              📋 Review Diminta
                            </span>
                          )}
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
        </div>
      </div>
    </div>
  )
}
