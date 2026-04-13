import React, { useEffect, useState, useCallback } from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Button, Badge, EmptyState, Skeleton, StatGroup, Stat, toast,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@blinkdotnew/ui'
import {
  Plus, FileText, Trash2, Clock, ShieldCheck,
  History, AlertTriangle, CheckCircle2, FolderOpen, ExternalLink,
  Bell, MailCheck,
} from 'lucide-react'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { useDocuments } from '../hooks/useDocuments'
import { useExpiryNotifications } from '../hooks/useExpiryNotifications'
import { DocumentUploadModal } from '../components/DocumentUploadModal'
import { DocumentVersionDrawer } from '../components/DocumentVersionDrawer'
import { ExpiryNotificationPanel } from '../components/ExpiryNotificationPanel'
import { getDocType, getExpiryStatus, formatBytes, DOCUMENT_TYPES } from '../lib/documentTypes'
import { getExpiringDocuments } from '../lib/expiryEmail'
import type { Document } from '../hooks/useDocuments'

export function Documents() {
  const { user } = useAuth()
  const {
    documents, isLoading, uploadProgress,
    fetchDocuments, uploadDocument, uploadNewVersion,
    deleteDocument, fetchVersions,
  } = useDocuments(user?.id)

  const { isSending, lastResult, checkAndNotify, getLastSentTime } = useExpiryNotifications()

  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notifDismissed, setNotifDismissed] = useState(false)
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null)

  useEffect(() => {
    fetchDocuments()
    if (user) {
      blink.db.properties
        .list({ where: { userId: user.id } })
        .then((p) => setProperties(p as { id: string; name: string }[]))
      setLastSentAt(getLastSentTime(user.id))
    }
  }, [user])

  // Auto-check on load: send if there are expiring docs and not sent today
  useEffect(() => {
    if (!user?.email || documents.length === 0 || isLoading) return
    const expiring = getExpiringDocuments(documents, 30)
    if (expiring.length === 0) return

    const lastSent = getLastSentTime(user.id)
    const hoursSince = lastSent ? (Date.now() - lastSent.getTime()) / 3600000 : Infinity

    // Auto-send only if 24h have passed
    if (hoursSince >= 24) {
      const enriched = expiring.map(item => ({
        ...item,
        propertyName: properties.find(p => p.id === item.doc.propertyId)?.name ?? '',
      }))
      // Non-blocking silent auto-check
      checkAndNotify(documents, properties, user.email, user.displayName ?? '', user.id)
        .then(res => {
          if (res.sent) {
            setLastSentAt(new Date())
            toast.success(`Expiry alert sent to ${user.email}`, {
              description: `${res.count} document${res.count > 1 ? 's' : ''} flagged for renewal`,
            })
          }
        })
        .catch(() => {})
    }
  }, [documents, isLoading])

  const handleManualSend = useCallback(async () => {
    if (!user?.email) return
    const res = await checkAndNotify(
      documents,
      properties,
      user.email,
      user.displayName ?? '',
      user.id,
      { force: true }
    )
    if (res.sent) {
      setLastSentAt(new Date())
      setNotifDismissed(true)
      toast.success(`Alert email sent to ${user.email}`, {
        description: `${res.count} expiring document${res.count > 1 ? 's' : ''} included.`,
      })
    } else if (res.error) {
      toast.error('Failed to send email', { description: res.error })
    }
  }, [user, documents, properties, checkAndNotify])

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setDeletingId(doc.id)
    try {
      await deleteDocument(doc.id)
      toast.success('Document removed from vault')
      fetchDocuments()
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  // Derived stats
  const expiredCount = documents.filter(d => {
    if (!d.expiryDate) return false
    return new Date(d.expiryDate) < new Date()
  }).length
  const urgentCount = documents.filter(d => {
    if (!d.expiryDate) return false
    const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000)
    return days >= 0 && days <= 60
  }).length

  // Items for notification panel
  const expiringItems = getExpiringDocuments(documents, 30).map(item => ({
    ...item,
    propertyName: properties.find(p => p.id === item.doc.propertyId)?.name ?? '',
  }))

  // Filter docs by tab
  const filteredDocs = activeTab === 'all'
    ? documents
    : documents.filter(d => d.type === activeTab)

  const getPropertyName = (id: string) =>
    properties.find(p => p.id === id)?.name ?? '—'

  const activeVersionProgress = activeDoc
    ? uploadProgress[`ver_${activeDoc.id}`]
    : undefined

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full">
          <div>
            <PageTitle className="text-3xl font-bold text-primary">Compliance Document Vault</PageTitle>
            <PageDescription className="text-muted-foreground mt-1">
              Encrypted storage with version control and automatic expiry alerts.
            </PageDescription>
          </div>
          <PageActions>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-primary hover:opacity-90 shadow-md shadow-primary/20 font-bold uppercase tracking-widest h-10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Secure Document
            </Button>
          </PageActions>
        </div>
      </PageHeader>

      <PageBody className="mt-8 space-y-8">
        {/* Stats row */}
        <StatGroup className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label="Total Documents"
            value={String(documents.length)}
            icon={<FolderOpen className="text-primary" />}
            className="bg-card border-border"
          />
          <Stat
            label="Expiring ≤30 days"
            value={String(expiringItems.length)}
            icon={<Bell className={expiringItems.length > 0 ? 'text-accent' : 'text-muted-foreground'} />}
            className="bg-card border-border"
          />
          <Stat
            label="Expired"
            value={String(expiredCount)}
            icon={<AlertTriangle className={expiredCount > 0 ? 'text-destructive' : 'text-muted-foreground'} />}
            className="bg-card border-border"
          />
          <Stat
            label="Vault Health"
            value={documents.length === 0 ? '—' : expiredCount === 0 ? 'Healthy' : 'Action Needed'}
            icon={expiredCount === 0
              ? <CheckCircle2 className="text-success" />
              : <AlertTriangle className="text-destructive" />
            }
            className="bg-card border-border"
          />
        </StatGroup>

        {/* Expiry notification panel */}
        {!notifDismissed && expiringItems.length > 0 && (
          <ExpiryNotificationPanel
            expiringItems={expiringItems}
            isSending={isSending}
            lastSentAt={lastSentAt}
            onSendNow={handleManualSend}
            onDismiss={() => setNotifDismissed(true)}
          />
        )}

        {/* Re-show button if dismissed but still have issues */}
        {notifDismissed && expiringItems.length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <Bell className="w-4 h-4 text-accent shrink-0" />
            <span className="text-sm text-muted-foreground flex-1">
              {expiringItems.length} document{expiringItems.length > 1 ? 's' : ''} still expiring within 30 days.
            </span>
            {lastSentAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MailCheck className="w-3 h-3 text-success" />
                Alert sent {lastSentAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-bold uppercase tracking-widest"
              onClick={() => setNotifDismissed(false)}
            >
              <Bell className="w-3 h-3 mr-1" />
              Show Alert
            </Button>
          </div>
        )}

        {/* Expiry-only urgency banner for expired docs (different from 30-day alert) */}
        {expiredCount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-destructive/5 border-destructive/20">
            <AlertTriangle className="w-5 h-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-bold text-destructive">
                {expiredCount} document{expiredCount > 1 ? 's' : ''} already expired
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expired STR permits and fire certificates may result in platform delisting and city fines.
              </p>
            </div>
          </div>
        )}

        {/* Type-based tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/30 p-1">
            <TabsTrigger value="all" className="text-xs font-bold uppercase tracking-widest">
              All ({documents.length})
            </TabsTrigger>
            {DOCUMENT_TYPES.map(t => {
              const count = documents.filter(d => d.type === t.value).length
              if (count === 0) return null
              return (
                <TabsTrigger key={t.value} value={t.value} className="text-xs font-bold uppercase tracking-widest">
                  {t.value} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : filteredDocs.length === 0 ? (
              <EmptyState
                icon={<FileText size={40} />}
                title={activeTab === 'all' ? 'Vault is empty' : `No ${activeTab} documents`}
                description={
                  activeTab === 'all'
                    ? 'Upload your city permits, fire certificates, and insurance policies.'
                    : `No documents of type "${activeTab}" in the vault yet.`
                }
                action={{ label: 'Upload Document', onClick: () => setIsUploadOpen(true) }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredDocs.map(doc => {
                  const docType = getDocType(doc.type)
                  const DocIcon = docType.icon
                  const expiry = getExpiryStatus(doc.expiryDate ?? null)
                  const propName = getPropertyName(doc.propertyId)
                  const isExpiring30 = expiringItems.some(i => i.doc.id === doc.id)

                  return (
                    <div
                      key={doc.id}
                      className={`group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card border rounded-xl hover:border-primary/20 transition-all ${
                        isExpiring30 ? 'border-accent/30' : 'border-border'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${docType.bg}`}>
                        <DocIcon className={`w-5 h-5 ${docType.color}`} />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm truncate">{doc.name}</span>
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest h-4 px-1.5 shrink-0">
                            {doc.type}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 bg-muted/50">
                            v{doc.version ?? 1}
                          </Badge>
                          {isExpiring30 && (
                            <Badge className="text-[9px] h-4 px-1.5 shrink-0 bg-accent/20 text-accent border-accent/30">
                              Alert Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {propName}
                          </span>
                          {doc.fileName && (
                            <span className="truncate max-w-[180px]">{doc.fileName}</span>
                          )}
                          <span>{formatBytes(doc.fileSize ?? null)}</span>
                        </div>
                      </div>

                      {/* Expiry badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {expiry.urgent && <Clock className="w-3.5 h-3.5 text-destructive animate-pulse" />}
                        <Badge
                          variant={expiry.variant}
                          className="text-[10px] uppercase font-bold tracking-tight"
                        >
                          {expiry.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-muted-foreground hover:text-primary"
                          title="Version history"
                          onClick={() => setActiveDoc(doc)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        {doc.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-primary"
                            title="Open document"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-muted-foreground hover:text-destructive"
                          title="Delete"
                          disabled={deletingId === doc.id}
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageBody>

      <DocumentUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        properties={properties}
        onUpload={async (file, meta) => {
          await uploadDocument(file, meta)
          fetchDocuments()
        }}
        uploadProgress={Object.values(uploadProgress)[0]}
      />

      <DocumentVersionDrawer
        document={activeDoc}
        onClose={() => setActiveDoc(null)}
        onFetchVersions={fetchVersions}
        onUploadVersion={async (docId, file, currentVer, notes) => {
          await uploadNewVersion(docId, file, currentVer, notes)
          fetchDocuments()
          if (activeDoc?.id === docId) {
            setActiveDoc(prev => prev ? { ...prev, version: currentVer + 1 } : null)
          }
        }}
        currentUploadProgress={activeVersionProgress}
      />
    </Page>
  )
}
