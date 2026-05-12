// 종목 검색/선택 도메인 타입을 정의하는 파일
export interface StockMasterItem {
  code: string
  name: string
  market: 'KOSPI' | 'KOSDAQ'
  corpCode?: string
}

export interface SearchStockResponse {
  items: StockMasterItem[]
}
