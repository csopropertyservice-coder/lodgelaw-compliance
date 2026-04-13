import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

interface Report {
  id: string
  property_id: string
  category: string
  message: string
  status: 'new' | 'in_review' | 'resolved'
  created_at: string
  property_name?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  noise: '🔊 Noise',
  parking: '🚗 Parking',
  trash: '🗑️ Trash',
  guests: '👥 Guests',
  other: '📝 Other',
}

const STATUS_STYLES: Record<string, { background: string; color: string; label: string }> = {
  new:       { background: '#fef2f2', color: '#ef4444', label: 'New' },
  in_review: { background: '#fffbeb', color: '#f59e0b', label: 'In Review' },
  resolved:  { background: '#f0fdf4', color: '#22c55e', label: 'Resolved' },
}

export function ResolutionCenter() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [properties, setProperties] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'in_review' | 'resolved'>('all')

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch user's properties first
      const { data: props } = await supabase
        .from('properties')
        .select('id, name')
        .eq('user_id', user!.id)

      const propMap: Record<string, string> = {}
      props?.forEach(p => { propMap[p.id] = p.name })
      setProperties(propMap)

      // Fetch all reports for those properties
      const propertyIds = props?.map(p => p.id) ?? []
      if (propertyIds.length === 0) {
        setReports([])
        setIsLoading(false)
        return
      }

      const { data: reportData } = await supabase
        .from('neighbor_reports')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })

      const enriched = (reportData ?? []).map(r => ({
        ...r,
        property_name: propMap[r.property_id] ?? 'Unknown Property',
      }))
      setReports(enriched)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (reportId: string, newStatus: string) => {
    await supabase
      .from('neighbor_reports')
      .update({ status: newStatus })
      .eq('id', reportId)
    setReports(prev =>
      prev.map(r => r.id === reportId ? { ...r, status: newStatus as Report['status'] } : r)
    )
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)
  const newCount = reports.filter(r => r.status === 'new').length

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Resolution Center</h1>
          <p style={styles.subtitle}>Manage neighbor reports across all your properties</p>
        </div>
        {newCount > 0 && (
          <div style={styles.badge}>{newCount} new report{newCount > 1 ? 's' : ''}</div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={styles.tabs}>
        {(['all', 'new', 'in_review', 'resolved'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{ ...styles.tab, ...(filter === tab ? styles.tabActive : {}) }}
          >
            {tab === 'all' ? 'All' : STATUS_STYLES[tab].label}
            <span style={styles.tabCount}>
              {tab === 'all' ? reports.length : reports.filter(r => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div style={styles.empty}>Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📭</div>
          <p style={styles.emptyText}>No reports here yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(report => {
            const statusStyle = STATUS_STYLES[report.status]
            return (
              <div key={report.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.cardLeft}>
                    <span style={styles.categoryTag}>
                      {CATEGORY_LABELS[report.category] ?? report.category}
                    </span>
                    <span style={styles.propertyName}>{report.property_name}</span>
                  </div>
                  <div style={{ ...styles.statusBadge, background: statusStyle.background, color: statusStyle.color }}>
                    {statusStyle.label}
                  </div>
                </div>

                <p style={styles.message}>{report.message}</p>

                <div style={styles.cardBottom}>
                  <span style={styles.timestamp}>
                    {new Date(report.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <div style={styles.actions}>
                    {report.status !== 'in_review' && (
                      <button
                        style={styles.actionBtn}
                        onClick={() => updateStatus(report.id, 'in_review')}
                      >
                        Mark In Review
                      </button>
                    )}
                    {report.status !== 'resolved' && (
                      <button
                        style={{ ...styles.actionBtn, ...styles.actionBtnGreen }}
                        onClick={() => updateStatus(report.id, 'resolved')}
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { padding: '32px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  badge: { background: '#fef2f2', color: '#ef4444', fontWeight: '700', fontSize: '13px', padding: '6px 14px', borderRadius: '20px', border: '1px solid #fecaca' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  tab: { padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' },
  tabActive: { border: '1.5px solid #6366f1', background: '#eef2ff', color: '#6366f1' },
  tabCount: { background: '#e2e8f0', borderRadius: '10px', padding: '1px 7px', fontSize: '11px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  categoryTag: { background: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px' },
  propertyName: { fontSize: '13px', fontWeight: '600', color: '#0f172a' },
  statusBadge: { fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' },
  message: { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px 0' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timestamp: { fontSize: '12px', color: '#94a3b8' },
  actions: { display: 'flex', gap: '8px' },
  actionBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569' },
  actionBtnGreen: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  empty: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  emptyCard: { textAlign: 'center', padding: '60px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' },
  emptyIcon: { fontSize: '40px', marginBottom: '12px' },
  emptyText: { color: '#94a3b8', fontSize: '14px' },
}
