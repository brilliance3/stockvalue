// OpenDART 재무제표를 5개 연도로 정규화해 반환하는 서버리스 엔드포인트
import { stockMaster } from '../src/data/stockMaster'
import { normalizeDartFinancials, type DartItem } from '../src/utils/normalizeDart'
import type { DartFinancialResponse } from '../src/types/financial'
import { asVercelFetch, getSearchParam, jsonError, jsonOk } from './_shared'

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

async function handleDartFinancials(request: Request): Promise<Response> {
  const apiKey = process.env.OPEN_DART_API_KEY
  if (!apiKey) {
    return jsonError(
      400,
      'OPEN_DART_API_KEY가 설정되지 않았습니다.',
      '환경변수에 OPEN_DART_API_KEY를 추가해 주세요.',
    )
  }

  const stockCode = getSearchParam(request, 'stockCode')
  if (!stockCode) {
    return jsonError(400, 'stockCode 파라미터가 필요합니다.')
  }

  const corpCode =
    getSearchParam(request, 'corpCode') ??
    stockMaster.find((item) => item.code === stockCode)?.corpCode

  if (!corpCode) {
    return jsonError(404, 'corpCode를 찾지 못했습니다.')
  }

  const currentYear = new Date().getFullYear() - 1
  const years = Array.from({ length: 5 }, (_, idx) => currentYear - (4 - idx))

  try {
    let source: DartFsType = 'CFS'
    const items: DartItem[] = []

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

    return jsonOk(response)
  } catch (error) {
    return jsonError(500, 'OpenDART 조회 중 오류가 발생했습니다.', String(error))
  }
}

export default asVercelFetch(handleDartFinancials)
