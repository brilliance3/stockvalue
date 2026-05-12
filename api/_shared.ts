// 서버리스 API 공통: Web Request 로직과 Vercel Node 진입점을 연결하는 유틸

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
  url?: string
  headers?: Record<string, string | string[] | undefined>
}

export interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (payload: unknown) => void
  setHeader?: (key: string, value: string) => void
  send?: (payload: string) => void
  end?: (payload?: string) => void
}

function buildRequestUrl(req: ApiRequest): string {
  const rawUrl = req.url ?? '/'
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl
  }
  return `https://vercel.local${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`
}

function buildRequestHeaders(req: ApiRequest): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers ?? {})) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '))
    } else if (value !== undefined) {
      headers.set(key, value)
    }
  }
  return headers
}

function buildRequestBody(req: ApiRequest): BodyInit | null {
  if (req.body === undefined || req.body === null) return null
  if (typeof req.body === 'string') return req.body
  return JSON.stringify(req.body)
}

function toWebRequest(req: ApiRequest): Request {
  const method = (req.method ?? 'GET').toUpperCase()
  const init: RequestInit = {
    method,
    headers: buildRequestHeaders(req),
  }

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = buildRequestBody(req)
  }

  return new Request(buildRequestUrl(req), init)
}

async function sendWebResponse(res: ApiResponse, response: Response): Promise<void> {
  response.headers.forEach((value, key) => {
    res.setHeader?.(key, value)
  })

  const text = await response.text()
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    res.status(response.status).json(text ? JSON.parse(text) : {})
    return
  }

  res.status(response.status)
  if (res.send) {
    res.send(text)
  } else {
    res.end?.(text)
  }
}

export async function runVercelFunction(
  req: ApiRequest,
  res: ApiResponse,
  allowedMethods: string[],
  handler: (request: Request) => Promise<Response>,
): Promise<void> {
  const method = (req.method ?? 'GET').toUpperCase()
  if (!allowedMethods.includes(method)) {
    res.setHeader?.('Allow', allowedMethods.join(', '))
    res.status(405).json({ error: true, message: '허용되지 않은 메서드입니다.' })
    return
  }

  const response = await runWithJsonCatch(handler, toWebRequest(req))
  await sendWebResponse(res, response)
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
