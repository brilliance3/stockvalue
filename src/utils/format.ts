// 숫자/통화/퍼센트 표시 포맷을 담당하는 유틸 파일
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '데이터 부족'
  }
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function formatCurrency(
  value: number | null | undefined,
  unit = '원',
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '데이터 부족'
  }
  return `${new Intl.NumberFormat('ko-KR').format(Math.round(value))}${unit}`
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '데이터 부족'
  }
  return `${value.toFixed(1)}%`
}
