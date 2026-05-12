// 연도별 주요 재무 항목을 표 형태로 보여주는 컴포넌트
import type { FinancialRow } from '../types/financial'
import { formatNumber } from '../utils/format'

interface FinancialTableProps {
  financials: FinancialRow[]
}

export function FinancialTable({ financials }: FinancialTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">재무제표 요약</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-3 py-2 text-left">연도</th>
              <th className="px-3 py-2 text-right">매출액</th>
              <th className="px-3 py-2 text-right">영업이익</th>
              <th className="px-3 py-2 text-right">순이익</th>
              <th className="px-3 py-2 text-right">자본총계</th>
              <th className="px-3 py-2 text-right">BPS</th>
            </tr>
          </thead>
          <tbody>
            {financials.map((row) => (
              <tr key={row.year} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{row.year}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.revenue)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.operatingIncome)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.netIncome)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.equity)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.bps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
