import React from 'react'
import { Button, Badge, Progress } from '@blinkdotnew/ui'
import { AlertTriangle, CheckCircle2, Info, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import type { PropertyAnalysis } from '../hooks/usePropertyCompliance'

const SCORE_CONFIG = (score: number) => {
  if (score >= 80) return { color: 'text-success', barClass: '', label: 'Compliant' }
  if (score >= 50) return { color: 'text-accent', barClass: '', label: 'At Risk' }
  return { color: 'text-destructive', barClass: '', label: 'Non-Compliant' }
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, className: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  warning: { icon: AlertTriangle, className: 'text-accent', bg: 'bg-accent/5 border-accent/20' },
  info: { icon: Info, className: 'text-primary', bg: 'bg-primary/5 border-primary/10' }
}

interface Props {
  propertyId: string
  propertyName: string
  analysis: { data: PropertyAnalysis | null; isLoading: boolean; error: string | null } | undefined
  onAnalyze: () => void
}

export function PropertyCompliancePanel({ propertyId, propertyName, analysis, onAnalyze }: Props) {
  if (!analysis) {
    return (
      <div className="flex items-center gap-3 py-3">
        <Sparkles className="w-4 h-4 text-accent/60" />
        <span className="text-xs text-muted-foreground">AI compliance analysis available for this property</span>
        <Button size="sm" variant="outline" onClick={onAnalyze} className="ml-auto h-7 text-[10px] font-bold uppercase tracking-widest">
          Analyze
        </Button>
      </div>
    )
  }

  if (analysis.isLoading) {
    return (
      <div className="flex items-center gap-3 py-3">
        <Loader2 className="w-4 h-4 text-accent animate-spin" />
        <span className="text-xs text-muted-foreground">Running AI compliance analysis…</span>
      </div>
    )
  }

  if (analysis.error) {
    return (
      <div className="flex items-center gap-3 py-3">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-xs text-destructive">{analysis.error}</span>
        <Button size="sm" variant="ghost" onClick={onAnalyze} className="ml-auto h-7">
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  const data = analysis.data
  if (!data) return null

  const scoreConfig = SCORE_CONFIG(data.complianceScore)

  return (
    <div className="space-y-4 animate-fade-in py-2">
      {/* Score bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-accent">Compliance Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black ${scoreConfig.color}`}>{data.complianceScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <Badge variant="outline" className={`text-[9px] h-5 px-1.5 ml-1 ${
              data.status === 'compliant' ? 'bg-success/10 text-success border-success/20' :
              data.status === 'at-risk' ? 'bg-accent/10 text-accent border-accent/20' :
              'bg-destructive/10 text-destructive border-destructive/20'
            }`}>
              {data.status}
            </Badge>
          </div>
        </div>
        <Progress value={data.complianceScore} className="h-2" />
      </div>

      {/* Issues */}
      {data.issues.length > 0 && (
        <div className="space-y-1.5">
          {data.issues.map((issue, i) => {
            const cfg = SEVERITY_CONFIG[issue.severity]
            const Icon = cfg.icon
            return (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${cfg.bg}`}>
                <Icon className={`w-3 h-3 shrink-0 mt-0.5 ${cfg.className}`} />
                <span>{issue.description}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recommendations</p>
          {data.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-3 h-3 text-success shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}

      {/* Next deadline */}
      {data.nextDeadline && (
        <p className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-1">
          Next deadline: <span className="font-bold text-foreground">{data.nextDeadline}</span>
        </p>
      )}

      <Button size="sm" variant="ghost" onClick={onAnalyze} className="h-7 text-[10px] text-muted-foreground px-2">
        <RefreshCw className="w-3 h-3 mr-1" /> Re-analyze
      </Button>
    </div>
  )
}
