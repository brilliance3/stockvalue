// 투자 메모 형태의 템플릿 리포트를 출력하는 컴포넌트
import type { StockMasterItem } from '../types/stock'
import type { ValuationResponse } from '../types/valuation'
import { formatCurrency, formatPercent } from '../utils/format'

interface ReportBoxProps {
  stock: StockMasterItem
  valuation: ValuationResponse
}

export function ReportBox({ stock, valuation }: ReportBoxProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">템플릿 리포트</h2>
      <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
        {`${stock.name}(${stock.code})의 중립 시나리오 적정가는 ${formatCurrency(valuation.fairPrice)}입니다.
현재가는 ${formatCurrency(valuation.currentPrice)}로 계산되며, 안전마진은 ${formatPercent(valuation.marginOfSafety)}입니다.
본 결과는 OpenDART/KRX 공시 데이터와 S-RIM 단순 모델을 기반으로 산출되어, 실제 투자 의사결정 전 추가 검증이 필요합니다.`}
      </p>
    </section>
  )
}
