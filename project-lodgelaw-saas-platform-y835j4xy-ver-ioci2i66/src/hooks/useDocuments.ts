import { useState, useCallback } from 'react'
import { blink } from '../blink/client'

export interface Document {
  id: string
  userId: string
  propertyId: string
  type: string
  name: string
  fileName: string | null
  url: string
  expiryDate: string | null
  fileSize: number | null
  version: number
  notes: string | null
  createdAt: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  userId: string
  version: number
  url: string
  fileName: string
  fileSize: number | null
  notes: string | null
  createdAt: string
}

export function useDocuments(userId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const fetchDocuments = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const data = await blink.db.documents.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      setDocuments(data as Document[])
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const uploadDocument = useCallback(async (
    file: File,
    meta: { propertyId: string; type: string; name: string; expiryDate: string; notes: string }
  ) => {
    if (!userId) throw new Error('Not authenticated')

    const tempId = `upload_${Date.now()}`
    setUploadProgress(p => ({ ...p, [tempId]: 0 }))

    // Upload file to storage
    const ext = file.name.split('.').pop()
    const storagePath = `documents/${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { publicUrl } = await blink.storage.upload(file, storagePath, {
      onProgress: (pct) => setUploadProgress(p => ({ ...p, [tempId]: pct }))
    })

    setUploadProgress(p => ({ ...p, [tempId]: 100 }))

    // Save metadata to DB
    const doc = await blink.db.documents.create({
      userId,
      propertyId: meta.propertyId,
      type: meta.type,
      name: meta.name,
      fileName: file.name,
      url: publicUrl,
      expiryDate: meta.expiryDate || null,
      fileSize: file.size,
      version: 1,
      notes: meta.notes || null,
    })

    // Record first version
    await blink.db.documentVersions.create({
      documentId: doc.id,
      userId,
      version: 1,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      notes: meta.notes || null,
    })

    setUploadProgress(p => { const n = { ...p }; delete n[tempId]; return n })
    return doc
  }, [userId])

  const uploadNewVersion = useCallback(async (
    documentId: string,
    file: File,
    currentVersion: number,
    notes: string
  ) => {
    if (!userId) throw new Error('Not authenticated')

    const tempId = `ver_${documentId}`
    setUploadProgress(p => ({ ...p, [tempId]: 0 }))

    const storagePath = `documents/${userId}/${Date.now()}_v${currentVersion + 1}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { publicUrl } = await blink.storage.upload(file, storagePath, {
      onProgress: (pct) => setUploadProgress(p => ({ ...p, [tempId]: pct }))
    })

    const newVersion = currentVersion + 1

    // Update document record
    await blink.db.documents.update(documentId, {
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      version: newVersion,
      notes: notes || null,
    })

    // Add version history entry
    await blink.db.documentVersions.create({
      documentId,
      userId,
      version: newVersion,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      notes: notes || null,
    })

    setUploadProgress(p => { const n = { ...p }; delete n[tempId]; return n })
  }, [userId])

  const deleteDocument = useCallback(async (documentId: string) => {
    await blink.db.documents.delete(documentId)
  }, [])

  const fetchVersions = useCallback(async (documentId: string): Promise<DocumentVersion[]> => {
    const data = await blink.db.documentVersions.list({
      where: { documentId },
      orderBy: { version: 'desc' }
    })
    return data as DocumentVersion[]
  }, [])

  return {
    documents,
    isLoading,
    uploadProgress,
    fetchDocuments,
    uploadDocument,
    uploadNewVersion,
    deleteDocument,
    fetchVersions,
  }
}
