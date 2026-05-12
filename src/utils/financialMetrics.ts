// 재무 데이터에서 핵심 지표를 계산하는 유틸 파일
import type { FinancialRow } from '../types/financial'

export interface FinancialMetrics {
  latestRevenue: number | null
  latestOperatingIncome: number | null
  latestNetIncome: number | null
  latestEquity: number | null
  roe: number | null
  operatingMargin: number | null
}

export function calculateFinancialMetrics(
  financials: FinancialRow[],
): FinancialMetrics {
  const latest = financials[financials.length - 1]

  if (!latest) {
    return {
      latestRevenue: null,
      latestOperatingIncome: null,
      latestNetIncome: null,
      latestEquity: null,
      roe: null,
      operatingMargin: null,
    }
  }

  const roe =
    latest.netIncome !== null &&
    latest.equity !== null &&
    latest.equity !== 0
      ? (latest.netIncome / latest.equity) * 100
      : null

  const operatingMargin =
    latest.operatingIncome !== null &&
    latest.revenue !== null &&
    latest.revenue !== 0
      ? (latest.operatingIncome / latest.revenue) * 100
      : null

  return {
    latestRevenue: latest.revenue,
    latestOperatingIncome: latest.operatingIncome,
    latestNetIncome: latest.netIncome,
    latestEquity: latest.equity,
    roe,
    operatingMargin,
  }
}
