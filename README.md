# ZENIT

Głosowy przewodnik (Polska, TTS) w dwóch trybach:

- ⭐ **Astronomia** — przewodnik po niebie nocnym, narracja generowana na żywo przez LLM na bazie realnie obliczonej pozycji gwiazdy (azymut/wysokość)
- 🎨 **Muzeum** — oprowadzanie po wystawie, kurator dostarcza JSON z notatkami o eksponatach, LLM zamienia je w żywą, spersonalizowaną narrację

Aplikacja jest audio-first: użytkownik słucha, nie patrzy w ekran. Cały interfejs jest po prostu wsparciem — tekst na ekranie to to samo co mówi TTS.

## Stack

Vanilla JavaScript, zero buildu, zero `npm install`. Cała logika ładowana przez zwykłe tagi `<script>` w `index.html`, w tej kolejności:

```
src/lib/systemPrompt.js    → window.SYSTEM_PROMPT (prompt dla trybu astronomii)
src/lib/fallbackSteps.js   → window.FALLBACK_STEPS (4 statyczne kroki — baza + sieć bezpieczeństwa)
src/lib/catalog.json.js    → window.CATALOG (katalog gwiazd Tier 1 + referencje gwiazdozbiorów)
src/lib/astronomy.js       → window.ZenitAstronomy (transformacja RA/Dec → Alt/Az, własny wzór)
src/lib/tts.js             → window.TTS (Web Speech API wrapper)
src/lib/llm.js             → window.LLM (Claude/OpenAI/Mistral przez własny backend-proxy)
src/lib/museumExample.js   → przykładowe dane muzealne (referencyjne, nieużywane w runtime)
src/components.js          → window.Components (renderowanie ekranów, string templates)
src/app.js                 → window.app (stan + logika, jeden obiekt)
```

Render: `window.app.state.screen` decyduje który `render*()` z `components.js` wygeneruje `innerHTML`. Pełna wymiana DOM przy każdej zmianie stanu — brak wirtualnego DOM, brak diffowania.

## Flow (3 ekrany)

### 1. "Poznajmy się" (`renderPersonalization`)
Jeden ekran, wspólny dla obu trybów:
- wolny tekst "opowiedz mi o sobie" (`state.personalization`)
- profil: **Laik / Zainteresowany / Ekspert / Profesjonalista** (`state.profile` = `layperson`/`enthusiast`/`expert`/`professional`) — wpływa na ton narracji w obu trybach
- provider LLM: Claude / OpenAI / Mistral (`state.provider`)
- klucz API (`state.apiKey`) — **twarda bramka**: `confirmPersonalization()` woła `LLM.testKey()`, zły/pusty klucz blokuje przejście dalej z czytelnym błędem
- po udanym teście: lokalizacja — `navigator.geolocation` → jeśli zawiedzie/odmówione, pole ręcznego miasta → geokodowanie przez Nominatim (OpenStreetMap, darmowe, bez klucza) → Praga jako ostateczny fallback jeśli wszystko zawiedzie

### 2. "Co chcesz robić?" (`renderModeSelector`)
- **NIEBO** → `chooseAstronomy()`, od razu sesja
- **WYSTAWY** → siatka 4 gotowych wystaw (`docs/*.json`), posortowana wg dystansu od `state.location` (odznaka "≈X km", najbliższa oznaczona "Najbliżej Ciebie") + pole na wklejenie własnego JSON wystawy

### 3. Sesja (`renderSession`)
Narracja dla obu trybów generowana jest przez LLM **dla każdego kroku, łącznie z pierwszym**. Różnica:
- **Astronomia**: dwuwarstwowy fallback — błąd obliczeń pozycji lub błąd LLM (klucz już zwalidowany bramką, więc to ochrona przed przejściowym błędem sieci) → cicho spada na statyczny tekst z `FALLBACK_STEPS`, appka nigdy nie milknie.
- **Muzeum**: **brak fallbacku** (celowo) — `description`/`fact` z pliku wystawy to materiał źródłowy dla LLM, nie tekst czytany wprost. Błąd generacji → czytelny komunikat + przycisk "Spróbuj ponownie", nigdy surowy tekst kuratora.

## Astronomia — jak liczona jest pozycja gwiazdy

`src/lib/astronomy.js` (`window.ZenitAstronomy.getAltAz`) liczy Alt/Az **własnym wzorem**, bez zależności zewnętrznych — wcześniej korzystał z CDN `astronomy-engine`, ale ten skrypt w praktyce nigdy nie ustawiał się poprawnie w przeglądarce (potwierdzone na produkcji, nie tylko lokalnie). Wzór: Julian Date z `Date` → uproszczone Greenwich/Local Sidereal Time → kąt godzinny → standardowa transformacja horyzontalna (asin/atan2). Wystarczająco dokładne dla narracji głosowej ("spójrz w lewo i wyżej"), nieodpowiednie dla realnej nawigacji teleskopem.

`computeAstronomyPosition()` w `app.js` szuka celu (`target`, np. "Wielki Wóz") w `CATALOG.references`, bierze **pierwszą** gwiazdę z listy jako punkt odniesienia (nie średnią — unika problemów z zawijaniem azymutu 0°/360°) i przelicza jej Alt/Az dla `state.location` i bieżącego czasu.

## Muzeum — format pliku wystawy

Zob. [`docs/MUSEUM_MODE.md`](docs/MUSEUM_MODE.md) — pełny przewodnik dla kuratora. W skrócie: JSON z `systemPrompt` (instrukcja dla LLM, aktywnie używana jako `system` message) + `location` (do sortowania "w pobliżu") + `objects[]` (tytuł/autor/rok/opis/ciekawostka — surowe notatki, LLM przerabia je w żywą narrację, nigdy nie czytane wprost).

## Dlaczego jest `api/llm-proxy.js`

`llm.js` **nie** woła `api.anthropic.com`/`api.openai.com`/`api.mistral.ai` bezpośrednio z przeglądarki — takie wywołania są blokowane przez CORS (potwierdzone eksperymentalnie: Anthropic bez specjalnego nagłówka nie zwraca `Access-Control-Allow-Origin`, OpenAI/Mistral nie mają żadnego oficjalnego obejścia). Zamiast tego `LLM._callProxy()` woła własny, tego samego pochodzenia `/api/llm-proxy` (Vercel serverless function), który robi żądanie do providera **po stronie serwera** — server-to-server nie podlega CORS w ogóle. Klucz API użytkownika leci przez ten proxy, nie jest nigdzie zapisywany.

`api/personalization.js` — osobny endpoint, nieblokujący zapis personalizacji do Supabase (błąd/404 nie przerywa sesji).

## Deployment

**Vercel jest wymagany**, żeby `/api/*` miało się gdzie wykonać. GitHub Pages (`.github/workflows/pages.yml`) serwuje appkę jako czystą statykę — działa, ale bez LLM-proxy i bez zapisu personalizacji.

1. [vercel.com](https://vercel.com) → zaloguj się przez GitHub → "Add New" → "Project" → zaimportuj to repo
2. Framework preset: **Other** (zero-config — Vercel sam wykryje `package.json` i `/api/*.js`)
3. Deploy → URL `*.vercel.app`
4. Project → Settings → Environment Variables: `SUPABASE_URL`, `SUPABASE_KEY` (dla `api/personalization.js` — bez nich ten jeden endpoint zwraca 500, nie blokuje `api/llm-proxy.js`)
5. Testuj **na URL-u `*.vercel.app`** — na GitHub Pages `/api/*` nigdy nie zadziała

## Panel diagnostyczny

Każdy ekran ma na dole zwijany blok **"Diagnostyka"** (`<details>`/`<summary>`, jednym dotknięciem rozwijany na telefonie) — plain-tekstowy log kluczowych zdarzeń (`app.js::log()`): inicjalizacja LLM, wynik `testKey()`, wynik geolokalizacji/geokodowania, obliczona pozycja gwiazdy, sukces/błąd każdego wywołania LLM z pełnym komunikatem błędu. Zbudowany specjalnie po to, żeby dało się debugować appkę na telefonie bez DevTools — przy zgłaszaniu problemu warto od razu skopiować tę treść.

## Uruchomienie lokalne

```bash
python3 -m http.server 8000
```

Wystarczy do testowania UI/flow, ale `/api/llm-proxy` i `/api/personalization` **nie zadziałają** (to serverless functions Vercela, zwykły serwer statyczny ich nie obsłuży) — LLM zawsze spadnie na fallback lokalnie, chyba że zainstalujesz [Vercel CLI](https://vercel.com/docs/cli) i użyjesz `vercel dev`.

## Znane ograniczenia (świadome, nie przeoczone)

- **Klucz Mistral zahardkodowany** w `src/components.js` jako prefill — świadomie, to darmowy tier tylko do testów. Nie traktować jako bezpieczne dla produkcji.
- **Nominatim** (geokodowanie ręcznie wpisanego miasta) — publiczne, darmowe API bez SLA i z limitem tempa zapytań. Wystarczające do MVP, nie do skali.
- **Brak precesji współrzędnych** J2000→dziś w obliczeniach astronomicznych — błąd rzędu ułamków sekundy kątowej na wiek, nieistotne dla narracji głosowej.
- **Jedna gwiazda-referencja** na gwiazdozbiór (pierwsza z listy w `CATALOG.references`), nie średnia pozycja całego układu.
- **Brak realnego skanowania QR kamerą** w muzeum — "QR" to wklejenie tekstu JSON do pola tekstowego.
- Krok 1 astronomii i muzeum zawsze idzie przez LLM (ujednolicone) — pierwsze odtworzenie ma więc krótkie opóźnienie (czas odpowiedzi LLM), zanim TTS zacznie mówić.

## Struktura repo

```
index.html                        punkt wejścia, ładuje wszystkie skrypty
src/
  app.js                          stan + cała logika (window.app)
  components.js                   renderowanie ekranów (window.Components)
  lib/
    systemPrompt.js                prompt LLM dla astronomii
    fallbackSteps.js                4 statyczne kroki (baza + fallback)
    catalog.json.js                 katalog gwiazd + referencje gwiazdozbiorów
    astronomy.js                    RA/Dec → Alt/Az (własny wzór)
    tts.js                          Web Speech API wrapper
    llm.js                          abstrakcja LLM (przez api/llm-proxy)
    museumExample.js                przykładowe dane (referencyjne)
api/
  llm-proxy.js                     serverless proxy do Claude/OpenAI/Mistral (omija CORS)
  personalization.js                zapis personalizacji do Supabase
docs/
  MUSEUM_MODE.md                    przewodnik dla kuratora muzeum
  gumiak-grudziadz.json             przykładowa wystawa (Grudziądz)
  exhibit-zabytkowe-mozaiki.json     przykładowa wystawa (Warszawa)
  exhibit-natura-owady.json         przykładowa wystawa (Wrocław)
  exhibit-sztuka-nowoczesna.json     przykładowa wystawa (Łódź)
package.json                       minimalny, tylko żeby Vercel wykrył /api jako Node
```
