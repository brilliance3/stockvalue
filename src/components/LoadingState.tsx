// 비동기 로딩 상태를 표시하는 공통 컴포넌트
export function LoadingState() {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
      데이터를 불러오는 중입니다.
    </div>
  )
}
