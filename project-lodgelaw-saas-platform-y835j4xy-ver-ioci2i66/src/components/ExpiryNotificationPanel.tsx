import React from 'react'
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '@blinkdotnew/ui'
import { Bell, BellRing, CheckCircle2, Clock, Send, AlertTriangle, Mail, RefreshCw } from 'lucide-react'
import type { ExpiringDoc } from '../lib/expiryEmail'

interface Props {
  expiringItems: ExpiringDoc[]
  isSending: boolean
  lastSentAt: Date | null
  onSendNow: () => void
  onDismiss?: () => void
}

function DaysLeftPill({ days }: { days: number }) {
  if (days === 0) return <Badge variant="destructive" className="text-[10px] font-black uppercase">Today</Badge>
  if (days <= 7) return <Badge variant="destructive" className="text-[10px] font-bold uppercase">{days}d</Badge>
  if (days <= 14) return <Badge className="text-[10px] font-bold uppercase bg-orange-500/15 text-orange-600 border-orange-300">{days}d</Badge>
  return <Badge variant="outline" className="text-[10px] font-bold uppercase bg-accent/10 text-accent border-accent/20">{days}d</Badge>
}

export function ExpiryNotificationPanel({ expiringItems, isSending, lastSentAt, onSendNow, onDismiss }: Props) {
  const criticalCount = expiringItems.filter(i => i.daysLeft <= 7).length
  const hasCritical = criticalCount > 0

  if (expiringItems.length === 0) return null

  const lastSentLabel = lastSentAt
    ? `Last sent ${lastSentAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${lastSentAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : 'Never sent'

  return (
    <Card className={`border-2 shadow-md ${hasCritical ? 'border-destructive/40 bg-destructive/5' : 'border-accent/30 bg-accent/5'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasCritical ? 'bg-destructive/15' : 'bg-accent/15'}`}>
              {hasCritical
                ? <BellRing className="w-5 h-5 text-destructive animate-pulse" />
                : <Bell className="w-5 h-5 text-accent" />
              }
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                {hasCritical ? 'Critical: Documents Expiring This Week' : 'Document Expiry Alert'}
                <Badge
                  className={`text-[10px] font-black ${hasCritical ? 'bg-destructive text-white' : 'bg-accent/20 text-accent border-accent/30'}`}
                >
                  {expiringItems.length} document{expiringItems.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Email alert will be sent to your account address.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Document list */}
        <div className="space-y-2">
          {expiringItems.map(item => (
            <div key={item.doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.doc.type}
                  {item.propertyName && <> · {item.propertyName}</>}
                  {item.doc.expiryDate && (
                    <> · Expires {new Date(item.doc.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                  )}
                </p>
              </div>
              <DaysLeftPill days={item.daysLeft} />
            </div>
          ))}
        </div>

        {/* Actions row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{lastSentLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss} className="h-8 text-xs text-muted-foreground">
                Dismiss
              </Button>
            )}
            <Button
              onClick={onSendNow}
              loading={isSending}
              size="sm"
              className={`h-8 font-bold uppercase tracking-widest text-xs shadow-sm ${
                hasCritical
                  ? 'bg-destructive hover:bg-destructive/90 text-white'
                  : 'bg-primary hover:opacity-90 text-primary-foreground'
              }`}
            >
              {isSending
                ? <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />Sending…</>
                : <><Mail className="w-3 h-3 mr-1.5" />Send Alert Email</>
              }
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
