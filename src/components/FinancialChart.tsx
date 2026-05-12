// 최근 5개 연도 매출/영업이익 추이를 시각화하는 차트 컴포넌트
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { FinancialRow } from '../types/financial'

interface FinancialChartProps {
  financials: FinancialRow[]
}

/** h-72와 동일(288px). ResponsiveContainer가 % 높이로 -1 측정되는 것을 피함 */
const CHART_HEIGHT_PX = 288

export function FinancialChart({ financials }: FinancialChartProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">재무 추이 차트</h2>
      <div className="min-h-0 w-full min-w-0" style={{ height: CHART_HEIGHT_PX }}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX} minWidth={0}>
          <LineChart data={financials}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" name="매출액" />
            <Line
              type="monotone"
              dataKey="operatingIncome"
              stroke="#0ea5e9"
              name="영업이익"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
