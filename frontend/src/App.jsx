import { useState, useEffect, lazy, Suspense } from 'react'
import Sidebar from './components/Sidebar.jsx'
import HomePage from './pages/HomePage.jsx'
import DiagnosisPage from './pages/DiagnosisPage.jsx'
import GuessingGamePage from './pages/GuessingGamePage.jsx'
import DoctorChatPage from './pages/DoctorChatPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ChatWidget from './components/ChatWidget.jsx'

// 3D stack is heavy — load it only when the Digital Twin page is opened
const DigitalTwinPage = lazy(() => import('./pages/DigitalTwinPage.jsx'))

const PAGES = {
  home: HomePage,
  diagnosis: DiagnosisPage,
  game: GuessingGamePage,
  doctor: DoctorChatPage,
  twin: DigitalTwinPage,
  about: AboutPage,
}

const GREETING = {
  role: 'assistant',
  text: "Hi there! I'm Dr. Alex — your always-available AI medical companion. 👋\n\nI'm here to help you understand histology results, explain treatment options, talk through what to expect, or just lend an empathetic ear.\n\nWhat's on your mind today?",
}

// A "big" question deserves the full page instead of the little widget
function isBigQuestion(text) {
  const words = text.trim().split(/\s+/).length
  if (words >= 22 || text.length >= 140) return true
  const heavy = /scared|afraid|dying|die|terrified|overwhelm|depress|hopeless|prognosis|survival|treatment plan|chemo|radiation|surgery|stage (iii|iv|3|4)|metasta|spread/i
  return heavy.test(text)
}

function pageFromPath() {
  const p = window.location.pathname.replace(/^\//, '')
  return PAGES[p] ? p : 'home'
}

export default function App() {
  const [activePage, setActivePageState] = useState(pageFromPath)
  const [chatOpen, setChatOpen] = useState(false)
  const [lastPrediction, setLastPrediction] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 900px), (orientation: portrait)').matches)
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 900px), (orientation: portrait)').matches)

  // Shared chat conversation between the floating widget and the Dr. Alex page
  const [messages, setMessages] = useState([GREETING])
  const [chatLoading, setChatLoading] = useState(false)

  function setActivePage(id) {
    setActivePageState(id)
    if (isMobile) setSidebarOpen(false)
    const path = id === 'home' ? '/' : `/${id}`
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
  }

  useEffect(() => {
    const onPop = () => setActivePageState(pageFromPath())
    window.addEventListener('popstate', onPop)
    const mq = window.matchMedia('(max-width: 900px), (orientation: portrait)')
    const onMq = e => { setIsMobile(e.matches); if (e.matches) setSidebarOpen(false); else setSidebarOpen(true) }
    mq.addEventListener('change', onMq)
    return () => { window.removeEventListener('popstate', onPop); mq.removeEventListener('change', onMq) }
  }, [])

  async function sendMessage(text, { fromWidget = false } = {}) {
    const msg = (text || '').trim()
    if (!msg || chatLoading) return
    // Route big questions to the dedicated page for a calmer, roomier experience
    if (fromWidget && isBigQuestion(msg)) {
      setChatOpen(false)
      setActivePage('doctor')
    }
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context: { last_prediction: lastPrediction?.prediction || '' } }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting right now. Please try again in a moment." }])
    }
    setChatLoading(false)
  }

  const PageComponent = PAGES[activePage] || HomePage

  function handleMainClick() {
    // On phones the toolbar is an overlay — tapping the page dismisses it
    if (isMobile && sidebarOpen) setSidebarOpen(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f0f4f8' }}>
      {/* Persistent top-left brand cluster: logo = Home, always available */}
      <div style={{
        position: 'fixed', top: 14, left: 14, zIndex: 400,
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <button
          onClick={() => setActivePage('home')}
          title="Home"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.875rem', borderRadius: 14,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
            boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
          }}
        >
          <span style={{ fontSize: 20 }}>🧬</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '0.05em' }}>CCC</span>
        </button>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Hide menu' : 'Show menu'}
          style={{
            width: 40, height: 40, borderRadius: 12,
            border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer',
            fontSize: 17, color: '#334155', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Backdrop when sidebar is open over content on mobile */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 250,
        }} />
      )}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        open={sidebarOpen}
        isMobile={isMobile}
      />

      <main
        className="app-main"
        onClick={handleMainClick}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          paddingTop: '4.5rem',
          position: 'relative',
        }}
      >
        <Suspense fallback={<div style={{ padding: '2rem', color: '#64748b' }}>Loading…</div>}>
          <PageComponent
            lastPrediction={lastPrediction}
            setLastPrediction={setLastPrediction}
            openChat={() => setChatOpen(true)}
            setActivePage={setActivePage}
            messages={messages}
            chatLoading={chatLoading}
            onSend={sendMessage}
          />
        </Suspense>
      </main>

      {/* Floating chat button */}
      {activePage !== 'doctor' && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59,130,246,0.4)', zIndex: 100,
            fontSize: 24, transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Talk to (AI) Dr. Alex"
        >
          🩺
        </button>
      )}

      {chatOpen && (
        <ChatWidget
          onClose={() => setChatOpen(false)}
          messages={messages}
          loading={chatLoading}
          onSend={sendMessage}
          onExpand={() => { setChatOpen(false); setActivePage('doctor') }}
        />
      )}
    </div>
  )
}
