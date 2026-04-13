import React, { useState, useEffect } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge, toast, Field, Input, Avatar, AvatarImage, Separator, Switch } from '@blinkdotnew/ui'
import { Settings as SettingsIcon, Shield, User, Bell, Lock, Save, MapPin, FileText, Printer, CreditCard, Mail, CheckCircle2, Clock } from 'lucide-react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { PricingTiers } from '../components/PricingTiers'
import { useExpiryNotifications } from '../hooks/useExpiryNotifications'
import { useDocuments } from '../hooks/useDocuments'

export function Settings() {
  const { user } = useAuth()
  const [localContact, setLocalContact] = useState({ name: '', phone: '', email: '', address: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [autoAlerts, setAutoAlerts] = useState(true)
  const { checkAndNotify, isSending, getLastSentTime } = useExpiryNotifications()
  const { documents, fetchDocuments } = useDocuments(user?.id)
  const lastSentAt = user ? getLastSentTime(user.id) : null

  useEffect(() => {
    if (user) fetchDocuments()
  }, [user])

  const handleTestAlert = async () => {
    if (!user?.email) return
    const props = await blink.db.properties.list({ where: { userId: user.id } })
    const res = await checkAndNotify(
      documents,
      props as any[],
      user.email,
      user.displayName ?? '',
      user.id,
      { force: true }
    )
    if (res.sent) {
      toast.success(`Test alert sent to ${user.email}`, {
        description: `${res.count} expiring document${res.count !== 1 ? 's' : ''} included.`
      })
    } else if (res.items.length === 0) {
      toast.info('No expiring documents', {
        description: 'All documents are valid beyond 30 days. No alert needed.'
      })
    } else {
      toast.error('Alert failed', { description: res.error })
    }
  }

  const handleSaveContact = async () => {
    setIsSaving(true)
    try {
      // Mock saving to a settings table or user metadata
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Local responder contact updated')
    } catch (error) {
      toast.error('Failed to update contact')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrintGuestPacket = () => {
    toast.info('Generating Digital Guest Packet...', {
      description: 'Your 2026-compliant PDF is being prepared.'
    })
    // Mock PDF generation
    setTimeout(() => {
      window.open('https://example.com/guest-packet.pdf', '_blank')
    }, 1500)
  }

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <PageTitle className="text-3xl font-bold text-primary">Settings & Operations</PageTitle>
        <PageDescription className="text-muted-foreground mt-1">Manage your account and 2026 legal requirements.</PageDescription>
      </PageHeader>

      <PageBody className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Subscription Plans */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-bold text-lg">Subscription & Tiers</h3>
            </div>
            <PricingTiers />
          </section>

          {/* Email Notification Settings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                <CardTitle>Document Expiry Notifications</CardTitle>
              </div>
              <CardDescription>
                LodgeLaw automatically emails you when compliance documents are expiring within 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Toggle row */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Automatic Expiry Alerts</p>
                  <p className="text-xs text-muted-foreground">Send email once per day when documents are expiring</p>
                </div>
                <Switch
                  checked={autoAlerts}
                  onCheckedChange={setAutoAlerts}
                />
              </div>

              {/* Alert target */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Alert Destination</p>
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Alerts are sent to your account email automatically.</p>
                </div>
                {lastSentAt && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Last Sent</p>
                    <p className="text-xs font-bold">
                      {lastSentAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Threshold + Test */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alert Window</p>
                  <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold">30 days before expiry</span>
                    <Badge variant="outline" className="text-[9px] ml-auto uppercase">Default</Badge>
                  </div>
                </div>
                <Button
                  onClick={handleTestAlert}
                  loading={isSending}
                  variant="outline"
                  className="h-10 font-bold uppercase tracking-widest text-xs shrink-0"
                >
                  <Mail className="w-3.5 h-3.5 mr-2" />
                  Send Test Alert
                </Button>
              </div>

              {/* What's included */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Includes</p>
                {[
                  'Document name, type, and assigned property',
                  'Days until expiry with urgency level',
                  'Direct link to your document vault',
                  'Renewal checklist specific to Texas 2026 STR rules',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Local Contact Management */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <CardTitle>Mandatory Local Contact (24/7 Responder)</CardTitle>
              </div>
              <CardDescription>Required by Texas law for all short-term rental operators. This person must respond within 1 hour.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Contact Name">
                  <Input placeholder="e.g., John Smith" value={localContact.name} onChange={(e) => setLocalContact({...localContact, name: e.target.value})} />
                </Field>
                <Field label="Emergency Phone">
                  <Input placeholder="e.g., (512) 555-0199" value={localContact.phone} onChange={(e) => setLocalContact({...localContact, phone: e.target.value})} />
                </Field>
              </div>
              <Field label="Contact Email">
                <Input placeholder="e.g., responder@lodgelaw.com" value={localContact.email} onChange={(e) => setLocalContact({...localContact, email: e.target.value})} />
              </Field>
              <Field label="Local Address (must be within 20 miles)">
                <Input placeholder="e.g., 123 Responder Way, Austin, TX 78701" value={localContact.address} onChange={(e) => setLocalContact({...localContact, address: e.target.value})} />
              </Field>
              <div className="pt-2">
                <Button onClick={handleSaveContact} loading={isSaving} className="bg-primary">
                  <Save className="w-4 h-4 mr-2" /> Save Contact Info
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Digital Guest Packet */}
          <Card className="border-border shadow-sm bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                <CardTitle>Digital Guest Packet Generator</CardTitle>
              </div>
              <CardDescription className="text-primary/70">Create a 2026-compliant printable PDF containing local noise rules, ordinances, and emergency contacts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-background border border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Printer className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">One-Click Packet</h4>
                    <p className="text-xs text-muted-foreground">Includes all active properties & ordinances.</p>
                  </div>
                </div>
                <Button onClick={handlePrintGuestPacket} className="bg-primary hover:opacity-90">
                  <Printer className="w-4 h-4 mr-2" /> Generate & Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* User Profile */}
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center pb-0">
              <Avatar className="w-20 h-20 mx-auto border-4 border-background shadow-lg">
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} />
              </Avatar>
              <CardTitle className="mt-4">{user?.displayName || 'STR Operator'}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-3"><User size={16} /> Edit Profile</Button>
                <Button variant="ghost" className="w-full justify-start gap-3"><Bell size={16} /> Notifications</Button>
                <Button variant="ghost" className="w-full justify-start gap-3"><Lock size={16} /> Security</Button>
              </div>
              <Separator className="my-4" />
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subscription</span>
                  <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/20">Pro Tier</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your Pro subscription includes unlimited properties, AI Ordinance Summaries, and the Digital Guest Packet Generator.
                </p>
                <Button variant="link" className="text-xs p-0 h-auto mt-2">Manage Billing</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  )
}