import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { supabase } from '../lib/supabaseClient'

const CATEGORIES = [
  { value: 'noise',    label: '🔊 Noise' },
  { value: 'parking',  label: '🚗 Parking' },
  { value: 'trash',    label: '🗑️ Trash' },
  { value: 'guests',   label: '👥 Guests' },
  { value: 'other',    label: '📝 Other' },
]

export function NeighborReport() {
  const { propertyId } = useParams({ strict: false })
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!category || !message.trim()) {
      setError('Please select a category and write a message.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const { error: insertError } = await supabase
        .from('neighbor_reports')
        .insert({
          property_id: propertyId,
          category,
          message: message.trim(),
          status: 'new',
        })
      if (insertError) throw insertError
      setSubmitted(true)
    } catch (err: any) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.title}>Report Submitted</h2>
          <p style={styles.subtitle}>
            Thank you. The property host has been notified and will review your concern shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>LodgeLaw</div>
        <h2 style={styles.title}>Submit a Neighbor Report</h2>
        <p style={styles.subtitle}>
          Your report is anonymous and will be reviewed by the property host.
        </p>

        <div style={styles.field}>
          <label style={styles.label}>Category</label>
          <div style={styles.categoryGrid}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  ...styles.categoryBtn,
                  ...(category === c.value ? styles.categoryBtnActive : {})
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Describe the issue</label>
          <textarea
            style={styles.textarea}
            placeholder="Please describe what happened, including date and time if possible..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={styles.submitBtn}
        >
          {isLoading ? 'Submitting...' : 'Submit Report'}
        </button>

        <p style={styles.footer}>
          Powered by LodgeLaw · Anonymous & Secure
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  logo: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#6366f1',
    marginBottom: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 28px 0',
    lineHeight: '1.5',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  categoryBtn: {
    padding: '10px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.15s',
  },
  categoryBtnActive: {
    border: '1.5px solid #6366f1',
    background: '#eef2ff',
    color: '#6366f1',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    resize: 'vertical',
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '12px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: '#6366f1',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  footer: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94a3b8',
  },
}
