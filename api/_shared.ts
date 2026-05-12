// 서버리스 API 공통: @vercel/node 요청/응답 헬퍼
import type { VercelRequest, VercelResponse } from '@vercel/node'

export function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const value = req.query[key]
  if (Array.isArray(value)) return value[0]
  if (value === undefined || value === '') return undefined
  return String(value)
}

export function sendError(
  res: VercelResponse,
  statusCode: number,
  message: string,
  details?: unknown,
): void {
  if (res.headersSent) return
  res.status(statusCode).json({ error: true, message, details })
}
