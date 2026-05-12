// MVP에서 사용하는 기본 종목 마스터 데이터를 제공하는 파일
import type { StockMasterItem } from '../types/stock'

export const stockMaster: StockMasterItem[] = [
  { code: '005930', name: '삼성전자', market: 'KOSPI', corpCode: '00126380' },
  { code: '000660', name: 'SK하이닉스', market: 'KOSPI', corpCode: '00164779' },
  { code: '035420', name: 'NAVER', market: 'KOSPI', corpCode: '00266961' },
  { code: '035720', name: '카카오', market: 'KOSPI', corpCode: '00362066' },
  { code: '051910', name: 'LG화학', market: 'KOSPI', corpCode: '00356361' },
  { code: '005380', name: '현대차', market: 'KOSPI', corpCode: '00164742' },
  { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI', corpCode: '01515323' },
  { code: '207940', name: '삼성바이오로직스', market: 'KOSPI', corpCode: '00877059' },
  { code: '068270', name: '셀트리온', market: 'KOSPI', corpCode: '00534499' },
  { code: '091990', name: '셀트리온헬스케어', market: 'KOSDAQ', corpCode: '01032374' },
]
