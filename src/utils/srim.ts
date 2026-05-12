// S-RIM 적정가/시나리오 계산을 담당하는 유틸 파일
import type { ValuationScenario } from '../types/valuation'

export interface SrimInput {
  bps: number | null
  roe: number | null
  requiredReturn?: number
  currentPrice: number | null
}

export interface SrimResult {
  fairPrice: number | null
  marginOfSafety: number | null
  scenarios: ValuationScenario[]
}

function calcFairPrice(
  bps: number | null,
  roe: number | null,
  discountRate: number,
): number | null {
  if (bps === null || roe === null) return null
  return bps * (roe / discountRate)
}

function calcUpside(
  fairPrice: number | null,
  currentPrice: number | null,
): number | null {
  if (fairPrice === null || currentPrice === null || currentPrice === 0) {
    return null
  }
  return ((fairPrice - currentPrice) / currentPrice) * 100
}

export function calculateSrim({
  bps,
  roe,
  requiredReturn = 8,
  currentPrice,
}: SrimInput): SrimResult {
  const fairPrice = calcFairPrice(bps, roe, requiredReturn)
  const marginOfSafety = calcUpside(fairPrice, currentPrice)

  const scenarios: ValuationScenario[] = [
    { label: '낙관', discountRate: 7, fairPrice: calcFairPrice(bps, roe, 7), upside: null },
    { label: '중립', discountRate: requiredReturn, fairPrice, upside: null },
    { label: '비관', discountRate: 10, fairPrice: calcFairPrice(bps, roe, 10), upside: null },
  ] satisfies ValuationScenario[]

  const calculatedScenarios = scenarios.map((scenario) => ({
    ...scenario,
    upside: calcUpside(scenario.fairPrice, currentPrice),
  }))

  return {
    fairPrice,
    marginOfSafety,
    scenarios: calculatedScenarios,
  }
}
