# PDF Insight — eksport kierunku 3a („Szałwia na marginesie”)

Pliki: `index.html` (ekran wyniku), `styles.css` (tokeny + style komponentów). Zwykły HTML/CSS, gotowy do przeniesienia do Reacta (klasy → `className`).

## Czcionki
| Krój | Użycie | Źródło | Licencja |
|---|---|---|---|
| Schibsted Grotesk 400/500/600 | interfejs, nagłówki, tekst | https://fonts.google.com/specimen/Schibsted+Grotesk | SIL OFL 1.1 |
| IBM Plex Mono 400/500 | kwoty, daty, nazwy plików, JSON | https://fonts.google.com/specimen/IBM+Plex+Mono | SIL OFL 1.1 |

Oba kroje mają pełne polskie znaki (ą ć ę ł ń ó ś ź ż, Ą Ć Ę Ł Ń Ó Ś Ź Ż). Do self-hostingu: pobierz pliki z Google Fonts lub https://github.com/schibsted/schibsted-grotesk i https://github.com/IBM/plex.

## Tokeny
**Kolory:** `--color-paper` #F6F1E6 (tło), `--color-surface` #FBF8F1, `--color-ink` #2A2C30, `--color-ink-muted` #5E6168, `--color-line` #DDD8CE, `--color-line-strong` #2A2C30, `--color-line-control` #B9B4A9, `--color-accent` #34507E (granat, akcje), `--color-accent-hover` #263C60, `--color-accent-active` #1C2E4A, `--color-sage` #C7D1BC, `--color-sage-line` #8FA083, `--color-sage-ink` #26331F, `--color-focus` #34507E, `--color-disabled-bg` #E4DFD4, `--color-disabled-ink` #8A8C90.

**Typografia:** `--font-sans`, `--font-mono`; rozmiary `--text-xs` 13 · `--text-sm` 14 · `--text-md` 16 · `--text-lg` 19 · `--text-xl` 21 · `--text-2xl` 30 · `--text-3xl` 48 px, każdy z parą `--leading-*`; grubości 400/500/600.

**Odstępy:** `--space-1`…`--space-16` w skali 4 px (4, 8, 12, 16, 20, 24, 28, 32, 40, 56, 64).

**Promienie / linie / cienie:** `--radius-sm` 3 px, `--radius-md` 4 px, `--line-hair` 1 px, `--line-accent` 3 px, `--focus-ring` 2 px, bez cieni.

## Zasady
- Granat tylko dla akcji (przyciski, linki, fokus). Szałwia: kolumna marginesu, znaczniki źródła, oś dat.
- Stany przycisków: domyślny, `:hover`, `:focus-visible` (obrys 2 px), `:active`, `:disabled`.
- Kontrast tekstu ≥ 4.5:1 (WCAG AA) na ecru i szałwii. Wyjątek: `--color-disabled-ink` na `--color-disabled-bg` ma ok. 3:1 — dla wyłączonych przycisków WCAG nie wymaga kontrastu, ale jeśli chcesz go zachować, przyciemnij ten kolor.
- `prefers-reduced-motion` wyłącza przejścia. Poniżej 900 px margines przechodzi nad treść, siatki w jedną kolumnę.
- Puste sekcje: `<p class="empty">Nie znaleziono kwot.</p>` / „Nie znaleziono dat.”
