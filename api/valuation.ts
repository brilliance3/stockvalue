// 재무데이터와 시세를 기반으로 S-RIM 가치를 계산하는 서버리스 엔드포인트
import type { FinancialRow } from '../src/types/financial'
import type { BbbYieldSource, KrxPriceResponse, ValuationResponse } from '../src/types/valuation'
import { calculateFinancialMetrics } from '../src/utils/financialMetrics'
import {
  methodologyWarnings,
  normalizeYieldPercentInput,
  percentToRDecimal,
} from '../src/utils/requiredReturnR'
import { calculateSrim } from '../src/utils/srim'
import { jsonError, jsonOk, runWithJsonCatch } from './_shared'

interface ValuationRequestBody {
  stockCode?: string
  financials?: FinancialRow[]
  price?: KrxPriceResponse
  requiredReturn?: number
  useBbbMinusAdjustment?: boolean
  bbbMinusSpread?: number
  bbbMinusYield?: number
  /** 금투협(kofiabond) 1순위·KAP 보조·추정 대체 */
  bbbYieldSource?: BbbYieldSource
}

async function readJsonBody(request: Request): Promise<ValuationRequestBody | Response> {
  try {
    const body = (await request.json()) as ValuationRequestBody
    return body ?? {}
  } catch {
    return jsonError(400, '요청 본문(JSON)을 해석할 수 없습니다.')
  }
}

async function handleValuation(request: Request): Promise<Response> {
  const bodyOrErr = await readJsonBody(request)
  if (bodyOrErr instanceof Response) {
    return bodyOrErr
  }
  const body = bodyOrErr

  const stockCode = body.stockCode
  const financials = body.financials ?? []
  const price = body.price
  const requiredReturn = body.requiredReturn ?? 8
  const useBbbMinusAdjustment = body.useBbbMinusAdjustment ?? false
  const bbbMinusSpread = body.bbbMinusSpread ?? 0
  const rawBbbYield = body.bbbMinusYield
  const bbbYieldSource: BbbYieldSource = body.bbbYieldSource ?? 'kofia'
  const normalizedBbbYield =
    rawBbbYield !== undefined && rawBbbYield !== null
      ? normalizeYieldPercentInput(Number(rawBbbYield))
      : null
  const adjustedRequiredReturn = useBbbMinusAdjustment
    ? normalizedBbbYield ?? requiredReturn + bbbMinusSpread
    : requiredReturn
  const rDecimal = percentToRDecimal(adjustedRequiredReturn)

  if (!stockCode) {
    return jsonError(400, 'stockCode가 필요합니다.')
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
    warnings.push(...methodologyWarnings(bbbYieldSource, adjustedRequiredReturn, rDecimal))
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
    bbbMinusSpread: useBbbMinusAdjustment ? adjustedRequiredReturn - requiredReturn : 0,
    scenarios: srim.scenarios,
    warnings,
  }

  return jsonOk(result)
}

export async function POST(request: Request): Promise<Response> {
  return runWithJsonCatch(handleValuation, request)
}
