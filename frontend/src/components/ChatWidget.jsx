import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function ChatWidget({ onClose, onExpand, messages, loading, onSend }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function send() {
    if (!input.trim() || loading) return
    const msg = input.trim()
    setInput('')
    onSend(msg, { fromWidget: true })
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      width: 'min(360px, calc(100vw - 2rem))',
      maxHeight: '70vh',
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 200,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>👨‍⚕️</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>(AI) Dr. Alex</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>AI Medical Companion</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button onClick={onExpand} title="Open full page" style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)',
            fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '0.25rem',
          }}>⤢</button>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)',
            fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0.25rem',
          }}>×</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '0.625rem 0.875rem',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #1d4ed8, #3b82f6)' : '#f1f5f9',
              color: msg.role === 'user' ? '#fff' : '#0f172a',
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: '0 0 0.25rem' }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                  ul: ({ children }) => <ul style={{ paddingLeft: '1rem', margin: '0.25rem 0' }}>{children}</ul>,
                  li: ({ children }) => <li style={{ marginBottom: '0.125rem' }}>{children}</li>,
                }}
              >{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{
              padding: '0.625rem 0.875rem',
              borderRadius: '16px 16px 16px 4px',
              background: '#f1f5f9',
              color: '#64748b',
              fontSize: 13,
            }}>
              <span style={{ animation: 'pulse 1.5s infinite' }}>Dr. Alex is typing…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask Dr. Alex anything…"
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            borderRadius: 12,
            border: '1.5px solid #e2e8f0',
            fontFamily: 'inherit',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.625rem 1rem',
            borderRadius: 12,
            border: 'none',
            background: loading || !input.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color: loading || !input.trim() ? '#94a3b8' : '#fff',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
