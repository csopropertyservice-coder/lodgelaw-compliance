import { useAuth } from '../hooks/useAuth'

export function LandingPage() {
  const { login } = useAuth()

  return (
    <div style={s.wrapper}>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>⚖️ LodgeLaw</div>
        <div style={s.navLinks}>
          <a href="#features" style={s.navLink}>Features</a>
          <a href="#pricing" style={s.navLink}>Pricing</a>
          <button style={s.navCta} onClick={() => login()}>Sign In</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroBadge}>🏆 Built for Texas STR Hosts · 2026 Compliant</div>
          <h1 style={s.heroTitle}>
            Stop Guessing.<br />
            <span style={s.heroAccent}>Stay Compliant.</span>
          </h1>
          <p style={s.heroSub}>
            LodgeLaw is the all-in-one compliance command center for Texas short-term rental hosts.
            Manage permits, calculate taxes, resolve neighbor disputes — all in one place.
          </p>
          <div style={s.heroActions}>
            <button style={s.heroPrimary} onClick={() => login()}>
              Get Started Free →
            </button>
            <a href="#features" style={s.heroSecondary}>See Features</a>
          </div>
          <p style={s.heroDisclaimer}>No credit card required · Setup in under 5 minutes</p>
        </div>

        {/* Hero visual */}
        <div style={s.heroCard}>
          <div style={s.heroCardHeader}>
            <span style={s.heroCardDot('green')} />
            <span style={s.heroCardDot('yellow')} />
            <span style={s.heroCardDot('red')} />
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
                <span style={{ ...s.heroCardRowStatus, color: item.color }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
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

      {/* Features */}
      <section id="features" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionBadge}>Features</div>
          <h2 style={s.sectionTitle}>Everything a Texas STR host needs</h2>
          <p style={s.sectionSub}>Built specifically for the 2026 regulatory landscape in Austin, Houston, and Dallas.</p>

          <div style={s.featureGrid}>
            {[
              {
                icon: '🛡️',
                title: 'Compliance Command Center',
                desc: 'Real-time risk scores by zip code. Track Austin Type 1/2 licenses, Houston registration, and Dallas zoning — all in one dashboard.',
              },
              {
                icon: '📄',
                title: 'Document Vault',
                desc: 'Store permits, licenses, and insurance docs with version history and expiry alerts. Never miss a renewal deadline again.',
              },
              {
                icon: '🧮',
                title: 'HOT Tax Estimator',
                desc: 'Calculate your Hotel Occupancy Tax liability by month. State (6%) + city rates auto-applied. Export to PDF for your records.',
              },
              {
                icon: '📱',
                title: 'Neighbor Resolution Center',
                desc: 'Generate a QR code for each property. Neighbors submit anonymous reports. You manage and resolve them from your dashboard.',
              },
              {
                icon: '🏠',
                title: 'Portfolio Management',
                desc: 'Track all your STR properties in one place. Monitor nights rented, license numbers, and per-property compliance status.',
              },
              {
                icon: '🔔',
                title: 'Smart Alerts',
                desc: 'Email alerts for expiring documents, new neighbor reports, and upcoming tax deadlines. Stay ahead before issues escalate.',
              },
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

      {/* Compliance highlight */}
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

      {/* Pricing */}
      <section id="pricing" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionBadge}>Pricing</div>
          <h2 style={s.sectionTitle}>Simple, transparent pricing</h2>
          <div style={s.pricingGrid}>
            {[
              {
                name: 'Starter',
                price: '$0',
                period: 'forever',
                desc: 'Perfect for single-property hosts',
                features: ['1 property', 'Document vault', 'Tax estimator', 'Compliance dashboard'],
                cta: 'Get Started Free',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$29',
                period: 'per month',
                desc: 'For serious STR investors',
                features: ['Unlimited properties', 'Resolution Center + QR codes', 'Email alerts', 'PDF tax exports', 'Priority support'],
                cta: 'Start Pro Trial',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'contact us',
                desc: 'For property managers & funds',
                features: ['Everything in Pro', 'Multi-user access', 'API access', 'Custom ordinance tracking', 'Dedicated support'],
                cta: 'Contact Sales',
                highlight: false,
              },
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
                    <li key={j} style={{ ...s.pricingFeature, ...(plan.highlight ? { color: '#e0e7ff' } : {}) }}>
                      ✓ {f}
                    </li>
                  ))}
                </ul>
                <button
                  style={{ ...s.pricingCta, ...(plan.highlight ? s.pricingCtaHighlight : {}) }}
                  onClick={() => login()}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaSection}>
        <h2 style={s.ctaTitle}>Ready to get compliant?</h2>
        <p style={s.ctaSub}>Join Texas STR hosts who use LodgeLaw to stay ahead of 2026 regulations.</p>
        <button style={s.ctaBtn} onClick={() => login()}>
          Access Command Center →
        </button>
        <p style={s.ctaDisclaimer}>LodgeLaw is an operational tool. Always consult a licensed attorney for legal advice.</p>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>⚖️ LodgeLaw</div>
        <p style={s.footerText}>© 2026 LodgeLaw · Built for Texas STR Compliance</p>
      </footer>
    </div>
  )
}

const s: Record<string, any> = {
  wrapper: { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' },

  // Nav
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', zIndex: 100 },
  navLogo: { fontSize: '18px', fontWeight: '800', color: '#0f172a
