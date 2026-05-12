// 핵심 재무/밸류 지표를 카드 단위로 보여주는 컴포넌트
interface MetricCardProps {
  title: string
  value: string
  hint?: string
}

export function MetricCard({ title, value, hint }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  )
}
