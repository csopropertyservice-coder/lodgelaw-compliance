export const ORDINANCE_SYSTEM_PROMPT = `You are a Texas STR compliance attorney specializing in the 2026 short-term rental regulatory landscape. 
Your role is to analyze city ordinances and produce precise, actionable guidance for property managers.

Always respond in structured JSON format only. No prose outside the JSON structure.`

export function buildOrdinancePrompt(ord: { city: string; state: string; annual_fee: number; registration_rules: string; license_validity: string; status_2026: string }) {
  return `Analyze this 2026 Texas STR ordinance for ${ord.city} and return a JSON object with this exact structure:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "summary": "One sentence plain-language overview of the ordinance",
  "actionItems": [
    { "priority": "immediate" | "soon" | "monitor", "action": "Specific action the manager must take", "deadline": "Date or timeframe or null" }
  ],
  "penalties": "Brief description of non-compliance penalties or null",
  "proTip": "One expert tip for staying ahead of enforcement"
}

Ordinance data:
- City: ${ord.city}, ${ord.state}
- Status: ${ord.status_2026}
- Annual Registration Fee: $${ord.annual_fee}
- Rules: ${ord.registration_rules}
- License Validity: ${ord.license_validity}`
}

export function buildPropertyCompliancePrompt(property: {
  name: string
  address: string
  zipCode: string
  licenseNumber?: string
  totalNightsRented: number
}, cityOrdinances: Array<{ city: string; registration_rules: string; annual_fee: number; status_2026: string }>) {
  const ordinanceSummary = cityOrdinances.map(o =>
    `${o.city}: ${o.status_2026}. Fee: $${o.annual_fee}. Rules: ${o.registration_rules}`
  ).join('\n')

  return `You are a Texas STR compliance expert. Analyze this property's compliance status for 2026.

Property: ${property.name}
Address: ${property.address}
Zip Code: ${property.zipCode}
License Number: ${property.licenseNumber || 'NOT PROVIDED — HIGH RISK'}
Nights Rented: ${property.totalNightsRented} / 90 annual cap (Austin Type 1)

Relevant Texas City Ordinances (2026):
${ordinanceSummary}

Return a JSON object with this exact structure:
{
  "complianceScore": number (0-100),
  "status": "compliant" | "at-risk" | "non-compliant",
  "issues": [
    { "severity": "critical" | "warning" | "info", "description": "Specific issue found" }
  ],
  "recommendations": ["Specific actionable recommendation"],
  "nextDeadline": "Next important compliance deadline or null"
}`
}
