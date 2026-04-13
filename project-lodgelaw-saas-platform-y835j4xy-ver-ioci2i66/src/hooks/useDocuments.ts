import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface Document {
  id: string
  user_id: string
  property_id: string
  type: string
  name: string
  file_name: string | null
  url: string
  expiry_date: string | null
  file_size: number | null
  version: number
  notes: string | null
  created_at: string
}

export interface DocumentVersion {
  id: string
  document_id: string
  user_id: string
  version: number
  url: string
  file_name: string
  file_size: number | null
  notes: string | null
  created_at: string
}

export function useDocuments(userId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const fetchDocuments = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
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
    setUploadProgress(p => ({ ...p, [tempId]: 10 }))

    const storagePath = `documents/${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { error: uploadError } = await supabase.storage
      .from('lodgelaw-documents')
      .upload(storagePath, file)
    if (uploadError) throw uploadError

    setUploadProgress(p => ({ ...p, [tempId]: 70 }))

    const { data: { publicUrl } } = supabase.storage
      .from('lodgelaw-documents')
      .getPublicUrl(storagePath)

    const { data: doc, error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        property_id: meta.propertyId,
        type: meta.type,
        name: meta.name,
        file_name: file.name,
        url: publicUrl,
        expiry_date: meta.expiryDate || null,
        file_size: file.size,
        version: 1,
        notes: meta.notes || null,
      })
      .select()
      .single()
    if (insertError) throw insertError

    await supabase.from('document_versions').insert({
      document_id: doc.id,
      user_id: userId,
      version: 1,
      url: publicUrl,
      file_name: file.name,
      file_size: file.size,
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
    setUploadProgress(p => ({ ...p, [tempId]: 10 }))

    const storagePath = `documents/${userId}/${Date.now()}_v${currentVersion + 1}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { error: uploadError } = await supabase.storage
      .from('lodgelaw-documents')
      .upload(storagePath, file)
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('lodgelaw-documents')
      .getPublicUrl(storagePath)

    const newVersion = currentVersion + 1

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        version: newVersion,
        notes: notes || null,
      })
      .eq('id', documentId)
    if (updateError) throw updateError

    await supabase.from('document_versions').insert({
      document_id: documentId,
      user_id: userId,
      version: newVersion,
      url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      notes: notes || null,
    })

    setUploadProgress(p => { const n = { ...p }; delete n[tempId]; return n })
  }, [userId])

  const deleteDocument = useCallback(async (documentId: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', documentId)
    if (error) throw error
  }, [])

  const fetchVersions = useCallback(async (documentId: string): Promise<DocumentVersion[]> => {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version', { ascending: false })
    if (error) throw error
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
