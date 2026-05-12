// OpenDART 재무제표를 5개 연도로 정규화해 반환하는 서버리스 엔드포인트
import { stockMaster } from '../src/data/stockMaster'
import { normalizeDartFinancials, type DartItem } from '../src/utils/normalizeDart'
import type { DartFinancialResponse } from '../src/types/financial'
import { getQueryParam, sendError, type ApiRequest, type ApiResponse } from './_shared'

type DartFsType = 'CFS' | 'OFS'

interface DartResponse {
  status: string
  message: string
  list?: DartItem[]
}

async function fetchDartYear(
  apiKey: string,
  corpCode: string,
  year: number,
  fsDiv: DartFsType,
): Promise<DartItem[]> {
  const params = new URLSearchParams({
    crtfc_key: apiKey,
    corp_code: corpCode,
    bsns_year: String(year),
    reprt_code: '11011',
    fs_div: fsDiv,
  })

  const response = await fetch(
    `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?${params.toString()}`,
  )
  const payload = (await response.json()) as DartResponse

  if (!response.ok || payload.status !== '000') {
    return []
  }
  return payload.list ?? []
}

export default async function handler(
  req: ApiRequest,
  res: ApiResponse,
): Promise<void> {
  const apiKey = process.env.OPEN_DART_API_KEY
  if (!apiKey) {
    sendError(
      res,
      400,
      'OPEN_DART_API_KEY가 설정되지 않았습니다.',
      '환경변수에 OPEN_DART_API_KEY를 추가해 주세요.',
    )
    return
  }

  const stockCode = getQueryParam(req, 'stockCode')
  if (!stockCode) {
    sendError(res, 400, 'stockCode 파라미터가 필요합니다.')
    return
  }

  const corpCode =
    getQueryParam(req, 'corpCode') ??
    stockMaster.find((item) => item.code === stockCode)?.corpCode

  if (!corpCode) {
    sendError(res, 404, 'corpCode를 찾지 못했습니다.')
    return
  }

  const currentYear = new Date().getFullYear() - 1
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - (4 - idx))

  try {
    let source: DartFsType = 'CFS'
    let items: DartItem[] = []

    for (const year of years) {
      const annual = await fetchDartYear(apiKey, corpCode, year, 'CFS')
      items.push(...annual)
    }

    if (items.length === 0) {
      source = 'OFS'
      for (const year of years) {
        const annual = await fetchDartYear(apiKey, corpCode, year, 'OFS')
        items.push(...annual)
      }
    }

    const financials = normalizeDartFinancials(items)
    const latest = financials[financials.length - 1]

    const response: DartFinancialResponse = {
      stockCode,
      corpCode,
      source,
      financials,
      warnings: {
        hasDeficit: (latest?.netIncome ?? 0) < 0,
        hasCapitalImpairment: (latest?.equity ?? 0) <= 0,
        hasDataGap: financials.length < 3,
      },
      message: financials.length === 0 ? '재무 데이터를 찾지 못했습니다.' : undefined,
    }

    res.status(200).json(response)
  } catch (error) {
    sendError(res, 500, 'OpenDART 조회 중 오류가 발생했습니다.', String(error))
  }
}
