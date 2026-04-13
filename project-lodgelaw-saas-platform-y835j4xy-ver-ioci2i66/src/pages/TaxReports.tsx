import React, { useState, useEffect } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody, Button, DataTable, EmptyState, Card, CardHeader, CardTitle, CardContent, Badge, toast, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Field, StatGroup, Stat } from '@blinkdotnew/ui'
import { Plus, Calculator, FileDown, TrendingUp, History, DollarSign } from 'lucide-react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'

type TaxRecord = {
  id: string
  user_id: string
  property_id: string
  month: string
  revenue: number
  tax_amount: number
  status: string
  created_at: string
}

export function TaxReports() {
  const { user } = useAuth()
  const [records, setRecords] = useState<TaxRecord[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRecord, setNewRecord] = useState({ property_id: '', month: '', revenue: '' })

  const fetchData = async () => {
    try {
      const [recs, props] = await Promise.all([
        blink.db.tax_records.list({ where: { user_id: user?.id } }),
        blink.db.properties.list({ where: { user_id: user?.id } })
      ])
      setRecords(recs as TaxRecord[])
      setProperties(props)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const handleAddRecord = async () => {
    if (!newRecord.property_id || !newRecord.month || !newRecord.revenue) {
      toast.error('Please fill in all required fields')
      return
    }

    const prop = properties.find(p => p.id === newRecord.property_id)
    const hotRate = prop?.hotRate || 0.06
    const revenueValue = parseFloat(newRecord.revenue)
    const taxAmount = revenueValue * hotRate

    try {
      await blink.db.tax_records.create({
        ...newRecord,
        revenue: revenueValue,
        tax_amount: taxAmount,
        user_id: user?.id,
        status: 'pending'
      })
      toast.success('Tax record recorded')
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Failed to record tax')
    }
  }

  const columns = [
    { 
      accessorKey: 'month', 
      header: 'Filing Period',
      cell: ({ row }: any) => <span className="font-semibold text-sm">{row.original.month}</span>
    },
    { 
      accessorKey: 'property', 
      header: 'Property',
      cell: ({ row }: any) => {
        const prop = properties.find(p => p.id === row.original.property_id)
        return <span className="text-sm">{prop?.name || 'Unknown'}</span>
      }
    },
    { 
      accessorKey: 'revenue', 
      header: 'Total Revenue',
      cell: ({ row }: any) => <span className="text-sm">${Number(row.original.revenue).toLocaleString()}</span>
    },
    { 
      accessorKey: 'tax_amount', 
      header: 'HOT Amount',
      cell: ({ row }: any) => <span className="text-sm font-bold text-primary">${Number(row.original.tax_amount).toLocaleString()}</span>
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === 'paid' ? "outline" : "secondary"} className={`text-[10px] h-5 px-2 uppercase tracking-widest ${row.original.status === 'paid' ? 'bg-success/5 border-success/20 text-success' : ''}`}>
          {row.original.status}
        </Badge>
      )
    },
    { 
      accessorKey: 'actions', 
      header: '',
      cell: () => (
        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 uppercase font-bold tracking-widest"><FileDown className="w-3 h-3 mr-1" /> PDF Export</Button>
      )
    }
  ]

  const totalTax = records.reduce((acc, curr) => acc + Number(curr.tax_amount), 0)
  const pendingTax = records.filter(r => r.status === 'pending').reduce((acc, curr) => acc + Number(curr.tax_amount), 0)

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex justify-between items-start w-full">
          <div>
            <PageTitle className="text-3xl font-bold text-primary">Tax Reporting Assistant</PageTitle>
            <PageDescription className="text-muted-foreground mt-1">Automated Hotel Occupancy Tax (HOT) calculation and filing.</PageDescription>
          </div>
          <PageActions>
            <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Record Monthly Revenue
            </Button>
          </PageActions>
        </div>
      </PageHeader>

      <PageBody className="mt-8 space-y-8">
        <StatGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat label="Total HOT Paid" value={`$${totalTax.toLocaleString()}`} icon={<DollarSign className="text-success" />} className="bg-card border-border shadow-sm" />
          <Stat label="Pending Filing" value={`$${pendingTax.toLocaleString()}`} icon={<History className="text-accent" />} className="bg-card border-border shadow-sm" />
          <Stat label="Compliance Score" value="98%" trend={2} trendLabel="up from last qtr" icon={<TrendingUp className="text-primary" />} className="bg-card border-border shadow-sm" />
        </StatGroup>

        {records.length === 0 && !isLoading ? (
          <EmptyState 
            icon={<Calculator size={48} />} 
            title="No revenue recorded" 
            description="Enter your monthly OTA revenue to calculate local taxes automatically."
            action={{ label: 'Add Record', onClick: () => setIsModalOpen(true) }}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={records} 
            loading={isLoading} 
            className="border-border shadow-sm bg-card rounded-xl overflow-hidden"
          />
        )}
      </PageBody>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Monthly Revenue Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Field label="Property">
              <Select value={newRecord.property_id} onValueChange={(v) => setNewRecord({...newRecord, property_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select Property" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reporting Month">
              <Input type="month" value={newRecord.month} onChange={(e) => setNewRecord({...newRecord, month: e.target.value})} />
            </Field>
            <Field label="Total Revenue (Gross)">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input className="pl-7" placeholder="0.00" value={newRecord.revenue} onChange={(e) => setNewRecord({...newRecord, revenue: e.target.value})} />
              </div>
            </Field>
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Estimated HOT Liability</h4>
              <div className="text-2xl font-black text-primary">
                ${(parseFloat(newRecord.revenue || '0') * (properties.find(p => p.id === newRecord.property_id)?.hotRate || 0.06)).toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Based on local Texas municipality rates (6-15% varies by zip).</p>
            </div>

            <Button onClick={handleAddRecord} className="w-full bg-primary text-primary-foreground">
              Submit Revenue Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  )
}
