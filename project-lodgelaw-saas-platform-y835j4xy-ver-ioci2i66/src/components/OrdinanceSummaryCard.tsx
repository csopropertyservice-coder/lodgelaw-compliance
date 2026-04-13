import React from 'react'
import { Badge } from '@blinkdotnew/ui'
import { AlertTriangle, CheckCircle2, Clock, Info, Lightbulb, Sparkles, Zap } from 'lucide-react'
import type { ParsedSummary, SummaryState } from '../hooks/useOrdinanceSummary'

const RISK_CONFIG = {
  low: { label: 'Low Risk', className: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  medium: { label: 'Medium Risk', className: 'bg-accent/10 text-accent border-accent/20', icon: AlertTriangle },
  high: { label: 'High Risk', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle },
  critical: { label: 'Critical', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: Zap }
}

const PRIORITY_CONFIG = {
  immediate: { label: 'Immediate', className: 'bg-destructive/10 text-destructive border-destructive/30', icon: Zap },
  soon: { label: 'Soon', className: 'bg-accent/10 text-accent border-accent/30', icon: Clock },
  monitor: { label: 'Monitor', className: 'bg-primary/10 text-primary border-primary/30', icon: Info }
}

function StreamingCursor() {
  return (
    <span className="inline-block w-0.5 h-3.5 bg-accent/60 animate-pulse ml-0.5 align-middle" />
  )
}

interface Props {
  state: SummaryState
  cityName: string
}

export function OrdinanceSummaryCard({ state, cityName }: Props) {
  const { raw, parsed, isStreaming, error } = state

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-destructive">Analysis failed</p>
          <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
        </div>
      </div>
    )
  }

  // While streaming but not yet parseable — show raw stream
  if (isStreaming && !parsed) {
    return (
      <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">AI Analyzing {cityName}…</span>
        </div>
        <div className="font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap break-words max-h-32 overflow-hidden">
          {raw}
          <StreamingCursor />
        </div>
      </div>
    )
  }

  // Fully parsed result
  if (parsed) {
    const risk = RISK_CONFIG[parsed.riskLevel] ?? RISK_CONFIG.medium
    const RiskIcon = risk.icon

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-accent">AI Compliance Analysis</span>
          </div>
          <Badge className={`text-[10px] h-5 px-2 border font-bold uppercase ${risk.className}`}>
            <RiskIcon className="w-2.5 h-2.5 mr-1" />
            {risk.label}
          </Badge>
        </div>

        {/* Summary sentence */}
        <p className="text-sm text-foreground leading-relaxed font-medium">{parsed.summary}</p>

        {/* Action Items */}
        <div className="space-y-2">
          <h6 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action Items</h6>
          {parsed.actionItems.map((item, i) => {
            const pConfig = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.monitor
            const PIcon = pConfig.icon
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                <Badge className={`text-[9px] h-5 px-1.5 border shrink-0 font-bold uppercase ${pConfig.className}`}>
                  <PIcon className="w-2 h-2 mr-0.5" />
                  {pConfig.label}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug">{item.action}</p>
                  {item.deadline && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {item.deadline}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Penalties */}
        {parsed.penalties && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase text-destructive tracking-wide mb-0.5">Non-Compliance Penalties</p>
              <p className="text-xs text-muted-foreground">{parsed.penalties}</p>
            </div>
          </div>
        )}

        {/* Pro Tip */}
        {parsed.proTip && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Lightbulb className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase text-accent tracking-wide mb-0.5">Expert Tip</p>
              <p className="text-xs text-muted-foreground">{parsed.proTip}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
