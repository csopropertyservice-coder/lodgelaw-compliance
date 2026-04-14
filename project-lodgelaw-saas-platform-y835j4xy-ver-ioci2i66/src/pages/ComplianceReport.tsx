import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { getRiskByZip } from '../lib/compliance'
import { formatCurrency } from '../lib/taxCalculator'

interface Property {
  id: string
  name: string
  address: string
  zip_code: string
  license_number: string | null
  total_nights_rented: number
  status: string
}

interface ReportConfig {
  title: string
  preparedFor: string
  preparedBy: string
  audience: 'hoa' | 'buyer' | 'general'
  includeFinancials: boolean
  includeDocs: boolean
  includeReports: boolean
}

export function ComplianceReport() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [taxEntries, setTaxEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [config, setConfig] = useState<ReportConfig>({
    title: 'STR Portfolio Compliance Report',
    preparedFor: '',
    preparedBy: '',
    audience: 'general',
    includeFinancials: true,
    includeDocs: true,
    includeReports: true,
  })

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    const propRes = await supabase.from('properties').select('*').eq('user_id', user!.id)
    const propIds = propRes.data?.map(p => p.id) ?? []

    const [docRes, reportRes, taxRes] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', user!.id),
      propIds.length > 0
        ? supabase.from('neighbor_reports').select('*').in('property_id', propIds)
        : Promise.resolve({ data: [] }),
      supabase.from('revenue_entries').select('*').eq('user_id', user!.id).order('month_year', { ascending: false }),
    ])

    setProperties(propRes.data ?? [])
    setDocs(docRes.data ?? [])
    setReports((reportRes as any).data ?? [])
    setTaxEntries(taxRes.data ?? [])
    setIsLoading(false)
  }

  const update = (key: keyof ReportConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setConfig(prev => ({ ...prev, [key]: e.target.value }))

  const toggleBool = (key: keyof ReportConfig) =>
    setConfig(prev => ({ ...prev, [key]: !prev[key] }))

  const totalTax = taxEntries.reduce((sum, e) => sum + (e.calculated_tax || 0), 0)
  const totalRevenue = taxEntries.reduce((sum, e) => sum + (e.total_revenue || 0), 0)
  const expiredDocs = docs.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date())
  const openReports = reports.filter(r => r.status === 'new')
  const resolvedReports = reports.filter(r => r.status === 'resolved')
  const compliantProps = properties.filter(p => p.license_number)

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  if (isPreview) {
    return (
      <div>
        <style>{`@media print { .no-print { display: none !important; } }`}</style>
        <div className="no-print" style={{ padding: '16px 32px', background: '#0f172a', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setIsPreview(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
            ← Back to Editor
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 48px', fontFamily: 'Georgia, serif', color: '#0f172a' }}>
          {/* Cover */}
          <div style={{ marginBottom: '48px', paddingBottom: '48px', borderBottom: '2px solid #0f172a' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6366f1', marginBottom: '16px', fontFamily: 'system-ui, sans-serif', fontWeight: '700' }}>
              ⚖️ LodgeLaw · Texas STR Compliance Platform
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 24px 0', letterSpacing: '-0.02em', lineHeight: '1.2' }}>{config.title}</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>
              {[
                ['Date', today],
                ['Audience', config.audience === 'hoa' ? 'HOA / Property Management' : config.audience === 'buyer' ? 'Prospective Buyer' : 'General'],
                ...(config.preparedFor ? [['Prepared For', config.preparedFor]] : []),
                ...(config.preparedBy ? [['Prepared By', config.preparedBy]] : []),
              ].map(([label, value], i) => (
                <div key={i}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Summary */}
          <div style={rp.section}>
            <h2 style={rp.h2}>Executive Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Properties', value: properties.length, color: '#6366f1' },
                { label: 'Licensed Properties', value: `${compliantProps.length}/${properties.length}`, color: compliantProps.length === properties.length ? '#22c55e' : '#ef4444' },
                { label: 'Open Reports', value: openReports.length, color: openReports.length === 0 ? '#22c55e' : '#f59e0b' },
                { label: 'Compliance Score', value: `${Math.round((compliantProps.length / Math.max(properties.length, 1)) * 100)}%`, color: '#6366f1' },
              ].map((stat, i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', textAlign: 'center', border: '1px solid #e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <p style={rp.p}>
              This report provides a comprehensive compliance overview for a portfolio of {properties.length} short-term rental {properties.length === 1 ? 'property' : 'properties'} in Texas.
              {compliantProps.length === properties.length
                ? ' All properties are currently licensed and compliant with 2026 Texas STR regulations.'
                : ` ${properties.length - compliantProps.length} ${properties.length - compliantProps.length === 1 ? 'property requires' : 'properties require'} license registration to achieve full compliance.`}
              {openReports.length > 0 && ` There ${openReports.length === 1 ? 'is' : 'are'} currently ${openReports.length} open neighbor ${openReports.length === 1 ? 'report' : 'reports'} under review.`}
            </p>
          </div>

          {/* Properties */}
          <div style={rp.section}>
            <h2 style={rp.h2}>Property Portfolio</h2>
            {properties.map((p, i) => {
              const risk = getRiskByZip(p.zip_code)
              const propDocs = docs.filter(d => d.property_id === p.id)
              const propReports = reports.filter(r => r.property_id === p.id)
              return (
                <div key={p.id} style={{ marginBottom: '24px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' }}>{p.name}</h3>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{p.address}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: risk.score > 70 ? '#ef4444' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{risk.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{risk.score}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
                    <div style={{ background: p.license_number ? '#f0fdf4' : '#fef2f2', borderRadius: '6px', padding: '8px 12px' }}>
                      <div style={{ color: '#94a3b8', marginBottom: '2px' }}>License</div>
                      <div style={{ fontWeight: '700', color: p.license_number ? '#16a34a' : '#dc2626' }}>{p.license_number ?? '⚠️ Missing'}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '8px 12px' }}>
                      <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Documents</div>
                      <div style={{ fontWeight: '700' }}>{propDocs.length} on file</div>
                    </div>
                    <div style={{ background: propReports.filter(r => r.status === 'new').length > 0 ? '#fffbeb' : '#f0fdf4', borderRadius: '6px', padding: '8px 12px' }}>
                      <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Reports</div>
                      <div style={{ fontWeight: '700', color: propReports.filter(r => r.status === 'new').length > 0 ? '#f59e0b' : '#16a34a' }}>
                        {propReports.filter(r => r.status === 'new').length} open · {propReports.filter(r => r.status === 'resolved').length} resolved
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Documents */}
          {config.includeDocs && docs.length > 0 && (
            <div style={rp.section}>
              <h2 style={rp.h2}>Document Vault Summary</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Document', 'Type', 'Property', 'Expiry', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => {
                    const expired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
                    const propName = properties.find(p => p.id === doc.property_id)?.name ?? '—'
                    return (
                      <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '600' }}>{doc.name}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b', textTransform: 'capitalize' }}>{doc.type}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{propName}</td>
                        <td style={{ padding: '8px 12px', color: expired ? '#ef4444' : '#64748b' }}>
                          {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ background: expired ? '#fef2f2' : '#f0fdf4', color: expired ? '#ef4444' : '#16a34a', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
                            {expired ? 'Expired' : 'Valid'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Financials */}
          {config.includeFinancials && taxEntries.length > 0 && (
            <div style={rp.section}>
              <h2 style={rp.h2}>Financial Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px', fontFamily: 'system-ui, sans-serif' }}>
                {[
                  { label: 'Total Gross Revenue', value: formatCurrency(totalRevenue) },
                  { label: 'Total HOT Tax Collected', value: formatCurrency(totalTax) },
                  { label: 'Avg Monthly Revenue', value: formatCurrency(totalRevenue / Math.max(taxEntries.length, 1)) },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{item.value}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Neighbor Reports */}
          {config.includeReports && reports.length > 0 && (
            <div style={rp.section}>
              <h2 style={rp.h2}>Neighbor Relations Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontFamily: 'system-ui, sans-serif' }}>
                {[
                  { label: 'Total Reports', value: reports.length, color: '#6366f1' },
                  { label: 'Resolved', value: resolvedReports.length, color: '#22c55e' },
                  { label: 'Open', value: openReports.length, color: openReports.length > 0 ? '#f59e0b' : '#22c55e' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
                  </div>
                ))}
              </div>
              {config.audience === 'hoa' && (
                <p style={{ ...rp.p, marginTop: '16px' }}>
                  All neighbor complaints are logged and tracked through the LodgeLaw Resolution Center. Hosts are notified immediately upon submission and are required to respond within 48 hours.
                </p>
              )}
              {config.audience === 'buyer' && (
                <p style={{ ...rp.p, marginTop: '16px' }}>
                  The property has a documented neighbor relations history. All reports have been addressed through a formal resolution process, demonstrating responsible property management practices.
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '2px solid #0f172a', fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>Generated by LodgeLaw · Texas STR Compliance Platform</span>
            <span>{today}</span>
          </div>
          <p style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'system-ui, sans-serif', marginTop: '8px' }}>
            This report is generated for informational purposes only. LodgeLaw is an operational tool — consult a licensed attorney for legal compliance advice.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Compliance Report Generator</h1>
          <p style={s.subtitle}>Create a professional white-label report for HOAs, buyers, or property managers</p>
        </div>
        <button style={s.previewBtn} onClick={() => setIsPreview(true)}>👁 Preview & Print</button>
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>📋 Report Details</h3>
          <div style={s.field}>
            <label style={s.label}>Report Title</label>
            <input style={s.input} value={config.title} onChange={update('title')} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Prepared For</label>
            <input style={s.input} value={config.preparedFor} onChange={update('preparedFor')} placeholder="Austin HOA Board / John Smith" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Prepared By</label>
            <input style={s.input} value={config.preparedBy} onChange={update('preparedBy')} placeholder="Your name or company" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Report Audience</label>
            <select style={s.select} value={config.audience} onChange={update('audience') as any}>
              <option value="general">General Purpose</option>
              <option value="hoa">HOA / Property Management</option>
              <option value="buyer">Prospective Buyer</option>
            </select>
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>📊 Include in Report</h3>
          {[
            { key: 'includeFinancials', label: '💰 Financial Summary', desc: 'Revenue and HOT tax totals' },
            { key: 'includeDocs', label: '📄 Document Vault', desc: 'All compliance documents and expiry status' },
            { key: 'includeReports', label: '📱 Neighbor Relations', desc: 'Report history and resolution stats' },
          ].map(item => (
            <div
              key={item.key}
              onClick={() => toggleBool(item.key as keyof ReportConfig)}
              style={{
                ...s.toggleRow,
                background: config[item.key as keyof ReportConfig] ? '#eef2ff' : '#f8fafc',
                border: `1.5px solid ${config[item.key as keyof ReportConfig] ? '#c7d2fe' : '#e2e8f0'}`,
              }}
            >
              <div>
                <div style={s.toggleLabel}>{item.label}</div>
                <div style={s.toggleDesc}>{item.desc}</div>
              </div>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', border: '2px solid',
                borderColor: config[item.key as keyof ReportConfig] ? '#6366f1' : '#cbd5e1',
                background: config[item.key as keyof ReportConfig] ? '#6366f1' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {config[item.key as keyof ReportConfig] && <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>✓</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...s.card, gridColumn: '1 / -1' }}>
          <h3 style={s.cardTitle}>📈 Report Preview Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Properties', value: properties.length },
              { label: 'Licensed', value: `${compliantProps.length}/${properties.length}` },
              { label: 'Documents', value: docs.length },
              { label: 'Open Reports', value: openReports.length },
              { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
              { label: 'Total Tax', value: formatCurrency(totalTax) },
            ].map((item, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{item.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
          <button style={{ ...s.previewBtn, marginTop: '20px', width: '100%', padding: '14px', fontSize: '15px' }} onClick={() => setIsPreview(true)}>
            👁 Preview Full Report & Print
          </button>
        </div>
      </div>
    </div>
  )
}

const rp: Record<string, any> = {
  section: { marginBottom: '40px' },
  h2: { fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', marginTop: 0, fontFamily: 'system-ui, sans-serif', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' },
  p: { fontSize: '13px', lineHeight: '1.7', color: '#374151', margin: 0, fontFamily: 'system-ui, sans-serif' },
}

const s: Record<string, any> = {
  wrapper: { padding: '32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  previewBtn: { padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '20px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer' },
  toggleLabel: { fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' },
  toggleDesc: { fontSize: '12px', color: '#64748b' },
}
