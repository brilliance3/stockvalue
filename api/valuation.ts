// 재무데이터와 시세를 기반으로 S-RIM 가치를 계산하는 서버리스 엔드포인트
import type { FinancialRow } from '../src/types/financial'
import type { KrxPriceResponse, ValuationResponse } from '../src/types/valuation'
import { calculateFinancialMetrics } from '../src/utils/financialMetrics'
import { calculateSrim } from '../src/utils/srim'
import { sendError, type ApiRequest, type ApiResponse } from './_shared'

interface ValuationRequestBody {
  stockCode?: string
  financials?: FinancialRow[]
  price?: KrxPriceResponse
  requiredReturn?: number
  useBbbMinusAdjustment?: boolean
  bbbMinusSpread?: number
}

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method && req.method.toUpperCase() !== 'POST') {
    sendError(res, 405, 'POST 메서드만 지원합니다.')
    return
  }

  const body = (req.body ?? {}) as ValuationRequestBody
  const stockCode = body.stockCode
  const financials = body.financials ?? []
  const price = body.price
  const requiredReturn = body.requiredReturn ?? 8
  const useBbbMinusAdjustment = body.useBbbMinusAdjustment ?? false
  const bbbMinusSpread = body.bbbMinusSpread ?? 0
  const adjustedRequiredReturn = useBbbMinusAdjustment
    ? requiredReturn + bbbMinusSpread
    : requiredReturn

  if (!stockCode) {
    sendError(res, 400, 'stockCode가 필요합니다.')
    return
  }

  const metrics = calculateFinancialMetrics(financials)
  const latest = financials[financials.length - 1]

  const bps =
    latest?.bps ??
    (latest?.equity !== null &&
    latest?.equity !== undefined &&
    price?.sharesOutstanding !== null &&
    price?.sharesOutstanding !== undefined &&
    price.sharesOutstanding > 0
      ? latest.equity / price.sharesOutstanding
      : null)
  const roe = metrics.roe
  const currentPrice = price?.closePrice ?? null
  const srim = calculateSrim({
    bps,
    roe,
    requiredReturn: adjustedRequiredReturn,
    currentPrice,
  })

  const warnings: string[] = []
  if ((metrics.latestNetIncome ?? 0) < 0) warnings.push('최근 순이익이 적자입니다.')
  if ((metrics.latestEquity ?? 0) <= 0) warnings.push('자본잠식 가능성이 있습니다.')
  if (financials.length < 3) warnings.push('재무 데이터가 부족해 추정 오차가 큽니다.')
  if (currentPrice === null) warnings.push('현재 주가가 없어 상승여력 계산이 제한됩니다.')
  if (latest?.bps === null || latest?.bps === undefined) {
    warnings.push('BPS 직접 공시값이 없어 자본총계/발행주식수로 대체 계산했습니다.')
  }
  if (useBbbMinusAdjustment) {
    warnings.push(`BBB- 가산금리(${bbbMinusSpread.toFixed(2)}%p)를 할인율에 반영했습니다.`)
  }

  const result: ValuationResponse = {
    stockCode,
    currentPrice,
    fairPrice: srim.fairPrice,
    marginOfSafety: srim.marginOfSafety,
    roe,
    bps,
    requiredReturn,
    adjustedRequiredReturn,
    bbbMinusSpread: useBbbMinusAdjustment ? bbbMinusSpread : 0,
    scenarios: srim.scenarios,
    warnings,
  }

  res.status(200).json(result)
}
