# 🎸 Songsterr Ultimate (v4.0.0)

> **A Tampermonkey userscript that unlocks all Songsterr Plus features and replaces the native export button with high-quality Guitar Pro 7 (.gp) and MIDI (.mid) downloaders built on alphaTab.**

---

## ✨ Features

- **Plus unlock** — Speed control, Loop, Solo/Mute, and Print work without a subscription
- **GP7 download** — full Guitar Pro 7 file with all tracks, tunings, articulations, bends, slides, harmonics, dynamics, repeats, and tempo changes
- **MIDI download** — standard multi-track MIDI with correct General MIDI channel assignments
- **YouTube Audio-Only mode** — Hide video while keeping audio playing (thanks to パプリカ!)
- **Native Autoscroll fix** — Restores proper scrolling behavior (thanks to パプリカ!)
- **Debug logging system** — Real-time operation logs for troubleshooting
- **Memory management** — Intelligent cache cleanup to prevent memory leaks
- **Ad & consent banner removal** — hides all promotional elements and the GDPR popup
- **Smart Plus unlock** — targeted paywall unlock that never touches the player's own disabled buttons

---

## 🚀 Installation

1. Install **Tampermonkey** for your browser: [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) · [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) · [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
2. Open the Tampermonkey dashboard → **Create a new script**
3. Paste the full content of `SongsterrUltimate.user.js` and save (`Ctrl+S`)
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

#### Section 2 — Robust Network Interception

We replace the global `fetch` with a **protected hook** using `Object.defineProperty` with `writable: false` and `configurable: false` to prevent the page from redefining it:

| Route | Action |
|---|---|
| `/auth/profile` | Returns `MAGIC_PROFILE` as fake `200 OK` JSON |
| `sentry` / `logs` / `analytics` | Returns `{}` silently, blocking telemetry |
| `/api/songs/*` / `/api/tab/*` | Caches revision data for our downloader |

**Stealth features:**
- `fetchHooked.toString()` returns the original function's source, defeating integrity checks
- Protected with `Object.defineProperty` to survive any page-side redefinitions
- Falls back gracefully for older browsers

#### Section 3 — Intelligent Memory Management

To prevent memory leaks from accumulated cached data:

```js
const CACHE_SIZE_LIMIT = 50;
function manageCacheSize() {
  if (window.__SGD_REVISION_CACHE.size >= CACHE_SIZE_LIMIT) {
    // Remove oldest 10 entries when limit reached
    const entries = Array.from(window.__SGD_REVISION_CACHE.entries());
    for (let i = 0; i < 10 && i < entries.length; i++) {
      window.__SGD_REVISION_CACHE.delete(entries[i][0]);
    }
  }
}
```

The revision cache automatically cleans up old entries to stay under the 50-song limit.

#### Section 4 — DOM State Injection

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

#### Section 5 — Smart Plus Unlock

This is the most delicate part. We use a `setInterval` that targets **only Plus-gated buttons**:

**⚠️ Critical pitfall:** removing `disabled` from ALL buttons breaks the tab player! Songsterr legitimately uses `disabled` during audio loading.

**Solution — three surgical passes:**

1. **Lock SVG icons** — `svg use[href*="lock"]` marks paywalled buttons
2. **Known data-id values** — Plus features have predictable `data-id` attributes (`Speed`, `Loop`, `Solo`, `Print`)
3. **Songsterr's lock class** — `Cny223` is the internal class for locked controls

**Special handling:** The Autoscroll button is protected separately by パプリカ's fix (data-id renamed to `Auto-Scroll` to avoid conflicts with our setInterval).

Player controls (Play, Metronome, navigation) have none of these signals, so they're never touched.

#### Section 6 — SPA Navigation & Race Condition Prevention

Songsterr is a React SPA with dynamic navigation. We handle this with multiple resilience mechanisms:

**Debounced injection:**
```js
let _injectionTimeout = null;
function debouncedInjection() {
  if (_injectionTimeout) clearTimeout(_injectionTimeout);
  _injectionTimeout = setTimeout(() => {
    tryInjectButtons();
  }, 100);
}
```

**Navigation hooks:**
- Intercept `history.pushState`, `history.replaceState`, and `popstate` events
- Schedule multiple injection attempts (100ms, 500ms, 1200ms) for variable render times
- Track page transition state to block downloads during navigation
- Clear revision cache when changing songs (but preserve for Tab/Chords toggle)

#### Section 7 — Error Handling & Logging

**Improved error filtering:**
Only filters known benign errors (`AudioContext`, `source-map`, etc.) while preserving Songsterr and script-related errors for debugging.

**Comprehensive logging system:**
```js
function sgdLog(level, source, message, data) {
  // Structured logging with source tagging
}
```

Silent `try/catch` blocks now log warnings instead of swallowing errors silently, making debugging much easier.

#### Section 8 — The GP7/MIDI Downloader

This is where the magic happens! Inspired by Metaphysics0's approach:

**Step 1:** Read song metadata from the same `<script id="state">` element (with API fallback when DOM is stale)
**Step 2:** Fetch track data from Songsterr's CloudFront CDN using Chrome headers via `GM_xmlhttpRequest` (bypasses CORS)
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

**CDN Strategy:**
- Primary: `dqsljvtekg760.cloudfront.net`
- Fallback: `d3d3l6a6rcgkaf.cloudfront.net`
- API cache fallback when both CDNs fail
- Full Chrome 124 headers for authentication

#### Section 9 — Button Injection

**Injection target:**
```html
<div id="c-export" class="B3a4pa B3agq5">   ← replaced entirely
  <button id="control-export" title="Download tab">Export</button>
</div>
```

We replace the `#c-export` div with our `#sgd-wrapper`, inheriting the same CSS classes for perfect alignment.

**Three fallback selectors** for Songsterr updates:
1. `#c-export` — stable element ID (primary)
2. `#control-export`'s parent div
3. Any element with `[title*="Download tab"]` or `[data-id*="Export"]`

**Permanent `MutationObserver`** re-injects if our buttons disappear after React re-renders.

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

- **v4.0.0** — Major version: Debug logging system, memory management, SPA navigation improvements, robust fetch hook protection
- **v3.2.0** — Integrated パプリカ's YouTube Audio-Only and Autoscroll fixes
- **v3.0.x** — Initial GP7/MIDI downloader with Plus unlock

---

**Made with ❤️ for the guitar community, with special thanks to パプリカ and Metaphysics0 for their brilliant contributions!**
