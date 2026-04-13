import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Separator } from '@blinkdotnew/ui'
import { Check, ShieldCheck, Sparkles, Zap } from 'lucide-react'

export function PricingTiers() {
  const tiers = [
    {
      name: 'Basic',
      price: '$29',
      description: 'Essential compliance for small operators.',
      features: [
        'Up to 3 properties',
        'Compliance Health Check',
        'Risk Score Engine',
        'Standard Tax Reporting'
      ],
      cta: 'Current Plan',
      variant: 'outline'
    },
    {
      name: 'Pro',
      price: '$79',
      description: 'Full-scale automation for power managers.',
      features: [
        'Unlimited properties',
        'AI Ordinance Summaries',
        'Digital Guest Packet Generator',
        'Priority Alert Feed',
        'White-label Reports'
      ],
      cta: 'Upgrade to Pro',
      variant: 'default',
      popular: true
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tiers.map((tier) => (
        <Card key={tier.name} className={`border-border shadow-sm relative ${tier.popular ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}>
          {tier.popular && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-primary px-3 py-1 text-[10px] uppercase font-black tracking-widest">
              Most Popular
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              {tier.name === 'Pro' ? <Sparkles className="w-5 h-5 text-accent" /> : <ShieldCheck className="w-5 h-5 text-muted-foreground" />}
              {tier.name}
            </CardTitle>
            <CardDescription>{tier.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{tier.price}</span>
              <span className="text-muted-foreground font-medium">/mo</span>
            </div>
            
            <Separator className="opacity-50" />
            
            <ul className="space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-4 h-4 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Button variant={tier.variant as any} className={`w-full font-bold uppercase tracking-widest h-11 ${tier.name === 'Pro' ? 'bg-primary shadow-lg shadow-primary/20' : ''}`}>
              {tier.cta}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
