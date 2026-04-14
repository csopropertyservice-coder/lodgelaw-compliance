import { useAuth } from '../hooks/useAuth'

export function LandingPage() {
  const { login } = useAuth()

  return (
    <div style={s.wrapper}>
      <nav style={s.nav}>
        <div style={s.navLogo}>⚖️ LodgeLaw</div>
        <div style={s.navLinks}>
          <a href="#features" style={s.navLink}>Features</a>
          <a href="#pricing" style={s.navLink}>Pricing</a>
          <button style={s.navCta} onClick={() => login()}>Sign In</button>
        </div>
      </nav>

      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroBadge}>🏆 Built for Texas STR Hosts · 2026 Compliant</div>
          <h1 style={s.heroTitle}>Stop Guessing.<br /><span style={s.heroAccent}>Stay Compliant.</span></h1>
          <p style={s.heroSub}>LodgeLaw is the all-in-one compliance command center for Texas short-term rental hosts. Manage permits, calculate taxes, resolve neighbor disputes — all in one place.</p>
          <div style={s.heroActions}>
            <button style={s.heroPrimary} onClick={() => login()}>Get Started Free →</button>
            <a href="#features" style={s.heroSecondary}>See Features</a>
          </div>
          <p style={s.heroDisclaimer}>No credit card required · Setup in under 5 minutes</p>
        </div>
        <div style={s.heroCard}>
          <div style={s.heroCardHeader}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={s.heroCardTitle}>Compliance Command Center</span>
          </div>
          <div style={s.heroCardBody}>
            {[
              { label: 'Austin License', status: '✅ Active', color: '#22c55e' },
              { label: 'HOT Filing — April', status: '⚠️ Due May 20', color: '#f59e0b' },
              { label: 'Neighbor Report', status: '🔔 1 New', color: '#6366f1' },
              { label: 'Platform Health', status: '✅ Compliant', color: '#22c55e' },
            ].map((item, i) => (
              <div key={i} style={s.heroCardRow}>
                <span style={s.heroCardRowLabel}>{item.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={s.statsBar}>
        {[
          { value: '2026', label: 'Texas Compliant' },
          { value: '3', label: 'Texas Cities Covered' },
          { value: '15%', label: 'HOT Rate Calculated' },
          { value: '100%', label: 'Data Ownership' },
        ].map((stat, i) => (
          <div key={i} style={s.statItem}>
            <div style={s.statValue}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <section id="features" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionBadge}>Features</div>
          <h2 style={s.sectionTitle}>Everything a Texas STR host needs</h2>
          <p style={s.sectionSub}>Built specifically for the 2026 regulatory landscape in Austin, Houston, and Dallas.</p>
          <div style={s.featureGrid}>
            {[
              { icon: '🛡️', title: 'Compliance Command Center', desc: 'Real-time risk scores by zip code. Track Austin Type 1/2 licenses, Houston registration, and Dallas zoning — all in one dashboard.' },
              { icon: '📄', title: 'Document Vault', desc: 'Store permits, licenses, and insurance docs with version history and expiry alerts. Never miss a renewal deadline again.' },
              { icon: '🧮', title: 'HOT Tax Estimator', desc: 'Calculate your Hotel Occupancy Tax liability by month. State (6%) + city rates auto-applied. Export to PDF for your records.' },
              { icon: '📱', title: 'Neighbor Resolution Center', desc: 'Generate a QR code for each property. Neighbors submit anonymous reports. You manage and resolve them from your dashboard.' },
              { icon: '🏠', title: 'Portfolio Management', desc: 'Track all your STR properties in one place. Monitor nights rented, license numbers, and per-property compliance status.' },
              { icon: '🔔', title: 'Smart Alerts', desc: 'Email alerts for expiring documents, new neighbor reports, and upcoming tax deadlines. Stay ahead before issues escalate.' },
            ].map((f, i) => (
              <div key={i} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={s.complianceSection}>
        <div style={s.sectionInner}>
          <div style={s.sectionBadge}>2026 Regulations</div>
          <h2 style={{ ...s.sectionTitle, color: '#f8fafc' }}>Built for Texas's toughest STR markets</h2>
          <div style={s.cityGrid}>
            {[
              { city: 'Austin', risk: 'Extreme Risk', score: 92, rule: 'Type 2 licenses heavily restricted. $1,058 non-owner fee. Platform transparency rules July 1, 2026.' },
              { city: 'Houston', risk: 'High Risk', score: 85, rule: 'Mandatory registration display on all OTAs as of Jan 2026. $275 annual fee enforced.' },
              { city: 'Dallas', risk: 'Medium Risk', score: 45, rule: 'Zoning enforcement paused by injunction. Annual registration still required.' },
            ].map((c, i) => (
              <div key={i} style={s.cityCard}>
                <div style={s.cityHeader}>
                  <span style={s.cityName}>{c.city}, TX</span>
                  <span style={s.cityScore}>{c.score}</span>
                </div>
                <div style={s.cityRisk}>{c.risk}</div>
                <p style={s.cityRule}>{c.rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionBadge}>Pricing</div>
          <h2 style={s.sectionTitle}>Simple, transparent pricing</h2>
          <div style={s.pricingGrid}>
            {[
              { name: 'Starter', price: '$0', period: 'forever', desc: 'Perfect for single-property hosts', features: ['1 property', 'Document vault', 'Tax estimator', 'Compliance dashboard'], cta: 'Get Started Free', highlight: false },
              { name: 'Pro', price: '$29', period: 'per month', desc: 'For serious STR investors', features: ['Unlimited properties', 'Resolution Center + QR codes', 'Email alerts', 'PDF tax exports', 'Priority support'], cta: 'Start Pro Trial', highlight: true },
              { name: 'Enterprise', price: 'Custom', period: 'contact us', desc: 'For property managers & funds', features: ['Everything in Pro', 'Multi-user access', 'API access', 'Custom ordinance tracking', 'Dedicated support'], cta: 'Contact Sales', highlight: false },
            ].map((plan, i) => (
              <div key={i} style={{ ...s.pricingCard, ...(plan.highlight ? s.pricingCardHighlight : {}) }}>
                {plan.highlight && <div style={s.pricingBadge}>Most Popular</div>}
                <h3 style={{ ...s.pricingName, ...(plan.highlight ? { color: '#fff' } : {}) }}>{plan.name}</h3>
                <div style={s.pricingPrice}>
                  <span style={{ ...s.pricingAmount, ...(plan.highlight ? { color: '#fff' } : {}) }}>{plan.price}</span>
                  <span style={{ ...s.pricingPeriod, ...(plan.highlight ? { color: '#a5b4fc' } : {}) }}>/{plan.period}</span>
                </div>
                <p style={{ ...s.pricingDesc, ...(plan.highlight ? { color: '#c7d2fe' } : {}) }}>{plan.desc}</p>
                <ul style={s.pricingFeatures}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ ...s.pricingFeature, ...(plan.highlight ? { color: '#e0e7ff' } : {}) }}>✓ {f}</li>
                  ))}
                </ul>
                <button style={{ ...s.pricingCta, ...(plan.highlight ? s.pricingCtaHighlight : {}) }} onClick={() => login()}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={s.ctaSection}>
        <h2 style={s.ctaTitle}>Ready to get compliant?</h2>
        <p style={s.ctaSub}>Join Texas STR hosts who use LodgeLaw to stay ahead of 2026 regulations.</p>
        <button style={s.ctaBtn} onClick={() => login()}>Access Command Center →</button>
        <p style={s.ctaDisclaimer}>LodgeLaw is an operational tool. Always consult a licensed attorney for legal advice.</p>
      </section>

      <footer style={s.footer}>
        <div style={s.footerLogo}>⚖️ LodgeLaw</div>
        <p style={s.footerText}>© 2026 LodgeLaw · Built for Texas STR Compliance</p>
      </footer>
    </div>
  )
}

const s: Record<string, any> = {
  wrapper: { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 100 },
  navLogo: { fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '32px' },
  navLink: { fontSize: '14px', color: '#64748b', textDecoration: 'none', fontWeight: '500' },
  navCta: { padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '80px 40px', maxWidth: '1200px', margin: '0 auto', gap: '60px', flexWrap: 'wrap' },
  heroInner: { flex: 1, minWidth: '300px' },
  heroBadge: { display: 'inline-block', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '20px', marginBottom: '24px', border: '1px solid #bbf7d0' },
  heroTitle: { fontSize: '52px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.03em', margin: '0 0 20px 0' },
  heroAccent: { color: '#6366f1' },
  heroSub: { fontSize: '18px', color: '#64748b', lineHeight: '1.6', margin: '0 0 32px 0', maxWidth: '480px' },
  heroActions: { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' },
  heroPrimary: { padding: '14px 28px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  heroSecondary: { fontSize: '15px', color: '#6366f1', fontWeight: '600', textDecoration: 'none' },
  heroDisclaimer: { fontSize: '12px', color: '#94a3b8', marginTop: '16px' },
  heroCard: { background: '#0f172a', borderRadius: '16px', padding: '24px', width: '320px', flexShrink: 0, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' },
  heroCardHeader: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' },
  heroCardTitle: { fontSize: '11px', color: '#64748b', marginLeft: '4px', fontWeight: '600' },
  heroCardBody: { display: 'flex', flexDirection: 'column', gap: '12px' },
  heroCardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderRadius: '8px', padding: '10px 14px' },
  heroCardRowLabel: { fontSize: '13px', color: '#94a3b8', fontWeight: '500' },
  statsBar: { display: 'flex', justifyContent: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' },
  statItem: { flex: 1, textAlign: 'center', padding: '32px 24px', borderRight: '1px solid #e2e8f0', maxWidth: '250px' },
  statValue: { fontSize: '32px', fontWeight: '800', color: '#6366f1', marginBottom: '4px' },
  statLabel: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  section: { padding: '80px 40px' },
  sectionInner: { maxWidth: '1100px', margin: '0 auto' },
  sectionBadge: { display: 'inline-block', background: '#eef2ff', color: '#6366f1', fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '20px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  sectionTitle: { fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 12px 0' },
  sectionSub: { fontSize: '16px', color: '#64748b', marginBottom: '48px', maxWidth: '500px' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' },
  featureCard: { background: '#f8fafc', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' },
  featureIcon: { fontSize: '32px', marginBottom: '16px' },
  featureTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', marginTop: 0 },
  featureDesc: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 },
  complianceSection: { padding: '80px 40px', background: '#0f172a' },
  cityGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '40px' },
  cityCard: { background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' },
  cityHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cityName: { fontSize: '18px', fontWeight: '700', color: '#f8fafc' },
  cityScore: { fontSize: '28px', fontWeight: '800', color: '#6366f1' },
  cityRisk: { fontSize: '12px', fontWeight: '700', color: '#f59e0b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  cityRule: { fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: 0 },
  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '48px' },
  pricingCard: { background: '#f8fafc', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', position: 'relative' },
  pricingCardHighlight: { background: '#6366f1', border: '1px solid #6366f1' },
  pricingBadge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#0f172a', fontSize: '11px', fontWeight: '800', padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' },
  pricingName: { fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', marginTop: 0 },
  pricingPrice: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' },
  pricingAmount: { fontSize: '36px', fontWeight: '800', color: '#0f172a' },
  pricingPeriod: { fontSize: '13px', color: '#94a3b8' },
  pricingDesc: { fontSize: '13px', color: '#64748b', marginBottom: '24px' },
  pricingFeatures: { listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' },
  pricingFeature: { fontSize: '13px', color: '#374151', fontWeight: '500' },
  pricingCta: { width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  pricingCtaHighlight: { background: '#fff', color: '#6366f1', border: '2px solid #fff' },
  ctaSection: { background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '80px 40px', textAlign: 'center' },
  ctaTitle: { fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 16px 0' },
  ctaSub: { fontSize: '16px', color: '#64748b', margin: '0 0 32px 0' },
  ctaBtn: { padding: '16px 36px', borderRadius: '12px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '24px', display: 'block', margin: '0 auto 24px' },
  ctaDisclaimer: { fontSize: '11px', color: '#94a3b8' },
  footer: { padding: '32px 40px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  footerLogo: { fontSize: '16px', fontWeight: '800', color: '#0f172a' },
  footerText: { fontSize: '12px', color: '#94a3b8' },
}
