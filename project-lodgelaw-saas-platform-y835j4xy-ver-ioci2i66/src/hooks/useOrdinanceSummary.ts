import { useState, useCallback } from 'react'
import { blink } from '../blink/client'
import { buildOrdinancePrompt, ORDINANCE_SYSTEM_PROMPT } from '../lib/aiPrompts'

export interface ParsedSummary {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  actionItems: Array<{
    priority: 'immediate' | 'soon' | 'monitor'
    action: string
    deadline: string | null
  }>
  penalties: string | null
  proTip: string
}

export interface SummaryState {
  raw: string
  parsed: ParsedSummary | null
  isStreaming: boolean
  error: string | null
}

export function useOrdinanceSummary() {
  const [summaries, setSummaries] = useState<Record<string, SummaryState>>({})

  const summarize = useCallback(async (ord: any) => {
    const id = ord.id

    setSummaries(prev => ({
      ...prev,
      [id]: { raw: '', parsed: null, isStreaming: true, error: null }
    }))

    try {
      let accumulated = ''

      await blink.ai.streamText(
        {
          messages: [
            { role: 'system', content: ORDINANCE_SYSTEM_PROMPT },
            { role: 'user', content: buildOrdinancePrompt(ord) }
          ],
          model: 'gpt-4.1-mini',
          maxTokens: 600,
          temperature: 0.3
        },
        (chunk: string) => {
          accumulated += chunk
          setSummaries(prev => ({
            ...prev,
            [id]: { ...prev[id], raw: accumulated, isStreaming: true, parsed: null }
          }))
        }
      )

      // Parse the JSON once streaming completes
      let parsed: ParsedSummary | null = null
      try {
        const jsonMatch = accumulated.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        }
      } catch {
        // If JSON parse fails, keep raw text
      }

      setSummaries(prev => ({
        ...prev,
        [id]: { raw: accumulated, parsed, isStreaming: false, error: null }
      }))
    } catch (err: any) {
      setSummaries(prev => ({
        ...prev,
        [id]: { raw: '', parsed: null, isStreaming: false, error: err?.message || 'AI analysis failed' }
      }))
    }
  }, [])

  const summarizeAll = useCallback(async (ordinances: any[]) => {
    for (const ord of ordinances) {
      await summarize(ord)
    }
  }, [summarize])

  const clear = useCallback((id: string) => {
    setSummaries(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  return { summaries, summarize, summarizeAll, clear }
}
