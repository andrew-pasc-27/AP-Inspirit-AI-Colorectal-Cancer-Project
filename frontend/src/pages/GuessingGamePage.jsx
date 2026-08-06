import { useState, useEffect } from 'react'

const CLASS_LABELS = ['adipose', 'complex', 'debris', 'empty', 'lympho', 'mucosa', 'stroma', 'tumor']
const LABEL_INFO = {
  adipose: { emoji: '🟤', hint: 'This tissue type consists mainly of fat cells with large, clear vacuoles.' },
  complex: { emoji: '🔵', hint: 'Irregular glandular structures with distorted crypt architecture.' },
  debris: { emoji: '⚫', hint: 'Dead or dying cells — look for fragmented, irregular dark material.' },
  empty: { emoji: '⬜', hint: 'Mostly acellular — you may see a lumen or processing artifact.' },
  lympho: { emoji: '🟠', hint: 'Densely packed small round cells — these are immune cells.' },
  mucosa: { emoji: '🟢', hint: 'Healthy colon tissue with regular, well-organised crypts.' },
  stroma: { emoji: '🟡', hint: 'Connective tissue — spindly cells in a fibrous matrix.' },
  tumor: { emoji: '🔴', hint: 'Abnormal, chaotic glands with irregular nuclei — cancer tissue.' },
}
const HS_KEY = 'ccc_highscore'

export default function GuessingGamePage() {
  const [samples, setSamples] = useState([])
  const [started, setStarted] = useState(false)
  const [currentSample, setCurrentSample] = useState(null)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [newRecord, setNewRecord] = useState(false)

  useEffect(() => {
    fetch('/api/samples').then(r => r.json()).then(data => setSamples(data.samples || []))
    setHighScore(Number(localStorage.getItem(HS_KEY) || 0))
  }, [])

  function pickRandom(pool) {
    const p = pool || samples
    if (!p.length) return
    setCurrentSample(p[Math.floor(Math.random() * p.length)])
    setSelected(null); setRevealed(false); setShowHint(false)
  }

  function startGame() {
    setScore(0); setRound(0); setStreak(0); setNewRecord(false)
    setStarted(true)
    pickRandom()
  }

  function guess(label) {
    if (revealed) return
    setSelected(label); setRevealed(true)
    const correct = label === currentSample.label
    if (correct) {
      const gained = showHint ? 0 : 1
      const newScore = score + gained
      setScore(newScore)
      setStreak(s => s + 1)
      if (newScore > highScore) {
        setHighScore(newScore)
        localStorage.setItem(HS_KEY, String(newScore))
        setNewRecord(true)
      }
    } else {
      setStreak(0)
    }
    setRound(r => r + 1)
  }

  if (!samples.length) return (
    <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ fontSize: 48 }}>⏳</div>
      <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading samples…</p>
    </div>
  )

  /* Start screen */
  if (!started) return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: '2rem' }}>
      <div className="fade-up" style={{
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
        borderRadius: 24, padding: '3rem 2rem', textAlign: 'center', color: '#fff',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: 64, marginBottom: '1rem' }}>🎮</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: '0.5rem' }}>Guesser</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 1.5rem' }}>
          Can you identify the tissue type like a real pathologist? You get 1 point per correct
          guess. Using a hint scores that round as 0. Beat your high score!
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '0.625rem 1.25rem', marginBottom: '1.5rem',
        }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>High Score: {highScore}</span>
        </div>
        <div>
          <button onClick={startGame} style={{
            padding: '0.875rem 2.5rem', borderRadius: 14, border: 'none',
            background: '#fff', color: '#7c3aed', fontFamily: 'inherit',
            fontSize: 17, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>▶ Start Game</button>
        </div>
      </div>
    </div>
  )

  /* Game screen */
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>🎮 Guesser</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Streak: {streak} 🔥</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <StatCard value={`${score}/${round}`} label="Score" color="#7c3aed" />
          <StatCard value={`🏆 ${highScore}`} label="High Score" color="#f59e0b" />
          <button onClick={() => setStarted(false)} style={{
            padding: '0 1rem', borderRadius: 12, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
          }}>Quit</button>
        </div>
      </div>

      <div className="two-col">
        {/* Left: image + hint */}
        <div>
          <div style={{ background: '#fff', borderRadius: 20, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
            {currentSample && (
              <img src={`/api/samples/${currentSample.filename}`} alt="Guess this tissue"
                style={{ width: '100%', borderRadius: 14, display: 'block' }} />
            )}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {!showHint ? (
              <button onClick={() => setShowHint(true)} style={{
                width: '100%', padding: '0.625rem', borderRadius: 12, border: '1.5px dashed #cbd5e1',
                background: 'transparent', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              }}>💡 Show Hint (this round scores 0)</button>
            ) : (
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                💡 <strong>Hint:</strong> {LABEL_INFO[currentSample?.label]?.hint}
              </p>
            )}
          </div>
        </div>

        {/* Right: guesses + result */}
        <div>
          <div style={{ background: '#fff', borderRadius: 20, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>What type of tissue is this?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {CLASS_LABELS.map(label => {
                const isCorrect = label === currentSample?.label
                const isSelected = label === selected
                let bg = '#f8fafc', border = '#e2e8f0', color = '#1e293b'
                if (revealed) {
                  if (isCorrect) { bg = '#f0fdf4'; border = '#86efac'; color = '#166534' }
                  else if (isSelected) { bg = '#fef2f2'; border = '#fca5a5'; color = '#991b1b' }
                }
                return (
                  <button key={label} onClick={() => guess(label)} disabled={revealed} style={{
                    padding: '0.625rem 0.75rem', borderRadius: 12, border: `1.5px solid ${border}`,
                    background: bg, color, cursor: revealed ? 'default' : 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: isSelected || (revealed && isCorrect) ? 700 : 400,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <span>{LABEL_INFO[label]?.emoji}</span>
                    <span style={{ textTransform: 'capitalize' }}>{label}</span>
                    {revealed && isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    {revealed && isSelected && !isCorrect && <span style={{ marginLeft: 'auto' }}>✗</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {revealed && (
            <div className="fade-up" style={{
              background: selected === currentSample?.label ? '#f0fdf4' : '#fef2f2',
              border: `1.5px solid ${selected === currentSample?.label ? '#86efac' : '#fca5a5'}`,
              borderRadius: 20, padding: '1.25rem', textAlign: 'center',
            }}>
              {newRecord && selected === currentSample?.label && (
                <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309', marginBottom: '0.5rem' }}>🏆 New High Score!</div>
              )}
              <div style={{ fontSize: 32, marginBottom: '0.5rem' }}>{selected === currentSample?.label ? '🎉' : '😅'}</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                {selected === currentSample?.label ? 'Correct!' : `It was ${currentSample?.label}`}
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: '1rem' }}>{LABEL_INFO[currentSample?.label]?.hint}</div>
              <button onClick={() => pickRandom()} style={{
                padding: '0.625rem 1.5rem', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', color: '#fff',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Next Image →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '0.5rem 1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center', minWidth: 80 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
    </div>
  )
}
