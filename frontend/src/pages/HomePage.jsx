const OPTIONS = [
  {
    id: 'diagnosis',
    icon: '🔬',
    title: 'Tissue Diagnosis',
    desc: 'Upload a colorectal histology image and get an instant AI classification with confidence scores and clinical guidance.',
    color: '#3b82f6',
    cta: 'Start diagnosis',
  },
  {
    id: 'game',
    icon: '🎮',
    title: 'Guesser',
    desc: 'Train your eye like a pathologist. Guess the tissue type, beat your high score, and learn as you go.',
    color: '#8b5cf6',
    cta: 'Play the game',
  },
  {
    id: 'twin',
    icon: '🧍',
    title: 'Digital Twin',
    desc: 'Explore a 3D model of the body. Toggle cancer, stage, and the 8 tissue types to visualise what may be happening.',
    color: '#10b981',
    cta: 'Open the twin',
  },
  {
    id: 'doctor',
    icon: '👨‍⚕️',
    title: '(AI) Dr. Alex',
    desc: 'Chat anytime with your AI medical companion about results, treatments, next steps, or just how you feel.',
    color: '#0ea5e9',
    cta: 'Talk to Dr. Alex',
  },
]

export default function HomePage({ setActivePage }) {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Hero */}
      <div className="fade-up" style={{
        background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
        borderRadius: 24,
        padding: '3rem 2.5rem',
        marginBottom: '2rem',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, fontSize: 200, opacity: 0.07 }}>🧬</div>
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 20,
            padding: '0.375rem 1rem',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: '1rem',
          }}>
            🧬 AI-Powered Histology
          </div>
          <h1 className="hero-title" style={{ fontSize: 40, fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.1 }}>
            Colorectal Cancer Colleague
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', maxWidth: 560, lineHeight: 1.6 }}>
            Your companion for understanding colorectal tissue. Analyse histology images,
            test your knowledge, and talk to an AI doctor — all in one place.
          </p>
        </div>
      </div>

      {/* 3 options */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
        What would you like to do?
      </h2>
      <div className="home-grid">
        {OPTIONS.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => setActivePage(opt.id)}
            className="fade-up"
            style={{
              animationDelay: `${i * 0.08}s`,
              background: '#fff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 20,
              padding: '1.75rem',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'all 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 12px 28px ${opt.color}33`
              e.currentTarget.style.borderColor = opt.color
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
              e.currentTarget.style.borderColor = '#e2e8f0'
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `${opt.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>{opt.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{opt.title}</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, flex: 1 }}>{opt.desc}</div>
            <div style={{
              marginTop: '0.25rem',
              color: opt.color,
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}>
              {opt.cta} →
            </div>
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: '2rem' }}>
        ⚠️ For educational purposes only — not a medical device and not a substitute for professional medical advice.
      </p>
    </div>
  )
}
