# 🎸 Songsterr Ultimate (v3.2.1)

> **A Tampermonkey userscript that unlocks all Songsterr Plus features and replaces the native export button with high-quality Guitar Pro 7 (.gp) and MIDI (.mid) downloaders built on alphaTab.**

---

## ✨ Features

- **Plus unlock** — Speed control, Loop, Solo/Mute, and Print work without a subscription
- **GP7 download** — full Guitar Pro 7 file with all tracks, tunings, articulations, bends, slides, harmonics, dynamics, repeats, and tempo changes
- **MIDI download** — standard multi-track MIDI with correct General MIDI channel assignments
- **YouTube Audio-Only mode** — Hide video while keeping audio playing (thanks to パプリカ!)
- **Native Autoscroll fix** — Restores proper scrolling behavior (thanks to パプリカ!)
- **Ad & consent banner removal** — hides all promotional elements and the GDPR popup
- **Smart Plus unlock** — targeted paywall unlock that never touches the player's own disabled buttons

---

## 🚀 Installation

1. Install **Tampermonkey** for your browser: [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) · [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) · [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
2. Open the Tampermonkey dashboard → **Create a new script**
3. Paste the full content of `🎸 Songsterr Ultimate (Premium Unlocked)-3.2.1.user.js` and save (`Ctrl+S`)
4. Navigate to [songsterr.com](https://www.songsterr.com) — works best in a private window

---

## 🙏 Acknowledgments & Credits

This project wouldn't be possible without the brilliant work of these contributors:

### 🌟 **パプリカ (Papurika)**
- **YouTube Audio-Only System** — Genius solution for hiding YouTube videos while preserving audio playback
- **Native Autoscroll Fix** — Surgical fix that restores Songsterr's scrolling behavior without breaking the app
- Their approach uses opacity:0 and absolute positioning instead of display:none to avoid browser power-saving interruptions

### 🚀 **Metaphysics0's songsterr-downloader**
- **CDN Interception Strategy** — The brilliant idea of intercepting legitimate Songsterr API calls to access protected tab data
- **CloudFront Header Spoofing** — Technique for bypassing CDN authentication by posing as a legitimate Chrome browser
- **Fallback CDN Logic** — Robust approach with multiple CDN endpoints for maximum reliability
- Project: https://github.com/Metaphysics0/songsterr-downloader

### 🎸 **alphaTab Library**
- **Music Notation Engine** — Powerful library for converting tab data to standard formats
- **GP7/MIDI Export** — High-quality exporters that preserve all musical nuances
- Project: https://www.alphatab.net/

---

## 🧠 How It Works

The script is structured in **7 main sections** that work together to unlock Songsterr:

### 🎯 **Core Strategy**

We attack the problem from **three angles simultaneously**:

1. **Network Layer** — Intercept `/auth/profile` API calls and return a fake Plus profile
2. **DOM State** — Patch the initial Redux state before React reads it
3. **UI Layer** — Continuously unlock Plus-gated buttons with surgical precision

This multi-layered approach ensures the app believes it's in Plus mode from the very first render.

---

### 🔧 **Technical Deep-Dive**

#### Section 1 — The Magic Plus Profile

```js
const MAGIC_ID = Math.floor(Math.random() * 900000000) + 100000000;
const MAGIC_PROFILE = { plan: 'plus', hasPlus: true, subscription: { plan: { id: 'plus' } }, ... };
```

A fresh random 9-digit user ID is generated **each session**. This prevents the server from accumulating download history against a fixed ID that could trigger rate limiting.

The profile perfectly mirrors what Songsterr's `/auth/profile` endpoint returns for real subscribers.

#### Section 2 — Network Interception

We replace the global `fetch` with our own function using `Object.defineProperty`:

| Route | Action |
|---|---|
| `/auth/profile` | Returns `MAGIC_PROFILE` as fake `200 OK` JSON |
| `sentry` / `logs` / `analytics` | Returns `{}` silently, blocking telemetry |
| `/api/songs/*` / `/api/tab/*` | Caches revision data for our downloader |

**Stealth:** `fetchHooked.toString()` returns the original function's source, defeating integrity checks.

#### Section 3 — DOM State Injection

Songsterr uses server-side rendering. Before React boots, it writes the entire Redux state into:

```html
<script id="state">{"user":{"hasPlus":false,...},...}</script>
```

We patch this JSON **as soon as the element appears**, before React parses it:

```js
data.user.hasPlus = true;
data.user.profile = MAGIC_PROFILE;
data.consent = { loading: false, suite: 'tcf', view: 'none' }; // kills GDPR banner
```

Result: React hydrates in Plus mode from its very first render, with zero flash of free content.

#### Section 4 — Smart Plus Unlock

This is the most delicate part. We use a `setInterval` that targets **only Plus-gated buttons**:

**⚠️ Critical pitfall:** removing `disabled` from ALL buttons breaks the tab player! Songsterr legitimately uses `disabled` during audio loading.

**Solution — three surgical passes:**

1. **Lock SVG icons** — `svg use[href*="lock"]` marks paywalled buttons
2. **Known data-id values** — Plus features have predictable `data-id` attributes (`Speed`, `Loop`, `Solo`, `Print`)
3. **Songsterr's lock class** — `Cny223` is the internal class for locked controls

Player controls (Play, Metronome, navigation) have none of these signals, so they're never touched.

#### Section 5 — The GP7/MIDI Downloader

This is where the magic happens! Inspired by Metaphysics0's approach:

**Step 1:** Read song metadata from the same `<script id="state">` element
**Step 2:** Fetch track data from Songsterr's CloudFront CDN using Chrome headers
**Step 3:** Convert to alphaTab's internal model with precise mappings
**Step 4:** Export to GP7 or MIDI formats

**Key conversions:**

| Concept | Songsterr → alphaTab |
|---|---|
| **Duration** | Fraction `[num, den]` → Duration enum + dots |
| **String index** | `0` = highest string → `1` = lowest string |
| **Bend points** | Hundredths of semitone → Quarter-tones (×2) |
| **Instrument ID** | Internal ID → GM program (0-127) |
| **Percussion** | MIDI note → alphaTab articulation index |

#### Section 6 — Button Injection & SPA Resilience

Songsterr is a React SPA. Navigation between pages destroys our injected buttons. We handle this with:

1. **Permanent MutationObserver** — Re-injects if our buttons disappear
2. **History API hooks** — Detects React Router navigation
3. **Multiple fallback selectors** — Handles Songsterr updates gracefully

---

## 🎵 Special Features

### 🎬 **YouTube Audio-Only Mode** (by パプリカ)

Ever wanted to just listen to the original song while practicing? This feature:

- Adds a 🎵/🎬 toggle button in the toolbar
- Hides YouTube video while preserving audio playback
- Uses opacity:0 and absolute positioning (not display:none) to avoid browser power-saving interruptions
- Persists your preference in localStorage
- Handles dynamically injected iframes with MutationObserver

### 🔄 **Native Autoscroll Fix** (by パプリカ)

Songsterr's CSS changes can break the native autoscroll. パプリカ's fix:

- Surgically removes the problematic `overflow: auto !important` rule
- Protects the Autoscroll button by renaming its `data-id`
- Maintains compatibility with the rest of the script

---

## 🔍 Debug Mode

The script includes a comprehensive debug logging system:

1. Press `F12` to open DevTools
2. Type `toggleSgdLogging()` in the console to enable/disable logging
3. Watch the detailed operation logs in real-time

A green "Logging ON/OFF" button appears in the UI for easy access.

---

## ⚠️ Disclaimer

This project is for educational and cybersecurity research purposes only. It demonstrates advanced browser extension techniques including client-side state spoofing, network interception, and DOM manipulation.

If you use Songsterr regularly, please consider supporting the developers with an official subscription. This script is intended for learning, testing, and personal use scenarios.

---

## 📝 Version History

- **v3.2.1** — Optimized performance, added memory management, improved error handling
- **v3.2.0** — Integrated パプリカ's YouTube Audio-Only and Autoscroll fixes
- **v3.0.x** — Initial GP7/MIDI downloader with Plus unlock

---

**Made with ❤️ for the guitar community, with special thanks to パプリカ and Metaphysics0 for their brilliant contributions!**
