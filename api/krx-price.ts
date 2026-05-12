// KRX 시세를 시장별 엔드포인트로 조회하는 서버리스 엔드포인트
import { stockMaster } from '../src/data/stockMaster'
import { normalizeKrxPayload, type RawKrxResponse } from '../src/utils/normalizeKrx'
import type { KrxPriceResponse } from '../src/types/valuation'
import { getQueryParam, sendError, type ApiRequest, type ApiResponse } from './_shared'
import { withJsonHandler } from './withJsonHandler'

function getKrxPathByMarket(market: 'KOSPI' | 'KOSDAQ'): string {
  if (market === 'KOSPI') {
    return process.env.KRX_KOSPI_DAILY_PATH ?? '/sto/stk_bydd_trd'
  }
  return process.env.KRX_KOSDAQ_DAILY_PATH ?? '/sto/ksq_bydd_trd'
}

function toYyyyMmDd(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

function getKrxRows(payload: unknown): RawKrxResponse[] {
  if (Array.isArray(payload)) return payload as RawKrxResponse[]
  if (!payload || typeof payload !== 'object') return []

  const objectPayload = payload as Record<string, unknown>
  const candidates = ['OutBlock_1', 'output', 'data', 'result']
  for (const key of candidates) {
    const value = objectPayload[key]
    if (Array.isArray(value)) return value as RawKrxResponse[]
  }

  return []
}

function matchesStock(row: RawKrxResponse, stockCode: string): boolean {
  const shortCode = row.ISU_SRT_CD?.trim()
  const isuCode = row.ISU_CD?.trim()
  return shortCode === stockCode || isuCode?.includes(stockCode) === true
}

function buildUnavailableResponse(
  stockCode: string,
  market: 'KOSPI' | 'KOSDAQ',
  message: string,
): KrxPriceResponse {
  return {
    stockCode,
    market,
    closePrice: null,
    marketCap: null,
    sharesOutstanding: null,
    date: new Date().toISOString().slice(0, 10),
    message,
  }
}

interface YahooQuoteItem {
  regularMarketPrice?: number
  marketCap?: number
  sharesOutstanding?: number
  regularMarketTime?: number
}

async function fetchYahooFallback(
  stockCode: string,
  market: 'KOSPI' | 'KOSDAQ',
): Promise<KrxPriceResponse | null> {
  const suffix = market === 'KOSPI' ? 'KS' : 'KQ'
  const symbol = `${stockCode}.${suffix}`
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`

  const response = await fetch(url)
  if (!response.ok) return null

  const payload = (await response.json()) as {
    quoteResponse?: { result?: YahooQuoteItem[] }
  }
  const quote = payload.quoteResponse?.result?.[0]
  if (!quote) return null

  const timestamp = quote.regularMarketTime
  const date = timestamp
    ? new Date(timestamp * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  return {
    stockCode,
    market,
    source: 'YAHOO_FALLBACK',
    closePrice: quote.regularMarketPrice ?? null,
    marketCap: quote.marketCap ?? null,
    sharesOutstanding: quote.sharesOutstanding ?? null,
    date,
    message: 'KRX 실패로 Yahoo Finance 보조 시세를 사용했습니다.',
  }
}

async function krxPriceHandler(
  req: ApiRequest,
  res: ApiResponse,
): Promise<void> {
  const stockCode = getQueryParam(req, 'stockCode')
  if (!stockCode) {
    sendError(res, 400, 'stockCode 파라미터가 필요합니다.')
    return
  }

  const selected = stockMaster.find((item) => item.code === stockCode)
  if (!selected) {
    sendError(res, 404, '지원하지 않는 종목코드입니다.')
    return
  }

  const baseUrl = process.env.KRX_API_BASE_URL
  const apiKey = process.env.KRX_API_KEY

  if (!baseUrl || !apiKey) {
    const response = buildUnavailableResponse(
      stockCode,
      selected.market,
      'KRX_API_BASE_URL 또는 KRX_API_KEY가 없어 시세를 조회하지 못했습니다. 환경변수를 설정해 주세요.',
    )
    res.status(200).json(response)
    return
  }

  if (baseUrl.includes('openapi.krx.co.kr')) {
    const response = buildUnavailableResponse(
      stockCode,
      selected.market,
      'KRX_API_BASE_URL이 포털 URL(openapi.krx.co.kr)로 설정되어 있습니다. 실제 데이터 API 베이스 URL로 변경해 주세요. 예: https://data-dbg.krx.co.kr/svc/apis',
    )
    res.status(200).json(response)
    return
  }

  const basDd = getQueryParam(req, 'basDd') ?? toYyyyMmDd(new Date())
  const endpoint = `${baseUrl}${getKrxPathByMarket(selected.market)}?basDd=${basDd}`
  const tryFallbackAndRespond = async (reason: string) => {
    let fallbackError: string | null = null
    try {
      const fallback = await fetchYahooFallback(stockCode, selected.market)
      if (fallback) {
        fallback.message = `${reason} / ${fallback.message}`
        res.status(200).json(fallback)
        return
      }
      fallbackError = 'Yahoo Finance에서 유효한 시세 데이터를 받지 못했습니다.'
    } catch (error) {
      fallbackError = `Yahoo Finance fallback 실패: ${String(error)}`
    }
    const combinedReason = fallbackError ? `${reason} / ${fallbackError}` : reason
    res
      .status(200)
      .json(buildUnavailableResponse(stockCode, selected.market, combinedReason))
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        AUTH_KEY: apiKey,
      },
    })

    if (!response.ok) {
      await tryFallbackAndRespond(
        `KRX 시세 조회 실패(${response.status}). 요청 URL: ${endpoint}`,
      )
      return
    }

    const payload = (await response.json()) as unknown
    const payloadObj = payload as Record<string, unknown>
    if (payloadObj?.respCode && String(payloadObj.respCode) !== '0') {
      await tryFallbackAndRespond(
        `KRX API 응답 오류(${String(payloadObj.respCode)}): ${String(payloadObj.respMsg ?? 'Unknown')}`,
      )
      return
    }

    const rows = getKrxRows(payload)
    const row = rows.find((item) => matchesStock(item, stockCode))

    if (!row) {
      await tryFallbackAndRespond(
        `KRX 응답에서 종목(${stockCode}) 데이터를 찾지 못했습니다. 요청 URL: ${endpoint}`,
      )
      return
    }

    const normalized = normalizeKrxPayload(row)
    const result: KrxPriceResponse = {
      stockCode,
      market: selected.market,
      source: 'KRX',
      closePrice: normalized.closePrice,
      marketCap: normalized.marketCap,
      sharesOutstanding: normalized.sharesOutstanding,
      date: normalized.date,
    }
    res.status(200).json(result)
  } catch (error) {
    await tryFallbackAndRespond(`KRX 연동 중 네트워크 오류가 발생했습니다. ${String(error)}`)
  }
}

export default withJsonHandler(krxPriceHandler)
