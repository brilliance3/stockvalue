// 밸류에이션 핵심 결과를 요약 카드로 보여주는 컴포넌트
import type { ValuationResponse } from '../types/valuation'
import { formatCurrency, formatPercent } from '../utils/format'

interface ValuationCardProps {
  valuation: ValuationResponse
}

export function ValuationCard({ valuation }: ValuationCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">S-RIM 평가 요약</h2>
      <dl className="grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">현재가</dt>
          <dd className="font-semibold text-slate-900">
            {formatCurrency(valuation.currentPrice)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">적정가</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(valuation.fairPrice)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">안전마진</dt>
          <dd className="font-semibold text-slate-900">
            {formatPercent(valuation.marginOfSafety)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
