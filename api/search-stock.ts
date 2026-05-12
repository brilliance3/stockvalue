// 종목명/코드 검색 결과를 반환하는 서버리스 엔드포인트
import { stockMaster } from '../src/data/stockMaster'
import type { SearchStockResponse } from '../src/types/stock'
import { getSearchParam, jsonError, jsonOk, runWithJsonCatch } from './_shared'

async function handleSearch(request: Request): Promise<Response> {
  const q = (getSearchParam(request, 'q') ?? '').trim()
  if (!q) {
    return jsonError(400, '검색어(q)를 입력해 주세요.')
  }

  const normalized = q.toLowerCase()
  const items = stockMaster
    .filter((item) => item.name.includes(q) || item.code.includes(normalized))
    .slice(0, 20)

  const response: SearchStockResponse = { items }
  return jsonOk(response)
}

export async function GET(request: Request): Promise<Response> {
  return runWithJsonCatch(handleSearch, request)
}
