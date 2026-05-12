// 대시보드 상단 브랜드/설명 헤더를 표시하는 컴포넌트
import { BarChart3 } from 'lucide-react'

export function Header() {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ValueLens Korea</h1>
          <p className="text-sm text-slate-600">
            한국 상장사 재무데이터 기반 S-RIM 밸류에이션 MVP
          </p>
        </div>
      </div>
    </header>
  )
}
