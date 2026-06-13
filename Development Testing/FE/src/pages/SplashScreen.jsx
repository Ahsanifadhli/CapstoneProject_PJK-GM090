import React, { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [phase, setPhase] = useState(0)
  // phase 0 = logo muncul, phase 1 = tagline muncul, phase 2 = progress bar penuh

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="splash-screen">
      {/* Background animated particles */}
      <div className="splash-particles">
        {[...Array(14)].map((_, i) => (
          <div key={i} className={`splash-particle splash-p${i % 4}`} style={{
            left: `${5 + i * 7}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: `${2 + (i % 4) * 0.5}s`
          }} />
        ))}
      </div>

      {/* Center content */}
      <div className="splash-center">

        {/* Shield icon dengan ring animasi */}
        <div className={`splash-logo-wrap ${phase >= 0 ? 'splash-visible' : ''}`}>
          <div className="splash-ring splash-ring-1" />
          <div className="splash-ring splash-ring-2" />
          <div className="splash-ring splash-ring-3" />
          <div className="splash-icon">🛡</div>
        </div>

        {/* Brand name */}
        <div className={`splash-brand ${phase >= 0 ? 'splash-visible' : ''}`}>
          AI <span>SHIELD</span>
        </div>

        {/* Tagline muncul setelah phase 1 */}
        <div className={`splash-tagline ${phase >= 1 ? 'splash-tagline-show' : ''}`}>
          Smart Handling of Integrity in Ethical Live Dialogue
        </div>

        {/* Powered by badge */}
        <div className={`splash-powered ${phase >= 1 ? 'splash-tagline-show' : ''}`}>
          <span className="splash-dot-live" />
          Powered by IndoBERT · Accuracy 90.33%
        </div>

        {/* Progress bar */}
        <div className="splash-progress-wrap">
          <div className={`splash-progress-bar ${phase >= 2 ? 'splash-progress-full' : ''}`} />
        </div>

        {/* Loading text */}
        <div className="splash-loading-text">
          {phase === 0 && 'Memuat sistem...'}
          {phase === 1 && 'Menginisialisasi moderasi AI...'}
          {phase === 2 && 'Siap! Mengalihkan...'}
        </div>
      </div>
    </div>
  )
}
