// OpenDART 계정명을 내부 재무 스키마로 정규화하는 유틸 파일
import type { FinancialRow } from '../types/financial'

const ACCOUNT_NAME_MAP: Record<string, keyof Omit<FinancialRow, 'year'>> = {
  매출액: 'revenue',
  영업이익: 'operatingIncome',
  당기순이익: 'netIncome',
  당기순이익손실: 'netIncome',
  반기순이익: 'netIncome',
  분기순이익: 'netIncome',
  지배기업소유주지분순이익: 'netIncome',
  지배기업의소유주에게귀속되는당기순이익: 'netIncome',
  연결당기순이익: 'netIncome',
  계속영업당기순이익: 'netIncome',
  법인세비용차감후당기순이익: 'netIncome',
  자본총계: 'equity',
  지배기업소유주지분: 'equity',
  기본주당이익: 'eps',
  기본주당순이익: 'eps',
  주당순이익: 'eps',
  주당순자산가치: 'bps',
  주당순자산: 'bps',
}

function normalizeAccountName(name: string): string {
  return name.replace(/\s/g, '').replace(/[(),]/g, '')
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const normalized = value.replace(/,/g, '').trim()
  if (!normalized || normalized === '-' || normalized === 'N/A') return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export interface DartItem {
  bsns_year: string
  account_nm: string
  thstrm_amount?: string
  frmtrm_amount?: string
}

export function normalizeDartFinancials(items: DartItem[]): FinancialRow[] {
  const yearMap = new Map<string, FinancialRow>()

  items.forEach((item) => {
    const mappedKey = ACCOUNT_NAME_MAP[normalizeAccountName(item.account_nm)]
    if (!mappedKey) return

    const year = item.bsns_year
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        year,
        revenue: null,
        operatingIncome: null,
        netIncome: null,
        equity: null,
        eps: null,
        bps: null,
      })
    }

    const row = yearMap.get(year)!
    row[mappedKey] = toNumber(item.thstrm_amount ?? item.frmtrm_amount)
  })

  return Array.from(yearMap.values())
    .sort((a, b) => Number(a.year) - Number(b.year))
    .slice(-5)
}
