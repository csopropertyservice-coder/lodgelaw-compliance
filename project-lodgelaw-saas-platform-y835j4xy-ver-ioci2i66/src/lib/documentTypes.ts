import { ShieldCheck, Flame, FileText, Building2, ScrollText, Award } from 'lucide-react'

export const DOCUMENT_TYPES = [
  { value: 'Permit', label: 'STR City Permit', icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10', urgencyWeight: 1 },
  { value: 'Fire Safety', label: 'Fire Safety Certificate', icon: Flame, color: 'text-destructive', bg: 'bg-destructive/10', urgencyWeight: 2 },
  { value: 'Insurance', label: 'Insurance Policy (STR Rider)', icon: Building2, color: 'text-accent', bg: 'bg-accent/10', urgencyWeight: 1 },
  { value: 'HOA Rules', label: 'HOA / Deed Restriction', icon: ScrollText, color: 'text-secondary-foreground', bg: 'bg-secondary/20', urgencyWeight: 0 },
  { value: 'Inspection', label: 'Property Inspection Report', icon: Award, color: 'text-success', bg: 'bg-success/10', urgencyWeight: 1 },
  { value: 'Other', label: 'Other Compliance Document', icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted', urgencyWeight: 0 },
] as const

export type DocumentTypeValue = typeof DOCUMENT_TYPES[number]['value']

export function getDocType(value: string) {
  return DOCUMENT_TYPES.find(d => d.value === value) ?? DOCUMENT_TYPES[DOCUMENT_TYPES.length - 1]
}

export function getExpiryStatus(expiryDate: string | null) {
  if (!expiryDate) return { label: 'No Expiry', variant: 'outline' as const, daysLeft: null, urgent: false }
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: 'Expired', variant: 'destructive' as const, daysLeft: days, urgent: true }
  if (days <= 14) return { label: `${days}d left`, variant: 'destructive' as const, daysLeft: days, urgent: true }
  if (days <= 60) return { label: `${days}d left`, variant: 'warning' as const, daysLeft: days, urgent: true }
  return { label: `${days}d left`, variant: 'outline' as const, daysLeft: days, urgent: false }
}

export function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
