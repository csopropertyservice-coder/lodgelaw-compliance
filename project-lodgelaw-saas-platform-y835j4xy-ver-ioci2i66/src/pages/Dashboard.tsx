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

  // Summary stats
  const [totalProperties, setTotalProperties] = useState(0)
  const [pendingReports, setPendingReports] = useState(0)
  const [monthlyTax, setMonthlyTax] = useState(0)
  const [expiringDocs, setExpiringDocs] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      // Total properties
      const { count: propCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)

      // Pending neighbor reports
      const { count: reportCount } = await supabase
        .from('neighbor_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
        .in('property_id', await getUserPropertyIds())

      // This month's estimated tax
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const { data: taxData } = await supabase
        .from('revenue_entries')
        .select('calculated_tax')
        .eq('user_id', user!.id)
        .eq('month_year', monthYear)

      const totalTax = taxData?.reduce((sum, e) => sum + (e.calculated_tax || 0), 0) ?? 0

      // Expiring documents (within 30 days)
      const in30Days = new Date()
      in30Days.setDate(in30Days.getDate() + 30)
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
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

  const getUserPropertyIds = async (): Promise<string[]> => {
    const { data } = await supabase
      .from('properties')
      .select('id')
      .eq('user_id', user!.id)
    return data?.map(p => p.id) ?? []
  }

  const handleZipSearch = () => {
    if (zipCode.length < 5) return
    setRiskData(getRiskByZip(zipCode))
  }

  const handleHealthCheck = () => {
    if (!listingUrl) return
    const check = checkLicenseVisibility(listingUrl)
    setHealthCheck(check)
  }

  return (
    <div style={s.wrapper}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Compliance Command Center</h1>
          <p style={s.subtitle}>Real-time status of your 2026 STR operations in Texas.</p>
        </div>
        <div style={s.dateBadge}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statIcon('#eef2ff', '#6366f1')}><Home size={18} color="#6366f1" /></div>
          <div>
            <div style={s.statValue}>{statsLoading ? '—' : totalProperties}</div>
            <div style={s.statLabel}>Total Properties</div>
          </div>
        </div>
        <div style={{ ...s.statCard, ...(pendingReports > 0 ? s.statCardAlert : {}) }}>
          <div style={s.statIcon('#fef2f2', '#ef4444')}><Bell size={18} color="#ef4444" /></div>
          <div>
            <div style={{ ...s.statValue, ...(pendingReports > 0 ? { color: '#ef4444' } : {}) }}>
              {statsLoading ? '—' : pendingReports}
            </div>
            <div style={s.statLabel}>Pending Reports</div>
          </div>
        </div>
        <div style={s.statCard}>
          <div style={s.statIcon('#f0fdf4', '#22c55e')}><DollarSign size={18} color="#22c55e" /></div>
          <div>
            <div style={s.statValue}>{statsLoading ? '—' : formatCurrency(monthlyTax)}</div>
            <div style={s.statLabel}>Est. Tax This Month</div>
          </div>
        </div>
        <div style={{ ...s.statCard, ...(expiringDocs > 0 ? s.statCardWarn : {}) }}>
          <div style={s.statIcon('#fffbeb', '#f59e0b')}><FileWarning size={18} color="#f59e0b" /></div>
          <div>
            <div style={{ ...s.statValue, ...(expiringDocs > 0 ? { color: '#f59e0b' } : {}) }}>
              {statsLoading ? '—' : expiringDocs}
            </div>
            <div style={s.statLabel}>Docs Expiring Soon</div>
          </div>
        </div>
      </div>

      {/* Tools grid */}
      <div style={s.toolsGrid}>
        {/* Risk Score Engine */}
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

        {/* Platform Health Check */}
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
              {healthCheck.isValid
                ? <CheckCircle2 size={18} color="#22c55e" />
                : <AlertTriangle size={18} color="#ef4444" />}
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

      {/* Compliance Feed */}
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
            <div key={i} style={s.alertR
