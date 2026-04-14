import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { Plus, Home, MapPin, Sparkles, ChevronDown, ChevronRight, QrCode, X, Copy } from 'lucide-react'

type Property = {
  id: string
  user_id: string
  name: string
  address: string
  zip_code: string
  license_number: string | null
  hot_rate: number
  hoa_rules: string | null
  total_nights_rented: number
  status: string
}

function QRModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const reportUrl = `${window.location.origin}/report/${property.id}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reportUrl)}`
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(reportUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={ov.backdrop} onClick={onClose}>
      <div style={ov.modal} onClick={e => e.stopPropagation()}>
        <div style={ov.header}>
          <h2 style={ov.title}>Neighbor Report QR Code</h2>
          <button onClick={onClose} style={ov.closeBtn}><X size={18} /></button>
        </div>
        <p style={ov.subtitle}>Print or display this at <strong>{property.name}</strong>. Neighbors scan it to submit anonymous reports.</p>
        <div style={ov.qrWrapper}>
          <img src={qrImageUrl} alt="QR Code" style={{ width: '180px', height: '180px' }} />
        </div>
        <div style={ov.linkBox}>
          <span style={ov.linkText}>{reportUrl}</span>
          <button onClick={copyLink} style={ov.copyBtn}><Copy size={14} /> {copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>💡 Print and place in your welcome binder.</p>
      </div>
    </div>
  )
}

const ov: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  title: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  subtitle: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' },
  qrWrapper: { display: 'flex', justifyContent: 'center', marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
  linkBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' },
  linkText: { flex: 1, fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
}

function AddPropertyModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', address: '', zip_code: '', license_number: '', hot_rate: '15', hoa_rules: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.name || !form.address || form.zip_code.length !== 5) {
      setError('Please fill in name, address, and a 5-digit zip code.')
      return
    }
    setIsSaving(true)
    setError('')
    const hotRate = parseFloat(form.hot_rate) || 15
    const { error: insertError } = await supabase.from('properties').insert({
      user_id: user!.id,
      name: form.name,
      address: form.address,
      zip_code: form.zip_code,
      license_number: form.license_number || null,
      hot_rate: hotRate > 1 ? hotRate / 100 : hotRate,
      hoa_rules: form.hoa_rules || null,
      total_nights_rented: 0,
      status: 'active',
    })
    setIsSaving(false)
    if (insertError) { setError('Failed to save. Please try again.'); return }
    onSave()
    onClose()
  }

  return (
    <div style={ov.backdrop} onClick={onClose}>
      <div style={{ ...ov.modal, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={ov.header}>
          <h2 style={ov.title}>Add New Property</h2>
          <button onClick={onClose} style={ov.closeBtn}><X size={18} /></button>
        </div>
        {[
          { label: 'Property Name *', key: 'name', placeholder: 'South Congress Bungalow' },
          { label: 'Address *', key: 'address', placeholder: '1842 S Congress Ave, Austin, TX' },
          { label: 'Zip Code *', key: 'zip_code', placeholder: '78704' },
          { label: 'License Number', key: 'license_number', placeholder: 'STR-2026-ATX-00412' },
          { label: 'HOT Rate % (e.g. 15 for Austin, 13 for Houston/Dallas)', key: 'hot_rate', placeholder: '15' },
          { label: 'HOA Rules (optional)', key: 'hoa_rules', placeholder: 'No short-term rentals under 30 days...' },
        ].map(field => (
          <div key={field.key} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{field.label}</label>
            <input
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
              placeholder={field.placeholder}
              value={form[field.key as keyof typeof form]}
              onChange={update(field.key)}
            />
          </div>
        ))}
        {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
        >
          {isSaving ? 'Saving...' : 'Add Property'}
        </button>
      </div>
    </div>
  )
}

export function Properties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [qrProperty, setQrProperty] = useState<Property | null>(null)

  const fetchData = async () => {
    if (!user) return
    setIsLoading(true)
    const { data } = await supabase.from('properties').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setProperties(data ?? [])
    setIsLoading(false)
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getRiskColor = (zipCode: string) => {
    if (zipCode?.startsWith('787')) return '#ef4444'
    if (zipCode?.startsWith('770')) return '#f59e0b'
    return '#22c55e'
  }

  return (
    <>
      {qrProperty && <QRModal property={qrProperty} onClose={() => setQrProperty(null)} />}
      {isModalOpen && <AddPropertyModal onClose={() => setIsModalOpen(false)} onSave={fetchData} />}

      <div style={s.wrapper}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Properties</h1>
            <p style={s.subtitle}>Manage your STR portfolio and compliance status.</p>
          </div>
          <button style={s.addBtn} onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Property
          </button>
        </div>

        {isLoading ? (
          <div style={s.loading}>Loading properties...</div>
        ) : properties.length === 0 ? (
          <div style={s.emptyCard}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>No properties yet</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>Add your first STR property to start tracking compliance.</p>
            <button style={s.addBtn} onClick={() => setIsModalOpen(true)}><Plus size={16} /> Add Property</button>
          </div>
        ) : (
          <div style={s.list}>
            {properties.map(property => (
              <div key={property.id}>
                <div style={s.propertyCard}>
                  <div style={s.propertyLeft}>
                    <button onClick={() => toggleRow(property.id)} style={s.expandBtn}>
                      {expandedRows.has(property.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div style={{ ...s.riskDot, background: getRiskColor(property.zip_code) }} />
                    <div>
                      <div style={s.propertyName}>{property.name}</div>
                      <div style={s.propertyAddress}><MapPin size={11} /> {property.address}</div>
                    </div>
                  </div>

                  <div style={s.propertyMeta}>
                    <div style={s.metaItem}>
                      <div style={s.metaLabel}>License</div>
                      <div style={{ ...s.metaValue, color: property.license_number ? '#16a34a' : '#ef4444' }}>
                        {property.license_number ?? '⚠️ Missing'}
                      </div>
                    </div>
                    <div style={s.metaItem}>
                      <div style={s.metaLabel}>Nights Used</div>
                      <div style={s.metaValue}>{property.total_nights_rented}/90</div>
                    </div>
                    <div style={s.metaItem}>
                      <div style={s.metaLabel}>HOT Rate</div>
                      <div style={s.metaValue}>{((property.hot_rate || 0) * 100).toFixed(0)}%</div>
                    </div>
                    <div style={s.metaItem}>
                      <div style={s.metaLabel}>Status</div>
                      <div style={{ ...s.statusBadge, background: property.status === 'active' ? '#f0fdf4' : '#f1f5f9', color: property.status === 'active' ? '#16a34a' : '#64748b' }}>
                        {property.status}
                      </div>
                    </div>
                  </div>

                  <div style={s.propertyActions}>
                    <button style={s.actionBtn} onClick={() => setQrProperty(property)}>
                      <QrCode size={14} /> QR Code
                    </button>
                  </div>
                </div>

                {expandedRows.has(property.id) && (
                  <div style={s.expandedPanel}>
                    <div style={s.panelGrid}>
                      <div style={s.panelItem}>
                        <div style={s.panelLabel}>Full Address</div>
                        <div style={s.panelValue}>{property.address}</div>
                      </div>
                      <div style={s.panelItem}>
                        <div style={s.panelLabel}>Zip Code</div>
                        <div style={s.panelValue}>{property.zip_code}</div>
                      </div>
                      <div style={s.panelItem}>
                        <div style={s.panelLabel}>License Number</div>
                        <div style={{ ...s.panelValue, color: property.license_number ? '#16a34a' : '#ef4444' }}>
                          {property.license_number ?? 'Not registered — HIGH RISK'}
                        </div>
                      </div>
                      <div style={s.panelItem}>
                        <div style={s.panelLabel}>HOA Rules</div>
                        <div style={s.panelValue}>{property.hoa_rules ?? 'None recorded'}</div>
                      </div>
                    </div>
                    {!property.license_number && (
                      <div style={s.warningBox}>
                        ⚠️ This property is missing a license number. Texas STR regulations require license numbers to be displayed on all OTA listings (Airbnb, VRBO). Add your license number to avoid platform delisting.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const s: Record<string, any> = {
  wrapper: { padding: '32px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  emptyCard: { textAlign: 'center', padding: '60px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  propertyCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  propertyLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' },
  expandBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', flexShrink: 0 },
  riskDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  propertyName: { fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '3px' },
  propertyAddress: { fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' },
  propertyMeta: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  metaItem: { textAlign: 'center' },
  metaLabel: { fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' },
  metaValue: { fontSize: '13px', fontWeight: '700', color: '#0f172a' },
  statusBadge: { fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px' },
  propertyActions: { display: 'flex', gap: '8px', marginLeft: 'auto' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  expandedPanel: { background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '20px' },
  panelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' },
  panelItem: {},
  panelLabel: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  panelValue: { fontSize: '13px', color: '#0f172a', lineHeight: '1.5' },
  warningBox: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#92400e', lineHeight: '1.5' },
}
