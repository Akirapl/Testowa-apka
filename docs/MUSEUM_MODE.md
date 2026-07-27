# ZENIT Muzeum — Przewodnik dla Kuratora

## Jak to działa

1. Zwiedzający otwiera ZENIT, przechodzi ekran "Poznajmy się" (personalizacja + profil + klucz LLM)
2. Na ekranie "Co chcesz robić?" wybiera **🎨 WYSTAWY**
3. Widzi siatkę gotowych wystaw (posortowaną wg odległości od swojej lokalizacji, jeśli ją udostępnił) + pole do wklejenia własnego JSON-a wystawy
4. Po wybraniu wystawy ZENIT **generuje żywą narrację przez LLM** dla każdego eksponatu (nie czyta tekstu z pliku wprost — patrz niżej) i odtwarza ją głosowo
5. Zwiedzający przechodzi między dziełami przyciskiem "Dalej"

**Wymaga skonfigurowanego klucza LLM** (wpisanego na ekranie "Poznajmy się") — bez niego appka nie przejdzie dalej. Jeśli generacja danego kroku zawiedzie (np. przejściowy błąd sieci), appka pokazuje czytelny komunikat + przycisk "Spróbuj ponownie" — nigdy nie czyta surowego tekstu z pliku jako awaryjnej zastępki.

## Format pliku wystawy (JSON)

```json
{
  "systemPrompt": "Jesteś przewodnikiem po wystawie...",
  "location": { "city": "Warszawa", "lat": 52.2297, "lon": 21.0122 },
  "objects": [
    {
      "title": "Tytuł dzieła",
      "author": "Imię artysty",
      "year": "Rok",
      "description": "Notatki kuratora o dziele — surowy materiał źródłowy dla LLM.",
      "fact": "Ciekawostka dodatkowa — technika, historia, anegdota."
    }
  ]
}
```

### Pole po polu

- **`systemPrompt`** (opcjonalnie, zalecane) — **aktywnie używane** jako `system` message dla LLM przy generowaniu narracji każdego eksponatu tej wystawy. To tutaj definiujesz ton przewodnika ("jesteś opiekunem wystawy sztuki nowoczesnej, mówisz z pasją o...").
- **`location`** (opcjonalnie) — `{city, lat, lon}`. Używane do sortowania listy wystaw wg odległości od zwiedzającego ("Najbliżej Ciebie", odznaka "≈X km"). Bez tego pola appka i tak działa, tylko bez sortowania.
- **`objects`** — tablica eksponatów:
  - **`title`** (wymagane) — nazwa dzieła
  - **`author`** (opcjonalnie) — artysta
  - **`year`** (opcjonalnie) — rok powstania
  - **`description`** (wymagane) — **surowe notatki kuratora**, nie finalny tekst do odczytania. LLM przekształca je w naturalną, żywą narrację dostosowaną do profilu i personalizacji zwiedzającego (np. inny ton dla "Laika" niż dla "Profesjonalisty").
  - **`fact`** (opcjonalnie) — dodatkowa ciekawostka, też surowy materiał dla LLM

### Ważne: opis ≠ finalna narracja

`description`/`fact` **nie są** czytane wprost przez TTS — to materiał źródłowy. LLM za każdym razem generuje nową wersję narracji na bazie tych notatek + `systemPrompt` + profilu i personalizacji zwiedzającego. Ten sam eksponat może więc brzmieć inaczej dla różnych osób. Pisz notatki rzeczowo i szczegółowo — im więcej konkretów podasz, tym lepszy materiał dla LLM.

## Przykład pełny

```json
{
  "systemPrompt": "Jesteś przewodnikiem po galerii sztuki współczesnej. Opisujesz dzieła głosowo, zawsze dodając historię autora i kontekst czasowy.",
  "location": { "city": "Warszawa", "lat": 52.2297, "lon": 21.0122 },
  "objects": [
    {
      "title": "Nocny spacer",
      "author": "Vincent van Gogh",
      "year": "1890",
      "description": "To słynny obraz van Gogha namalowany w Arles. Pokazuje ulicę nocą oświetloną gazowymi latarniami. Żółte światła odbijają się od błękitnego nocnego nieba. Kompozycja jest niezwykle dynamiczna — perspektywa pobiegów w kierunku horyzontu przyciąga widza do głębi obrazu.",
      "fact": "Van Gogh zamalował ten obraz świeżą farbą jeszcze na mokrej warstwie poprzedniej. Ta technika zwana alla prima daje obrazowi niesamowitą energię."
    },
    {
      "title": "Całunek",
      "author": "Gustav Klimt",
      "year": "1908",
      "description": "Jedno z najsławniejszych dzieł art déco. Para w jedwabnych szatach złotego koloru, otoczona ornamentami.",
      "fact": "Klimt użył tutaj rzeczywistego złota w farbie — malatura zwana chrysografia."
    }
  ]
}
```

Skopiuj taki JSON i wklej do pola "LUB WKLEJ SWÓJ KOD QR" na ekranie wyboru wystawy, żeby przetestować.

## Gotowe przykładowe wystawy (w repo)

Cztery gotowe wystawy w `docs/*.json`, dostępne od razu w appce jako kafelki do wyboru:

| Plik | Temat | Miasto |
|---|---|---|
| `gumiak-grudziadz.json` | Historia polskich gumiaków (1927-2015) | Grudziądz |
| `exhibit-zabytkowe-mozaiki.json` | Mozaiki rzymskie z okresu antycznego | Warszawa |
| `exhibit-natura-owady.json` | Entomologia — od Apollo do Herculesa | Wrocław |
| `exhibit-sztuka-nowoczesna.json` | Sztuka XX-XXI wieku: Rothko, Paik, Banksy | Łódź |

## Jak przygotować QR kod dla zwiedzających

1. Przygotuj JSON według formatu powyżej
2. Wklej go do dowolnego generatora QR (np. `qr-code-generator.com`)
3. Wygeneruj i wydrukuj kod QR, umieść przy wystawie
4. Zwiedzający na razie **wkleja treść ręcznie** w pole tekstowe — realne skanowanie kamerą nie jest jeszcze zaimplementowane (patrz "Przyszłe ulepszenia")

## Przyszłe ulepszenia (nie zrobione)

- [ ] Realne skanowanie QR kamerą telefonu (dziś: wklejenie tekstu)
- [ ] Zdjęcia dzieł (inline lub lightbox)
- [ ] Narracja w wielu językach
- [ ] Statystyki (ile czasu na każdym eksponacie, ścieżka zwiedzania)
