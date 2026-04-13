import { useState, useCallback } from 'react'
import { blink } from '../blink/client'
import { buildPropertyCompliancePrompt } from '../lib/aiPrompts'

export interface PropertyAnalysis {
  complianceScore: number
  status: 'compliant' | 'at-risk' | 'non-compliant'
  issues: Array<{ severity: 'critical' | 'warning' | 'info'; description: string }>
  recommendations: string[]
  nextDeadline: string | null
}

export function usePropertyCompliance() {
  const [analyses, setAnalyses] = useState<Record<string, { data: PropertyAnalysis | null; isLoading: boolean; error: string | null }>>({})

  const analyzeProperty = useCallback(async (property: any, ordinances: any[]) => {
    const id = property.id
    setAnalyses(prev => ({ ...prev, [id]: { data: null, isLoading: true, error: null } }))

    try {
      const { text } = await blink.ai.generateText({
        prompt: buildPropertyCompliancePrompt(property, ordinances),
        model: 'gpt-4.1-mini',
        maxTokens: 500,
        temperature: 0.2
      })

      let parsed: PropertyAnalysis | null = null
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch {
        // fallback
      }

      setAnalyses(prev => ({ ...prev, [id]: { data: parsed, isLoading: false, error: null } }))
    } catch (err: any) {
      setAnalyses(prev => ({ ...prev, [id]: { data: null, isLoading: false, error: err?.message || 'Analysis failed' } }))
    }
  }, [])

  return { analyses, analyzeProperty }
}
