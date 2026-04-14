import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { formatCurrency } from '../lib/taxCalculator'
import { AlertTriangle, FileWarning, MessageSquareWarning, DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react'

interface Alert {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'document' | 'report' | 'tax' | 'compliance'
  title: string
  description: string
  actionLabel: string
  actionPath: string
  daysUntil?: number | null
  createdAt: string
}

const PRIORITY_CONFIG = {
  critical: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Critical', icon: XCircle },
  high:     { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'High',     icon: AlertTriangle },
  medium:   { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', label: 'Medium',   icon: Clock },
  low:      { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', label: 'Low',      icon: CheckCircle2 },
}

export function AlertFeed() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) buildAlerts()
  }, [user])

  const buildAlerts = async () => {
    setIsLoading(true)
    const built: Alert[] = []

    try {
      // Get property IDs
      const { data: props } = await supabase
        .from('properties')
        .select('id, name, license_number, zip_code')
        .eq('user_id', user!.id)

      const propIds = props?.map(p => p.id) ?? []
      const propMap: Record<string, any> = {}
      props?.forEach(p => { propMap[p.id] = p })

      // 1. Missing license numbers
      props?.forEach(p => {
        if (!p.license_number) {
          built.push({
            id: `license_${p.id}`,
            priority: 'critical',
            category: 'compliance',
            title: `Missing License: ${p.name}`,
            description: `${p.name} has no STR license number recorded. This is required for OTA platform compliance and city registration.`,
            actionLabel: 'Add License',
            actionPath: '/properties',
            createdAt: new Date().toISOString(),
          })
        }
      })

      // 2. Expiring documents
      const today = new Date()
      const in30 = new Date(); in30.setDate(today.getDate() + 30)
      const in7  = new Date(); in7.setDate(today.getDate() + 7)

      const { data: docs } = await supabase
        .from('documents')
        .select('id, name, expiry_date, property_id')
        .eq('user_id', user!.id)
        .lte('expiry_date', in30.toISOString().split('T')[0])

      docs?.forEach(doc => {
        if (!doc.expiry_date) return
        const expiry = new Date(doc.expiry_date)
        const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
        const propName = propMap[doc.property_id]?.name ?? 'Unknown Property'

        built.push({
          id: `doc_${doc.id}`,
          priority: days < 0 ? 'critical' : days <= 7 ? 'critical' : days <= 14 ? 'high' : 'medium',
          category: 'document',
          title: days < 0 ? `EXPIRED: ${doc.name}` : `Expiring Soon: ${doc.name}`,
          description: days < 0
            ? `This document expired ${Math.abs(days)} days ago at ${propName}. Renew immediately to stay compliant.`
            : `This document expires in ${days} day${days !== 1 ? 's' : ''} at ${propName}.`,
          actionLabel: 'View Documents',
          actionPath: '/documents',
          daysUntil: days,
          createdAt: new Date().toISOString(),
        })
      })

      // 3. Pending neighbor reports
      if (propIds.length > 0) {
        const { data: reports } = await supabase
          .from('neighbor_reports')
          .select('id, category, created_at, property_id')
          .eq('status', 'new')
          .in('property_id', propIds)

        reports?.forEach(report => {
          const propName = propMap[report.property_id]?.name ?? 'Unknown Property'
          const age = Math.floor((Date.now() - new Date(report.created_at).getTime()) / 86400000)
          built.push({
            id: `report_${report.id}`,
            priority: age > 7 ? 'high' : 'medium',
            category: 'report',
            title: `New Neighbor Report: ${report.category.charAt(0).toUpperCase() + report.category.slice(1)}`,
            description: `An unresolved ${report.category} complaint was submitted ${age === 0 ? 'today' : `${age} day${age !== 1 ? 's' : ''} ago`} for ${propName}. Unresolved reports can escalate to city enforcement.`,
            actionLabel: 'Go to Resolution Center',
            actionPath: '/resolution-center',
            createdAt: report.created_at,
          })
        })
      }

      // 4. Tax due alerts
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const { data: taxEntries } = await supabase
        .from('revenue_entries')
        .select('calculated_tax, month_year, property_id')
        .eq('user_id', user!.id)
        .eq('month_year', monthYear)

      if (taxEntries && taxEntries.length > 0) {
        const totalTax = taxEntries.reduce((sum, e) => sum + (e.calculated_tax || 0), 0)
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 20)
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000)
        built.push({
          id: `tax_${monthYear}`,
          priority: daysUntilDue <= 7 ? 'critical' : daysUntilDue <= 14 ? 'high' : 'medium',
          category: 'tax',
          title: `HOT Tax Due: ${formatCurrency(totalTax)}`,
          description: `Your Hotel Occupancy Tax for ${new Date(now.getFullYear(), now.getMonth()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} is estimated at ${formatCurrency(totalTax)}. Due date: ${dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`,
          actionLabel: 'View Tax Estimator',
          actionPath: '/tax-estimator',
          daysUntil: daysUntilDue,
          createdAt: new Date().toISOString(),
        })
      }

      // 5. Austin nights warning
      props?.forEach(p => {
        if (p.zip_code?.startsWith('787')) {
          built.push({
            id: `nights_${p.id}`,
            priority: 'low',
            category: 'compliance',
            title: `Austin 90-Night Cap: Monitor ${p.name}`,
            description: `Austin Type 1 licenses are capped at 90 nights/year. Ensure you are tracking your rental nights to avoid violations.`,
            actionLabel: 'View Properties',
            actionPath: '/properties',
            createdAt: new Date().toISOString(),
          })
        }
      })

      // Sort by priority
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      built.sort((a, b) => order[a.priority] - order[b.priority])
      setAlerts(built)
    } catch (err) {
      console.error('Alert build error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]))

  const visible = alerts
    .filter(a => !dismissed.has(a.id))
    .filter(a => filter === 'all' || a.priority === filter)

  const counts = {
    critical: alerts.filter(a => a.priority === 'critical' && !dismissed.has(a.id)).length,
    high:     alerts.filter(a => a.priority === 'high'     && !dismissed.has(a.id)).length,
    medium:   alerts.filter(a => a.priority === 'medium'   && !dismissed.has(a.id)).length,
    low:      alerts.filter(a => a.priority === 'low'      && !dismissed.has(a.id)).length,
  }

  const CATEGORY_ICONS = {
    document:   <FileWarning size={16} />,
    report:     <MessageSquareWarning size={16} />,
    tax:        <DollarSign size={16} />,
    compliance: <AlertTriangle size={16} />,
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Priority Alert Feed</h1>
          <p style={s.subtitle}>All compliance issues ranked by urgency — across all your properties</p>
        </div>
        <button style={s.refreshBtn} onClick={buildAlerts}>↻ Refresh</button>
      </div>

      {/* Summary bar */}
      <div style={s.summaryBar}>
        {(['critical', 'high', 'medium', 'low'] as const).map(p => {
          const cfg = PRIORITY_CONFIG[p]
          return (
            <div key={p} style={{ ...s.summaryItem, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: cfg.color }}>{counts[p]}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div style={s.tabs}>
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...s.tab,
              ...(filter === f ? {
                background: f === 'all' ? '#0f172a' : PRIORITY_CONFIG[f]?.bg,
                color: f === 'all' ? '#fff' : PRIORITY_CONFIG[f]?.color,
                border: `1.5px solid ${f === 'all' ? '#0f172a' : PRIORITY_CONFIG[f]?.border}`,
              } : {})
            }}
          >
            {f === 'all' ? `All (${alerts.filter(a => !dismissed.has(a.id)).length})` : `${PRIORITY_CONFIG[f].label} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div style={s.empty}>Loading alerts...</div>
      ) : visible.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>All clear!</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No active alerts in this category.</p>
        </div>
      ) : (
        <div style={s.list}>
          {visible.map(alert => {
            const cfg = PRIORITY_CONFIG[alert.priority]
            const Icon = cfg.icon
            return (
              <div key={alert.id} style={{ ...s.alertCard, borderLeft: `4px solid ${cfg.color}` }}>
                <div style={s.alertTop}>
                  <div style={s.alertLeft}>
                    <div style={{ ...s.priorityBadge, background: cfg.bg, color: cfg.color }}>
                      <Icon size={12} />
                      {cfg.label}
                    </div>
                    <div style={{ ...s.categoryBadge }}>
                      {CATEGORY_ICONS[alert.category]}
                      {alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}
                    </div>
                  </div>
                  <button style={s.dismissBtn} onClick={() => dismiss(alert.id)}>✕</button>
                </div>

                <h3 style={s.alertTitle}>{alert.title}</h3>
                <p style={s.alertDesc}>{alert.description}</p>

                <div style={s.alertBottom}>
                  <a href={alert.actionPath} style={s.actionBtn}>{alert.actionLabel} →</a>
                  <span style={s.timestamp}>
                    {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s: Record<string, any> = {
  wrapper: { padding: '32px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  refreshBtn: { padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' },
  summaryBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
  summaryItem: { borderRadius: '12px', padding: '16px', textAlign: 'center' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  tab: { padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#64748b' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  alertCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' },
  alertTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  alertLeft: { display: 'flex', gap: '8px', alignItems: 'center' },
  priorityBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  categoryBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', background: '#f1f5f9', color: '#475569' },
  dismissBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '4px 8px' },
  alertTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' },
  alertDesc: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 14px 0' },
  alertBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { fontSize: '13px', fontWeight: '700', color: '#6366f1', textDecoration: 'none' },
  timestamp: { fontSize: '11px', color: '#94a3b8' },
  empty: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  emptyCard: { textAlign: 'center', padding: '60px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' },
}
