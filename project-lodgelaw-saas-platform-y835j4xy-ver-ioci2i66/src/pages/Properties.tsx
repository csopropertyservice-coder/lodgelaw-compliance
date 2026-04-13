import React, { useState, useEffect } from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Button, DataTable, EmptyState, Card, CardHeader, CardContent,
  Progress, Badge, AutoForm, toast,
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@blinkdotnew/ui'
import { Plus, Home, MapPin, Calendar, ShieldCheck, Info, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
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

export function Properties() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [ordinances, setOrdinances] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
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
        <button
          onClick={() => toggleRow(row.original.id)}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
        >
          {expandedRows.has(row.original.id)
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </button>
      )
    },
    {
      accessorKey: 'name',
      header: 'Property Name',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
            <Home className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{row.original.name}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {row.original.address}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'licenseNumber',
      header: 'License #',
      cell: ({ row }: any) => (
        <Badge
          variant={row.original.licenseNumber ? 'secondary' : 'destructive'}
          className="text-[10px] h-5 px-2"
        >
          {row.original.licenseNumber || 'Missing License'}
        </Badge>
      )
    },
    {
      accessorKey: 'nights',
      header: 'Night Counter',
      cell: ({ row }: any) => {
        const nights = Number(row.original.totalNightsRented || 0)
        const limit = 90
        const percentage = Math.min((nights / limit) * 100, 100)
        return (
          <div className="w-44 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className={percentage > 80 ? 'text-destructive' : 'text-muted-foreground'}>
                {nights} / {limit}
              </span>
              <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} className="h-1.5" />
          </div>
        )
      }
    },
    {
      accessorKey: 'aiScore',
      header: 'AI Score',
      cell: ({ row }: any) => {
        const analysis = analyses[row.original.id]
        if (!analysis) {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); analyzeProperty(row.original, ordinances) }}
              className="flex items-center gap-1 text-xs text-accent/70 hover:text-accent transition-colors font-medium"
            >
              <Sparkles className="w-3 h-3" /> Run AI
            </button>
          )
        }
        if (analysis.isLoading) return <span className="text-xs text-muted-foreground animate-pulse">Analyzing…</span>
        if (!analysis.data) return <span className="text-xs text-muted-foreground">–</span>
        const score = analysis.data.complianceScore
        return (
          <span className={`text-sm font-black ${score >= 80 ? 'text-success' : score >= 50 ? 'text-accent' : 'text-destructive'}`}>
            {score}<span className="text-xs font-normal text-muted-foreground">/100</span>
          </span>
        )
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant="outline" className="text-[10px] h-5 px-2 bg-success/5 border-success/20 text-success uppercase tracking-widest">
          {row.original.status}
        </Badge>
      )
    }
  ]

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex justify-between items-start w-full">
          <div>
            <PageTitle className="text-3xl font-bold text-primary">Managed Properties</PageTitle>
            <PageDescription className="text-muted-foreground mt-1">
              Track STR units with AI-powered compliance scoring and night limits.
            </PageDescription>
          </div>
          <PageActions>
            <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
          </PageActions>
        </div>
      </PageHeader>

      <PageBody className="mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, label: 'Compliance Status', value: '100% Valid', bg: 'bg-accent/10', color: 'text-accent' },
            { icon: Calendar, label: 'Peak Season Risk', value: 'Low', bg: 'bg-primary/10', color: 'text-primary' },
            { icon: Info, label: 'TX Law Check', value: 'Passed', bg: 'bg-muted', color: 'text-muted-foreground' }
          ].map(({ icon: Icon, label, value, bg, color }) => (
            <Card key={label} className="border-border shadow-sm bg-card">
              <CardHeader className="p-4 flex flex-row items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
                  <span className="text-lg font-bold">{value}</span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {properties.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Home size={48} />}
            title="No properties yet"
            description="Add your first STR unit to begin AI-powered compliance tracking."
            action={{ label: 'Add Property', onClick: () => setIsModalOpen(true) }}
          />
        ) : (
          <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-card">
            <DataTable
              columns={columns}
              data={properties}
              loading={isLoading}
              searchable
              searchColumn="name"
            />
            {/* Expandable AI panels rendered below each row */}
            {properties.filter(p => expandedRows.has(p.id)).map(property => (
              <div key={`expand-${property.id}`} className="border-t border-border bg-muted/20 px-6 py-4">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                    AI Compliance Breakdown — {property.name}
                  </p>
                  <PropertyCompliancePanel
                    propertyId={property.id}
                    propertyName={property.name}
                    analysis={analyses[property.id]}
                    onAnalyze={() => analyzeProperty(property, ordinances)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New STR Property</DialogTitle>
          </DialogHeader>
          <AutoForm
            schema={propertySchema}
            onSubmit={handleAddProperty}
            className="space-y-4"
          />
        </DialogContent>
      </Dialog>
    </Page>
  )
}
