// 종목명/코드 검색 결과를 반환하는 서버리스 엔드포인트
import { stockMaster } from '../src/data/stockMaster'
import type { SearchStockResponse } from '../src/types/stock'
import { getQueryParam, sendError, type ApiRequest, type ApiResponse } from './_shared'

export default function handler(req: ApiRequest, res: ApiResponse): void {
  const q = getQueryParam(req, 'q')?.trim() ?? ''
  if (!q) {
    sendError(res, 400, '검색어(q)를 입력해 주세요.')
    return
  }

  const normalized = q.toLowerCase()
  const items = stockMaster
    .filter((item) => item.name.includes(q) || item.code.includes(normalized))
    .slice(0, 20)

  const response: SearchStockResponse = { items }
  res.status(200).json(response)
}
