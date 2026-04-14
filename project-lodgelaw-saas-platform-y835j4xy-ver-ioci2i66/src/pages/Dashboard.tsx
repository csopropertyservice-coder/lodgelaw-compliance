import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { getRiskByZip, checkLicenseVisibility } from '../lib/compliance'
import { formatCurrency } from '../lib/taxCalculator'
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, Activity, Info, Home, FileWarning, DollarSign, Bell } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuth()
  const [zipCode, setZipCode] = useState('')
  const [riskData, setRiskData] = useState<any>(null)
  const [listingUrl, setListingUrl] = useState('')
  const [healthCheck, setHealthCheck] = useState<any>(null)
  const [totalProperties, setTotalProperties] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [monthlyTax, setMonthlyTax] = useState(0)
  const [expiringDocs, setExpiringDocs] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  const getUserPropertyIds = async (): Promise<string[]> => {
    const { data } = await supabase.from('properties').select('id').eq('user_id', user!.id)
    return data?.map(p => p.id) ?? []
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const { count: propCount } = await supabase
        .from('properties').select('*', { count: 'exact', head: true }).eq('user_id', user!.id)

      const propertyIds = await getUserPropertyIds()
      const { count: reportCount } = await supabase
        .from('neighbor_reports').select('*', { count: 'exact', head: true })
        .eq('status', 'new').in('property_id', propertyIds.length ? propertyIds : ['none'])

      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const { data: taxData } = await supabase
        .from('revenue_entries').select('calculated_tax').eq('user_id', user!.id).eq('month_year', monthYear)
      const totalTax = taxData?.reduce((sum, e) => sum + (e.calculated_tax || 0), 0) ?? 0

      const in30Days = new Date()
      in30Days.setDate(in30Days.getDate() + 30)
      const { count: docCount } = await supabase
        .from('documents').select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .lte('expiry_date', in30Days.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0])

      setTotalProperties(propCount ?? 0)
      setPendingReports(reportCount ?? 0)
      setMonthlyTax(totalTax)
      setExpiringDocs(docCount ?? 0)
    } catch (err) {
      console.error('Stats error:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleZipSearch = () => {
    if (zipCode.length < 5) return
    setRiskData(getRiskByZip(zipCode))
  }

  const handleHealthCheck = () => {
    if (!listingUrl) return
    setHealthCheck(checkLicenseVisibility(listingUrl))
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Compliance Command Center</h1>
          <p style={s.subtitle}>Real-time status of your 2026 STR operations in Texas.</p>
        </div>
        <div style={s.dateBadge}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statIconBox('#eef2ff')}><Home size={18} color="#6366f1" /></div>
          <div>
            <div style={s.statValue}>{statsLoading ? '—' : totalProperties}</div>
            <div style={s.statLabel}>Total Properties</div>
          </div>
        </div>
        <div style={{ ...s.statCard, ...(pendingReports > 0 ? s.statCardAlert : {}) }}>
          <div style={s.statIconBox('#fef2f2')}><Bell size={18} color="#ef4444" /></div>
          <div>
            <div style={{ ...s.statValue, ...(pendingReports > 0 ? { color: '#ef4444' } : {}) }}>
              {statsLoading ? '—' : pendingReports}
            </div>
            <div style={s.statLabel}>Pending Reports</div>
          </div>
        </div>
        <div style={s.statCard}>
          <div style={s.statIconBox('#f0fdf4')}><DollarSign size={18} color="#22c55e" /></div>
          <div>
            <div style={s.statValue}>{statsLoading ? '—' : formatCurrency(monthlyTax)}</div>
            <div style={s.statLabel}>Est. Tax This Month</div>
          </div>
        </div>
        <div style={{ ...s.statCard, ...(expiringDocs > 0 ? s.statCardWarn : {}) }}>
          <div style={s.statIconBox('#fffbeb')}><FileWarning size={18} color="#f59e0b" /></div>
          <div>
            <div style={{ ...s.statValue, ...(expiringDocs > 0 ? { color: '#f59e0b' } : {}) }}>
              {statsLoading ? '—' : expiringDocs}
            </div>
            <div style={s.statLabel}>Docs Expiring Soon</div>
          </div>
        </div>
      </div>

      <div style={s.toolsGrid}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <ShieldAlert size={18} color="#6366f1" />
            <span style={s.cardTitle}>Risk Score Engine</span>
          </div>
          <p style={s.cardDesc}>Enter a Texas zip code to check current enforcement status.</p>
          <div style={s.inputRow}>
            <input
              style={s.input}
              placeholder="Enter Zip Code (e.g. 78701)"
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              maxLength={5}
              onKeyDown={e => e.key === 'Enter' && handleZipSearch()}
            />
            <button style={s.btn} onClick={handleZipSearch}>
              <Search size={14} /> Check
            </button>
          </div>
          {riskData && (
            <div style={s.resultBox}>
              <div style={s.resultTop}>
                <div>
                  <div style={s.resultCity}>{riskData.city}, TX</div>
                  <div style={{ ...s.riskBadge, background: riskData.score > 70 ? '#fef2f2' : '#f0fdf4', color: riskData.score > 70 ? '#ef4444' : '#22c55e' }}>
                    {riskData.label}
                  </div>
                </div>
                <div style={s.resultScore}>{riskData.score}</div>
              </div>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${riskData.score}%`, background: riskData.score > 70 ? '#ef4444' : '#22c55e' }} />
              </div>
              <div style={s.alertBox}>
                <AlertTriangle size={14} color="#f59e0b" />
                <span style={s.alertText}>{riskData.alert}</span>
              </div>
            </div>
          )}
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <Activity size={18} color="#6366f1" />
            <span style={s.cardTitle}>Platform Health Check</span>
          </div>
          <p style={s.cardDesc}>Verify your listing visibility per July 1, 2026 regulations.</p>
          <div style={s.inputRow}>
            <input
              style={s.input}
              placeholder="Paste Airbnb/VRBO Listing URL"
              value={listingUrl}
              onChange={e => setListingUrl(e.target.value)}
            />
            <button style={s.btn} onClick={handleHealthCheck}>Scan</button>
          </div>
          {healthCheck && (
            <div style={{ ...s.healthResult, background: healthCheck.isValid ? '#f0fdf4' : '#fef2f2', border: `1px solid ${healthCheck.isValid ? '#bbf7d0' : '#fecaca'}` }}>
              {healthCheck.isValid ? <CheckCircle2 size={18} color="#22c55e" /> : <AlertTriangle size={18} color="#ef4444" />}
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: healthCheck.isValid ? '#16a34a' : '#dc2626' }}>
                  {healthCheck.isValid ? 'Platform Compliant' : 'Risk Detected'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{healthCheck.message}</div>
              </div>
            </div>
          )}
          <div style={s.infoBox}>
            <Info size={12} color="#6366f1" />
            <span style={s.infoText}>2026 Austin Rule: License numbers must appear in the designated OTA field or first line of description.</span>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardHeader}>
          <Bell size={18} color="#6366f1" />
          <span style={s.cardTitle}>Compliance Alerts & Ordinance Updates</span>
        </div>
        <div style={s.alertList}>
          {[
            { city: 'Austin', date: 'July 1, 2026', title: 'Platform Transparency Rules Active', tag: 'Action Required', type: 'error' },
            { city: 'Houston', date: 'Jan 15, 2026', title: 'New Registration Portal Opens', tag: 'Update', type: 'warning' },
            { city: 'Dallas', date: 'April 10, 2026', title: 'Injunction Update: Zoning enforcement paused', tag: 'Monitoring', type: 'info' },
          ].map((alert, i) => (
            <div key={i} style={s.alertRow}>
              <div style={{ ...s.alertDot, background: alert.type === 'error' ? '#ef4444' : alert.type === 'warning' ? '#f59e0b' : '#6366f1' }} />
              <div style={s.alertContent}>
                <div style={s.alertMeta}>{alert.city} · {alert.date} <span style={s.alertTag}>{alert.tag}</span></div>
                <div style={s.alertTitle}>{alert.title}</div>
              </div>
              <ExternalLink size={14} color="#94a3b8" style={{ cursor: 'pointer', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, any> = {
  wrapper: { padding: '32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  dateBadge: { fontSize: '12px', color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' },
  statCardAlert: { border: '1px solid #fecaca', background: '#fff5f5' },
  statCardWarn: { border: '1px solid #fde68a', background: '#fffbeb' },
  statIconBox: (bg: string) => ({ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
  statValue: { fontSize: '22px', fontWeight: '800', color: '#0f172a', lineHeight: 1 },
  statLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
  toolsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', marginBottom: '20px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a' },
  cardDesc: { fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' },
  inputRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
  input: { flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff' },
  btn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  resultBox: { background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' },
  resultTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  resultCity: { fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
  resultScore: { fontSize: '32px', fontWeight: '800', color: '#0f172a' },
  riskBadge: { display: 'inline-block', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' },
  progressBar: { height: '6px', background: '#e2e8f0', borderRadius: '999px', marginBottom: '12px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '999px' },
  alertBox: { display: 'flex', gap: '8px', alignItems: 'flex-start', background: '#fff', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0' },
  alertText: { fontSize: '12px', color: '#64748b', lineHeight: '1.5' },
  healthResult: { display: 'flex', alignItems: 'flex-start', gap: '10px', borderRadius: '10px', padding: '12px', marginBottom: '12px' },
  infoBox: { display: 'flex', gap: '6px', alignItems: 'flex-start', background: '#eef2ff', borderRadius: '8px', padding: '10px 12px' },
  infoText: { fontSize: '12px', color: '#4338ca', lineHeight: '1.5' },
  alertList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  alertRow: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' },
  alertDot: { width: '8px', height: '36px', borderRadius: '4px', flexShrink: 0 },
  alertContent: { flex: 1 },
  alertMeta: { fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '3px' },
  alertTag: { background: '#e2e8f0', borderRadius: '4px', padding: '1px 6px', marginLeft: '6px', fontSize: '10px' },
  alertTitle: { fontSize: '13px', fontWeight: '600', color: '#0f172a' },
}
