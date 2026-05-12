# ValueLens Korea MVP

OpenDART/KRX 기반으로 한국 상장사의 재무 요약과 S-RIM 시나리오를 보여주는 Vite React + TypeScript 프로젝트입니다.

## 기술 스택

- Frontend: Vite, React, TypeScript, Tailwind CSS, Recharts, lucide-react
- API: `api/` 서버리스 함수(OpenDART/KRX/Valuation)

## 시작하기

```bash
npm install
npm run dev
```

## 환경변수

`.env.example`를 복사해서 `.env`를 생성하고 값을 채워주세요.

```bash
cp .env.example .env
```

필수 키는 다음과 같습니다.

- `OPEN_DART_API_KEY`
- `KRX_API_BASE_URL`
- `KRX_API_KEY`

`OPEN_DART_API_KEY` 또는 KRX 설정이 없으면 API는 실패하지 않고, 사용자에게 안내 메시지를 반환하도록 구현되어 있습니다.

## 빌드

```bash
npm run build
```

## 배포 메모

- Vercel 배포를 기준으로 `api/` 함수 구조를 사용합니다.
- 로컬에서 API까지 함께 확인하려면 `vercel dev` 사용을 권장합니다.
