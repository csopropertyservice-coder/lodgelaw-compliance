import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Badge, Progress, StatGroup, Stat, Page, PageHeader, PageTitle, PageDescription, PageBody, toast } from '@blinkdotnew/ui'
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, Activity, Info } from 'lucide-react'
import { getRiskByZip, checkLicenseVisibility } from '../lib/compliance'

export function Dashboard() {
  const [zipCode, setZipCode] = useState('')
  const [riskData, setRiskData] = useState<any>(null)
  const [listingUrl, setListingUrl] = useState('')
  const [healthCheck, setHealthCheck] = useState<any>(null)

  const handleZipSearch = () => {
    if (zipCode.length < 5) return
    const risk = getRiskByZip(zipCode)
    setRiskData(risk)
  }

  const handleHealthCheck = () => {
    if (!listingUrl) return
    const check = checkLicenseVisibility(listingUrl)
    setHealthCheck(check)
    if (check.isValid) {
      toast.success('Listing is compliant')
    } else {
      toast.error('Listing check failed')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Compliance Command Center</h1>
        <p className="text-muted-foreground mt-1 text-lg">Real-time status of your 2026 STR operations in Texas.</p>
      </div>

      <StatGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat 
          label="Total Nights" 
          value="64" 
          trend={12} 
          trendLabel="vs last month" 
          description="90-day limit (Austin Type 1)"
          className="bg-card border border-border"
        />
        <Stat 
          label="Risk Level" 
          value={riskData?.label || "Low"} 
          icon={<ShieldAlert className={riskData?.score > 70 ? "text-destructive" : "text-success"} />} 
          className="bg-card border border-border"
        />
        <Stat 
          label="HOT Due" 
          value="$1,248" 
          description="Next filing: May 20, 2026"
          className="bg-card border border-border"
        />
      </StatGroup>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Score Engine */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accent" />
              <CardTitle>Risk Score Engine</CardTitle>
            </div>
            <CardDescription>Enter a Texas zip code to check current enforcement status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <Input 
                placeholder="Enter Zip Code (e.g., 78701)" 
                value={zipCode} 
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={5}
              />
              <Button onClick={handleZipSearch}><Search className="w-4 h-4 mr-2" />Check</Button>
            </div>

            {riskData && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4 animate-slide-up">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{riskData.city}, TX</h3>
                    <Badge variant={riskData.score > 70 ? "destructive" : "secondary"}>{riskData.label}</Badge>
                  </div>
                  <div className="text-3xl font-black">{riskData.score}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Regulatory Density</span>
                    <span>{riskData.score}%</span>
                  </div>
                  <Progress value={riskData.score} className="h-2" />
                </div>

                <div className="flex gap-2 p-3 rounded-lg bg-card border border-border text-sm">
                  <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{riskData.alert}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Health Check */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              <CardTitle>Platform Health Check</CardTitle>
            </div>
            <CardDescription>Verify your listing visibility per July 1, 2026 regulations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-3">
              <Input 
                placeholder="Paste Airbnb/VRBO Listing URL" 
                value={listingUrl} 
                onChange={(e) => setListingUrl(e.target.value)}
              />
              <Button onClick={handleHealthCheck}>Scan</Button>
            </div>

            {healthCheck && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 animate-slide-up ${healthCheck.isValid ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                {healthCheck.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                )}
                <div>
                  <h4 className={`font-bold text-sm ${healthCheck.isValid ? 'text-success' : 'text-destructive'}`}>
                    {healthCheck.isValid ? 'Platform Compliant' : 'Risk Detected'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{healthCheck.message}</p>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1 mb-2 uppercase tracking-wider">
                <Info className="w-3 h-3" /> 2026 Austin Rule (Type 1)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Platform transparency rules now require a 1:1 match between city license records and OTA listing data. License numbers must be displayed in the designated field or first line of description.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Feed */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Compliance Alerts & Ordinance Updates</CardTitle>
          <CardDescription>Stay ahead of 2026 regulatory shifts in Texas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { city: 'Austin', date: 'July 1, 2026', title: 'Platform Transparency Rules Active', tag: 'Action Required', type: 'error' },
              { city: 'Houston', date: 'Jan 15, 2026', title: 'New Registration Portal Opens', tag: 'Update', type: 'warning' },
              { city: 'Dallas', date: 'April 10, 2026', title: 'Injunction Update: Zoning enforcement paused', tag: 'Monitoring', type: 'info' }
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${alert.type === 'error' ? 'bg-destructive' : alert.type === 'warning' ? 'bg-accent' : 'bg-info'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-muted-foreground">{alert.city} • {alert.date}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{alert.tag}</Badge>
                    </div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{alert.title}</h4>
                  </div>
                </div>
                <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
