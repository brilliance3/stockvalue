// 서버리스 API에서 공통 응답/유틸을 제공하는 헬퍼
export interface ApiRequest {
  query?: Record<string, string | string[] | undefined>
  body?: unknown
  method?: string
}

export interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (payload: unknown) => void
}

export function getQueryParam(
  req: ApiRequest,
  key: string,
): string | undefined {
  const value = req.query?.[key]
  if (Array.isArray(value)) return value[0]
  return value
}

export function sendError(
  res: ApiResponse,
  statusCode: number,
  message: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    error: true,
    message,
    details,
  })
}
