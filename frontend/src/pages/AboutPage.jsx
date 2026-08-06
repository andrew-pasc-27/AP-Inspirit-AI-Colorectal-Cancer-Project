const CLASSES = [
  { label: 'tumor', emoji: '🔴', desc: 'Adenocarcinoma tissue — abnormal, chaotic gland structures.' },
  { label: 'stroma', emoji: '🟡', desc: 'Supportive connective tissue surrounding colon glands.' },
  { label: 'lympho', emoji: '🟠', desc: 'Dense lymphocyte infiltration — immune cell-rich regions.' },
  { label: 'mucosa', emoji: '🟢', desc: 'Normal healthy colonic epithelium with regular crypts.' },
  { label: 'adipose', emoji: '🟤', desc: 'Fat tissue — pericolic adipose, typically from resection margins.' },
  { label: 'debris', emoji: '⚫', desc: 'Necrotic / cellular debris — dead or dying cell material.' },
  { label: 'complex', emoji: '🔵', desc: 'Complex glandular patterns suggestive of dysplasia or early CRC.' },
  { label: 'empty', emoji: '⬜', desc: 'Acellular regions — lumen, mucin, or processing artifact.' },
]

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: '0.375rem' }}>
          ℹ️ About
        </h1>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          How the Colorectal Cancer Colleague works.
        </p>
      </div>

      {/* Model card */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          🧠 The Model
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {[
            ['Architecture', 'ResNet50 (transfer learning)'],
            ['Input size', '224 × 224 px (padded, 0-255 scale)'],
            ['Classes', '8 colorectal tissue types'],
            ['Task', 'Multi-class classification'],
            ['Dataset', 'Colorectal histology tiles'],
            ['Framework', 'TensorFlow / Keras'],
          ].map(([k, v]) => (
            <div key={k} style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: '0.75rem 1rem',
            }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.25rem' }}>{k}</div>
              <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
          The model was trained with <strong>no normalization</strong> (images kept on a 0–255 scale, no ResNet preprocess_input)
          and images padded to 224×224 with <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>resize_with_pad</code>.
          Our preprocessing pipeline matches these conditions exactly.
        </p>
      </div>

      {/* Tissue classes */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          🔬 Tissue Classes
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {CLASSES.map(c => (
            <div key={c.label} style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{c.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', textTransform: 'capitalize', marginBottom: '0.125rem' }}>{c.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          ✨ Features
        </h2>
        {[
          ['🔬 Diagnosis', 'Upload any colorectal histology tile and get instant AI classification with confidence bars and clinical guidance.'],
          ['🎮 Guessing Game', 'Test your pathology knowledge — can you identify the tissue type before the AI does?'],
          ['👨‍⚕️ Dr. Alex', 'Chat with an AI medical companion for explanations, emotional support, and guidance on next steps.'],
          ['📊 Confidence Scores', 'See how confident the model is across all 8 classes — not just a single answer.'],
        ].map(([title, desc]) => (
          <div key={title} style={{
            display: 'flex',
            gap: '1rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', minWidth: 140 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        background: '#fffbeb',
        border: '1.5px solid #fcd34d',
        borderRadius: 16,
        padding: '1.25rem',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: '0.5rem' }}>
          ⚠️ Important Disclaimer
        </h3>
        <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
          This application is for <strong>educational and research purposes only</strong>. It is not a medical device,
          does not provide clinical diagnoses, and should never replace the assessment of a qualified pathologist
          or physician. Always consult your medical team for real diagnostic decisions.
        </p>
      </div>
    </div>
  )
}
