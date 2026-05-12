// 재무제표 응답과 경고 상태 타입을 정의하는 파일
export interface FinancialRow {
  year: string
  revenue: number | null
  operatingIncome: number | null
  netIncome: number | null
  equity: number | null
  eps: number | null
  bps: number | null
}

export interface FinancialWarnings {
  hasDeficit: boolean
  hasCapitalImpairment: boolean
  hasDataGap: boolean
}

export interface DartFinancialResponse {
  stockCode: string
  corpCode: string
  source: 'CFS' | 'OFS'
  financials: FinancialRow[]
  warnings: FinancialWarnings
  message?: string
}
