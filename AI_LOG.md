# AI_LOG

## Narzędzia

- Claude Code (CLI), model Claude Opus 5.5 (`claude-opus-5-5`)
- _Reszta (Claude Design i inne) zostanie uzupełniona w etapie 7._

## Kluczowe prompty

_Zostaną uzupełnione w etapie 7._

---

## Etap 1: szkielet i demo (2026-10-29, 21:57)

**Prompt / polecenie:** „Przeczytaj dokładnie CLAUDE.md […] Streść mi w 5 punktach […] Wypisz pytania lub ryzyka […] Powiedz, co dokładnie mam zrobić w Etapie 0”. Następnie: „zostawiamy pdf-reader. leć dalej, na resztę się zgadzam” i „ok” do planu etapu 1.

**Co zrobiło AI:** Postawiło monorepo z npm workspaces (`web/`: Vite + React + TS strict, `worker/`: Cloudflare Worker), wspólną konfigurację ESLint/Prettier, schemat Zod wyniku i Worker zwracający przykładowy JSON z CORS ograniczonym do `ALLOWED_ORIGIN`. Dodało workflowy GitHub Actions (sprawdzenia na PR, deploy po merge'u) i dostosowało CLAUDE.md do nazwy repo `pdf-reader`.

**Decyzje:**

- Repo zostaje `pdf-reader` (decyzja użytkownika), więc `base: '/pdf-reader/'`.
- Worker importuje schemat z `web/src/lib/schema.ts`: jedno źródło prawdy, wspólny `zod` dzięki workspaces.
- TypeScript przypięty do 6.0: create-vite 9 instaluje TS 7 i oxlint, a `typescript-eslint` wspiera tylko TS < 6.1. Zostajemy przy ESLint ze stacku.
- Brak nagłówka Origin lub obcy Origin → 403. To blokada dla przeglądarek, nie uwierzytelnienie (rate limit w etapie 3).
- `no-console` dopuszcza `warn`/`error` (zakaz dotyczy `console.log`).
- `worker-configuration.d.ts` w repo + `wrangler types --check` w CI (zalecenie Cloudflare); `.gitattributes` wymusza LF; `*.pdf` w `.gitignore`.
- `workflow_dispatch` w workflowach (ręczny redeploy po ustawieniu `VITE_API_URL`) i sekret `CLOUDFLARE_ACCOUNT_ID` (zgoda użytkownika).

**Gdzie AI się pomyliło i jak poprawiono:** Plan etapu zakładał najnowszy TypeScript razem z ESLint. Przed instalacją AI sprawdziło zależności (`npm view`) i znalazło niezgodność `typescript-eslint` z TS 7, więc przypięło TS 6.0. Lint, typecheck i testy nie wykazały błędów.
