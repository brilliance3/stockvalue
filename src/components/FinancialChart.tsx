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

export function FinancialChart({ financials }: FinancialChartProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">재무 추이 차트</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
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
