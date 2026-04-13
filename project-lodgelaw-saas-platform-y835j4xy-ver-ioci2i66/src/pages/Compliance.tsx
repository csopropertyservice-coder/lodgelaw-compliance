import React, { useEffect } from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageActions, PageBody,
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, Skeleton, Alert, AlertTitle, AlertDescription, toast
} from '@blinkdotnew/ui'
import { useState } from 'react'
import { BookOpen, Download, Info, Sparkles, Zap, RefreshCw } from 'lucide-react'
import { blink } from '../blink/client'
import { useOrdinanceSummary } from '../hooks/useOrdinanceSummary'
import { OrdinanceSummaryCard } from '../components/OrdinanceSummaryCard'

export function Compliance() {
  const [ordinances, setOrdinances] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { summaries, summarize, summarizeAll } = useOrdinanceSummary()

  const fetchOrdinances = async () => {
    try {
      const data = await blink.db.ordinances.list()
      setOrdinances(data)
    } catch (error) {
      console.error('Error fetching ordinances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdinances()
  }, [])

  const isAnyStreaming = Object.values(summaries).some(s => s.isStreaming)
  const analyzedCount = Object.values(summaries).filter(s => s.parsed).length

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full">
          <div>
            <PageTitle className="text-3xl font-bold text-primary">Texas Ordinance Database</PageTitle>
            <PageDescription className="text-muted-foreground mt-1">
              AI-powered analysis of 2026 STR regulations. Structured action items for Austin, Houston, and Dallas.
            </PageDescription>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              className="text-xs font-bold uppercase tracking-widest h-9"
              onClick={() => {
                if (!isAnyStreaming) summarizeAll(ordinances)
                else toast('Analysis already in progress…')
              }}
              disabled={isLoading || isAnyStreaming}
            >
              {isAnyStreaming ? (
                <><Sparkles className="w-3 h-3 mr-2 animate-pulse text-accent" /> Analyzing…</>
              ) : (
                <><Zap className="w-3 h-3 mr-2" /> Analyze All {ordinances.length > 0 ? `(${ordinances.length})` : ''}</>
              )}
            </Button>
          </div>
        </div>
      </PageHeader>

      <PageBody className="mt-8 space-y-8">
        <Alert className="bg-primary/5 border-primary/10">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-bold">2026 Compliance Deadlines</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Houston: mandatory registration display as of <strong>Jan 1, 2026</strong>.
            Austin: platform transparency rules active <strong>July 1, 2026</strong>.
            Dallas: zoning enforcement paused pending injunction — tracking still required.
          </AlertDescription>
        </Alert>

        {analyzedCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">
              {analyzedCount} of {ordinances.length} ordinances analyzed
            </span>
            <Badge className="ml-auto bg-accent/20 text-accent border-accent/30 text-[10px] uppercase font-bold">
              {Math.round((analyzedCount / ordinances.length) * 100)}% Complete
            </Badge>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {isLoading
            ? [1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)
            : ordinances.map(ord => (
                <Card key={ord.id} className="border-border shadow-sm bg-card hover:border-primary/20 transition-all group overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    {/* City meta panel */}
                    <div className="lg:w-56 bg-sidebar p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-sidebar-border shrink-0">
                      <div>
                        <h3 className="text-2xl font-black text-sidebar-foreground">{ord.city}</h3>
                        <p className="text-xs font-bold text-sidebar-foreground/50 uppercase tracking-widest">{ord.state} • 2026</p>
                      </div>
                      <div className="mt-6 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Annual Fee</p>
                          <p className="text-xl font-black text-sidebar-primary">${ord.annual_fee}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Validity</p>
                          <p className="text-sm font-bold text-sidebar-foreground">{ord.license_validity}</p>
                        </div>
                        <Badge variant="outline" className="bg-sidebar-accent/40 text-sidebar-foreground border-sidebar-border text-[9px] uppercase tracking-tight w-full justify-center">
                          {ord.status_2026}
                        </Badge>
                      </div>
                    </div>

                    {/* Content panel */}
                    <div className="flex-1 p-6 space-y-6 min-w-0">
                      {/* Raw rules */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> 2026 Registration Rules
                        </h4>
                        <p className="text-sm leading-relaxed text-foreground/90">{ord.registration_rules}</p>
                      </div>

                      {/* AI summary section */}
                      <div className="pt-4 border-t border-border">
                        {summaries[ord.id] ? (
                          <div className="space-y-4">
                            <OrdinanceSummaryCard state={summaries[ord.id]} cityName={ord.city} />
                            {!summaries[ord.id].isStreaming && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => summarize(ord)}
                                className="h-7 text-[10px] text-muted-foreground uppercase tracking-widest px-2"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-accent/50" />
                              <span className="text-sm text-muted-foreground">
                                AI can generate structured action items for this ordinance
                              </span>
                            </div>
                            <Button
                              onClick={() => summarize(ord)}
                              className="bg-primary hover:opacity-90 shrink-0 text-xs font-bold uppercase tracking-widest h-9"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-2" />
                              Analyze with AI
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
          }
        </div>
      </PageBody>
    </Page>
  )
}
