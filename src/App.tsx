import { useEffect, useMemo, useState } from 'react'
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
import type { BbbYieldSource, KrxPriceResponse, ValuationResponse } from './types/valuation'
import { calculateFinancialMetrics } from './utils/financialMetrics'
import { formatCurrency, formatPercent } from './utils/format'
import { parseApiJson } from './utils/parseApiJson'
import {
  R_MATURITY_WARNING,
  R_SOURCE_KAP_GUIDE,
  R_SOURCE_KOFIA_GUIDE,
} from './utils/requiredReturnR'

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
  const [bbbYieldSource, setBbbYieldSource] = useState<BbbYieldSource>('kofia')
  const [bbbYieldInput, setBbbYieldInput] = useState('8.5')

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
      const payload = await parseApiJson<{ items: StockMasterItem[] }>(response)
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

      const financialPayload = await parseApiJson<DartFinancialResponse>(financialResponse)
      const pricePayload = await parseApiJson<KrxPriceResponse>(priceResponse)
      setFinancialData(financialPayload)
      setPriceData(pricePayload)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : '데이터 조회 중 오류가 발생했습니다.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedStock || !financialData || !priceData) return
    let cancelled = false
    ;(async () => {
      try {
        const valuationResponse = await fetch('/api/valuation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stockCode: selectedStock.code,
            financials: financialData.financials,
            price: priceData,
            requiredReturn: 8,
            useBbbMinusAdjustment: useBbbAdjustment,
            bbbMinusYield: Number(bbbYieldInput) || 8,
            bbbYieldSource,
          }),
        })
        const valuationPayload = await parseApiJson<ValuationResponse>(valuationResponse)
        if (!cancelled) {
          setValuation(valuationPayload)
          setError(null)
        }
      } catch (caughtError) {
        if (!cancelled) {
          setValuation(null)
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : '밸류에이션 계산 중 오류가 발생했습니다.',
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    selectedStock,
    financialData,
    priceData,
    useBbbAdjustment,
    bbbYieldSource,
    bbbYieldInput,
  ])

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
        <h2 className="mb-3 text-base font-semibold text-slate-900">요구수익률 r (원칙. BBB- 등급 5년 만기 무보증 회사채)</h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={useBbbAdjustment}
              onChange={(event) => setUseBbbAdjustment(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            위 원칙에 따른 시장 수익률(%)을 요구수익률 r로 사용 (해제 시 내부 기본 8% 가정)
          </label>
          <fieldset
            disabled={!useBbbAdjustment}
            className="flex flex-col gap-2 border-0 p-0 text-sm text-slate-700"
          >
            <legend className="sr-only">수익률 출처</legend>
            <span className="font-medium text-slate-800">조회·입력 출처</span>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="bbb-src"
                checked={bbbYieldSource === 'kofia'}
                onChange={() => setBbbYieldSource('kofia')}
              />
              금융투자협회 채권정보센터 (1순위)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="bbb-src"
                checked={bbbYieldSource === 'kap'}
                onChange={() => setBbbYieldSource('kap')}
              />
              한국자산평가(KAP) 채권금리 기준수익률 (보조)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="bbb-src"
                checked={bbbYieldSource === 'estimate'}
                onChange={() => setBbbYieldSource('estimate')}
              />
              공식 확인 어려움·추정·대체 (8~9% 대역 권장, 시장 급변 시 최신 검색 우선)
            </label>
          </fieldset>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-700">확인한 수익률</span>
            <input
              value={bbbYieldInput}
              onChange={(event) => setBbbYieldInput(event.target.value)}
              className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
              inputMode="decimal"
              disabled={!useBbbAdjustment}
            />
            <span className="text-sm text-slate-600">% (표가 %면 그대로 입력. 계산 시 r=값÷100)</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
            <li>{R_SOURCE_KOFIA_GUIDE}</li>
            <li>{R_SOURCE_KAP_GUIDE}</li>
            <li className="text-amber-900">{R_MATURITY_WARNING}</li>
          </ul>
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
              title="적용 요구수익률 r"
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
