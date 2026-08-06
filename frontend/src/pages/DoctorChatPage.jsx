import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const QUICK_QUESTIONS = [
  "What does tumor tissue mean?",
  "What are my treatment options?",
  "What is the survival rate?",
  "What symptoms should I watch for?",
  "How often should I get screened?",
  "What diet helps with colorectal cancer?",
  "I'm feeling scared and overwhelmed",
]

export default function DoctorChatPage({ lastPrediction, messages, chatLoading, onSend }) {
  const [input, setInput] = useState('')
  const loading = chatLoading
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function send(text) {
    const userMsg = (text || input).trim()
    if (!userMsg || loading) return
    setInput('')
    onSend(userMsg)
  }

  return (
    <div className="doctor-page" style={{ maxWidth: 780, margin: '0 auto', height: 'calc(100vh - 6rem)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
        borderRadius: 20,
        padding: '1.5rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, flexShrink: 0,
        }}>👨‍⚕️</div>
        <div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: '0.25rem' }}>(AI) Dr. Alex</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            AI Medical Companion · Colorectal Cancer Specialist
          </p>
          {lastPrediction && (
            <div style={{
              marginTop: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '0.375rem 0.75rem',
              display: 'inline-block',
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
            }}>
              📋 Last result: <strong style={{ textTransform: 'capitalize' }}>{lastPrediction.prediction}</strong>
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{
            background: 'rgba(34,197,94,0.2)',
            border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: 20,
            padding: '0.25rem 0.75rem',
            color: '#4ade80',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            Online
          </div>
        </div>
      </div>

      {/* Quick questions */}
      <div className="quick-questions" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 20,
              border: '1.5px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = '#eff6ff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '#fff' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: '#fff',
        borderRadius: 20,
        padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: '0.75rem',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>👨‍⚕️</div>
            )}
            <div style={{
              maxWidth: '75%',
              padding: '0.875rem 1rem',
              borderRadius: msg.role === 'user' ? '20px 20px 6px 20px' : '6px 20px 20px 20px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)'
                : '#f8fafc',
              color: msg.role === 'user' ? '#fff' : '#0f172a',
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: '0 0 0.5rem' }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                  ul: ({ children }) => <ul style={{ paddingLeft: '1.25rem', margin: '0.375rem 0' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ paddingLeft: '1.25rem', margin: '0.375rem 0' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
                }}
              >{msg.text}</ReactMarkdown>
            </div>
            {msg.role === 'user' && (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>👤</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>👨‍⚕️</div>
            <div style={{
              padding: '0.875rem 1rem',
              borderRadius: '6px 20px 20px 20px',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: 14,
            }}>
              Typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask Dr. Alex anything about your diagnosis, treatment, or wellbeing…"
          style={{
            flex: 1,
            padding: '0.875rem 1.25rem',
            borderRadius: 16,
            border: '1.5px solid #e2e8f0',
            fontFamily: 'inherit',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: 16,
            border: 'none',
            background: loading || !input.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: loading || !input.trim() ? '#94a3b8' : '#fff',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          Send →
        </button>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
        Dr. Alex is an AI assistant for educational purposes only. Always consult a qualified medical professional for real medical decisions.
      </p>
    </div>
  )
}
