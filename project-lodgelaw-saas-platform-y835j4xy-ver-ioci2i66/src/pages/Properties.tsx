import React, { useState, useEffect } from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Button, DataTable, EmptyState, Card, CardHeader, CardContent,
  Progress, Badge, AutoForm, toast,
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@blinkdotnew/ui'
import { Plus, Home, MapPin, Calendar, ShieldCheck, Info, Sparkles, ChevronDown, ChevronRight, QrCode, Copy, X } from 'lucide-react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { usePropertyCompliance } from '../hooks/usePropertyCompliance'
import { PropertyCompliancePanel } from '../components/PropertyCompliancePanel'
import { z } from 'zod'

const propertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  zipCode: z.string().length(5, 'Zip code must be 5 digits'),
  licenseNumber: z.string().optional(),
  hotRate: z.number().default(0.06),
  hoaRules: z.string().optional()
})

type Property = z.infer<typeof propertySchema> & { id: string; totalNightsRented: number; status: string }

// QR Modal component
function QRModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const reportUrl = `${window.location.origin}/report/${property.id}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reportUrl)}`

  const copyLink = () => {
    navigator.clipboard.writeText(reportUrl)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div style={overlayStyles.backdrop} onClick={onClose}>
      <div style={overlayStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={overlayStyles.header}>
          <h2 style={overlayStyles.title}>Neighbor Report QR Code</h2>
          <button onClick={onClose} style={overlayStyles.closeBtn}><X size={18} /></button>
        </div>
        <p style={overlayStyles.subtitle}>
          Print or display this QR code at <strong>{property.name}</strong>. Neighbors can scan it to submit anonymous reports directly to your Resolution Center.
        </p>
        <div style={overlayStyles.qrWrapper}>
          <img src={qrImageUrl} alt="QR Code" style={overlayStyles.qrImage} />
        </div>
        <div style={overlayStyles.linkBox}>
          <span style={overlayStyles.linkText}>{reportUrl}</span>
          <button onClick={copyLink} style={overlayStyles.copyBtn}>
            <Copy size={14} /> Copy
          </button>
        </div>
        <p style={overlayStyles.hint}>
          💡 Tip: Print this and place it in your welcome binder or on the fridge.
        </p>
      </div>
    </div>
  )
}

const overlayStyles: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  title: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' },
  subtitle: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' },
  qrWrapper: { display: 'flex', justifyContent: 'center', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
  qrImage: { width: '180px', height: '180px' },
  linkBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' },
  linkText: { flex: 1, fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  hint: { fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: 0 },
}

export function Properties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [ordinances, setOrdinances] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [qrProperty, setQrProperty] = useState<Property | null>(null)
  const { analyses, analyzeProperty } = usePropertyCompliance()

  const fetchData = async () => {
    try {
      const [props, ords] = await Promise.all([
        blink.db.properties.list({ where: { user_id: user?.id } }),
        blink.db.ordinances.list()
      ])
      setProperties(props as Property[])
      setOrdinances(ords)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
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

  const handleAddProperty = async (values: any) => {
    try {
      await blink.db.properties.create({
        ...values,
        userId: user?.id,
        totalNightsRented: 0,
        status: 'active'
      })
      toast.success('Property added successfully')
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Failed to add property')
    }
  }

  const columns = [
    {
      accessorKey: 'expand',
      header: '',
      cell: ({ row }: any) => (
        <button onClick={() => toggleRow(row.original.id)} className="p-1 hover:bg-muted rounded">
          {expandedRows.has(row.original.id)
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Property',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="w-3 h-3" />
          {row.original.address}
        </div>
      ),
    },
    {
      accessorKey: 'licenseNumber',
      header: 'License',
      cell: ({ row }: any) => (
        row.original.licenseNumber
          ? <Badge variant="outline" className="font-mono text-xs">{row.original.licenseNumber}</Badge>
          : <Badge variant="destructive" className="text-xs">Missing</Badge>
      ),
    },
    {
      accessorKey: 'totalNightsRented',
      header: 'Nights Used',
      cell: ({ row }: any) => {
        const nights = row.original.totalNightsRented || 0
        const pct = Math.min((nights / 90) * 100, 100)
        return (
          <div className="flex items-center gap-2 w-32">
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{nights}/90</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => analyzeProperty(row.original, ordinances)}
          >
            <Sparkles className="w-3 h-3" /> Analyze
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setQrProperty(row.original)}
          >
            <QrCode className="w-3 h-3" /> QR Code
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      {qrProperty && <QRModal property={qrProperty} onClose={() => setQrProperty(null)} />}

      <Page>
        <PageHeader>
          <div>
            <PageTitle>Properties</PageTitle>
            <PageDescription>Manage your STR portfolio and compliance status.</PageDescription>
          </div>
          <PageActions>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Property
            </Button>
          </PageActions>
        </PageHeader>
        <PageBody>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon={<Home className="w-8 h-8" />}
              title="No properties yet"
              description="Add your first STR property to start tracking compliance."
              action={<Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Property</Button>}
            />
          ) : (
            <div className="space-y-2">
              <DataTable columns={columns} data={properties} />
              {properties.map(property => (
                expandedRows.has(property.id) && (
                  <Card key={`panel-${property.id}`} className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4">
                      <PropertyCompliancePanel
                        property={property}
                        analysis={analyses[property.id]}
                        onAnalyze={() => analyzeProperty(property, ordinances)}
                      />
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          )}
        </PageBody>
      </Page>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>
          <AutoForm
            schema={propertySchema}
            onSubmit={handleAddProperty}
            submitLabel="Add Property"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
