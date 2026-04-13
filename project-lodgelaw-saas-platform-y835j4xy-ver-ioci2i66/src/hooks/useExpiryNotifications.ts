import { useState, useCallback } from 'react'
import { blink } from '../blink/client'
import {
  getExpiringDocuments,
  buildExpiryEmailHtml,
  buildExpiryEmailText,
  buildExpiryEmailSubject,
  type ExpiringDoc,
} from '../lib/expiryEmail'
import type { Document } from './useDocuments'

const VAULT_URL = `${window.location.origin}/documents`
// LocalStorage key to track last-sent timestamp per user
const LAST_SENT_KEY = (userId: string) => `lodgelaw_expiry_last_sent_${userId}`

export interface NotificationResult {
  sent: boolean
  count: number
  messageId?: string
  error?: string
  items: ExpiringDoc[]
}

export function useExpiryNotifications() {
  const [isSending, setIsSending] = useState(false)
  const [lastResult, setLastResult] = useState<NotificationResult | null>(null)

  const checkAndNotify = useCallback(async (
    documents: Document[],
    properties: { id: string; name: string }[],
    userEmail: string,
    userName: string,
    userId: string,
    opts: { threshold?: number; force?: boolean } = {}
  ): Promise<NotificationResult> => {
    const threshold = opts.threshold ?? 30

    // Throttle: don't send more than once per 24h unless forced
    if (!opts.force) {
      const lastSent = localStorage.getItem(LAST_SENT_KEY(userId))
      if (lastSent) {
        const hoursSince = (Date.now() - Number(lastSent)) / 3600000
        if (hoursSince < 24) {
          return { sent: false, count: 0, items: [], error: 'Already sent within 24h' }
        }
      }
    }

    const expiringItems = getExpiringDocuments(documents, threshold)
    if (expiringItems.length === 0) {
      return { sent: false, count: 0, items: [] }
    }

    // Enrich with property names
    const enriched: ExpiringDoc[] = expiringItems.map(item => ({
      ...item,
      propertyName: properties.find(p => p.id === item.doc.propertyId)?.name ?? '',
    }))

    setIsSending(true)
    try {
      const result = await blink.notifications.email({
        to: userEmail,
        subject: buildExpiryEmailSubject(enriched),
        html: buildExpiryEmailHtml(userName, enriched, VAULT_URL),
        text: buildExpiryEmailText(userName, enriched, VAULT_URL),
        replyTo: 'compliance@lodgelaw.app',
      })

      // Record send time to throttle future auto-sends
      localStorage.setItem(LAST_SENT_KEY(userId), String(Date.now()))

      const res: NotificationResult = {
        sent: true,
        count: enriched.length,
        messageId: result.messageId,
        items: enriched,
      }
      setLastResult(res)
      return res
    } catch (err: any) {
      const res: NotificationResult = {
        sent: false,
        count: 0,
        items: enriched,
        error: err?.message ?? 'Email failed',
      }
      setLastResult(res)
      return res
    } finally {
      setIsSending(false)
    }
  }, [])

  const getLastSentTime = useCallback((userId: string): Date | null => {
    const ts = localStorage.getItem(LAST_SENT_KEY(userId))
    return ts ? new Date(Number(ts)) : null
  }, [])

  return { isSending, lastResult, checkAndNotify, getLastSentTime }
}
