// API 응답이 JSON이 아닐 때(버셀 오류 페이지 등) 파싱 실패를 피하고 메시지를 만드는 유틸

export interface ApiErrorPayload {
  error?: boolean
  message?: string
  details?: unknown
}

export async function parseApiJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  const trimmed = text.trim()
  let payload: unknown
  try {
    payload = trimmed ? JSON.parse(trimmed) : {}
  } catch {
    const preview = trimmed.slice(0, 160)
    throw new Error(
      preview
        ? `서버가 JSON이 아닌 응답을 반환했습니다(${response.status}). ${preview}`
        : `서버 응답이 비어 있거나 JSON이 아닙니다(${response.status}).`,
    )
  }

  const obj = payload as T & ApiErrorPayload
  if (!response.ok) {
    throw new Error(obj.message ?? `요청에 실패했습니다(${response.status}).`)
  }
  return obj as T
}
