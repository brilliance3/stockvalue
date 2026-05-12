// 종목명/코드 검색 결과를 반환하는 서버리스 엔드포인트
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { stockMaster } from '../src/data/stockMaster'
import type { SearchStockResponse } from '../src/types/stock'
import { getQueryParam, sendError } from './_shared'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const q = (getQueryParam(req, 'q') ?? '').trim()
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
  } catch (error) {
    sendError(
      res,
      500,
      '서버 오류가 발생했습니다.',
      error instanceof Error ? error.message : String(error),
    )
  }
}
