import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'

interface Property {
  id: string
  name: string
  address: string
  license_number: string | null
}

interface Packet {
  wifi_network: string
  wifi_password: string
  checkin_time: string
  checkout_time: string
  house_rules: string
  noise_policy: string
  parking_info: string
  trash_info: string
  emergency_contact: string
  emergency_phone: string
  local_tip_1: string
  local_tip_2: string
  local_tip_3: string
  checkout_instructions: string
  custom_message: string
}

const DEFAULT: Packet = {
  wifi_network: '',
  wifi_password: '',
  checkin_time: '3:00 PM',
  checkout_time: '11:00 AM',
  house_rules: '• No smoking indoors\n• No parties or events\n• No unregistered guests\n• Treat the space as your own home',
  noise_policy: 'Quiet hours: 10 PM – 8 AM. Please respect our neighbors.',
  parking_info: '',
  trash_info: '',
  emergency_contact: '',
  emergency_phone: '',
  local_tip_1: '',
  local_tip_2: '',
  local_tip_3: '',
  checkout_instructions: '• Strip beds and leave linens by the door\n• Load and start dishwasher\n• Lock all doors and windows\n• Return keys to lockbox',
  custom_message: '',
}

export function GuestPacket() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [packet, setPacket] = useState<Packet>(DEFAULT)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    if (user) {
      supabase.from('properties').select('id, name, address, license_number')
        .eq('user_id', user.id)
        .then(({ data }) => {
          setProperties(data ?? [])
          if (data && data.length > 0) setSelectedId(data[0].id)
        })
    }
  }, [user])

  useEffect(() => {
    if (selectedId) loadPacket(selectedId)
  }, [selectedId])

  const loadPacket = async (propertyId: string) => {
    const { data } = await supabase
      .from('guest_packets')
      .select('*')
      .eq('property_id', propertyId)
      .single()
    if (data) {
      setPacket({
        wifi_network: data.wifi_network ?? '',
        wifi_password: data.wifi_password ?? '',
        checkin_time: data.checkin_time ?? '3:00 PM',
        checkout_time: data.checkout_time ?? '11:00 AM',
        house_rules: data.house_rules ?? DEFAULT.house_rules,
        noise_policy: data.noise_policy ?? DEFAULT.noise_policy,
        parking_info: data.parking_info ?? '',
        trash_info: data.trash_info ?? '',
        emergency_contact: data.emergency_contact ?? '',
        emergency_phone: data.emergency_phone ?? '',
        local_tip_1: data.local_tip_1 ?? '',
        local_tip_2: data.local_tip_2 ?? '',
        local_tip_3: data.local_tip_3 ?? '',
        checkout_instructions: data.checkout_instructions ?? DEFAULT.checkout_instructions,
        custom_message: data.custom_message ?? '',
      })
    } else {
      setPacket(DEFAULT)
    }
  }

  const handleSave = async () => {
    if (!selectedId || !user) return
    setIsSaving(true)
    await supabase.from('guest_packets').upsert({
      user_id: user.id,
      property_id: selectedId,
      ...packet,
    }, { onConflict: 'property_id' })
    setIsSaving(false)
    setSavedMsg('Saved!')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handlePrint = () => window.print()

  const property = properties.find(p => p.id === selectedId)

  const update = (key: keyof Packet) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPacket(prev => ({ ...prev, [key]: e.target.value }))

  if (isPreview && property) {
    return (
      <div>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
          }
        `}</style>
        <div className="no-print" style={{ padding: '16px 32px', background: '#0f172a', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setIsPreview(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1e293b', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
            ← Back to Editor
          </button>
          <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
            🖨️ Print / Save as PDF
          </button>
        </div>

        {/* Print-ready packet */}
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 40px', fontFamily: 'Georgia, serif', color: '#0f172a' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '32px', borderBottom: '3px solid #0f172a' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6366f1', fontWeight: '700', marginBottom: '8px' }}>Welcome to</div>
            <h1 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>{property.name}</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 12px 0' }}>{property.address}</p>
            {property.license_number && (
              <div style={{ display: 'inline-block', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                STR License: {property.license_number}
              </div>
            )}
          </div>

          {packet.custom_message && (
            <div style={{ background: '#f8fafc', borderLeft: '4px solid #6366f1', padding: '20px 24px', marginBottom: '32px', borderRadius: '0 8px 8px 0' }}>
              <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', fontStyle: 'italic', color: '#374151' }}>{packet.custom_message}</p>
            </div>
          )}

          {/* Check in/out */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: '🗓 Check-in', value: packet.checkin_time },
              { label: '🗓 Check-out', value: packet.checkout_time },
            ].map((item, i) => (
              <div key={i} style={{ background: '#0f172a', color: '#fff', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>{item.label}</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* WiFi */}
          {(packet.wifi_network || packet.wifi_password) && (
            <div style={ps.section}>
              <h2 style={ps.sectionTitle}>📶 WiFi</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={ps.infoBox}><div style={ps.infoLabel}>Network</div><div style={ps.infoValue}>{packet.wifi_network}</div></div>
                <div style={ps.infoBox}><div style={ps.infoLabel}>Password</div><div style={ps.infoValue}>{packet.wifi_password}</div></div>
              </div>
            </div>
          )}

          {/* House Rules */}
          {packet.house_rules && (
            <div style={ps.section}>
              <h2 style={ps.sectionTitle}>📋 House Rules</h2>
              <div style={ps.textBlock}>{packet.house_rules}</div>
            </div>
          )}

          {/* Noise Policy */}
          {packet.noise_policy && (
            <div style={ps.section}>
              <h2 style={ps.sectionTitle}>🔇 Noise Policy</h2>
              <div style={ps.textBlock}>{packet.noise_policy}</div>
            </div>
          )}

          {/* Parking & Trash */}
          {(packet.parking_info || packet.trash_info) && (
            <div style={ps.section}>
              <h2 style={ps.sectionTitle}>🚗 Parking & 🗑 Trash</h2>
              {packet.parking_info && <div style={{ marginBottom: '8px' }}><strong>Parking:</strong> {packet.parking_info}</div>}
              {packet.trash_info && <div><strong>Trash:</strong> {packet.trash_info}</div>}
            </div>
          )}

          {/* Local Tips */}
          {(packet.local_tip_1 || packet.local_tip_2 || packet.local_tip_3) && (
            <div style={ps.section}>
              <h2 style={ps.sectionTitle}>📍 Local Recommendations</h2>
              {[packet.local_tip_1, packet.local_tip_2, packet.local_tip_3].filter(Boolean).map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#6366f1', fontWeight: '700', minWidth: '20px' }}>{i + 1}.</span>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Checkout */}
          {packet.checkout_instructions && (
            <div style={ps.section}>
              <h2 style={ps.sectionTitle}>✅ Checkout Instructions</h2>
              <div style={ps.textBlock}>{packet.checkout_instructions}</div>
            </div>
          )}

          {/* Emergency */}
          {(packet.emergency_contact || packet.emergency_phone) && (
            <div style={{ ...ps.section, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ ...ps.sectionTitle, color: '#dc2626' }}>🚨 Emergency Contact</h2>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{packet.emergency_contact}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>{packet.emergency_phone}</div>
            </div>
          )}

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
            Generated by LodgeLaw · Texas STR Compliance Platform · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Guest Packet Generator</h1>
          <p style={s.subtitle}>Create a professional welcome packet for each property</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={s.previewBtn} onClick={() => setIsPreview(true)}>👁 Preview</button>
          <button style={s.saveBtn} onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : savedMsg || '💾 Save'}
          </button>
        </div>
      </div>

      <div style={s.propertyBar}>
        <label style={s.label}>Property</label>
        <select style={s.select} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div style={s.grid}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>🏠 Welcome Message</h3>
            <textarea style={{ ...s.textarea, height: '80px' }} placeholder="Write a warm personal welcome for your guests..." value={packet.custom_message} onChange={update('custom_message')} />
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>🗓 Check-in / Check-out</h3>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Check-in Time</label>
                <input style={s.input} value={packet.checkin_time} onChange={update('checkin_time')} placeholder="3:00 PM" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Check-out Time</label>
                <input style={s.input} value={packet.checkout_time} onChange={update('checkout_time')} placeholder="11:00 AM" />
              </div>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>📶 WiFi</h3>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Network Name</label>
                <input style={s.input} value={packet.wifi_network} onChange={update('wifi_network')} placeholder="MyNetwork_5G" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <input style={s.input} value={packet.wifi_password} onChange={update('wifi_password')} placeholder="password123" />
              </div>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>🚗 Parking & 🗑 Trash</h3>
            <div style={s.field}>
              <label style={s.label}>Parking Instructions</label>
              <input style={s.input} value={packet.parking_info} onChange={update('parking_info')} placeholder="Park in the driveway or on the street" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Trash Instructions</label>
              <input style={s.input} value={packet.trash_info} onChange={update('trash_info')} placeholder="Bins are on the left side of the house. Pickup is Monday." />
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>🚨 Emergency Contact</h3>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Name</label>
                <input style={s.input} value={packet.emergency_contact} onChange={update('emergency_contact')} placeholder="John Smith (Host)" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone</label>
                <input style={s.input} value={packet.emergency_phone} onChange={update('emergency_phone')} placeholder="(512) 555-0123" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>📋 House Rules</h3>
            <textarea style={s.textarea} value={packet.house_rules} onChange={update('house_rules')} />
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>🔇 Noise Policy</h3>
            <textarea style={{ ...s.textarea, height: '80px' }} value={packet.noise_policy} onChange={update('noise_policy')} />
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>📍 Local Recommendations</h3>
            {(['local_tip_1', 'local_tip_2', 'local_tip_3'] as const).map((key, i) => (
              <div key={key} style={s.field}>
                <label style={s.label}>Tip #{i + 1}</label>
                <input style={s.input} value={packet[key]} onChange={update(key)} placeholder={i === 0 ? 'Best coffee: Houndstooth Coffee, 0.5mi away' : i === 1 ? 'Great tacos: Veracruz All Natural, 1mi away' : 'Grocery: Whole Foods, 2mi away'} />
              </div>
            ))}
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>✅ Checkout Instructions</h3>
            <textarea style={s.textarea} value={packet.checkout_instructions} onChange={update('checkout_instructions')} />
          </div>
        </div>
      </div>
    </div>
  )
}

const ps: Record<string, any> = {
  section: { marginBottom: '28px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '12px', marginTop: 0, color: '#0f172a', fontFamily: 'system-ui, sans-serif' },
  textBlock: { fontSize: '14px', lineHeight: '1.8', color: '#374151', whiteSpace: 'pre-line' },
  infoBox: { background: '#f8fafc', borderRadius: '8px', padding: '14px', border: '1px solid #e2e8f0' },
  infoLabel: { fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  infoValue: { fontSize: '16px', fontWeight: '700', color: '#0f172a' },
}

const s: Record<string, any> = {
  wrapper: { padding: '32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  propertyBar: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: '#f8fafc', padding: '14px 20px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '16px' },
  field: { marginBottom: '12px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff', resize: 'vertical', height: '140px', fontFamily: 'system-ui, sans-serif', lineHeight: '1.6', boxSizing: 'border-box' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#0f172a', background: '#fff' },
  saveBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  previewBtn: { padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
}
