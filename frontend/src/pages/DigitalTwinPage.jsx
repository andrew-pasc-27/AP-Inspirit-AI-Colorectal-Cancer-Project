import { useState, useRef, Suspense, Component } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Environment } from '@react-three/drei'

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch { return false }
}

class CanvasBoundary extends Component {
  constructor(p) { super(p); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function ViewerFallback() {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: 56, marginBottom: '1rem' }}>🧍</div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: '0.5rem' }}>3D view unavailable here</div>
      <div style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
        Your browser or environment couldn't start 3D graphics (WebGL). The toggles on the right still
        describe the stage and tissue types — try opening the app in a standard desktop browser to see the model.
      </div>
    </div>
  )
}

// ── tissue types (match the model's 8 classes) ────────────────────────────────
const TISSUE_TYPES = [
  { id: 'tumor', label: 'Tumor', color: '#ef4444' },
  { id: 'stroma', label: 'Stroma', color: '#f59e0b' },
  { id: 'lympho', label: 'Lympho', color: '#f97316' },
  { id: 'mucosa', label: 'Mucosa', color: '#22c55e' },
  { id: 'adipose', label: 'Adipose', color: '#a16207' },
  { id: 'debris', label: 'Debris', color: '#6b7280' },
  { id: 'complex', label: 'Complex', color: '#3b82f6' },
  { id: 'empty', label: 'Empty', color: '#94a3b8' },
]

// Stage → how far the cancer has spread (number of tumor foci + node/metastasis flags)
const STAGES = {
  I:   { label: 'Stage I',   foci: 1, spread: 'Localised to the bowel wall',        nodes: false, mets: false },
  II:  { label: 'Stage II',  foci: 2, spread: 'Through the bowel wall, no nodes',    nodes: false, mets: false },
  III: { label: 'Stage III', foci: 3, spread: 'Spread to nearby lymph nodes',        nodes: true,  mets: false },
  IV:  { label: 'Stage IV',  foci: 4, spread: 'Metastasised to distant organs (liver/lung)', nodes: true, mets: true },
}

// ── 3D pieces ─────────────────────────────────────────────────────────────────
function Body({ skinOpacity }) {
  // Warm skin tone, semi-transparent so internal organs read through
  const mat = { color: '#e7b596', transparent: true, opacity: skinOpacity, roughness: 0.65, metalness: 0.0 }
  return (
    <group>
      {/* head */}
      <mesh position={[0, 2.42, 0]}><sphereGeometry args={[0.33, 32, 32]} /><meshStandardMaterial {...mat} /></mesh>
      {/* jaw/chin */}
      <mesh position={[0, 2.2, 0.05]}><sphereGeometry args={[0.26, 24, 24]} /><meshStandardMaterial {...mat} /></mesh>
      {/* neck */}
      <mesh position={[0, 1.92, 0]}><cylinderGeometry args={[0.13, 0.16, 0.28, 24]} /><meshStandardMaterial {...mat} /></mesh>

      {/* shoulders */}
      <mesh position={[0, 1.68, 0]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.16, 0.62, 8, 20]} /><meshStandardMaterial {...mat} /></mesh>
      {/* chest (wider) tapering to waist */}
      <mesh position={[0, 1.28, 0]}><cylinderGeometry args={[0.34, 0.44, 0.7, 28]} /><meshStandardMaterial {...mat} /></mesh>
      {/* abdomen/waist */}
      <mesh position={[0, 0.78, 0]}><cylinderGeometry args={[0.36, 0.34, 0.55, 28]} /><meshStandardMaterial {...mat} /></mesh>
      {/* pelvis */}
      <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.4, 0.3, 0.4, 28]} /><meshStandardMaterial {...mat} /></mesh>

      {/* left arm: upper + forearm + hand, hanging at the side */}
      <mesh position={[-0.5, 1.32, 0]}><capsuleGeometry args={[0.11, 0.5, 8, 16]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[-0.52, 0.78, 0]}><capsuleGeometry args={[0.095, 0.48, 8, 16]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[-0.53, 0.42, 0]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial {...mat} /></mesh>
      {/* right arm */}
      <mesh position={[0.5, 1.32, 0]}><capsuleGeometry args={[0.11, 0.5, 8, 16]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[0.52, 0.78, 0]}><capsuleGeometry args={[0.095, 0.48, 8, 16]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[0.53, 0.42, 0]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial {...mat} /></mesh>

      {/* left leg: thigh + shin + foot */}
      <mesh position={[-0.17, -0.12, 0]}><capsuleGeometry args={[0.15, 0.6, 8, 16]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[-0.17, -0.85, 0]}><capsuleGeometry args={[0.115, 0.6, 8, 16]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[-0.17, -1.28, 0.1]}><boxGeometry args={[0.18, 0.12, 0.34]} /><meshStandardMaterial {...mat} /></mesh>
      {/* right leg */}
      <mesh position={[0.17, -0.12, 0]}><capsuleGeometry args={[0.15, 0.6, 8, 16]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[0.17, -0.85, 0]}><capsuleGeometry args={[0.115, 0.6, 8, 16]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[0.17, -1.28, 0.1]}><boxGeometry args={[0.18, 0.12, 0.34]} /><meshStandardMaterial {...mat} /></mesh>
    </group>
  )
}

// The colon: a folded tube sitting in the abdomen
function Colon() {
  return (
    <group position={[0, 0.75, 0.15]}>
      {/* ascending */}
      <mesh position={[-0.32, 0, 0]}><capsuleGeometry args={[0.09, 0.55, 8, 16]} /><meshStandardMaterial color="#f9a8a8" roughness={0.6} /></mesh>
      {/* transverse */}
      <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.09, 0.6, 8, 16]} /><meshStandardMaterial color="#f9a8a8" roughness={0.6} /></mesh>
      {/* descending */}
      <mesh position={[0.32, 0, 0]}><capsuleGeometry args={[0.09, 0.55, 8, 16]} /><meshStandardMaterial color="#f9a8a8" roughness={0.6} /></mesh>
      {/* sigmoid/rectum */}
      <mesh position={[0.1, -0.4, 0]} rotation={[0, 0, 0.6]}><capsuleGeometry args={[0.09, 0.4, 8, 16]} /><meshStandardMaterial color="#f9a8a8" roughness={0.6} /></mesh>
    </group>
  )
}

function Pulse({ position, color, size = 0.14 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.18
      ref.current.scale.setScalar(s)
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 20, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  )
}

// Positions along the colon for tumor foci (in colon-local space, offset applied)
const FOCI_POS = [
  [0.42, 0.75 - 0.4 + 0.1, 0.15],   // sigmoid
  [-0.32, 0.75 + 0.15, 0.15],       // ascending
  [0.32, 0.75 - 0.1, 0.15],         // descending
  [0, 0.75 + 0.32, 0.15],           // transverse
]
const NODE_POS = [[-0.15, 0.55, 0.2], [0.18, 0.5, 0.2]]
const METS_POS = [[-0.35, 1.35, 0.15], [0.3, 1.55, 0.1]] // liver / lung region

function Scene({ showCancer, stage, activeTypes, skinOpacity }) {
  const st = STAGES[stage]
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      <Body skinOpacity={skinOpacity} />
      <Colon />

      {/* tumor foci by stage */}
      {showCancer && FOCI_POS.slice(0, st.foci).map((p, i) => (
        <Pulse key={i} position={p} color="#ef4444" size={0.15} />
      ))}
      {/* lymph nodes */}
      {showCancer && st.nodes && NODE_POS.map((p, i) => (
        <Pulse key={'n' + i} position={p} color="#f97316" size={0.09} />
      ))}
      {/* distant metastases */}
      {showCancer && st.mets && METS_POS.map((p, i) => (
        <Pulse key={'m' + i} position={p} color="#b91c1c" size={0.11} />
      ))}

      {/* tissue-type markers arranged around the colon */}
      {activeTypes.map((t, i) => {
        const type = TISSUE_TYPES.find(x => x.id === t)
        const angle = (i / TISSUE_TYPES.length) * Math.PI * 2
        const pos = [Math.cos(angle) * 0.55, 0.75 + Math.sin(angle) * 0.45, 0.35]
        return (
          <group key={t}>
            <mesh position={pos}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color={type.color} emissive={type.color} emissiveIntensity={0.3} />
            </mesh>
          </group>
        )
      })}

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={9}
        target={[0, 1, 0]}
        autoRotate={false}
      />
      <Environment preset="city" />
    </>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function DigitalTwinPage({ lastPrediction }) {
  const [showCancer, setShowCancer] = useState(true)
  const [stage, setStage] = useState('II')
  const [activeTypes, setActiveTypes] = useState([])
  const [skinOpacity, setSkinOpacity] = useState(0.22)

  function toggleType(id) {
    setActiveTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const st = STAGES[stage]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: '0.375rem' }}>
          🧍 Digital Twin
        </h1>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          A 3D visualisation of what may be happening in the body. Drag to rotate, scroll to zoom.
        </p>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* 3D viewer */}
        <div className="twin-viewer" style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          borderRadius: 24,
          height: 560,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 8px 30px rgba(15,23,42,0.25)',
        }}>
          {webglAvailable() ? (
            <CanvasBoundary fallback={<ViewerFallback />}>
              <Canvas camera={{ position: [0, 1.2, 5], fov: 45 }}>
                <Suspense fallback={<Html center><span style={{ color: '#fff' }}>Loading model…</span></Html>}>
                  <Scene showCancer={showCancer} stage={stage} activeTypes={activeTypes} skinOpacity={skinOpacity} />
                </Suspense>
              </Canvas>
            </CanvasBoundary>
          ) : (
            <ViewerFallback />
          )}
          <div style={{
            position: 'absolute', bottom: 12, left: 16, color: 'rgba(255,255,255,0.5)', fontSize: 12,
          }}>
            🖱️ Drag to rotate · scroll to zoom
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Cancer toggle */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>🔴 Show Cancer</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Highlight tumor foci in the colon</div>
              </div>
              <Toggle on={showCancer} onClick={() => setShowCancer(v => !v)} color="#ef4444" />
            </div>
          </div>

          {/* Stage selector */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: '0.75rem' }}>📊 Cancer Stage</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {Object.keys(STAGES).map(k => (
                <button key={k} onClick={() => setStage(k)} disabled={!showCancer} style={{
                  padding: '0.5rem', borderRadius: 10, cursor: showCancer ? 'pointer' : 'not-allowed',
                  border: `1.5px solid ${stage === k ? '#3b82f6' : '#e2e8f0'}`,
                  background: stage === k ? '#eff6ff' : '#f8fafc',
                  color: stage === k ? '#1d4ed8' : '#64748b',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: stage === k ? 700 : 500,
                  opacity: showCancer ? 1 : 0.5,
                }}>{k}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, background: '#f8fafc', borderRadius: 10, padding: '0.625rem 0.75rem' }}>
              <strong>{st.label}:</strong> {st.spread}
            </div>
          </div>

          {/* 8 tissue types */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>🎨 Visualize 8 Types</div>
              <button onClick={() => setActiveTypes(activeTypes.length ? [] : TISSUE_TYPES.map(t => t.id))} style={{
                border: 'none', background: 'transparent', color: '#3b82f6', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              }}>{activeTypes.length ? 'Clear' : 'Show all'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {TISSUE_TYPES.map(t => {
                const on = activeTypes.includes(t.id)
                const isLast = lastPrediction?.prediction === t.id
                return (
                  <button key={t.id} onClick={() => toggleType(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem',
                    borderRadius: 10, border: `1.5px solid ${on ? t.color : '#e2e8f0'}`,
                    background: on ? `${t.color}14` : '#f8fafc', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, color: '#334155', fontWeight: on ? 600 : 400, textAlign: 'left',
                  }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                    <span style={{ textTransform: 'capitalize' }}>{t.label}</span>
                    {isLast && <span title="Your last result" style={{ marginLeft: 'auto', fontSize: 11 }}>📋</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Body transparency */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: '0.5rem' }}>🔍 Body Transparency</div>
            <input type="range" min="0.05" max="0.6" step="0.01" value={skinOpacity}
              onChange={e => setSkinOpacity(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6' }} />
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: '1.5rem' }}>
        ⚠️ This is a simplified, illustrative visualisation — not an anatomically exact or diagnostic depiction.
      </p>
    </div>
  )
}

function Toggle({ on, onClick, color = '#3b82f6' }) {
  return (
    <button onClick={onClick} style={{
      width: 48, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: on ? color : '#cbd5e1', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 23 : 3, width: 22, height: 22, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}
