import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import {
  calculateHOT,
  formatCurrency,
  getMonthLabel,
  CITY_TAX_RATES,
  type TaxBreakdown,
} from '../lib/taxCalculator'

interface Property {
  id: string
  name: string
  zip_code: string
}

interface SavedEntry {
  id: string
  property_id: string
  month_year: string
  total_revenue: number
  platform_fees: number
  calculated_tax: number
  city: string
  property_name?: string
}

export function TaxEstimator() {
  const { user } = useAuth()
  const printRef = useRef<HTMLDivElement>(null)

  const [properties, setProperties] = useState<Property[]>([])
  const [entries, setEntries] = useState<SavedEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [propertyId, setPropertyId] = useState('')
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [grossRevenue, setGrossRevenue] = useState('')
  const [platformFees, setPlatformFees] = useState('')
  const [city, setCity] = useState('austin')
  const [breakdown, setBreakdown] = useState<TaxBreakdown | null>(null)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    const [{ data: props }, { data: ents }] = await Promise.all([
      supabase.from('properties').select('id, name, zip_code').eq('user_id', user!.id),
      supabase.from('revenue_entries').select('*').eq('user_id', user!.id).order('month_year', { ascending: false })
    ])
    const propMap: Record<string, string> = {}
    props?.forEach(p => { propMap[p.id] = p.name })
    setProperties(props ?? [])
    setEntries((ents ?? []).map(e => ({ ...e, property_name: propMap[e.property_id] ?? 'Unknown' })))
    if (props && props.length > 0) setPropertyId(props[0].id)
    setIsLoading(false)
  }

  const handleCalculate = () => {
    const revenue = parseFloat(grossRevenue) || 0
    const fees = parseFloat(platformFees) || 0
    setBreakdown(calculateHOT(revenue, fees, city))
  }

  const handleSave = async () => {
    if (!breakdown || !propertyId) return
    setIsSaving(true)
    const { error } = await supabase.from('revenue_entries').upsert({
      user_id: user!.id,
      property_id: propertyId,
      month_year: monthYear,
      total_revenue: breakdown.grossRevenue,
      platform_fees: breakdown.platformFees,
      calculated_tax: breakdown.totalTax,
      city,
    }, { onConflict: 'property_id,month_year' })
    setIsSaving(false)
    if (!error) {
      setSavedMsg('Saved!')
      setTimeout(() => setSavedMsg(''), 3000)
      fetchData()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={s.wrapper}>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #tax-print-area { display: block !important; }
        }
        #tax-print-area { display: none; }
      `}</style>

      {/* Print area */}
      <div id="tax-print-area" ref={printRef}>
        {breakdown && (
          <div style={{ padding: '40px', fontFamily: 'serif', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>LodgeLaw — HOT Tax Estimate</h1>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '13px' }}>
              Generated {new Date().toLocaleDateString()} · {getMonthLabel(monthYear)} · {CITY_TAX_RATES[city]?.label}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              {[
                ['Gross Revenue', formatCurrency(breakdown.grossRevenue)],
                ['Platform Fees Deducted', `(${formatCurrency(breakdown.platformFees)})`],
                ['Taxable Revenue', formatCurrency(breakdown.taxableRevenue)],
                ['', ''],
                ['Texas State HOT (6%)', formatCurrency(breakdown.stateTax)],
                [`${CITY_TAX_RATES[city]?.label} City Tax (${(breakdown.rates.city * 100).toFixed(0)}%)`, formatCurrency(breakdown.cityTax)],
                ['', ''],
                ['TOTAL TAX DUE', formatCurrency(breakdown.totalTax)],
              ].map(([label, value], i) => label ? (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 4px', fontWeight: i === 7 ? '700' : '400' }}>{label}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: i === 7 ? '700' : '400' }}>{value}</td>
                </tr>
              ) : <tr key={i}><td colSpan={2} style={{ padding: '4px' }}></td></tr>)}
            </table>
            <p style={{ marginTop: '24px', fontSize: '11px', color: '#94a3b8' }}>
              This is an estimate only. Consult a tax professional for official filings.
            </p>
          </div>
        )}
      </div>

      {/* Page header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tax Estimator</h1>
          <p style={s.subtitle}>Calculate your Hotel Occupancy Tax (HOT) liability by month</p>
        </div>
      </div>

      <div style={s.grid}>
        {/* Left — Input form */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>📊 Enter Revenue</h2>

          <div style={s.field}>
            <label style={s.label}>Property</label>
            <select style={s.select} value={propertyId} onChange={e => setPropertyId(e.target.value)}>
              {properties.length === 0
                ? <option>No properties yet</option>
                : properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
              }
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Month</label>
            <input
              type="month"
              style={s.input}
              value={monthYear}
              onChange={e => setMonthYear(e.target.value)}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>City / Tax Jurisdiction</label>
            <select style={s.select} value={city} onChange={e => setCity(e.target.value)}>
              {Object.entries(CITY_TAX_RATES).map(([key, val]) => (
                <option key={key} value={key}>{val.label} ({(val.total * 100).toFixed(0)}% total)</option>
              ))}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.label}>Gross Revenue ($)</label>
            <input
              type="number"
              style={s.input}
              placeholder="e.g. 4500"
              value={grossRevenue}
              onChange={e => setGrossRevenue(e.target.value)}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Platform Fees ($) <span style={s.hint}>Airbnb/VRBO fees to deduct</span></label>
            <input
              type="number"
              style={s.input}
              placeholder="e.g. 450"
              value={platformFees}
              onChange={e => setPlatformFees(e.target.value)}
            />
          </div>

          <button style={s.calcBtn} onClick={handleCalculate}>
            Calculate Tax
          </button>
        </div>

        {/* Right — Results */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>🧾 Tax Breakdown</h2>

          {!breakdown ? (
            <div style={s.empty}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧮</div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Enter your revenue and click Calculate to see your tax breakdown.</p>
            </div>
          ) : (
            <>
              <div style={s.periodLabel}>
                {getMonthLabel(monthYear)} · {CITY_TAX_RATES[city]?.label}
              </div>

              {/* Breakdown rows */}
              <div style={s.breakdownList}>
                <div style={s.breakdownRow}>
                  <span style={s.breakdownLabel}>Gross Revenue</span>
                  <span style={s.breakdownValue}>{formatCurrency(breakdown.grossRevenue)}</span>
                </div>
                <div style={{ ...s.breakdownRow, color: '#ef4444' }}>
                  <span>Platform Fees Deducted</span>
                  <span>({formatCurrency(breakdown.platformFees)})</span>
                </div>
                <div style={{ ...s.breakdownRow, borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontWeight: '600' }}>
                  <span>Taxable Revenue</span>
                  <span>{formatCurrency(breakdown.taxableRevenue)}</span>
                </div>

                <div style={{ margin: '16px 0 8px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tax Calculation
                </div>

                <div style={s.breakdownRow}>
                  <span>Texas State HOT (6%)</span>
                  <span>{formatCurrency(breakdown.stateTax)}</span>
                </div>
                <div style={s.breakdownRow}>
                  <span>{CITY_TAX_RATES[city]?.label} City Tax ({(breakdown.rates.city * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(breakdown.cityTax)}</span>
                </div>
              </div>

              {/* Total */}
              <div style={s.totalBox}>
                <span style={s.totalLabel}>TOTAL TAX DUE</span>
                <span style={s.totalAmount}>{formatCurrency(breakdown.totalTax)}</span>
              </div>

              <div style={s.rateNote}>
                Effective rate: {breakdown.effectiveRate.toFixed(1)}% of gross revenue
              </div>

              {/* Actions */}
              <div style={s.actions}>
                <button
                  style={s.saveBtn}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : savedMsg || '💾 Save Entry'}
                </button>
                <button style={s.printBtn} onClick={handlePrint}>
                  🖨️ Export / Print
                </button>
              </div>

              <p style={s.disclaimer}>
                Estimate only. Consult a tax professional for official filings.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Saved entries history */}
      {entries.length > 0 && (
        <div style={{ ...s.card, marginTop: '24px' }}>
          <h2 style={s.cardTitle}>📅 Saved Entries</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Month</th>
                  <th style={s.th}>Property</th>
                  <th style={s.th}>City</th>
                  <th style={s.th}>Gross Revenue</th>
                  <th style={s.th}>Platform Fees</th>
                  <th style={s.th}>Tax Due</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} style={s.tr}>
                    <td style={s.td}>{getMonthLabel(entry.month_year)}</td>
                    <td style={s.td}>{entry.property_name}</td>
                    <td style={s.td}>{CITY_TAX_RATES[entry.city]?.label ?? entry.city}</td>
                    <td style={s.td}>{formatCurrency(entry.total_revenue)}</td>
                    <td style={s.td}>{formatCurrency(entry.platform_fees)}</td>
                    <td style={{ ...s.td, fontWeight: '700', color: '#ef4444' }}>{formatCurrency(entry.calculated_tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { padding: '32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '20px', marginTop: 0 },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  hint: { fontWeight: '400', color: '#94a3b8', marginLeft: '4px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' as const, color: '#0f172a' },
  select: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' as const, color: '#0f172a', background: '#fff' },
  calcBtn: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' },
  empty: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' as const },
  periodLabel: { fontSize: '13px', fontWeight: '600', color: '#6366f1', marginBottom: '16px', background: '#eef2ff', padding: '6px 12px', borderRadius: '6px', display: 'inline-block' },
  breakdownList: { marginBottom: '16px' },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', color: '#374151' },
  breakdownLabel: {},
  breakdownValue: {},
  totalBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', margin: '16px 0 8px' },
  totalLabel: { fontSize: '13px', fontWeight: '700', color: '#ef4444', letterSpacing: '0.05em' },
  totalAmount: { fontSize: '22px', fontWeight: '800', color: '#ef4444' },
  rateNote: { fontSize: '12px', color: '#94a3b8', marginBottom: '16px' },
  actions: { display: 'flex', gap: '10px', marginBottom: '12px' },
  saveBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  printBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  disclaimer: { fontSize: '11px', color: '#94a3b8', textAlign: 'center' as const, margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 12px', textAlign: 'left' as const, fontWeight: '600', color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' as const },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 12px', color: '#374151' },
}
