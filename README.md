# 🎸 Songsterr Ultimate (v3.0)

> **A Tampermonkey userscript that unlocks all Songsterr Plus features and replaces the native export button with high-quality Guitar Pro 7 (.gp) and MIDI (.mid) downloaders built on alphaTab.**

---

## ✨ Features

- **Plus unlock** — Speed control, Loop, Solo/Mute, and Print work without a subscription
- **GP7 download** — full Guitar Pro 7 file with all tracks, tunings, articulations, bends, slides, harmonics, dynamics, repeats, and tempo changes
- **MIDI download** — standard multi-track MIDI with correct General MIDI channel assignments
- **Ad & consent banner removal** — hides all promotional elements and the GDPR popup
- **First-load freeze fix** — targeted paywall unlock that never touches the player's own disabled buttons

---

## 🚀 Installation

1. Install **Tampermonkey** for your browser: [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) · [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) · [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
2. Open the Tampermonkey dashboard → **Create a new script**
3. Paste the full content of `Songsterr_Ultimate.user.js` and save (`Ctrl+S`)
4. Navigate to [songsterr.com](https://www.songsterr.com) — works best in a private window

---

## 🧠 Technical Deep-Dive

The script is structured in **7 numbered sections** that run in order at `document-start`, before any of Songsterr's own JavaScript has executed.

---

### Section 0 — Preventive Cleanup

```js
localStorage.removeItem('persist:root');
```

Songsterr persists its Redux store in `localStorage` under the key `persist:root`. On a free account, this cached state contains `hasPlus: false`. If it's left in place, React hydrates with the cached "free" state and may ignore our later patches. Clearing it forces the app to rebuild its state from scratch on every page load.

---

### Section 1 — The Magic Plus Profile

```js
const MAGIC_ID = Math.floor(Math.random() * 900000000) + 100000000;
const MAGIC_PROFILE = { plan: 'plus', hasPlus: true, subscription: { plan: { id: 'plus' } }, ... };
```

A fresh random 9-digit user ID is generated **each session**. This ID is embedded in the fake profile object that we will inject at every layer (network, DOM state, and React). Using a random ID each time prevents the server from accumulating a download history against a fixed ID that could trigger a `429 Too Many Requests` quota error.

The profile shape mirrors exactly what Songsterr's `/auth/profile` endpoint returns for a real subscriber, so the React app accepts it without validation errors.

---

### Section 2 — Network Interception (fetch hook)

This is the **primary unlock mechanism**. We replace the global `fetch` with our own function using `Object.defineProperty`, which survives re-definitions by the page's own scripts.

**Two routes are intercepted:**

| Route | Action |
|---|---|
| `/auth/profile` | Returns `MAGIC_PROFILE` as a fake `200 OK` JSON response |
| `sentry` / `logs` / `analytics` / `useraudio` | Returns `{}` silently, blocking telemetry |

Everything else is forwarded to the original `fetch` unchanged.

**Stealth:** `fetchHooked.toString()` is overridden to return the original function's source code, defeating any integrity check that calls `fetch.toString()` to detect tampering.

**Why not intercept `/api/edits/download`?** The native download serves a `.gp5` file (Guitar Pro 5 format, older). Our downloader produces `.gp` (Guitar Pro 7) and `.mid` files which are higher quality and contain more data, so we leave the native download route alone and replace the button entirely.

---

### Section 3 — DOM State Injection

Songsterr uses **server-side rendering**. Before React boots, it writes the entire Redux initial state as a JSON string into:

```html
<script id="state">{"user":{"hasPlus":false,...},...}</script>
```

React reads this during hydration. If it says `hasPlus: false`, the UI renders in free mode even if our fetch hook is already active. We observe the DOM with a `MutationObserver` and patch the JSON text **as soon as the element appears**, before React parses it:

```js
data.user.hasPlus = true;
data.user.profile = MAGIC_PROFILE;
data.consent = { loading: false, suite: 'tcf', view: 'none' }; // kills the GDPR banner
```

This means React hydrates in Plus mode from its very first render, with zero flash of free content.

---

### Section 4 — CSS

`GM_addStyle` injects a stylesheet that:

- Hides consent banners, ad containers, and error overlays with `display: none !important`
- Removes `overflow` restrictions that Songsterr sometimes sets on `<body>` to block scrolling
- Styles our two download buttons (`.sgd-btn-gp` blue gradient, `.sgd-btn-midi` dark gradient)
- Styles the status toast (`#sgd-status`), a fixed pill at the bottom of the viewport that shows download progress

The button wrapper (`#sgd-wrapper`) inherits the CSS classes `B3a4pa B3agq5` from the native `#c-export` div it replaces, so it slots into the flex toolbar with identical vertical alignment.

---

### Section 5 — Targeted Plus Unlock (setInterval)

Sections 2 and 3 handle the initial load. But React continuously re-renders components — when the user changes speed, switches tracks, or scrolls, React may re-render the controls bar and reset button states.

A `setInterval` running every second re-applies the unlock to **Plus-gated buttons only**. This is the most delicate part of the script:

**⚠️ Critical pitfall:** removing `disabled` from *all* disabled buttons breaks the tab player. Songsterr's React player uses `disabled` legitimately during audio loading and tab parsing. Force-enabling those desynchronizes React's virtual DOM from the real DOM → the tab freezes.

**Solution — three targeted passes:**

1. **Lock SVG icons** — `svg use[href*="lock"]` elements are added by React specifically to mark paywalled buttons. We remove the icon and re-enable only its immediate `<button>` parent.
2. **Known data-id values** — Plus features carry predictable `data-id` attributes (`Speed`, `Loop`, `Solo`, `Autoscroll`, `Print`). We query only those.
3. **Songsterr's lock CSS class** — `Cny223` is Songsterr's internal class for locked controls. We remove it and re-enable those buttons.

Player controls (Play, Metronome, navigation) have none of these signals, so they are never touched.

---

### Section 6 — Console Filter

Patches `console.error` to silently drop known harmless errors (`AudioContext`, `source-map`, `401`, etc.) that Songsterr generates at runtime. This keeps the browser DevTools console clean during development.

---

### Section 7 — The GP7 / MIDI Downloader

This is the core feature — a complete pipeline that converts Songsterr's internal tab format into industry-standard files.

#### 7.1 — Read page metadata (`getStateFromPage`)

The same `<script id="state">` element from Section 3 contains the song's full metadata under `state.meta.current`:

```
songId      → numeric identifier  (e.g. 447)
revisionId  → current tab version (e.g. 5553765)
image       → CDN path segment    (e.g. "abc123")
tracks[]    → array of { partId, instrumentId, title, tuning, … }
```

These four values are all we need to build the CDN URLs for each track.

#### 7.2 — Fetch revision JSONs from the CDN (`fetchAllRevisions`)

Each track's full note data is stored as a separate JSON file on Songsterr's CloudFront CDN:

```
https://dqsljvtekg760.cloudfront.net/{songId}/{revisionId}/{image}/{partId}.json
```

The CDN validates `Origin` and `Referer` headers and rejects requests that don't look like they come from a browser on songsterr.com. We use `GM_xmlhttpRequest` (which bypasses the browser's CORS policy) and send a complete set of Chrome 124 headers to pass this validation.

All tracks are fetched **in parallel** with `Promise.all`. Failed tracks are logged as warnings and skipped rather than aborting the whole download.

#### 7.3 — Data model conversion (alphaTab)

We use [**alphaTab**](https://www.alphatab.net/) (v1.8.1) as our rendering and export engine. It has a rich internal model (`Score → MasterBar → Track → Staff → Bar → Voice → Beat → Note`) and exporters for GP7 and MIDI.

The conversion from Songsterr's JSON to alphaTab's model involves several non-trivial mappings:

| Concept | Songsterr format | alphaTab format | Conversion |
|---|---|---|---|
| **Duration** | Fraction `[num, den]` | `Duration` enum + dot count | Minimize delta across 7 bases × 3 dot levels |
| **String index** | `0` = highest string | `1` = lowest string | `alphaTab.string = numStrings − songsterr.string` |
| **Bend points** | Hundredths of a semitone | Quarter-tones | `× 2` |
| **Tuplet** | Integer (3, 5, 6, 7…) | `[numerator, denominator]` | Fixed map + `log2` fallback |
| **Instrument ID** | Songsterr internal ID | GM program (0–127) | Clamp to range; `1024` → percussion |
| **Percussion** | MIDI note number | Articulation index | GP7 round-trip to read alphaTab's index order |
| **MIDI channel** | — | 0–15, channel 9 = drums | Sequential assignment, skip 9 for non-percussion |

**Key functions:**

- `mapDuration(dur)` — finds the best `{ duration, dots }` pair for a given fractional duration
- `mapNote(nd, isPerc, numStrings)` — converts one note with all its ornaments (tie, dead, ghost, hammer-on/pull-off, staccato, vibrato, harmonic, slide, bend)
- `mapBeat(bd, mb, isPerc, numStrings)` — converts one beat with duration, tuplet, dynamics, pick stroke, palm mute
- `buildMasterBars(score, masterRev, count)` — builds the global timeline with time signatures, section markers, repeats, and BPM automations
- `buildTrack(score, entry, masterBarCount, channel)` — builds one complete track with tuning and all measures
- `buildScore(meta, revisions)` — assembles everything; calls `score.finish()` which is mandatory to resolve alphaTab's internal cross-references before export

#### 7.4 — Export

```js
// GP7
new alphaTab.exporter.Gp7Exporter().export(score, settings)  → Uint8Array

// MIDI
new alphaTab.midi.MidiFileGenerator(score, settings, handler).generate()
midiFile.toBinary()  → Uint8Array
```

The resulting binary is wrapped in a `Blob`, turned into a temporary object URL, and downloaded via a programmatically clicked `<a>` element.

---

### Section 7 (continued) — Button Injection

Songsterr is a **React Single-Page Application**. Navigation between pages (e.g. `/tab-s447` → `/chords-s447`) does not reload the page — React simply re-renders the toolbar, destroying our injected buttons.

**Injection target** (identified by reverse-engineering the page HTML):

```html
<div id="c-export" class="B3a4pa B3agq5">   ← replaced entirely
  <button id="control-export" title="Download tab">Export</button>
</div>
```

We replace the `#c-export` div with our `#sgd-wrapper` div, giving it the same classes `B3a4pa B3agq5` so it inherits the toolbar's flex alignment automatically.

**Three fallback selectors** handle potential Songsterr updates:
1. `#c-export` — stable element ID (primary)
2. `#control-export`'s parent div
3. Any element with `[title*="Download tab"]` or `[data-id*="Export"]`

**SPA resilience — three mechanisms working together:**

1. **Permanent `MutationObserver`** on `document.body` — fires on every DOM change; re-injects if `#sgd-wrapper` is no longer connected
2. **`history.pushState` hook** — intercepts React Router navigation; schedules re-injection at 300 ms / 900 ms / 1800 ms to account for variable render times
3. **`popstate` listener** — handles browser Back/Forward button navigation

---

## ⚠️ Disclaimer

This project is for educational and cybersecurity research purposes only. It demonstrates client-side state spoofing, network interception, and DOM manipulation techniques in a browser extension context. If you use Songsterr regularly, please consider supporting the developers with an official subscription.
