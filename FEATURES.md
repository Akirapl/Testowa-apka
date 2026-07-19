# ZENIT MVP — Features

## Overview

ZENIT is a voice-guided navigation system for two distinct experiences:
1. **Astronomy** — exploring the night sky with AI-generated rich narratives
2. **Museum** — exploring art exhibitions with curator-provided descriptions

Both modes use text-to-speech (TTS) to provide audio narration as the primary interface.

---

## Version Selector

**Initial screen** shows two options:

```
⭐ ASTRONOMIA      🎨 MUZEUM
```

Users choose which experience they want.

---

## 🌟 Astronomy Mode

### Flow

1. **Onboarding** — Select profile and LLM provider
   - Profile: Dziecko, Dorosły-laik, Pasjonat pop-science, Astronom-amator
   - LLM: Claude, OpenAI, Mistral
   - API Key: Enter to unlock LLM generation

2. **Session** — Explore the night sky
   - First star: Wielki Wóz (Big Dipper) with narration
   - Navigation: User taps "Znalazłem → dalej" to move to next star
   - Narration: LLM generates rich, personalized descriptions
   - Fallback: Pre-written descriptions if LLM fails

### Features

- **Adaptive narratives**: Tailored by user profile (beginner to expert)
- **Media Session API**: Control via headphone buttons (next/previous)
- **Offline mode**: Fallback steps when LLM/network unavailable
- **Polish language**: All narration in Polish with native TTS

---

## 🎨 Museum Mode

### Flow

1. **Version Selector** — Choose MUZEUM
2. **QR Code Input** — Paste curator JSON
3. **Session** — Navigate through artworks
   - Display: Title, artist, year
   - Audio: Description (pre-written, no LLM)
   - Navigation: Tap "Dalej" to next artwork
   - Fact: Additional trivia displayed below

### Curator Preparation

Curators prepare a JSON file:

```json
{
  "systemPrompt": "...",
  "objects": [
    {
      "title": "Artwork Name",
      "author": "Artist Name",
      "year": "1890",
      "description": "Narration text (Polish, natural speech)",
      "fact": "Additional fact or anecdote"
    }
  ]
}
```

Then generate a QR code from this JSON. Visitors scan the QR → data loads → exhibition plays.

### Features

- **No API needed**: Pure JSON, no LLM calls
- **Curator control**: Museum controls all content
- **Offline-ready**: Works completely offline once data is loaded
- **Rich metadata**: Shows artist, year, facts for each work
- **Audio-first**: Like astronomy, audio is primary, text is secondary

---

## Comparison

| Feature | Astronomy | Museum |
|---------|-----------|--------|
| Source | LLM (Claude/OpenAI/Mistral) | Curator JSON |
| Requires API? | Yes | No |
| Offline? | With fallback | Yes |
| Navigation | Stars (Tier 1 catalog) | Artworks (custom) |
| Personalization | User profile | Curator prompt |
| Content length | Variable (LLM) | Fixed (pre-written) |
| Use case | Sky exploration | Exhibition tours |

---

## How to Test

### Astronomy Mode
1. Click "ASTRONOMIA"
2. Select a profile (e.g., "Dorosły-laik")
3. Select LLM provider (e.g., "Claude")
4. Enter your API key
5. Click "Rozpocznij obserwację"
6. Listen to Wielki Wóz narration
7. Click "Znalazłem → dalej" to advance

### Museum Mode
1. Click "MUZEUM"
2. Copy this JSON:
   ```json
   {"systemPrompt":"Jesteś opiekunem wystawy sztuki.","objects":[{"title":"Nocny spacer","author":"Vincent van Gogh","year":"1890","description":"To słynny obraz van Gogha namalowany w Arles...","fact":"Van Gogh użył techniki alla prima."}]}
   ```
3. Paste into "KOD QR KURATORA" field
4. Click "Wczytaj wystawę"
5. Listen to artwork description
6. Click "Dalej" to navigate

---

## Supported Browsers

- Chrome/Chromium (desktop & mobile)
- Firefox (desktop & mobile)
- Safari (desktop & mobile)
- Edge

Requires:
- JavaScript enabled
- Web Audio API (for TTS)
- HTTPS (for API calls in astronomy mode)

---

## Future Enhancements

### Astronomy v2
- [ ] Dynamic star generation based on date/time/location
- [ ] Compass integration (gyroscope)
- [ ] Real-time visibility calculation
- [ ] More stars (Tier 2, 3 catalogs)
- [ ] Planetary positions (live)
- [ ] Meteor showers, eclipses

### Museum v2
- [ ] Live QR scanning from camera
- [ ] Artwork images (inline or lightbox)
- [ ] Multi-language support
- [ ] Geolocation-based next step
- [ ] Audio in multiple languages
- [ ] Analytics (time per artwork, path taken)
- [ ] LLM enhancement (summarize, generate facts)

---

## Architecture

- **Frontend**: Vanilla JavaScript (no npm/build)
- **Hosting**: Vercel (static + serverless)
- **LLM**: Multi-provider abstraction (Claude, OpenAI, Mistral)
- **TTS**: Web Speech API (browser-native)
- **Data**: Museum mode uses JSON (curator-provided)
- **Storage**: Astronomy fallback steps (static)

---

## Performance

- **Astronomy**: LLM call ~2-3s per narration (prefetches next)
- **Museum**: Instant load from JSON
- **TTS**: ~0.5-1.5s per narration (Polish, 0.95x speed)
- **Total per step**: 2-5s (mostly TTS playback)

---

For detailed setup, see:
- `/docs/MUSEUM_MODE.md` — Curator guide
- `/docs/MUSEUM_QR_EXAMPLE.txt` — Copy-paste example
