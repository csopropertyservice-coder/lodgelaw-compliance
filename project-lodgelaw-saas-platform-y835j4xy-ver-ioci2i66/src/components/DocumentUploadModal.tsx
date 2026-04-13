import React, { useState, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Badge, Field, Input, Select, SelectTrigger,
  SelectValue, SelectContent, SelectItem, Progress, toast
} from '@blinkdotnew/ui'
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { DOCUMENT_TYPES, formatBytes } from '../lib/documentTypes'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  properties: { id: string; name: string }[]
  onUpload: (file: File, meta: {
    propertyId: string
    type: string
    name: string
    expiryDate: string
    notes: string
  }) => Promise<void>
  uploadProgress?: number
}

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.webp'

export function DocumentUploadModal({ open, onOpenChange, properties, onUpload, uploadProgress }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [meta, setMeta] = useState({ propertyId: '', type: 'Permit', name: '', expiryDate: '', notes: '' })
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    if (!meta.name) setMeta(m => ({ ...m, name: f.name.replace(/\.[^/.]+$/, '') }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select a file'); return }
    if (!meta.propertyId) { toast.error('Please assign a property'); return }
    if (!meta.name) { toast.error('Please enter a document name'); return }

    setIsUploading(true)
    try {
      await onUpload(file, meta)
      toast.success('Document secured in vault')
      setFile(null)
      setMeta({ propertyId: '', type: 'Permit', name: '', expiryDate: '', notes: '' })
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setMeta({ propertyId: '', type: 'Permit', name: '', expiryDate: '', notes: '' })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isUploading) { onOpenChange(v); if (!v) reset() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent" />
            Secure Document Upload
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`
              relative rounded-xl border-2 border-dashed transition-all cursor-pointer
              ${isDragging ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-muted/30'}
              ${file ? 'cursor-default' : ''}
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)} • {file.type || 'document'}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Drop your document here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG — max 10 MB</p>
                </div>
                <Button variant="outline" size="sm" className="mt-2 text-xs font-bold uppercase tracking-widest pointer-events-none">
                  Browse Files
                </Button>
              </div>
            )}

            {/* Upload progress overlay */}
            {isUploading && uploadProgress !== undefined && uploadProgress < 100 && (
              <div className="absolute inset-0 rounded-xl bg-background/90 flex flex-col items-center justify-center gap-3 p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">Securing document…</p>
                <Progress value={uploadProgress} className="w-full h-2" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Metadata fields */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Property *">
              <Select value={meta.propertyId} onValueChange={(v) => setMeta(m => ({ ...m, propertyId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {properties.length === 0
                    ? <SelectItem value="__none" disabled>No properties yet</SelectItem>
                    : properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </Field>

            <Field label="Document Type">
              <Select value={meta.type} onValueChange={(v) => setMeta(m => ({ ...m, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Document Name *">
            <Input
              placeholder="e.g., 2026 Austin STR Permit – Type 1"
              value={meta.name}
              onChange={(e) => setMeta(m => ({ ...m, name: e.target.value }))}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Expiry Date">
              <Input
                type="date"
                value={meta.expiryDate}
                onChange={(e) => setMeta(m => ({ ...m, expiryDate: e.target.value }))}
              />
            </Field>
            <Field label="Notes (optional)">
              <Input
                placeholder="e.g., Renewal pending"
                value={meta.notes}
                onChange={(e) => setMeta(m => ({ ...m, notes: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <p className="text-xs text-muted-foreground">
              Files are encrypted in transit and stored securely. Each upload creates a version entry for audit trails.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            loading={isUploading}
            disabled={!file || isUploading}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest h-11"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Securing…' : 'Secure & Save to Vault'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
