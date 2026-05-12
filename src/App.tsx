import { useMemo, useState } from 'react'
import { ErrorState } from './components/ErrorState'
import { FinancialChart } from './components/FinancialChart'
import { FinancialTable } from './components/FinancialTable'
import { Header } from './components/Header'
import { LoadingState } from './components/LoadingState'
import { MetricCard } from './components/MetricCard'
import { ReportBox } from './components/ReportBox'
import { ScenarioTable } from './components/ScenarioTable'
import { StockSearch } from './components/StockSearch'
import { ValuationCard } from './components/ValuationCard'
import type { DartFinancialResponse } from './types/financial'
import type { StockMasterItem } from './types/stock'
import type { KrxPriceResponse, ValuationResponse } from './types/valuation'
import { calculateFinancialMetrics } from './utils/financialMetrics'
import { formatCurrency, formatPercent } from './utils/format'

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? '요청에 실패했습니다.')
  }
  return payload
}

function App() {
  const [keyword, setKeyword] = useState('')
  const [searchItems, setSearchItems] = useState<StockMasterItem[]>([])
  const [selectedStock, setSelectedStock] = useState<StockMasterItem | null>(null)
  const [financialData, setFinancialData] = useState<DartFinancialResponse | null>(null)
  const [priceData, setPriceData] = useState<KrxPriceResponse | null>(null)
  const [valuation, setValuation] = useState<ValuationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useBbbAdjustment, setUseBbbAdjustment] = useState(false)
  const [bbbSpreadInput, setBbbSpreadInput] = useState('1.8')

  const metrics = useMemo(
    () => calculateFinancialMetrics(financialData?.financials ?? []),
    [financialData],
  )

  const handleSearch = async () => {
    if (!keyword.trim()) return
    setSearching(true)
    setError(null)
    try {
      const response = await fetch(`/api/search-stock?q=${encodeURIComponent(keyword)}`)
      const payload = await parseJson<{ items: StockMasterItem[] }>(response)
      setSearchItems(payload.items)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '검색 중 오류가 발생했습니다.')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectStock = async (stock: StockMasterItem) => {
    setSelectedStock(stock)
    setLoading(true)
    setError(null)
    setFinancialData(null)
    setPriceData(null)
    setValuation(null)

    try {
      const [financialResponse, priceResponse] = await Promise.all([
        fetch(`/api/dart-financials?stockCode=${stock.code}&corpCode=${stock.corpCode ?? ''}`),
        fetch(`/api/krx-price?stockCode=${stock.code}`),
      ])

      const financialPayload = await parseJson<DartFinancialResponse>(financialResponse)
      const pricePayload = await parseJson<KrxPriceResponse>(priceResponse)
      setFinancialData(financialPayload)
      setPriceData(pricePayload)

      const valuationResponse = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockCode: stock.code,
          financials: financialPayload.financials,
          price: pricePayload,
          requiredReturn: 8,
          useBbbMinusAdjustment: useBbbAdjustment,
          bbbMinusSpread: Number(bbbSpreadInput) || 0,
        }),
      })
      const valuationPayload = await parseJson<ValuationResponse>(valuationResponse)
      setValuation(valuationPayload)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : '데이터 조회 중 오류가 발생했습니다.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 p-4 md:p-8">
      <Header />

      <StockSearch
        keyword={keyword}
        items={searchItems}
        loading={searching}
        onKeywordChange={setKeyword}
        onSearch={handleSearch}
        onSelect={handleSelectStock}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">할인율 옵션</h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={useBbbAdjustment}
              onChange={(event) => setUseBbbAdjustment(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            BBB- 가산금리 반영
          </label>
          <div className="flex items-center gap-2">
            <input
              value={bbbSpreadInput}
              onChange={(event) => setBbbSpreadInput(event.target.value)}
              className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
              inputMode="decimal"
              disabled={!useBbbAdjustment}
            />
            <span className="text-sm text-slate-600">%p</span>
          </div>
          <p className="text-xs text-slate-500">기본 할인율 8%에 선택적으로 가산됩니다.</p>
        </div>
      </section>

      {selectedStock ? (
        <p className="text-sm text-slate-600">
          선택 종목.
          <span className="font-semibold text-slate-900">
            {' '}
            {selectedStock.name} ({selectedStock.code})
          </span>
        </p>
      ) : null}

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {selectedStock && financialData && valuation ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <MetricCard title="매출액" value={formatCurrency(metrics.latestRevenue)} />
            <MetricCard title="영업이익" value={formatCurrency(metrics.latestOperatingIncome)} />
            <MetricCard title="ROE" value={formatPercent(metrics.roe)} />
            <MetricCard title="현재가" value={formatCurrency(priceData?.closePrice ?? null)} />
            <MetricCard
              title="적용 할인율"
              value={`${valuation.adjustedRequiredReturn.toFixed(2)}%`}
            />
            <MetricCard
              title="안전마진"
              value={formatPercent(valuation.marginOfSafety)}
              hint="중립 시나리오 기준"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FinancialChart financials={financialData.financials} />
            </div>
            <ValuationCard valuation={valuation} />
          </section>

          <FinancialTable financials={financialData.financials} />
          <ScenarioTable scenarios={valuation.scenarios} />

          {valuation.warnings.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {valuation.warnings.join(' / ')}
            </div>
          ) : null}

          <ReportBox stock={selectedStock} valuation={valuation} />
        </>
      ) : null}
    </main>
  )
}

export default App
