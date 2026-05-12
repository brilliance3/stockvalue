// 종목코드로 OpenDART corp_code를 조회하는 서버리스 엔드포인트
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stockMaster } from '../src/data/stockMaster'
import { asVercelFetch, getSearchParam, jsonError, jsonOk } from './_shared'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function loadCorpCodeMap(): Promise<Record<string, string>> {
  const filePath = join(__dirname, '..', 'public', 'corpCodeMap.json')
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as Record<string, string>
}

async function handleDartCorpCode(request: Request): Promise<Response> {
  try {
    const stockCode = getSearchParam(request, 'stockCode')
    if (!stockCode) {
      return jsonError(400, 'stockCode 파라미터가 필요합니다.')
    }

    const map = await loadCorpCodeMap()
    const byJson = map[stockCode]
    const byMaster = stockMaster.find((item) => item.code === stockCode)?.corpCode
    const corpCode = byJson ?? byMaster

    if (!corpCode) {
      return jsonError(404, 'corpCode를 찾을 수 없습니다.')
    }

    return jsonOk({ stockCode, corpCode })
  } catch (error) {
    return jsonError(500, 'corpCode 조회에 실패했습니다.', String(error))
  }
}

export default asVercelFetch(handleDartCorpCode)
