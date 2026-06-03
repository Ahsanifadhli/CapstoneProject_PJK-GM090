import React from "react"
import { useEffect, useState } from 'react'
import { getViolations, getStats, resetAll } from '../services/api'

const MOCK_STATS = { total_messages:1284, pantas:1201, tidak_pantas:83, moderation_rate:6.5 }
const MOCK_V = [
  { id:83, username:'user_anonim', text:'pesan mengandung ujaran kebencian...', room_id:'forum-umum', confidence:0.94, created_at:'03/06/26 09:17' },
  { id:82, username:'budi123',     text:'konten mengandung kata-kata kasar...', room_id:'forum-umum', confidence:0.87, created_at:'03/06/26 08:54' },
  { id:81, username:'rizal_dev',   text:'kata-kata kasar terdeteksi...',        room_id:'forum-tugas', confidence:0.76, created_at:'03/06/26 08:31' },
  { id:80, username:'anon_user2',  text:'ungkapan tidak pantas dalam diskusi...',room_id:'forum-aishield',confidence:0.91,created_at:'03/06/26 07:58' },
  { id:79, username:'mhs99',       text:'pesan melanggar aturan akademik...',   room_id:'forum-tanya', confidence:0.69, created_at:'02/06/26 22:10' },
]
const DAILY = [
  { day:'Sen',total:210,viol:12 },{ day:'Sel',total:185,viol:9 },
  { day:'Rab',total:230,viol:15 },{ day:'Kam',total:198,viol:11 },
  { day:'Jum',total:267,viol:18 },{ day:'Sab',total:124,viol:8 },
  { day:'Min',total:70, viol:10 },
]

export default function AdminDashboard({ onBack }) {
  const [stats, setStats]           = useState(MOCK_STATS)
  const [violations, setViolations] = useState(MOCK_V)

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(() => {})
    getViolations().then(r => { if(r.data?.length) setViolations(r.data) }).catch(() => {})
  }, [])

  const refresh = () => {
    getStats().then(r => setStats(r.data)).catch(() => {})
    getViolations().then(r => { if(r.data?.length) setViolations(r.data) }).catch(() => {})
  }

  const handleReset = () => {
    if (!window.confirm('Hapus semua data? Tidak bisa dibatalkan.')) return
    resetAll().then(() => { setStats(MOCK_STATS); setViolations([]) }).catch(() => {})
  }

  const pct = stats ? Math.round(stats.pantas / (stats.total_messages||1) * 100) : 94
  const maxBar = Math.max(...DAILY.map(d => d.total))

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
          <button className="btn-act primary" onClick={refresh}>↻ Refresh</button>
          <button className="btn-act warn" onClick={handleReset}>🗑 Reset Data</button>
        </div>
      </div>

      <div className="admin-body">
        {/* Stats */}
        <div className="stats-row">
          {[
            { icon:'💬', cls:'si-blue',  lbl:'Total Pesan',        val:stats.total_messages.toLocaleString(), sub:'Semua waktu',   sc:'sc-muted' },
            { icon:'✅', cls:'si-green', lbl:'Pesan Pantas',        val:stats.pantas.toLocaleString(),         sub:'Lolos moderasi',sc:'sc-ok'   },
            { icon:'🚫', cls:'si-red',   lbl:'Pesan Disembunyikan', val:stats.tidak_pantas.toLocaleString(),   sub:'Diblokir AI',   sc:'sc-warn'  },
            { icon:'📊', cls:'si-gold',  lbl:'Tingkat Moderasi',    val:`${stats.moderation_rate}%`,           sub:'Dari total',    sc:'sc-gold'  },
          ].map((s,i) => (
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
                  Total: {stats.total_messages.toLocaleString()} pesan
                </div>
              </div>
            </div>
          </div>

          <div className="ccrd">
            <div className="ccrd-title">Aktivitas 7 Hari Terakhir</div>
            <div className="bars">
              {DAILY.map(d => (
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
                      width:`${Math.round(d.total/maxBar*100)}%`,
                      background:'linear-gradient(90deg,var(--blue-2),var(--gold))',
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div>
          <div className="sec-hdr">
            <div className="sec-title">Log Pelanggaran Terbaru</div>
            <span style={{ fontSize:12, color:'var(--text-4)' }}>{violations.length} entri</span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Pengguna</th><th>Isi Pesan</th>
                  <th>Room</th><th>Confidence AI</th><th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {violations.length === 0
                  ? <tr><td colSpan={6}><div className="empty-tbl">✅ Belum ada pelanggaran</div></td></tr>
                  : violations.map((v,i) => {
                      const [bg, fg] = AVATARS[i % AVATARS.length].split(',')
                      const confPct  = Math.round(v.confidence * 100)
                      const confColor= v.confidence>.85?'var(--red)':v.confidence>.7?'var(--gold-dk)':'var(--green)'
                      return (
                        <tr key={v.id}>
                          <td style={{ fontWeight:700, color:'var(--text-3)' }}>{v.id}</td>
                          <td>
                            <div className="uchip">
                              <div className="uavatar" style={{ background:bg, color:fg }}>
                                {v.username?.slice(0,2).toUpperCase()}
                              </div>
                              {v.username}
                            </div>
                          </td>
                          <td>
                            <span className="badge-viol">Tidak Pantas</span>
                            <span style={{ color:'var(--text-3)', fontSize:12 }}>
                              {v.text?.length>55 ? v.text.slice(0,55)+'…' : v.text}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600,
                              background:'var(--bg-3)', color:'var(--text-2)', border:'1px solid var(--border)',
                            }}>{v.room_id}</span>
                          </td>
                          <td>
                            <div className="conf-row">
                              <div className="conf-track">
                                <div className="conf-fill" style={{ width:`${confPct}%`, background:confColor }}/>
                              </div>
                              <span style={{ fontWeight:700, fontSize:12, color:confColor }}>{confPct}%</span>
                            </div>
                          </td>
                          <td style={{ color:'var(--text-3)', whiteSpace:'nowrap', fontSize:12 }}>{v.created_at}</td>
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

