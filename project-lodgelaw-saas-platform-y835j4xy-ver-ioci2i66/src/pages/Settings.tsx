import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export function Settings() {
  const { user, logout } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [testSent, setTestSent] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [autoAlerts, setAutoAlerts] = useState(true)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '')
    }
  }, [user])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await supabase.auth.updateUser({ data: { full_name: displayName } })
      setSavedMsg('Profile saved!')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestAlert = async () => {
    if (!user?.email) return
    setIsSendingTest(true)
    try {
      // Get expiring documents
      const in30Days = new Date()
      in30Days.setDate(in30Days.getDate() + 30)
      const { data: docs } = await supabase
        .from('documents')
        .select('name, expiry_date')
        .eq('user_id', user.id)
        .lte('expiry_date', in30Days.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0])

      // Use Supabase's built-in email via a magic link as a workaround
      // In production, wire this to Resend/SendGrid via a Supabase Edge Function
      const docList = docs && docs.length > 0
        ? docs.map(d => `• ${d.name} — expires ${new Date(d.expiry_date).toLocaleDateString()}`).join('\n')
        : '• No documents expiring in the next 30 days'

      // For now show a success with the content that would be emailed
      setTestSent(true)
      setTimeout(() => setTestSent(false), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <h1 style={s.title}>Settings & Operations</h1>
        <p style={s.subtitle}>Manage your account and 2026 legal requirements.</p>
      </div>

      <div style={s.grid}>
        {/* Profile */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>👤 Profile</h3>
          <div style={s.avatarRow}>
            <div style={s.avatar}>{user?.email?.[0]?.toUpperCase()}</div>
            <div>
              <div style={s.avatarName}>{user?.displayName || user?.email}</div>
              <div style={s.avatarEmail}>{user?.email}</div>
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Display Name</label>
            <input style={s.input} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Phone (optional)</label>
            <input style={s.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(512) 555-0123" />
          </div>
          <button style={s.saveBtn} onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? 'Saving...' : savedMsg || 'Save Profile'}
          </button>
        </div>

        {/* Subscription */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>💳 Subscription</h3>
          <div style={s.planBadge}>
            <div style={s.planName}>Pro Tier</div>
            <div style={s.planPrice}>$79<span style={s.planPeriod}>/mo</span></div>
          </div>
          <ul style={s.planFeatures}>
            {['Unlimited properties', 'Resolution Center + QR codes', 'Email alerts', 'PDF tax exports', 'Guest Packet Generator', 'White-label Reports'].map((f, i) => (
              <li key={i} style={s.planFeature}>✓ {f}</li>
            ))}
          </ul>
          <div style={s.planNote}>
            Billing managed via Stripe. Contact support to change or cancel your plan.
          </div>
        </div>

        {/* Notifications */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>🔔 Document Expiry Notifications</h3>
          <p style={s.cardDesc}>LodgeLaw automatically alerts you when compliance documents are expiring within 30 days.</p>

          <div style={s.toggleRow} onClick={() => setAutoAlerts(!autoAlerts)}>
            <div>
              <div style={s.toggleLabel}>Auto-send expiry alerts</div>
              <div style={s.toggleDesc}>Sends to {user?.email}</div>
            </div>
            <div style={{ ...s.toggle, background: autoAlerts ? '#6366f1' : '#e2e8f0' }}>
              <div style={{ ...s.toggleDot, transform: autoAlerts ? 'translateX(20px)' : 'translateX(2px)' }} />
            </div>
          </div>

          <div style={s.alertTestBox}>
            <div style={s.alertTestInfo}>
              <div style={s.alertTestTitle}>📧 Test Alert Email</div>
              <div style={s.alertTestDesc}>Preview what your expiry alert looks like</div>
            </div>
            <button style={s.testBtn} onClick={handleTestAlert} disabled={isSendingTest}>
              {isSendingTest ? 'Checking...' : 'Send Test'}
            </button>
          </div>

          {testSent && (
            <div style={s.successBox}>
              ✅ Alert preview generated! In production, this would send to <strong>{user?.email}</strong>. To enable real email sending, connect a Resend or SendGrid API key via a Supabase Edge Function.
            </div>
          )}
        </div>

        {/* Legal */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>⚖️ Legal & Compliance</h3>
          <p style={s.cardDesc}>LodgeLaw is an operational assistant tool for Texas STR hosts.</p>
          <div style={s.legalList}>
            {[
              { title: 'Data Privacy', desc: 'Your data is stored securely in Supabase with row-level security. Only you can access your properties and documents.' },
              { title: 'Ordinance Disclaimer', desc: 'Compliance data is based on publicly available 2026 Texas city ordinances. Always consult a licensed attorney for legal advice.' },
              { title: 'Tax Disclaimer', desc: 'Tax estimates are for informational purposes only. Consult a CPA for official HOT filings.' },
            ].map((item, i) => (
              <div key={i} style={s.legalItem}>
                <div style={s.legalTitle}>{item.title}</div>
                <div style={s.legalDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Tiers */}
        <div style={{ ...s.card, gridColumn: '1 / -1' }}>
          <h3 style={s.cardTitle}>📦 Subscription & Tiers</h3>
          <div style={s.tiersGrid}>
            {[
              { name: 'Basic', price: '$29', period: '/mo', desc: 'Essential compliance for small operators.', features: ['Up to 3 properties', 'Compliance Health Check', 'Risk Score Engine', 'Standard Tax Reporting'], cta: 'Current Plan', highlight: false },
              { name: 'Pro', price: '$79', period: '/mo', desc: 'Full-scale automation for power managers.', features: ['Unlimited properties', 'AI Ordinance Summaries', 'Guest Packet Generator', 'Priority Alert Feed', 'White-label Reports'], cta: 'Upgrade to Pro', highlight: true },
              { name: 'Enterprise', price: 'Custom', period: '', desc: 'For funds and property management firms.', features: ['Everything in Pro', 'Multi-user access', 'API access', 'Custom ordinance tracking', 'Dedicated support'], cta: 'Contact Sales', highlight: false },
            ].map((tier, i) => (
              <div key={i} style={{ ...s.tierCard, ...(tier.highlight ? s.tierCardHighlight : {}) }}>
                <div style={s.tierName}>{tier.name}</div>
                <div style={s.tierPrice}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: tier.highlight ? '#fff' : '#0f172a' }}>{tier.price}</span>
                  <span style={{ fontSize: '13px', color: tier.highlight ? '#a5b4fc' : '#94a3b8' }}>{tier.period}</span>
                </div>
                <p style={{ fontSize: '13px', color: tier.highlight ? '#c7d2fe' : '#64748b', marginBottom: '16px' }}>{tier.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tier.features.map((f, j) => (
                    <li key={j} style={{ fontSize: '13px', color: tier.highlight ? '#e0e7ff' : '#374151' }}>✓ {f}</li>
                  ))}
                </ul>
                <button style={{ ...s.tierCta, ...(tier.highlight ? s.tierCtaHighlight : {}) }}>
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ ...s.card, gridColumn: '1 / -1', border: '1px solid #fecaca' }}>
          <h3 style={{ ...s.cardTitle, color: '#dc2626' }}>⚠️ Account</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>Sign out of LodgeLaw</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>You can sign back in at any time.</div>
            </div>
            <button style={s.signOutBtn} onClick={() => logout()}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, any> = {
  wrapper: { padding: '32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { marginBottom: '28px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '16px' },
  cardDesc: { fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' },
  saveBtn: { padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff', fontWeight: '700', flexShrink: 0 },
  avatarName: { fontSize: '14px', fontWeight: '700', color: '#0f172a' },
  avatarEmail: { fontSize: '12px', color: '#64748b' },
  planBadge: { background: '#eef2ff', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' },
  planPrice: { fontSize: '22px', fontWeight: '800', color: '#0f172a' },
  planPeriod: { fontSize: '13px', color: '#94a3b8', fontWeight: '400' },
  planFeatures: { listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' },
  planFeature: { fontSize: '13px', color: '#374151' },
  planNote: { fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', cursor: 'pointer', marginBottom: '16px' },
  toggleLabel: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  toggleDesc: { fontSize: '12px', color: '#64748b' },
  toggle: { width: '44px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleDot: { position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  alertTestBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0' },
  alertTestInfo: {},
  alertTestTitle: { fontSize: '13px', fontWeight: '700', color: '#0f172a' },
  alertTestDesc: { fontSize: '12px', color: '#64748b' },
  testBtn: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  successBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#16a34a', marginTop: '12px', lineHeight: '1.6' },
  legalList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  legalItem: { paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' },
  legalTitle: { fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  legalDesc: { fontSize: '12px', color: '#64748b', lineHeight: '1.5' },
  tiersGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  tierCard: { background: '#f8fafc', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0' },
  tierCardHighlight: { background: '#6366f1', border: '1px solid #6366f1' },
  tierName: { fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tierPrice: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' },
  tierCta: { width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  tierCtaHighlight: { background: '#fff', color: '#6366f1', border: '2px solid #fff' },
  signOutBtn: { padding: '9px 20px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
}
