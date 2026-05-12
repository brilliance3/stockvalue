// 서버리스 API 공통: Vercel Web 표준(Request/Response) + 레거시 타입(로컬 도구용)

/** Vercel Functions(Web)에서 쿼리스트링 읽기 */
export function getSearchParam(request: Request, key: string): string | undefined {
  const url = new URL(request.url)
  const raw = url.searchParams.get(key)
  if (raw === null || raw === '') return undefined
  return raw
}

export function jsonOk(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export function jsonError(status: number, message: string, details?: unknown): Response {
  return Response.json({ error: true, message, details }, { status })
}

/** Vercel이 정적 분석할 수 있도록 GET/POST 본문에서 직접 호출 */
export async function runWithJsonCatch(
  handler: (request: Request) => Promise<Response>,
  request: Request,
): Promise<Response> {
  try {
    return await handler(request)
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    return jsonError(500, '서버 오류가 발생했습니다.', details)
  }
}

/** @deprecated default { fetch } 리터럴 대신 GET/POST export 사용 */
export function asVercelFetch(handler: (request: Request) => Promise<Response>) {
  return {
    async fetch(request: Request): Promise<Response> {
      return runWithJsonCatch(handler, request)
    },
  }
}

/** @deprecated 로컬 타입 호환용 — 신규 코드는 Request + getSearchParam 사용 */
export interface ApiRequest {
  query?: Record<string, string | string[] | undefined>
  body?: unknown
  method?: string
}

export interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (payload: unknown) => void
}

export function getQueryParam(req: ApiRequest, key: string): string | undefined {
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
