# Context Notes

- Vite 프로젝트의 `api/*.ts` 파일이 `GET`/`POST` named export만 제공하고 있어 일반 Vercel Serverless Function 진입점으로 인식되지 않을 가능성이 컸다.
- 기존 API 내부 로직은 `Request`/`Response` 기반으로 유지하고, `api/_shared.ts`에서 Vercel `req`/`res`를 Web Request/Response로 변환하는 어댑터를 추가했다.
- 각 API 파일에는 Vercel이 확실히 호출할 수 있는 `export default async function handler(req, res)`를 추가했다.
