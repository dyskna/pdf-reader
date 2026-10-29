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

## Etap 2: wgrywanie i odczyt PDF (2026-10-29, 22:26)

**Prompt / polecenie:** „demo dziala, go dalej” (akceptacja planu etapu 2), wcześniej: „tak popraw CLAUDE.md w etapie 2” (PR-y zakłada Claude) i „sam se rób te pullrequesty, ja je tylko chce zatwierdzac”.

**Co zrobiło AI:** Dodało odczyt PDF w przeglądarce przez `pdfjs-dist`: walidację pliku, składanie elementów tekstu w linie, wykrywanie stron-skanów i tekst z oznaczeniami `[Strona N]`. Logikę stanów trzyma czysty reducer i hook `usePdfAnalysis`, a roboczy interfejs (drag & drop, etapy ładowania, błąd z ponowieniem, podgląd JSON) jest oddzielony w komponentach. Zaktualizowało CLAUDE.md: PR-y zakłada Claude przez `gh`.

**Decyzje:**

- Worker pdf.js importowany przez `?url`, żeby Vite dodał base `/pdf-reader/`.
- Duży odstęp poziomy (> 2× wysokość czcionki) → separator ` | ` między kolumnami/komórkami; elementy-spacje z pdf.js pomijane przy liczeniu odstępu.
- Skan = mniej niż 30 znaków bez białych znaków (zapas na znak wodny „POUFNE”).
- Gdy wszystkie strony to skany: czytelny błąd zamiast wysyłania pustego tekstu (OCR w etapie 3).
- Stany w czystym reducerze testowanym Vitestem, bez nowej zależności do testów komponentów.
- Zostaje nowoczesny build pdf.js (wymaga nowych przeglądarek); `legacy` jako opcja na później.

**Gdzie AI się pomyliło i jak poprawiono:**

- Zainstalowało `pdfjs-dist@^5` zamiast aktualnej wersji 6.4.299; AI zauważyło to w wyniku `npm view` i przeinstalowało na 6.x.
- Wywołało `pdf.destroy()`, którego w pdf.js 6 nie ma (przeniesione do `loadingTask`). Wyłapał typecheck, poprawione na `loadingTask.destroy()`.
- Rzucało nowe błędy bez `cause`. Wyłapał ESLint (`preserve-caught-error`), dodane `{ cause }`.
- Separator kolumn nie działał na prawdziwym PDF-ie: pdf.js wstawia elementy-spacje wypełniające przerwę, a testy jednostkowe tego nie przewidziały. Wyłapał ręczny test na wygenerowanym PDF-ie; poprawiona logika i dodane 2 testy.
- Pierwsza poprawka (`previous = { ...previous }` w pętli) dała błąd TS2698. Wyłapał typecheck, zastąpione flagą `endOfLine`.
