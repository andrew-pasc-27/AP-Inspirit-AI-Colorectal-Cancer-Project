import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import ConfidenceBar from '../components/ConfidenceBar.jsx'

const TISSUE_SEVERITY_COLOR = { high: '#fef2f2', moderate: '#fffbeb', low: '#f0fdf4' }
const TISSUE_SEVERITY_BORDER = { high: '#fca5a5', moderate: '#fcd34d', low: '#86efac' }

export default function DiagnosisPage({ setLastPrediction, openChat }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [samples, setSamples] = useState(null)
  const [mode, setMode] = useState('collapsed') // collapsed | options | samples
  const fileInputRef = useRef(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    await handleFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: false, noClick: true,
  })

  async function handleFile(file) {
    setImageUrl(URL.createObjectURL(file))
    setResult(null); setError(null); setMode('collapsed')
    await runPrediction(file)
  }

  async function runPrediction(file) {
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/predict', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Prediction failed')
      const data = await res.json()
      setResult(data); setLastPrediction(data)
    } catch {
      setError('Could not analyse the image. Please try again.')
    }
    setLoading(false)
  }

  async function loadSamples() {
    setMode('samples')
    if (samples) return
    try {
      const res = await fetch('/api/samples')
      const data = await res.json()
      setSamples(data.samples || [])
    } catch { setSamples([]) }
  }

  async function useSample(sample) {
    const res = await fetch(`/api/samples/${sample.filename}`)
    const blob = await res.blob()
    const file = new File([blob], sample.filename, { type: 'image/png' })
    await handleFile(file)
  }

  function reset() {
    setImageUrl(null); setResult(null); setError(null); setMode('collapsed')
  }

  const sortedScores = result ? Object.entries(result.scores).sort(([, a], [, b]) => b - a) : []

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: '0.375rem' }}>
          🔬 Tissue Diagnosis
        </h1>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          Get an instant AI-powered classification of a colorectal histology image.
        </p>
      </div>

      <div className="two-col">
        {/* Left: the single expanding box */}
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
          />

          {imageUrl ? (
            /* Preview state */
            <div style={{
              background: '#fff', borderRadius: 20, padding: '1rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <img src={imageUrl} alt="Tissue"
                style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 14, display: 'block' }} />
              <button onClick={reset} style={{
                marginTop: '0.875rem', width: '100%', padding: '0.75rem',
                borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc',
                color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
              }}>↺ Analyse another image</button>
            </div>
          ) : (
            /* The single box */
            <div className="fade-up" style={{
              border: `2px dashed ${isDragActive ? '#3b82f6' : '#cbd5e1'}`,
              borderRadius: 20,
              background: isDragActive ? '#eff6ff' : '#fff',
              padding: mode === 'samples' ? '1.5rem' : '2.5rem 2rem',
              transition: 'all 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              {mode === 'collapsed' && (
                <button
                  onClick={() => setMode('options')}
                  style={{
                    width: '100%', border: 'none', background: 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 52, marginBottom: '0.75rem' }}>🩻</div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 18, marginBottom: '0.25rem' }}>
                    Click here to begin
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 14 }}>
                    Choose how to start your diagnosis
                  </div>
                </button>
              )}

              {mode === 'options' && (
                <div className="fade-up">
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 16, marginBottom: '1rem', textAlign: 'center' }}>
                    How would you like to begin?
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <OptionRow icon="📤" title="Upload from device"
                      subtitle="Choose a PNG or JPG image" color="#3b82f6"
                      onClick={() => fileInputRef.current?.click()} />
                    <OptionRow icon="🖼️" title="Use a sample image"
                      subtitle="Real examples from the model's data" color="#8b5cf6"
                      onClick={loadSamples} />
                    <OptionRow icon="✋" title="Drag & drop"
                      subtitle="Drop an image anywhere on this box" color="#0ea5e9"
                      onClick={() => {}} />
                  </div>
                  <button onClick={() => setMode('collapsed')} style={{
                    marginTop: '0.875rem', width: '100%', padding: '0.5rem', border: 'none',
                    background: 'transparent', color: '#94a3b8', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13,
                  }}>← Back</button>
                </div>
              )}

              {mode === 'samples' && (
                <div className="fade-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>Pick a sample</div>
                    <button onClick={() => setMode('options')} style={{
                      border: 'none', background: 'transparent', color: '#3b82f6', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                    }}>← Back</button>
                  </div>
                  {!samples ? (
                    <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '1rem' }}>Loading samples…</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                      {samples.map(s => (
                        <button key={s.filename} onClick={() => useSample(s)} style={{
                          border: '1.5px solid #e2e8f0', borderRadius: 10, background: '#f8fafc',
                          cursor: 'pointer', padding: '0.25rem', fontSize: 10, color: '#475569', fontFamily: 'inherit',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0' }}
                          title={s.label}>
                          <img src={`/api/samples/${s.filename}`} alt={s.label}
                            style={{ width: '100%', height: 52, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                          <div style={{ marginTop: 3, textAlign: 'center', fontWeight: 500 }}>{s.label}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div>
          {loading && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 48, marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🔄</div>
              <p style={{ fontWeight: 600, color: '#0f172a' }}>Analysing tissue…</p>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: '0.25rem' }}>Running CNN model inference</p>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 20, padding: '1.5rem', color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          )}

          {result && !loading && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: TISSUE_SEVERITY_COLOR[result.info?.severity] || '#fff',
                border: `1.5px solid ${TISSUE_SEVERITY_BORDER[result.info?.severity] || '#e2e8f0'}`,
                borderRadius: 20, padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: 32 }}>{result.info?.emoji || '🔬'}</span>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>Prediction</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{result.info?.title || result.prediction}</div>
                  </div>
                </div>
                {result.info?.description && (
                  <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, marginBottom: '0.75rem' }}>{result.info.description}</p>
                )}
                <button onClick={openChat} style={{
                  padding: '0.5rem 1rem', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>💬 Ask (AI) Dr. Alex about this</button>
              </div>

              <div style={{ background: '#fff', borderRadius: 20, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Confidence Scores</h3>
                {sortedScores.map(([label, score]) => (
                  <ConfidenceBar key={label} label={label} score={score} isTop={label === result.prediction} />
                ))}
              </div>

              {result.info?.next_steps && (
                <div style={{ background: '#fff', borderRadius: 20, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' }}>📋 Suggested Next Steps</h3>
                  <ol style={{ paddingLeft: '1.25rem', color: '#334155', fontSize: 13, lineHeight: 1.8 }}>
                    {result.info.next_steps.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function OptionRow({ icon, title, subtitle, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem', width: '100%',
      padding: '0.875rem 1rem', borderRadius: 14, border: '1.5px solid #e2e8f0',
      background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}0c` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</div>
      </div>
    </button>
  )
}
