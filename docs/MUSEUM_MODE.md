# ZENIT Museum Mode — Instrukcja dla Kuratora Muzeum

## Przegląd

ZENIT ma teraz dwie wersje:
- **Astronomia** — przewodnik po niebie nocnym (głosowy)
- **Muzeum** — oprowadzanie po wystawie (głosowe + wizualne metadane)

## Tryb Muzeum — Jak to działa

1. Użytkownik uruchamia ZENIT
2. Wybiera **MUZEUM** zamiast ASTRONOMII
3. Wkleja kod QR przygotowany przez kuratora (jako JSON)
4. ZENIT czyta dzieła ze sprawnością i odczytuje opisy głosowo
5. Użytkownik przechodzi między dziełami stukając przyciski

## Format QR — JSON Kuratora

Kolektor przygotowuje plik JSON zawierający:

```json
{
  "systemPrompt": "Jesteś opiekunem wystawy w muzeum...",
  "objects": [
    {
      "title": "Tytuł dzieła",
      "author": "Imię artysty",
      "year": "Rok",
      "description": "Opis dzieła do odczytania głosowo. Może być długi i szczegółowy.",
      "fact": "Ciekawostka dodatkowa — np. technika, historia, anegdota"
    }
  ]
}
```

## Pole po polu

### `systemPrompt` (opcjonalnie)
Instrukcja dla potencjalnego LLM (na przyszłość). Teraz ignorowane w v1, ale dobrze je przygotować.

Przykład:
```
Jesteś opiekunem wystawy dedykowanej sztuce nowoczesnej. Opisujesz dzieła sztuki w wciągający sposób, dodając smaczki na temat artystów, technik i historii. Mów naturalnie, jak przewodnik dla osoby.
```

### `objects` — tablica dzieł

Każde dzieło musi mieć:

- **`title`** (wymagane) — nazwa dzieła, wyświetlana na górze
- **`author`** (opcjonalnie) — imię/nazwisko artysty
- **`year`** (opcjonalnie) — rok powstania
- **`description`** (wymagane) — opis do odczytania głosowo (polskie słowa, naturalne)
- **`fact`** (opcjonalnie) — dodatkowa ciekawostka wyświetlona jako drobny tekst

## Przykład pełny

```json
{
  "systemPrompt": "Jesteś przewodnikiem po galerii sztuki współczesnej. Opisujesz dzieła głosowo, zawsze dodając historię autora i kontekst czasowy.",
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
      "description": "Jedno z najsławniejszych dzieł art déco. Para w jedwabnych szatach złotego koloru, otoczona ornamentami. Ich twarze przypominają bizuterię — stylizowane, minimalistyczne. Całkowita roztopienie się w ornamencie, w ozdobie, w blasku złota.",
      "fact": "To dzieło jest ikoną wiedeńskiego art déco. Klimt użył tutaj rzeczywistego złota w farbie — malatura zwana chrysografia."
    }
  ]
}
```

## Jak przygotować QR Code

1. Przygotuj JSON w edytorze tekstu (lub skopiuj z exemplo powyżej)
2. Wklej JSON do generatora QR (np. `qr-server.com` lub `qrcode.com`)
3. Wygeneruj kod QR
4. Oddziel go z wystawy (na telefonie, w drucie, na ścianach)

## Testowanie

Aby przetestować:

1. Otwórz ZENIT w przeglądarce
2. Kliknij **MUZEUM**
3. Skopiuj JSON z przykładu powyżej
4. Wklej do pola "KOD QR KURATORA"
5. Kliknij "Wczytaj wystawę"

## Co się stanie

- ZENIT wczyta dzieła ze sprawnością
- Wyświetli tytuł, autora, rok na górze
- Odczyta opis głosowo
- Pokaże fakt jako tekst mały poniżej
- Użytkownik klika "Dalej" aby przejść do następnego dzieła

## Przyszłe ulepszenia (v2+)

- [ ] Dynamiczne QR scanning z kamery
- [ ] LLM generate pełnych opisów na bazie systemPrompt
- [ ] Foto dzieła (inline lub z URL)
- [ ] Audio narracji w różnych języków
- [ ] Geolokalizacja — następne dzieło na bazie lokacji w muzeum
- [ ] Statystyka — ile czasu na każdym dziele

---

**Pytania?** Skontaktuj się z zespołem ZENIT. Gotowy plik JSON wyślij na support@zenit.art.
