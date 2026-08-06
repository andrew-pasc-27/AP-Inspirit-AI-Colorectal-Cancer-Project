const NAV = [
  { id: 'diagnosis', icon: '🔬', label: 'Diagnosis' },
  { id: 'game', icon: '🎮', label: 'Guesser' },
  { id: 'twin', icon: '🧍', label: 'Digital Twin' },
  { id: 'doctor', icon: '👨‍⚕️', label: '(AI) Dr. Alex' },
  { id: 'about', icon: 'ℹ️', label: 'About' },
]

export default function Sidebar({ activePage, setActivePage, open, isMobile }) {
  const mobileStyle = isMobile ? {
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    zIndex: 300,
    width: open ? 220 : 0,
  } : {
    width: open ? 204 : 0,
  }
  return (
    <aside className="sidebar" style={{
      ...mobileStyle,
      flexShrink: 0,
      padding: open ? '4.5rem 0.75rem 0.75rem' : 0,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    }}>
      <div style={{
        background: '#0f172a',
        borderRadius: 20,
        height: 'calc(100vh - 5.25rem)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0',
        boxShadow: '0 8px 30px rgba(15,23,42,0.2)',
        minWidth: 188,
      }}>
        {/* Label */}
        <div style={{ padding: '0.25rem 1.25rem 0.75rem', color: '#64748b', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          Menu
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 0.625rem' }}>
          {NAV.map(item => {
            const active = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                  padding: '0.7rem 0.875rem', marginBottom: '0.25rem', borderRadius: 12,
                  border: 'none',
                  background: active ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: active ? '#60a5fa' : '#94a3b8',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                  borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1' }}
                onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(59,130,246,0.2)' : 'transparent'; e.currentTarget.style.color = active ? '#60a5fa' : '#94a3b8' }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.25rem 0.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', color: '#475569', fontSize: 11, whiteSpace: 'normal' }}>
          <div style={{ marginBottom: 4 }}>⚠️ Educational use only</div>
          <div>Not medical advice</div>
        </div>
      </div>
    </aside>
  )
}
