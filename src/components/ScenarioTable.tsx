// 낙관/중립/비관 S-RIM 시나리오를 표로 보여주는 컴포넌트
import type { ValuationScenario } from '../types/valuation'
import { formatCurrency, formatPercent } from '../utils/format'

interface ScenarioTableProps {
  scenarios: ValuationScenario[]
}

export function ScenarioTable({ scenarios }: ScenarioTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">S-RIM 시나리오</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="px-3 py-2 text-left">시나리오</th>
            <th className="px-3 py-2 text-right">할인율</th>
            <th className="px-3 py-2 text-right">적정가</th>
            <th className="px-3 py-2 text-right">상승여력</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => (
            <tr key={scenario.label} className="border-b border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-800">{scenario.label}</td>
              <td className="px-3 py-2 text-right">{scenario.discountRate}%</td>
              <td className="px-3 py-2 text-right">{formatCurrency(scenario.fairPrice)}</td>
              <td className="px-3 py-2 text-right">{formatPercent(scenario.upside)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">
        낙관·비관 열의 할인율은 시나리오용 가정(%)이며, 채권 만기와 무관합니다. 요구수익률 r은 5년 만기·무보증·BBB- 회사채 수익률로 별도
        확정하는 것을 원칙으로 합니다.
      </p>
    </section>
  )
}
