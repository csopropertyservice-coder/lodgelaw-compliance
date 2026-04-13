import React, { useEffect, useState, useRef } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Button, Badge, Progress, toast
} from '@blinkdotnew/ui'
import {
  History, Upload, FileText, Download, ExternalLink,
  GitCommit, Clock, X
} from 'lucide-react'
import { formatBytes, getDocType, getExpiryStatus } from '../lib/documentTypes'
import type { Document, DocumentVersion } from '../hooks/useDocuments'

interface Props {
  document: Document | null
  onClose: () => void
  onFetchVersions: (docId: string) => Promise<DocumentVersion[]>
  onUploadVersion: (docId: string, file: File, currentVersion: number, notes: string) => Promise<void>
  currentUploadProgress?: number
}

export function DocumentVersionDrawer({
  document: doc,
  onClose,
  onFetchVersions,
  onUploadVersion,
  currentUploadProgress,
}: Props) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null)
  const [versionNotes, setVersionNotes] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!doc) return
    setIsLoading(true)
    onFetchVersions(doc.id)
      .then(setVersions)
      .finally(() => setIsLoading(false))
  }, [doc?.id])

  const handleUploadNewVersion = async () => {
    if (!doc || !newVersionFile) return
    setIsUploading(true)
    try {
      await onUploadVersion(doc.id, newVersionFile, doc.version ?? 1, versionNotes)
      toast.success(`Version ${(doc.version ?? 1) + 1} uploaded successfully`)
      // Refresh version list
      const updated = await onFetchVersions(doc.id)
      setVersions(updated)
      setNewVersionFile(null)
      setVersionNotes('')
    } catch (err: any) {
      toast.error(err?.message || 'Version upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  if (!doc) return null

  const docType = getDocType(doc.type)
  const DocIcon = docType.icon
  const expiry = getExpiryStatus(doc.expiryDate ?? null)

  return (
    <Sheet open={!!doc} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${docType.bg}`}>
                <DocIcon className={`w-5 h-5 ${docType.color}`} />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base font-bold truncate">{doc.name}</SheetTitle>
                <p className="text-xs text-muted-foreground truncate">{doc.fileName || 'No file attached'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted ml-2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Meta grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Type', value: doc.type },
              { label: 'File Size', value: formatBytes(doc.fileSize ?? null) },
              { label: 'Current Version', value: `v${doc.version ?? 1}` },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>

          {/* Expiry status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            expiry.urgent ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border'
          }`}>
            <Clock className={`w-4 h-4 shrink-0 ${expiry.urgent ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <p className="text-xs font-bold">Expiry Status</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {doc.expiryDate
                  ? new Date(doc.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'No expiry date set'}
              </p>
            </div>
            <Badge variant={expiry.variant} className="text-[10px] uppercase font-bold shrink-0">
              {expiry.label}
            </Badge>
          </div>

          {/* Current document link */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-accent shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{doc.fileName || doc.name}</p>
                <p className="text-[10px] text-muted-foreground">Current active version</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] font-bold uppercase"
                onClick={() => window.open(doc.url, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open
              </Button>
            </div>
          </div>

          {/* Upload new version */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Upload className="w-3 h-3" /> Upload New Version
            </h4>
            <div
              onClick={() => inputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all
                ${newVersionFile ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-primary/30 hover:bg-muted/20'}
              `}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setNewVersionFile(e.target.files[0])}
              />
              {newVersionFile ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{newVersionFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(newVersionFile.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setNewVersionFile(null) }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-center text-xs text-muted-foreground">
                  Click to select replacement file
                </div>
              )}
            </div>

            {newVersionFile && (
              <>
                <input
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Version notes (e.g., Renewed for 2026)"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                />
                {isUploading && currentUploadProgress !== undefined && (
                  <Progress value={currentUploadProgress} className="h-1.5" />
                )}
                <Button
                  onClick={handleUploadNewVersion}
                  loading={isUploading}
                  className="w-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest h-9"
                >
                  Push Version {(doc.version ?? 1) + 1}
                </Button>
              </>
            )}
          </div>

          {/* Version history */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <History className="w-3 h-3" /> Version History
            </h4>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No version history recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border group">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black
                      ${i === 0 ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground'}`}>
                      v{v.version}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{v.fileName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {v.fileSize && <span>· {formatBytes(v.fileSize)}</span>}
                        {i === 0 && <Badge className="bg-accent/20 text-accent border-accent/20 text-[9px] uppercase">Current</Badge>}
                      </div>
                      {v.notes && <p className="text-[10px] text-muted-foreground mt-0.5 italic truncate">"{v.notes}"</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open(v.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
