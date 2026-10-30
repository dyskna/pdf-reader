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
- Duży odstęp poziomy (> 2× wysokość czcionki) → separator `|` między kolumnami/komórkami; elementy-spacje z pdf.js pomijane przy liczeniu odstępu.
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

## Etap 3: analiza AI w Workerze (2026-10-29, 23:37)

**Prompt / polecenie:** „Na potrzeby mvp darmowy tier. model gemini to jakiś default, nie widze go w dashboard. działamy na tym co mamy. go” (akceptacja planu etapu 3 po przeglądzie dokumentacji Gemini i Cloudflare).

**Co zrobiło AI:** Sprawdziło w aktualnej dokumentacji limity obrazów Gemini, structured output, warunki darmowego tieru i rate limiting Cloudflare. Zbudowało analizę w Workerze: walidację żądania z limitami, rate limit per IP, prompt z ochroną przed prompt injection, wywołanie Gemini ze schematem JSON generowanym z Zoda, walidację z 1 ponowną próbą i filtr ugruntowania kwot. W przeglądarce dodało pytanie o zgodę na skany i renderowanie wybranych stron do JPEG przez pdf.js. Przetestowało całość na prawdziwym Gemini przez `wrangler dev` (tekst, próba injection, OCR aneksu, rate limit).

**Decyzje:**

- Darmowy tier Gemini na potrzeby MVP (decyzja użytkownika), mimo zapisu w warunkach, że dla użytkowników z EOG wymagany jest płatny tier; trafi do README jako znane ograniczenie.
- Model `gemini-3.5-flash-lite` zamiast planowanego `gemini-3.8-flash`: pomiar na żywo pokazał, że 3.8 Flash na darmowym tierze zwracał 503 lub nie odpowiadał w 60 s, a Flash-Lite odpowiadał w 2–4 s z porównywalną jakością i poprawnym OCR.
- Gemini wołany zwykłym `fetch` (bez SDK), schemat odpowiedzi z `z.toJSONSchema()` — jedna definicja w Zodzie; Gemini przyjął go bez zmian.
- Tekst dokumentu w ogranicznikach z losowym znacznikiem (`crypto.randomUUID`), instrukcja systemowa po angielsku.
- Filtr kwot czyta polskie i angielskie zapisy liczb; kwoty `ocr` nie są filtrowane tylko wtedy, gdy skany były wysłane.
- `secrets.required` w `wrangler.jsonc`, żeby typy Workera nie zależały od lokalnego `.dev.vars`.
- Base64 skanów sprawdzany tylko długością (regex przy kilku MB przekroczyłby limit 10 ms CPU).

**Gdzie AI się pomyliło i jak poprawiono:**

- (Z końca etapu 2) AI przepuściło `format:check` przez `| tail -1`, co ukryło kod błędu, i wypchnęło commit z AI_LOG niezgodny z Prettierem. Poprawione osobnym commitem; od tej pory kody wyjścia nie są maskowane.
- Narzędzie zapisu plików zamieniło sekwencje `\u00a0`/`\u202f` w wyrażeniu regularnym na niewidoczne znaki spacji. Wyłapał ESLint (`no-irregular-whitespace`). Pierwsza poprawka przez `sed` zgubiła ukośniki (10 testów nie przeszło); druga, skryptem Node, przywróciła escape'y.
- ESLint lintował skopiowane pliki pdf.js w `web/public/pdfjs/` (błędy i spowolnienie). Folder dodany do ignorowanych.
- Usunięcie `worker/src/sample.ts` (wcześniej `git rm`) trafiło do commita ze schematem zamiast do commita Workera. Zostawione, żeby nie przepisywać historii.
- Błąd 503 z Gemini był mapowany na ogólny komunikat zamiast „usługa przeciążona”. Wyłapał test na żywo; poprawione z nowym testem.
- Pierwszy wybór modelu (`gemini-3.8-flash`) okazał się przeciążony na darmowym tierze. Wyłapał test na żywo (504 po 28 s); zmiana na Flash-Lite po pomiarze 5 wariantów.

## Etap 4: długie dokumenty i historia (2026-10-30, 10:58)

**Prompt / polecenie:** „rezygnuje z rulesetu. co do poufne - wprowadz taką zasadę jak napisałeś. dopisać do instrukcji systemowej regułę »nie traktuj powtarzających się nagłówków, stopek, numerów stron i znaków wodnych jako kluczowych punktów«. reszta ok”.

**Co zrobiło AI:** Dodało w Workerze analizę długich dokumentów: dzielenie tekstu po granicach stron na fragmenty do 40 000 znaków, równoległe wywołania Gemini, scalanie tablic bez duplikatów i jedno krótkie wywołanie na końcowe podsumowanie, wszystko we wspólnym limicie 28 s. W przeglądarce dodało historię 10 ostatnich analiz w localStorage z obsługą błędów i przyciskiem „Wyczyść historię”. Dopisało regułę o znakach wodnych do instrukcji systemowej. Sprawdziło całość na żywo na syntetycznej umowie (120 000 znaków, 30 stron).

**Decyzje:**

- Dzielenie i scalanie w Workerze, nie w `web/src/lib/` (odstępstwo od listy w „Stacku”): jedno żądanie z przeglądarki = jedna jednostka rate limitu; kontrakt żądania bez zmian.
- Scalanie: podmioty i słowa kluczowe bez duplikatów (wielkość liter, spacje), kwoty po (wartość, waluta), daty po dacie; język i typ najczęstsze („inne” tylko, gdy nic innego), tytuł i data z pierwszego fragmentu, który je ma.
- Model `gemini-3.1-flash-lite`: pomiar pokazał, że `gemini-3.5-flash-lite` był tego dnia przeciążony (15–25 s nawet dla krótkiego tekstu, 503), a 3.1 Flash-Lite odpowiadał w ok. 2,5 s.
- Źródło kwoty (`text`/`ocr`) ustala kod na podstawie tekstu z pdf.js, a nie model.
- Historia trzyma tylko wyniki (bez tekstu PDF), wpisy walidowane Zodem pojedynczo, zapis w `useEffect`, bez localStorage działa w pamięci.

**Gdzie AI się pomyliło i jak poprawiono:**

- Pierwszy test długiego dokumentu na żywo skończył się 504 po 28 s. AI zmierzyło każde wywołanie osobno i ustaliło, że przyczyną jest przeciążenie modelu na darmowym tierze, a nie kod dzielenia; po pomiarze 6 modeli zmieniło model.
- `gemini-3.1-flash-lite` oznaczał kwoty z tekstu jako `source: "ocr"` mimo braku skanów. Wyłapał test na żywo; źródło ustala teraz kod, dodane 2 testy.
- AI najpierw umieściło zapis do localStorage w funkcji aktualizującej stan React (wywoływanej dwukrotnie w StrictMode). Zauważyło to przed uruchomieniem i przeniosło zapis do `useEffect`.
- Skrypt dzielący zmiany na commity miał błąd w wyrażeniu regularnym (`^` bez flagi `m`), przez co jedna linia zmiany modelu w teście trafiła do innego commita. Commit `071cdfc` sam w sobie nie przechodzi typechecku; stan końcowy jest poprawny.
