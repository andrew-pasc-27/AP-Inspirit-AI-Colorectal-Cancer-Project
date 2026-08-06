const COLORS = {
  tumor: '#ef4444',
  stroma: '#f59e0b',
  lympho: '#f97316',
  mucosa: '#22c55e',
  adipose: '#a16207',
  debris: '#6b7280',
  complex: '#3b82f6',
  empty: '#94a3b8',
}

const EMOJIS = {
  tumor: '🔴', stroma: '🟡', lympho: '🟠', mucosa: '🟢',
  adipose: '🟤', debris: '⚫', complex: '🔵', empty: '⬜',
}

export default function ConfidenceBar({ label, score, isTop }) {
  const pct = Math.round(score * 100)
  const color = COLORS[label] || '#3b82f6'

  return (
    <div style={{ marginBottom: '0.625rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.25rem',
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: isTop ? 700 : 400,
          color: isTop ? '#0f172a' : '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}>
          {EMOJIS[label]} {label.charAt(0).toUpperCase() + label.slice(1)}
          {isTop && <span style={{
            fontSize: 10,
            background: color,
            color: '#fff',
            borderRadius: 4,
            padding: '1px 6px',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}>TOP</span>}
        </span>
        <span style={{
          fontSize: 13,
          fontWeight: isTop ? 700 : 400,
          color: isTop ? color : '#64748b',
        }}>{pct}%</span>
      </div>

      <div style={{
        height: isTop ? 10 : 6,
        background: '#e2e8f0',
        borderRadius: 999,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: isTop
            ? `linear-gradient(90deg, ${color}cc, ${color})`
            : color + '88',
          borderRadius: 999,
          transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
    </div>
  )
}
