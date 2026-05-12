// KRX 응답 필드를 프론트 공통 스키마로 정규화하는 유틸 파일
export interface RawKrxResponse {
  ISU_SRT_CD?: string
  ISU_CD?: string
  TDD_CLSPRC?: string | number
  TDD_CLSPRC_VAL?: string | number
  MKTCAP?: string | number
  MKT_CAP?: string | number
  LIST_SHRS?: string | number
  LISTED_SHARES?: string | number
  BAS_DD?: string
  TRD_DD?: string
  close?: string | number
  marketCap?: string | number
  listedShares?: string | number
  date?: string
}

export interface NormalizedKrx {
  closePrice: number | null
  marketCap: number | null
  sharesOutstanding: number | null
  date: string
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(value.replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeKrxPayload(payload: RawKrxResponse): NormalizedKrx {
  const close = payload.TDD_CLSPRC ?? payload.TDD_CLSPRC_VAL ?? payload.close
  const marketCap = payload.MKTCAP ?? payload.MKT_CAP ?? payload.marketCap
  const listedShares = payload.LIST_SHRS ?? payload.LISTED_SHARES ?? payload.listedShares
  const date = payload.BAS_DD ?? payload.TRD_DD ?? payload.date

  return {
    closePrice: toNumber(close),
    marketCap: toNumber(marketCap),
    sharesOutstanding: toNumber(listedShares),
    date: date ?? new Date().toISOString().slice(0, 10),
  }
}
