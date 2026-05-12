// 밸류에이션 계산 결과와 시나리오 타입을 정의하는 파일

/** BBB- 5년 요구수익률 입력 시 사용자가 값을 가져온 출처(안내·경고 문구용) */
export type BbbYieldSource = 'kofia' | 'kap' | 'estimate'

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
