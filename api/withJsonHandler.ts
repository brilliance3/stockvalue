// 서버리스 핸들러 미처리 예외 시에도 JSON 본문으로 응답하도록 감싸는 헬퍼
import { sendError, type ApiRequest, type ApiResponse } from './_shared'

export function withJsonHandler(
  fn: (req: ApiRequest, res: ApiResponse) => void | Promise<void>,
) {
  return async (req: ApiRequest, res: ApiResponse): Promise<void> => {
    try {
      await Promise.resolve(fn(req, res))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      try {
        sendError(res, 500, '서버 오류가 발생했습니다.', message)
      } catch {
        /* 응답 이미 전송됨 */
      }
    }
  }
}
