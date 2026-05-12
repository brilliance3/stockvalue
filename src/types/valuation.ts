// 밸류에이션 계산 결과와 시나리오 타입을 정의하는 파일
export interface KrxPriceResponse {
  stockCode: string
  market: 'KOSPI' | 'KOSDAQ'
  source?: 'KRX' | 'YAHOO_FALLBACK'
  closePrice: number | null
  marketCap: number | null
  sharesOutstanding: number | null
  date: string
  message?: string
}

export interface ValuationScenario {
  label: '낙관' | '중립' | '비관'
  discountRate: number
  fairPrice: number | null
  upside: number | null
}

export interface ValuationResponse {
  stockCode: string
  currentPrice: number | null
  fairPrice: number | null
  marginOfSafety: number | null
  roe: number | null
  bps: number | null
  requiredReturn: number
  adjustedRequiredReturn: number
  bbbMinusSpread: number
  scenarios: ValuationScenario[]
  warnings: string[]
}
