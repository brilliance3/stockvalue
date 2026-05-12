// 종목 검색과 선택을 처리하는 입력/결과 리스트 컴포넌트
import { Search } from 'lucide-react'
import type { StockMasterItem } from '../types/stock'

interface StockSearchProps {
  keyword: string
  items: StockMasterItem[]
  loading: boolean
  onKeywordChange: (value: string) => void
  onSearch: () => void
  onSelect: (item: StockMasterItem) => void
}

export function StockSearch({
  keyword,
  items,
  loading,
  onKeywordChange,
  onSearch,
  onSelect,
}: StockSearchProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">종목 검색</h2>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSearch()
            }}
            placeholder="예: 삼성전자, 005930"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none ring-indigo-200 focus:ring"
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          검색
        </button>
      </div>

      <ul className="mt-4 grid gap-2">
        {loading && <li className="text-sm text-slate-500">검색 중입니다.</li>}
        {!loading &&
          items.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-900">{item.name}</span>
                <span className="text-xs text-slate-500">
                  {item.code} · {item.market}
                </span>
              </button>
            </li>
          ))}
      </ul>
    </section>
  )
}
