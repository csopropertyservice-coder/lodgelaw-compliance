export const RISK_SCORE_DATA: Record<string, { score: number; label: string; city: string; status: string; alert: string }> = {
  '77002': { score: 85, label: 'High Risk', city: 'Houston', status: 'Mandatory registration display as of Jan 2026.', alert: '$275 annual fee. Houston now enforces license display on all OTAs.' },
  '78701': { score: 92, label: 'Extreme Risk', city: 'Austin', status: 'Strict enforcement. Type 2 licenses heavily restricted.', alert: 'Austin July 1, 2026 transparency rules in effect. $1,058 non-owner fee.' },
  '75201': { score: 45, label: 'Medium Risk', city: 'Dallas', status: 'Zoning enforcement paused due to injunction.', alert: 'Annual registration required, but spacing limits currently suspended.' },
  'DEFAULT': { score: 15, label: 'Low Risk', city: 'Unknown', status: 'Standard state-wide regulations apply.', alert: 'No specific city-level 2026 ordinances detected.' }
}

export function getRiskByZip(zip: string) {
  return RISK_SCORE_DATA[zip] || RISK_SCORE_DATA['DEFAULT']
}

export function checkLicenseVisibility(url: string) {
  // Mock logic for license check
  if (url.includes('airbnb') || url.includes('vrbo')) {
    // In a real app, this would be a scrape/API call
    return {
      isValid: Math.random() > 0.3,
      message: Math.random() > 0.3 ? 'License Number detected in description.' : 'License Number NOT detected. High risk of platform delisting.'
    }
  }
  return { isValid: false, message: 'Invalid OTA URL. Please provide a direct Airbnb or VRBO listing link.' }
}
