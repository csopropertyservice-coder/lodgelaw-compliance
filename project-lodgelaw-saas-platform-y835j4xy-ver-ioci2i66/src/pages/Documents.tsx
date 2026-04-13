import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useDocuments } from '../hooks/useDocuments'
import { DocumentUploadModal } from '../components/DocumentUploadModal'
import { DocumentVersionDrawer } from '../components/DocumentVersionDrawer'
import { ExpiryNotificationPanel } from '../components/ExpiryNotificationPanel'
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Button, Badge, toast
} from '@blinkdotnew/ui'
import { Plus, FileText, Calendar, Building, AlertTriangle, Eye } from 'lucide-react'

const TYPE_COLORS: Record<string, string> = {
  permit: 'bg-blue-100 text-blue-700',
  license: 'bg-purple-100 text-purple-700',
  insurance: 'bg-green-100 text-green-700',
  lease: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function Documents() {
  const { user } = useAuth()
  const { documents, isLoading, fetchDocuments, uploadDocument, uploadNewVersion, deleteDocument, fetchVersions, uploadProgress } = useDocuments(user?.id)
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (user) {
      fetchDocuments()
      supabase
        .from('properties')
        .select('id, name')
        .eq('user_id', user.id)
        .then(({ data }) => setProperties(data ?? []))
    }
  }, [user])

  const handleUpload = async (file: File, meta: any) => {
    try {
      await uploadDocument(file, meta)
      toast.success('Document uploaded successfully')
      setIsUploadOpen(false)
      fetchDocuments()
    } catch (err) {
      toast.error('Upload failed')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id)
      toast.success('Document deleted')
      fetchDocuments()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const filtered = filterType === 'all' ? documents : documents.filter(d => d.type === filterType)
  const expiringSoon = documents.filter(d => {
    const days = daysUntil(d.expiry_date)
    return days !== null && days <= 30 && days >= 0
  })

  return (
    <>
      <Page>
        <PageHeader>
          <div>
            <PageTitle>Documents</PageTitle>
            <PageDescription>Manage your STR compliance documents and licenses.</PageDescription>
          </div>
          <PageActions>
            {expiringSoon.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4" />
                {expiringSoon.length} document{expiringSoon.length > 1 ? 's' : ''} expiring soon
              </div>
            )}
            <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Upload Document
            </Button>
          </PageActions>
        </PageHeader>
        <PageBody>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'permit', 'license', 'insurance', 'lease', 'other'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No documents yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Upload your first compliance document to get started.</p>
              <Button onClick={() => setIsUploadOpen(true)}><Plus className="w-4 h-4 mr-2" />Upload Document</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(doc => {
                const days = daysUntil(doc.expiry_date)
                const isExpiringSoon = days !== null && days <= 30 && days >= 0
                const isExpired = days !== null && days < 0
                const propertyName = properties.find(p => p.id === doc.property_id)?.name ?? 'Unknown'

                return (
                  <div
                    key={doc.id}
                    className={`bg-card border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors ${
                      isExpired ? 'border-destructive/40' : isExpiringSoon ? 'border-amber-300' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">{doc.name}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.type] ?? TYPE_COLORS.other}`}>
                        {doc.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building className="w-3 h-3" />
                      {propertyName}
                    </div>

                    {doc.expiry_date && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        isExpired ? 'text-destructive' : isExpiringSoon ? 'text-amber-600' : 'text-muted-foreground'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {isExpired
                          ? `Expired ${Math.abs(days!)} days ago`
                          : isExpiringSoon
                          ? `Expires in ${days} days`
                          : `Expires ${new Date(doc.expiry_date).toLocaleDateString()}`}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">v{doc.version}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <Eye className="w-3 h-3" /> Versions
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(doc.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </PageBody>
      </Page>

      <DocumentUploadModal
        open={isUploadOpen}
        onOpenChange={(v) => setIsUploadOpen(v)}
        onUpload={handleUpload}
        properties={properties}
        uploadProgress={uploadProgress}
      />

      {selectedDoc && (
        <DocumentVersionDrawer
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUploadVersion={async (file, notes) => {
            await uploadNewVersion(selectedDoc.id, file, selectedDoc.version, notes)
            fetchDocuments()
            setSelectedDoc(null)
          }}
          fetchVersions={fetchVersions}
        />
      )}
    </>
  )
}
