// ==UserScript==
// @name         🎸 Songsterr Ultimate
// @namespace    http://tampermonkey.net/
// @version      3.0.1
// @description  Unlocks all Plus features (Speed, Loop, Solo) and Native Download (.gp7 and .midi). (Tested on Zen Browser)
// @author       Goulagman
// @supportURL   https://github.com/GoulagmanYt/Songsterr-Plus-Ultimate-Unlocker-
// @match        *://www.songsterr.com/*
// @require      https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.1/dist/alphaTab.min.js
// @connect      dqsljvtekg760.cloudfront.net
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  console.log('🎸 Songsterr Ultimate — Active v3.1.0');

  // ═══════════════════════════════════════════════════════════════════
  // 0. PREVENTIVE CLEANUP
  // Removes the cached Redux state to force a clean session and prevent
  // the "free" profile from being loaded from localStorage on startup.
  // ═══════════════════════════════════════════════════════════════════
  try { localStorage.removeItem('persist:root'); } catch (e) {}

  // Reference to the real window object (bypasses Tampermonkey's sandbox isolation)
  const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  // ═══════════════════════════════════════════════════════════════════
  // 1. "MAGIC" PLUS PROFILE
  // A random 9-digit ID is generated each session to bypass the server-
  // side daily download quota (HTTP 429 Too Many Requests).
  // The profile object mirrors exactly what Songsterr's /auth/profile
  // endpoint returns for a real Plus subscriber.
  // ═══════════════════════════════════════════════════════════════════
  const MAGIC_ID = Math.floor(Math.random() * 900000000) + 100000000;

  const MAGIC_PROFILE = {
    id                    : MAGIC_ID,
    uid                   : MAGIC_ID,
    email                 : `plususer${MAGIC_ID}@songsterr.com`,
    name                  : 'Plus User (Unlocked)',
    plan                  : 'plus',
    hasPlus               : true,
    permissions           : [],
    subscription          : { plan: { id: 'plus' } },
    bonusPurchasedFeatures: [],
    signature             : 'patched_signature',
    hadPlusBeforeSE       : true
  };

  // ═══════════════════════════════════════════════════════════════════
  // 2. NETWORK INTERCEPTION
  // We hook fetch() very early (document-start) to intercept two routes:
  //   A. /auth/profile  → return our spoofed Plus profile so the React
  //      app believes the user has an active subscription (unlocks
  //      Speed, Loop, Solo controls in the UI).
  //   B. sentry/logs/analytics/useraudio → silently swallow telemetry
  //      requests to prevent tracking during our operations.
  //
  // NOTE: We do NOT intercept /api/edits/download — our GP7/MIDI
  // downloader is superior to the native .gp5 export.
  // ═══════════════════════════════════════════════════════════════════
  const fetchOriginal = targetWindow.fetch;

  const fetchHooked = async function (resource, options) {
    // Determine whether resource is a Request object or a plain URL string
    const isReqObj = typeof resource === 'object' && resource instanceof Request;
    const url = isReqObj ? resource.url : (resource || '');

    // --- A. PROFILE SPOOFING ---
    // Songsterr calls this endpoint to check subscription status.
    // We respond with our forged Plus profile JSON.
    if (url.includes('/auth/profile')) {
      return new Response(JSON.stringify(MAGIC_PROFILE), {
        status : 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // --- B. TELEMETRY BLOCKING ---
    // Silently absorb outgoing analytics and error-logging requests.
    if (url.match(/(sentry|logs|analytics|useraudio)/i)) {
      return new Response('{}', { status: 200 });
    }

    // All other requests pass through unchanged
    return fetchOriginal(resource, options);
  };

  // Stealth mode: toString() returns the original function's source to
  // defeat any integrity checks that compare fetch.toString().
  fetchHooked.toString = () => fetchOriginal.toString();

  // Robust injection using Object.defineProperty so the hook survives
  // any re-definition attempts by the page's own scripts.
  try {
    Object.defineProperty(targetWindow, 'fetch', {
      value      : fetchHooked,
      writable   : true,
      configurable: true
    });
  } catch (e) {
    targetWindow.fetch = fetchHooked; // Fallback for older browsers
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. DOM STATE INJECTION
  // Songsterr stores its full Redux store as JSON inside
  // <script id="state"> on every page. React reads this element during
  // hydration to populate its initial state. We watch for the element
  // with a MutationObserver and patch it before React reads it,
  // injecting hasPlus:true and our fake profile so the app believes
  // the user is subscribed from the very first render.
  // ═══════════════════════════════════════════════════════════════════
  const stateObserver = new MutationObserver(() => {
    const el = document.getElementById('state');
    if (!el) return;
    try {
      const text = el.textContent.trim();
      if (!text) return;
      const data = JSON.parse(text);

      if (!data.user) data.user = {};
      data.user.hasPlus    = true;
      data.user.isLoggedIn = true;
      data.user.profile    = MAGIC_PROFILE;
      // Suppress the GDPR/CCPA consent banner
      data.consent = { loading: false, suite: 'tcf', view: 'none' };

      const patched = JSON.stringify(data);
      if (el.textContent !== patched) el.textContent = patched;
    } catch (e) { /* Invalid JSON, skip silently */ }
  });
  stateObserver.observe(document.documentElement, { childList: true, subtree: true });

  // ═══════════════════════════════════════════════════════════════════
  // 4. CSS — UI CLEANUP + BUTTON STYLES
  // ═══════════════════════════════════════════════════════════════════
  GM_addStyle(`
    /* ── Hide unwanted elements ────────────────────────────────────── */
    section[data-consent="summary"],
    div[class*="Consent"],
    #onetrust-banner-sdk,
    [id*="ad-"],
    [class*="ad-"],
    div[id^="div-gpt-ad"],
    div[class*="Error"]
    { display: none !important; visibility: hidden !important; }

    body, html { overflow: auto !important; }
    #apptab    { opacity: 1 !important; visibility: visible !important; }

    /* ── Our button wrapper ─────────────────────────────────────────── */
    /* Inherits B3a4pa / B3agq5 classes from the replaced #c-export div,
       so vertical alignment inside the flex toolbar is automatic.      */
    #sgd-wrapper {
      display      : inline-flex;
      align-items  : center;
      gap          : 12px;
    }

    /* ── GP7 & MIDI buttons ─────────────────────────────────────────── */
    .sgd-btn {
      display      : inline-flex;
      align-items  : center;
      gap          : 7px;
      padding      : 8px 16px;
      border       : none;
      border-radius: 8px;
      font-size    : 13px;
      font-weight  : 700;
      cursor       : pointer;
      white-space  : nowrap;
      box-shadow   : 0 2px 10px rgba(0,0,0,0.30);
      transition   : opacity .15s, transform .1s;
      font-family  : -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height  : 1;
      letter-spacing: 0.01em;
    }
    .sgd-btn:hover:not(:disabled)  { opacity: .82; transform: translateY(-1px); }
    .sgd-btn:active:not(:disabled) { transform: translateY(0); }
    .sgd-btn:disabled              { opacity: .4; cursor: not-allowed; }
    .sgd-btn-gp   { background: linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; }
    .sgd-btn-midi { background: linear-gradient(135deg,#1e293b,#0f172a); color:#fff; }

    /* ── Status toast — centered at the bottom of the viewport ──────── */
    #sgd-status {
      position     : fixed;
      bottom       : 20px;
      left         : 50%;
      transform    : translateX(-50%);
      background   : rgba(15,23,42,.90);
      color        : #e2e8f0;
      font-size    : 12px;
      font-weight  : 500;
      padding      : 6px 16px;
      border-radius: 20px;
      z-index      : 99999;
      pointer-events: none;
      opacity      : 0;
      transition   : opacity .25s;
      font-family  : -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      white-space  : nowrap;
    }
    #sgd-status.visible { opacity: 1; }
    #sgd-status.ok  { color: #86efac; }
    #sgd-status.err { color: #fca5a5; }
  `);

  // ═══════════════════════════════════════════════════════════════════
  // 5. TARGETED PLUS FEATURE UNLOCK
  //
  // ⚠️ CRITICAL PITFALL: We must NOT remove `disabled` from ALL buttons
  // on the page. Songsterr's tab player legitimately uses `disabled`
  // during its initialization phase (audio loading, tab parsing, etc.).
  // Force-enabling those buttons desynchronizes React's internal state
  // from the DOM → the tab freezes on first load.
  //
  // Strategy: target ONLY buttons locked by the Plus paywall, which are
  // identifiable by one of these three signals:
  //   1. They contain a lock SVG icon  (use[href*="lock"])
  //   2. Their data-id matches a known Plus feature name
  //   3. They carry the Songsterr lock CSS class (Cny223)
  // ═══════════════════════════════════════════════════════════════════

  // Known data-id values for Plus-gated features
  const PLUS_DATA_IDS = ['Speed', 'Loop', 'Solo', 'Autoscroll', 'Print'];

  setInterval(() => {
    // ── 1. Force print mode to "Plus" ────────────────────────────────
    const printEl = document.querySelector('[data-id^="Print--"]');
    if (printEl) printEl.setAttribute('data-id', 'Print--plus');

    // ── 2. Remove lock SVG icons ─────────────────────────────────────
    // React adds <use href*="lock"> inside Plus-gated buttons.
    // We remove the icon and re-enable only its direct button parent.
    document.querySelectorAll('svg use[href*="lock"]').forEach(use => {
      const svg    = use.closest('svg');
      const parent = svg?.closest('button');
      if (svg)    svg.remove();
      if (parent) {
        parent.removeAttribute('disabled');
        parent.classList.remove('Cny223');
        parent.style.pointerEvents = 'auto';
      }
    });

    // ── 3. Unlock Plus buttons by data-id ────────────────────────────
    // We only touch buttons whose data-id matches a known paywall
    // feature — never touching generic player controls.
    PLUS_DATA_IDS.forEach(id => {
      const el = document.querySelector(`[data-id*="${id}"]`);
      if (el && el.hasAttribute('disabled')) {
        el.removeAttribute('disabled');
        el.classList.remove('Cny223');
        el.style.pointerEvents = 'auto';
      }
    });

    // ── 4. Unlock any remaining buttons with Songsterr's lock class ──
    document.querySelectorAll('button.Cny223').forEach(btn => {
      btn.removeAttribute('disabled');
      btn.classList.remove('Cny223');
      btn.style.pointerEvents = 'auto';
    });
  }, 1000);

  // ═══════════════════════════════════════════════════════════════════
  // 6. CONSOLE FILTER
  // Suppress noisy, irrelevant errors that would pollute the console.
  // ═══════════════════════════════════════════════════════════════════
  const consoleErrorOrig = console.error;
  const CONSOLE_FILTERS  = ['AudioContext', 'source-map', 'unreachable', 'buffer', 'Secure-YEC', 'Aborted', '401'];
  console.error = function (...args) {
    if (CONSOLE_FILTERS.some(f => String(args[0]).includes(f))) return;
    consoleErrorOrig.apply(console, args);
  };

  // ═══════════════════════════════════════════════════════════════════
  // ▼▼▼  GP7 / MIDI DOWNLOADER  ▼▼▼
  // ═══════════════════════════════════════════════════════════════════

  // ───────────────────────────────────────────────────────────────────
  // CDN HEADERS
  // Songsterr's tab data lives on a CloudFront CDN that validates the
  // Origin and Referer headers. We spoof a Chrome browser signature so
  // the CDN accepts the request. GM_xmlhttpRequest is required because
  // the browser's fetch() would block these cross-origin requests.
  // ───────────────────────────────────────────────────────────────────
  const CDN_BASE = 'https://dqsljvtekg760.cloudfront.net';

  const CDN_HEADERS = {
    'User-Agent'        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept'            : 'application/json, */*',
    'Accept-Language'   : 'en-US,en;q=0.9',
    'sec-ch-ua'         : '"Chromium";v="124","Google Chrome";v="124"',
    'sec-ch-ua-mobile'  : '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-site'    : 'same-origin',
    'sec-fetch-mode'    : 'cors',
    'sec-fetch-dest'    : 'empty',
    'Referer'           : 'https://www.songsterr.com/',
    'Origin'            : 'https://www.songsterr.com',
    'Cache-Control'     : 'no-cache',
    'Pragma'            : 'no-cache'
  };

  // ───────────────────────────────────────────────────────────────────
  // STEP 1 — READ PAGE METADATA
  // Songsterr embeds all song metadata as JSON inside <script id="state">
  // (the same Redux store we patched in section 3). We extract:
  //   songId     — numeric song identifier
  //   revisionId — current revision of the tab
  //   image      — CDN path segment used to build revision URLs
  //   tracks     — array of track objects, each with a partId
  //   title / artist — used for the output filename
  // ───────────────────────────────────────────────────────────────────
  function getStateFromPage() {
    const el = document.getElementById('state');
    if (!el) throw new Error('#state element not found. Are you on a Songsterr tab page?');
    let parsed;
    try { parsed = JSON.parse(el.textContent || el.innerText); }
    catch (e) { throw new Error('Failed to parse page JSON: ' + e.message); }

    const cur = parsed?.meta?.current;
    if (!cur?.songId || !cur?.revisionId || !cur?.image) {
      throw new Error('Songsterr state payload is missing required fields (songId / revisionId / image).');
    }
    return {
      songId    : cur.songId,
      revisionId: cur.revisionId,
      image     : cur.image,
      title     : cur.title  || 'Song',
      artist    : cur.artist || 'Unknown Artist',
      tracks    : Array.isArray(cur.tracks) ? cur.tracks : []
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // STEP 2 — FETCH REVISION JSONs FROM THE CDN
  // Each track's note data is stored as a separate JSON file on the CDN:
  //   URL pattern: {CDN_BASE}/{songId}/{revisionId}/{image}/{partId}.json
  // All tracks are fetched in parallel via Promise.all.
  // GM_xmlhttpRequest is used to bypass the browser's CORS restrictions.
  // ───────────────────────────────────────────────────────────────────
  function fetchRevisionJson(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method      : 'GET',
        url,
        headers     : CDN_HEADERS,
        responseType: 'json',
        onload : res => {
          if (res.status >= 200 && res.status < 300) resolve(res.response);
          else reject(new Error(`HTTP ${res.status} — ${url}`));
        },
        onerror: err => reject(new Error(`Network error: ${JSON.stringify(err)}`))
      });
    });
  }

  async function fetchAllRevisions(meta) {
    const { songId, revisionId, image, tracks } = meta;
    const validTracks = tracks
      .filter(t => typeof t.partId === 'number')
      .sort((a, b) => a.partId - b.partId);

    if (validTracks.length === 0) throw new Error('No valid tracks found in page metadata.');

    const results = await Promise.all(
      validTracks.map(async track => {
        const url = `${CDN_BASE}/${songId}/${revisionId}/${image}/${track.partId}.json`;
        try {
          return { trackMeta: track, revision: await fetchRevisionJson(url) };
        } catch (err) {
          console.warn(`[SGD] Skipping track ${track.partId}:`, err.message);
          return null;
        }
      })
    );

    const revisions = results.filter(Boolean);
    if (revisions.length === 0) throw new Error('Could not fetch any track data from the CDN.');
    return revisions;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Songsterr duration [num, den] → alphaTab Duration + dots
  // Songsterr encodes durations as a fraction [numerator, denominator].
  // alphaTab uses an enum (Whole=1, Half=2, Quarter=4…) plus a dot count.
  // We find the best match by minimising the delta across all base
  // durations combined with 0, 1, or 2 augmentation dots.
  // ───────────────────────────────────────────────────────────────────
  function mapDuration(dur) {
    const D     = alphaTab.model.Duration;
    const bases = [D.Whole, D.Half, D.Quarter, D.Eighth, D.Sixteenth, D.ThirtySecond, D.SixtyFourth];

    if (!dur?.[0] || !dur?.[1]) return { duration: D.Quarter, dots: 0 };

    const target = dur[0] / dur[1];
    let best = { duration: D.Quarter, dots: 0 };
    let bestDelta = Infinity;

    for (const base of bases) {
      const bv = 1 / Number(base);
      for (const dots of [0, 1, 2]) {
        const dv    = bv + (dots >= 1 ? bv / 2 : 0) + (dots >= 2 ? bv / 4 : 0);
        const delta = Math.abs(dv - target);
        if (delta < bestDelta) { bestDelta = delta; best = { duration: base, dots }; }
      }
    }
    return best;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Tuplet integer → [numerator, denominator]
  // Examples: triplet 3 → [3,2], quintuplet 5 → [5,4], septuplet 7 → [7,4]
  // For unlisted values, the denominator is the nearest lower power of 2.
  // ───────────────────────────────────────────────────────────────────
  function getTupletRatio(t) {
    const map = { 3:[3,2], 5:[5,4], 6:[6,4], 7:[7,4], 9:[9,8], 10:[10,8], 12:[12,8] };
    if (map[t]) return map[t];
    if (t > 1) { const d = Math.pow(2, Math.floor(Math.log2(t))); return [t, d]; }
    return [1, 1];
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Songsterr instrument ID → MIDI program + flags
  // Instrument ID 1024 is Songsterr's code for drums/percussion.
  // Percussion must be routed to MIDI channel 9 (General MIDI standard).
  // All other IDs map directly to GM program numbers (clamped 0–127).
  // ───────────────────────────────────────────────────────────────────
  function mapInstrument(id) {
    if (id === 1024) return { program: 0, isPercussion: true };
    const prog = typeof id === 'number' ? Math.min(Math.max(id, 0), 127) : 24;
    return { program: prog, isPercussion: false };
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Percussion articulation index
  // alphaTab assigns its own internal index to each percussion
  // articulation. To get a stable mapping that survives version changes,
  // we perform a GP7 round-trip: export a minimal percussion score then
  // re-import it and read back the articulation array order.
  // The resulting Map (MIDI note → index) is built once and cached.
  // ───────────────────────────────────────────────────────────────────
  let _percMap = null;

  function buildPercMap() {
    // Build a minimal score with one empty percussion track
    const score = new alphaTab.model.Score();
    const mb    = new alphaTab.model.MasterBar();
    score.addMasterBar(mb);
    const track = new alphaTab.model.Track();
    track.playbackInfo.primaryChannel   = 9;
    track.playbackInfo.secondaryChannel = 9;
    const staff   = new alphaTab.model.Staff();
    staff.isPercussion = true;
    track.addStaff(staff);
    const bar   = new alphaTab.model.Bar();
    const voice = new alphaTab.model.Voice();
    const beat  = new alphaTab.model.Beat();
    beat.isEmpty = true;
    voice.addBeat(beat); bar.addVoice(voice); staff.addBar(bar);
    score.addTrack(track);

    // Export then re-import to read the articulation index order
    const settings  = new alphaTab.Settings();
    score.finish(settings);
    const data       = new alphaTab.exporter.Gp7Exporter().export(score, settings);
    const reimported = alphaTab.importer.ScoreLoader.loadScoreFromBytes(data, settings);

    const map = new Map();
    reimported.tracks[0].percussionArticulations.forEach((a, i) => {
      if (!map.has(a.id)) map.set(a.id, i);
    });
    return map;
  }

  function getPercIndex(midiNote) {
    if (!_percMap) _percMap = buildPercMap();
    return _percMap.get(midiNote) ?? midiNote;
  }

  // ───────────────────────────────────────────────────────────────────
  // LOOKUP TABLES
  // ───────────────────────────────────────────────────────────────────
  const VELOCITY_MAP = {
    ppp: alphaTab.model.DynamicValue.PPP,
    pp : alphaTab.model.DynamicValue.PP,
    p  : alphaTab.model.DynamicValue.P,
    mp : alphaTab.model.DynamicValue.MP,
    mf : alphaTab.model.DynamicValue.MF,
    f  : alphaTab.model.DynamicValue.F,
    ff : alphaTab.model.DynamicValue.FF,
    fff: alphaTab.model.DynamicValue.FFF
  };

  const HARMONIC_MAP = {
    natural   : alphaTab.model.HarmonicType.Natural,
    artificial: alphaTab.model.HarmonicType.Artificial,
    pinch     : alphaTab.model.HarmonicType.Pinch,
    tap       : alphaTab.model.HarmonicType.Tap,
    semi      : alphaTab.model.HarmonicType.Semi,
    feedback  : alphaTab.model.HarmonicType.Feedback
  };

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Build alphaTab MasterBars (global timeline)
  // MasterBars hold the data shared across all tracks: time signatures,
  // section markers, repeat brackets, and tempo automations (BPM).
  // The track with the most measures is used as the master reference.
  // ───────────────────────────────────────────────────────────────────
  function buildMasterBars(score, masterRev, count) {
    let sigNum = 4, sigDen = 4;

    for (let i = 0; i < count; i++) {
      const m  = masterRev?.measures?.[i];
      const s  = m?.signature;

      // Update time signature when a new one is present and valid
      if (Array.isArray(s) && s.length === 2 && s[0] && s[1]) [sigNum, sigDen] = s;

      const mb = new alphaTab.model.MasterBar();
      mb.timeSignatureNumerator   = sigNum;
      mb.timeSignatureDenominator = sigDen;

      // Section marker (e.g. "Verse", "Chorus", "Bridge")
      if (m?.marker) {
        const text = typeof m.marker === 'string' ? m.marker : (m.marker?.text || '');
        const sec  = new alphaTab.model.Section();
        sec.marker = sec.text = text;
        mb.section = sec;
      }

      if (m?.repeatStart)                                                 mb.isRepeatStart    = true;
      if (typeof m?.repeatCount    === 'number' && m.repeatCount > 0)    mb.repeatCount      = m.repeatCount;
      if (typeof m?.alternateEnding === 'number' && m.alternateEnding > 0) mb.alternateEndings = m.alternateEnding;

      score.addMasterBar(mb);
    }

    // Tempo automations — always referenced against a quarter note (index 2)
    const tempo = masterRev?.automations?.tempo;
    if (Array.isArray(tempo)) {
      for (const pt of tempo) {
        const mb = score.masterBars[pt.measure];
        if (!mb) continue;
        const ratio = pt.position > 0 ? Math.max(0, Math.min(1, pt.position / (pt.type || 4))) : 0;
        mb.tempoAutomations.push(
          alphaTab.model.Automation.buildTempoAutomation(false, ratio, pt.bpm, 2, true)
        );
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Songsterr Note → alphaTab Note
  //
  // Two critical coordinate differences:
  //   ★ STRING INDEX: Songsterr string 0 = highest-pitched string.
  //     alphaTab string 1 = lowest-pitched string.
  //     Formula: alphaTab.string = numStrings - songsterr.string
  //
  //   ★ BEND SCALE: Songsterr encodes bend points in hundredths of a
  //     semitone. alphaTab uses quarter-tones.
  //     Formula: alphaTab.tone = songsterr.tone × 2
  // ───────────────────────────────────────────────────────────────────
  function mapNote(nd, isPerc, numStrings) {
    const note  = new alphaTab.model.Note();
    note.string = isPerc ? 0 : numStrings - (nd.string ?? 0);
    note.fret   = nd.fret ?? 0;

    // Percussion notes use an articulation index instead of string/fret
    if (isPerc) note.percussionArticulation = getPercIndex(nd.fret ?? 0);

    if (nd.tie)         note.isTieDestination   = true;
    if (nd.dead)        note.isDead             = true;
    if (nd.ghost)       note.isGhost            = true;
    if (nd.hp)          note.isHammerPullOrigin = true;
    if (nd.staccato)    note.isStaccato         = true;
    if (nd.accentuated) note.accentuated        = alphaTab.model.AccentuationType.Heavy;

    if (nd.wideVibrato)  note.vibrato = alphaTab.model.VibratoType.Wide;
    else if (nd.vibrato) note.vibrato = alphaTab.model.VibratoType.Slight;

    // Harmonic type
    if (nd.harmonic) {
      const ht = HARMONIC_MAP[nd.harmonic.toLowerCase()];
      if (typeof ht === 'number') {
        note.harmonicType = ht;
        if (typeof nd.harmonicFret === 'number') note.harmonicValue = nd.harmonicFret;
      }
    }

    // Slide type mapping
    if (nd.slide) {
      const s = nd.slide.toLowerCase();
      const Out = alphaTab.model.SlideOutType, In = alphaTab.model.SlideInType;
      if      (s === 'shift')                             note.slideOutType = Out.Shift;
      else if (s === 'legato')                            note.slideOutType = Out.Legato;
      else if (s === 'into_from_below' || s === 'below') note.slideInType  = In.IntoFromBelow;
      else if (s === 'into_from_above')                  note.slideInType  = In.IntoFromAbove;
      else if (s === 'out_up')                           note.slideOutType = Out.OutUp;
      else if (s === 'out_down' || s === 'downwards')    note.slideOutType = Out.OutDown;
    }

    // Bend — ★ multiply by 2: Songsterr hundredths → alphaTab quarter-tones
    if (nd.bend?.points?.length > 0) {
      note.bendType = alphaTab.model.BendType.Custom;
      for (const pt of nd.bend.points) {
        note.addBendPoint(new alphaTab.model.BendPoint(
          Math.round(pt.position),
          Math.round(pt.tone * 2)  // ★ scale factor ×2
        ));
      }
    }

    return note;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Songsterr Beat → alphaTab Beat
  // Handles: durations, dots, tuplets, dynamics, pick stroke,
  // beat-level vibrato, and palm mute.
  // ───────────────────────────────────────────────────────────────────
  function mapBeat(bd, masterBar, isPerc, numStrings) {
    const beat = new alphaTab.model.Beat();
    if (bd.rest) beat.isEmpty = true;

    const dur    = mapDuration(bd.duration);
    beat.duration = dur.duration;
    beat.dots     = bd.dots ?? dur.dots;

    if (bd.text) beat.text = bd.text;

    // Tuplet: recompute base duration from the `type` denominator field
    if (typeof bd.tuplet === 'number' && bd.tuplet > 1) {
      const [n, d]    = getTupletRatio(bd.tuplet);
      beat.tupletNumerator   = n;
      beat.tupletDenominator = d;
      if (typeof bd.type === 'number' && bd.type > 0) {
        beat.duration = mapDuration([1, bd.type]).duration;
        beat.dots     = bd.dots ?? 0;
      }
    }

    // Dynamic (velocity) level
    if (typeof bd.velocity === 'string') {
      const dyn = VELOCITY_MAP[bd.velocity.toLowerCase()];
      if (typeof dyn === 'number') beat.dynamics = dyn;
    }

    // Pick stroke direction
    if (typeof bd.pickStroke === 'string') {
      const ps = bd.pickStroke.toLowerCase();
      if (ps === 'down') beat.pickStroke = alphaTab.model.PickStroke.Down;
      else if (ps === 'up') beat.pickStroke = alphaTab.model.PickStroke.Up;
    }

    // Beat-level vibrato
    if (bd.wideVibrato || bd.vibratoWithTremoloBar) beat.vibrato = alphaTab.model.VibratoType.Wide;
    else if (bd.vibrato)                            beat.vibrato = alphaTab.model.VibratoType.Slight;

    if (bd.palmMute) beat.isPalmMute = true;

    // Add all notes to this beat
    for (const nd of (bd.notes || [])) {
      if (!nd.rest) beat.addNote(mapNote(nd, isPerc, numStrings));
    }

    return beat;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Fill an empty voice with rest beats
  // Used when a measure has no beat data (full-measure rest).
  // One rest beat is added per beat of the time signature numerator.
  // ───────────────────────────────────────────────────────────────────
  function fillWithRests(voice, masterBar) {
    const num = masterBar.timeSignatureNumerator   || 4;
    const den = masterBar.timeSignatureDenominator || 4;
    const dur = mapDuration([1, den]);
    for (let i = 0; i < num; i++) {
      const rest = new alphaTab.model.Beat();
      rest.isEmpty  = true;
      rest.duration = dur.duration;
      rest.dots     = dur.dots;
      voice.addBeat(rest);
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Build a complete alphaTab Track
  // Handles:
  //   • Tuning: Songsterr stores strings high→low, alphaTab expects the
  //     raw array as-is (the constructor handles the direction).
  //   • Percussion: forced to MIDI channel 9 (GM standard).
  //   • Measures: iterates all master bars; empty ones get rest voices.
  // ───────────────────────────────────────────────────────────────────
  function buildTrack(score, entry, masterBarCount, channel) {
    const { trackMeta, revision } = entry;
    const playback = mapInstrument(trackMeta.instrumentId ?? revision.instrumentId);
    const isPerc   = playback.isPercussion || !!trackMeta.isDrums;

    const track = new alphaTab.model.Track();
    track.name      = trackMeta.title || trackMeta.name || revision.name || 'Track';
    track.shortName = track.name.slice(0, 20);
    track.playbackInfo.program          = playback.program;
    track.playbackInfo.primaryChannel   = channel;
    track.playbackInfo.secondaryChannel = channel;

    const staff = new alphaTab.model.Staff();
    staff.isPercussion = isPerc;

    // ★ Tuning array passed as-is from Songsterr (high→low order)
    const tuning = revision.tuning || trackMeta.tuning;
    if (Array.isArray(tuning) && tuning.length > 0 && !isPerc) {
      staff.stringTuning = new alphaTab.model.Tuning('Custom', tuning, false);
    }
    const numStrings = Array.isArray(tuning) ? tuning.length : 6;

    for (let mi = 0; mi < masterBarCount; mi++) {
      const bar    = new alphaTab.model.Bar();
      const m      = revision.measures?.[mi];
      const mb     = score.masterBars[mi];
      const voices = m?.voices || [];

      if (voices.length === 0) {
        const v = new alphaTab.model.Voice();
        fillWithRests(v, mb);
        bar.addVoice(v);
      } else {
        for (const sv of voices) {
          const v    = new alphaTab.model.Voice();
          const bts  = sv?.beats || [];
          if (bts.length === 0 || sv?.rest) {
            fillWithRests(v, mb);
          } else {
            for (const bd of bts) v.addBeat(mapBeat(bd, mb, isPerc, numStrings));
            if (v.beats.length === 0) fillWithRests(v, mb);
          }
          bar.addVoice(v);
        }
      }
      staff.addBar(bar);
    }

    track.addStaff(staff);
    score.addTrack(track);
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Assemble the complete alphaTab Score
  // The track with the most measures is elected as the "master" track
  // whose measure data drives MasterBar construction.
  // MIDI channels 0–15 are assigned sequentially; channel 9 is always
  // reserved for percussion (General MIDI specification).
  // score.finish() is mandatory before any export — it finalises all
  // internal cross-references within the score model.
  // ───────────────────────────────────────────────────────────────────
  function buildScore(meta, revisions) {
    const score   = new alphaTab.model.Score();
    score.title   = meta.title;
    score.artist  = meta.artist;
    score.tab     = 'Songsterr Ultimate v3';

    // Elect the track with the most measures as the master reference
    const masterRev = revisions.reduce((best, cur) =>
      (cur.revision?.measures?.length || 0) > (best.revision?.measures?.length || 0) ? cur : best
    ).revision;

    const masterBarCount = Math.max(1,
      revisions.reduce((m, e) => Math.max(m, e.revision?.measures?.length || 0), 0)
    );

    buildMasterBars(score, masterRev, masterBarCount);

    // Assign MIDI channels (0–15), skipping channel 9 for non-percussion
    let nextChannel = 0;
    for (const entry of revisions) {
      const id    = entry.trackMeta.instrumentId ?? entry.revision.instrumentId;
      const isPerc = id === 1024 || !!entry.trackMeta.isDrums;
      let channel;
      if (isPerc) {
        channel = 9; // GM spec: channel 9 is always percussion
      } else {
        if (nextChannel === 9) nextChannel++; // Skip the reserved drum channel
        channel = nextChannel++;
      }
      buildTrack(score, entry, masterBarCount, channel);
    }

    const settings = new alphaTab.Settings();
    score.finish(settings); // ★ Mandatory — finalises all internal linkage
    return { score, settings };
  }

  // ───────────────────────────────────────────────────────────────────
  // EXPORT GP7 — Returns a Uint8Array in Guitar Pro 7 (.gp) format
  // ───────────────────────────────────────────────────────────────────
  function exportGP7(meta, revisions) {
    const { score, settings } = buildScore(meta, revisions);
    return new alphaTab.exporter.Gp7Exporter().export(score, settings);
  }

  // ───────────────────────────────────────────────────────────────────
  // EXPORT MIDI — Returns a Uint8Array in standard MIDI (.mid) format
  // ───────────────────────────────────────────────────────────────────
  function exportMIDI(meta, revisions) {
    const { score, settings } = buildScore(meta, revisions);
    const midiFile  = new alphaTab.midi.MidiFile();
    const handler   = new alphaTab.midi.AlphaSynthMidiFileHandler(midiFile, true);
    new alphaTab.midi.MidiFileGenerator(score, settings, handler).generate();
    return midiFile.toBinary();
  }

  // ───────────────────────────────────────────────────────────────────
  // UTILITY — Trigger a browser file download from a Uint8Array
  // Creates a temporary object URL, clicks it, then revokes it.
  // ───────────────────────────────────────────────────────────────────
  function triggerDownload(bytes, fileName, mime) {
    const blob = new Blob([bytes], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Sanitize a title into a safe filename (no special characters)
  function safeName(str) {
    return str.replace(/[^a-zA-Z0-9 _\-]/g, '').trim().replace(/\s+/g, '_') || 'tab';
  }

  // ───────────────────────────────────────────────────────────────────
  // UI — Status toast (centered bottom of viewport)
  // Lazily created on first use, auto-hides after a given duration.
  // ───────────────────────────────────────────────────────────────────
  let _toastTimer = null;
  let _toast = null;

  function getToast() {
    if (!_toast) {
      _toast = document.createElement('div');
      _toast.id = 'sgd-status';
      document.body.appendChild(_toast);
    }
    return _toast;
  }

  function showStatus(msg, type = '', duration = 4500) {
    const t = getToast();
    t.textContent = msg;
    t.className   = 'visible ' + type;
    clearTimeout(_toastTimer);
    if (duration > 0) {
      _toastTimer = setTimeout(() => { t.className = ''; }, duration);
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // MAIN DOWNLOAD FLOW — triggered on button click
  // Four sequential steps:
  //   1. Read song metadata from the #state element
  //   2. Fetch all revision JSONs from the CloudFront CDN
  //   3. Convert to GP7 or MIDI via alphaTab
  //   4. Trigger browser download
  // ───────────────────────────────────────────────────────────────────
  async function handleDownload(format, btnGP, btnMID) {
    btnGP.disabled  = true;
    btnMID.disabled = true;
    showStatus('⏳ Reading page state…', '', 0);

    try {
      // Step 1 — extract metadata from #state
      const meta = getStateFromPage();
      showStatus(`⏳ Fetching ${meta.tracks.length} track(s) from CDN…`, '', 0);

      // Step 2 — download all revision JSONs
      const revisions = await fetchAllRevisions(meta);
      showStatus(`⚙️ Converting ${revisions.length} track(s) → ${format.toUpperCase()}…`, '', 0);

      // Step 3 — build and export
      const name = safeName(`${meta.artist} - ${meta.title}`);
      let bytes, fileName, mime;

      if (format === 'gp') {
        bytes    = exportGP7(meta, revisions);
        fileName = `${name}.gp`;
        mime     = 'application/gp';
      } else {
        bytes    = exportMIDI(meta, revisions);
        fileName = `${name}.mid`;
        mime     = 'audio/midi';
      }

      // Step 4 — trigger browser download
      triggerDownload(bytes, fileName, mime);
      showStatus(`✅ "${fileName}" downloaded!`, 'ok');

    } catch (err) {
      console.error('[SGD] Download failed:', err);
      showStatus(`❌ ${err.message}`, 'err', 7000);
    } finally {
      btnGP.disabled  = false;
      btnMID.disabled = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. BUTTON INJECTION — Replaces the native export button
  //
  // DOM structure (from reverse-engineering the page HTML):
  //   <div id="c-export" class="B3a4pa B3agq5">   ← our injection target
  //     <button id="control-export" ...>Export</button>
  //   </div>
  //
  // The controls bar (.B3a1lv) is a flex container. Each item carries
  // the classes B3a4pa + B3agq5 which handle vertical alignment.
  // We replace the entire #c-export div and give our wrapper those same
  // classes so it sits at exactly the same position in the bar.
  //
  // SPA resilience:
  //   • Permanent MutationObserver: re-injects if #sgd-wrapper disappears
  //     after a React re-render (e.g. switching Tab ↔ Chords view)
  //   • history.pushState / replaceState / popstate hooks: detect SPA
  //     navigation and schedule re-injection after React re-renders
  // ═══════════════════════════════════════════════════════════════════

  // Only inject on tab/chords song pages, not on the homepage or artist pages
  function isTabPage() {
    return /\/a\/wsa\/.+/.test(location.pathname);
  }

  function createOurButtons() {
    // Reuse the native container's CSS classes for automatic flex alignment
    const wrapper     = document.createElement('div');
    wrapper.id        = 'sgd-wrapper';
    wrapper.className = 'B3a4pa B3agq5'; // same classes as the replaced #c-export div

    const btnGP      = document.createElement('button');
    btnGP.className  = 'sgd-btn sgd-btn-gp';
    btnGP.innerHTML  = '🎸 GP7';
    btnGP.title      = 'Download Guitar Pro 7 (.gp)';

    const btnMID     = document.createElement('button');
    btnMID.className = 'sgd-btn sgd-btn-midi';
    btnMID.innerHTML = '🎹 MIDI';
    btnMID.title     = 'Download MIDI (.mid)';

    btnGP.addEventListener('click',  () => handleDownload('gp',   btnGP, btnMID));
    btnMID.addEventListener('click', () => handleDownload('midi', btnGP, btnMID));

    wrapper.appendChild(btnGP);
    wrapper.appendChild(btnMID);
    return wrapper;
  }

  function tryInjectButtons() {
    if (!isTabPage()) return false;

    // Already injected and still connected to the DOM — nothing to do
    if (document.getElementById('sgd-wrapper')?.isConnected) return true;

    // ── Primary target: #c-export (stable React ID) ──────────────────
    const cExport = document.getElementById('c-export');
    if (cExport) {
      cExport.replaceWith(createOurButtons());
      console.log('[SGD] ✅ Injected (#c-export)');
      return true;
    }

    // ── Fallback 1: parent of #control-export button ─────────────────
    const ctrlExport = document.getElementById('control-export');
    if (ctrlExport) {
      (ctrlExport.closest('div') || ctrlExport.parentElement).replaceWith(createOurButtons());
      console.log('[SGD] ✅ Injected (#control-export parent)');
      return true;
    }

    // ── Fallback 2: any element with a download-related title/data-id ─
    const nativeBtn = document.querySelector(
      '[data-id*="Download"], [data-id*="Export"], [title*="Download tab"]'
    );
    if (nativeBtn) {
      (nativeBtn.closest('div') || nativeBtn.parentElement).replaceWith(createOurButtons());
      console.log('[SGD] ✅ Injected (fallback title/data-id)');
      return true;
    }

    return false; // Target not in DOM yet — will retry via MutationObserver
  }

  // Permanent MutationObserver: re-injects whenever #sgd-wrapper is
  // removed from the DOM (React re-render after tab ↔ chords switch)
  const btnObserver = new MutationObserver(() => {
    if (!document.getElementById('sgd-wrapper')?.isConnected) {
      tryInjectButtons();
    }
  });

  // SPA navigation hook.
  // React Router uses history.pushState to navigate without a page reload.
  // We schedule three injection attempts with increasing delays to cover
  // slow initial renders and lazy-loaded components.
  function onSpaNavigate() {
    setTimeout(tryInjectButtons, 300);
    setTimeout(tryInjectButtons, 900);
    setTimeout(tryInjectButtons, 1800);
  }

  const _pushState    = history.pushState.bind(history);
  history.pushState   = function (...a) { _pushState(...a);     onSpaNavigate(); };
  const _replaceState = history.replaceState.bind(history);
  history.replaceState = function (...a) { _replaceState(...a); onSpaNavigate(); };
  window.addEventListener('popstate', onSpaNavigate); // Back/Forward browser buttons

  // Bootstrap
  function startObserving() {
    const go = () => {
      btnObserver.observe(document.body, { childList: true, subtree: true });
      tryInjectButtons();
    };
    if (document.body) go();
    else document.addEventListener('DOMContentLoaded', go);
  }

  startObserving();

})();
