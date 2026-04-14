// ============================================================
// LodgeLaw — Hotel Occupancy Tax (HOT) Calculator
// Texas 2026 rates — easy to edit per city
// ============================================================

export interface TaxRates {
  state: number      // Texas state HOT — always 6%
  city: number       // Local city rate — varies
  total: number      // Combined
  label: string      // Display name
}

// Edit these rates per city as needed
export const CITY_TAX_RATES: Record<string, TaxRates> = {
  austin: {
    state: 0.06,
    city: 0.09,
    total: 0.15,
    label: 'Austin',
  },
  houston: {
    state: 0.06,
    city: 0.07,
    total: 0.13,
    label: 'Houston',
  },
  dallas: {
    state: 0.06,
    city: 0.07,
    total: 0.13,
    label: 'Dallas',
  },
  san_antonio: {
    state: 0.06,
    city: 0.09,
    total: 0.15,
    label: 'San Antonio',
  },
  other: {
    state: 0.06,
    city: 0.09,
    total: 0.15,
    label: 'Other TX City',
  },
}

export interface TaxBreakdown {
  grossRevenue: number
  platformFees: number
  taxableRevenue: number
  stateTax: number
  cityTax: number
  totalTax: number
  effectiveRate: number
  rates: TaxRates
}

export function calculateHOT(
  grossRevenue: number,
  platformFees: number,
  city: string
): TaxBreakdown {
  const rates = CITY_TAX_RATES[city] ?? CITY_TAX_RATES.other
  const taxableRevenue = Math.max(0, grossRevenue - platformFees)
  const stateTax = taxableRevenue * rates.state
  const cityTax = taxableRevenue * rates.city
  const totalTax = taxableRevenue * rates.total
  const effectiveRate = grossRevenue > 0 ? (totalTax / grossRevenue) * 100 : 0

  return {
    grossRevenue,
    platformFees,
    taxableRevenue,
    stateTax,
    cityTax,
    totalTax,
    effectiveRate,
    rates,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function getMonthLabel(monthYear: string): string {
  const [year, month] = monthYear.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
