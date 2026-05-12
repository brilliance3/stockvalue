// 요구수익률 r(%) 정규화 및 금투협·KAP 조회 우선순위·검증 문구를 모은 유틸

import type { BbbYieldSource } from '../types/valuation'

/** 금투협 채권정보센터(kofiabond.or.kr) 시가평가 기준 1순위 안내 */
export const R_SOURCE_KOFIA_GUIDE =
  '1순위. 금융투자협회 채권정보센터(kofiabond.or.kr) → 시가평가 → 채권시가평가기준수익률 → 공모회사채 또는 회사채, 무보증, 등급 BBB-, 만기 5년.'

/** 한국자산평가(KAP) 채권금리 기준수익률 보조 출처 안내 */
export const R_SOURCE_KAP_GUIDE =
  '2순위(보조). 한국자산평가(KAP) 채권금리 기준수익률 → 공모회사채 → 무보증 → BBB- → 5년.'

export const R_MATURITY_WARNING =
  '회사채(무보증 3년) BBB- 등 3년 만기 최종호가수익률은 5년 S-RIM 요구수익률 r로 바로 쓰지 말 것. 반드시 만기 5년·등급 BBB-·무보증인지 확인할 것.'

const ESTIMATE_FALLBACK_MIN = 8
const ESTIMATE_FALLBACK_MAX = 9

/**
 * 화면/API에서 넘어온 값을 "퍼센트 포인트" 숫자로 통일한다.
 * 공시표가 %일 때 8.72 → 내부 계산용 소수는 percentToRDecimal(8.72).
 * 사용자가 실수로 소수(0.0872)만 입력한 경우 8.72%로 본다.
 */
export function normalizeYieldPercentInput(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return (ESTIMATE_FALLBACK_MIN + ESTIMATE_FALLBACK_MAX) / 2
  }
  if (value > 0 && value < 1) {
    return value * 100
  }
  return value
}

export function percentToRDecimal(percentPoints: number): number {
  return percentPoints / 100
}

/** 공식 확인 불가 시 보수적 대역 내 기본값(%) */
export function defaultEstimateYieldPercent(): number {
  return (ESTIMATE_FALLBACK_MIN + ESTIMATE_FALLBACK_MAX) / 2
}

export function methodologyWarnings(
  source: BbbYieldSource,
  yieldPercent: number,
  rDecimal: number,
): string[] {
  const pct = yieldPercent.toFixed(2)
  const rStr = rDecimal.toFixed(4)
  const base = [
    R_MATURITY_WARNING,
    `요구수익률 r은 만기 5년·무보증·BBB- 회사채 기준 수익률 원칙. 계산식에 사용한 r=${rStr}(${pct}%).`,
  ]

  if (source === 'kofia') {
    return [
      ...base,
      `조회 출처(사용자 선택). ${R_SOURCE_KOFIA_GUIDE}`,
      '금투협 표가 %면 위 입력값은 % 단위이며, 계산 시 소수 r로 변환해 사용함.',
    ]
  }
  if (source === 'kap') {
    return [
      ...base,
      `조회 출처(사용자 선택). ${R_SOURCE_KAP_GUIDE}`,
      '금투협에서 5년 BBB-를 직접 확인하지 못한 경우의 보조 출처로만 사용하는 것을 권장함.',
    ]
  }
  return [
    ...base,
    `공식 값을 확인하지 못해 보수적으로 ${pct}%를 적용했다(r=${rStr}).`,
    `시장 금리 급변 시에는 최신 검색·공시 수치를 우선 검토할 것. 대체값 기본 대역은 ${ESTIMATE_FALLBACK_MIN}%~${ESTIMATE_FALLBACK_MAX}% 안에서 선택하는 것을 권장함.`,
    `원천 재확인은 금투협 채권정보센터 또는 KAP 채권금리 기준수익률에서 만기 5년·무보증·BBB-를 다시 확인할 것.`,
  ]
}
