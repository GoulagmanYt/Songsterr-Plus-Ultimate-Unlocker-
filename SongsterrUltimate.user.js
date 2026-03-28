// ==UserScript==
// @name           🎸 Songsterr Ultimate (Premium Unlocked)
// @name:en        🎸 Songsterr Ultimate (Premium Unlocked)
// @name:fr        🎸 Songsterr Ultime (Premium Débloqué)
// @name:es        🎸 Songsterr Definitivo (Premium Desbloqueado)
// @name:de        🎸 Songsterr Ultimativ (Premium Freigeschaltet)
// @name:it        🎸 Songsterr Definitivo (Premium Sbloccato)
// @name:pt        🎸 Songsterr Supremo (Premium Desbloqueado)
// @name:pt-BR     🎸 Songsterr Supremo (Full Premium)
// @name:nl        🎸 Songsterr Ultiem (Premium Ontgrendeld)
// @name:pl        🎸 Songsterr Ostateczny (Premium Odblokowany)
// @name:ru        🎸 Songsterr Абсолютный (Премиум Разблокирован)
// @name:ja        🎸 Songsterr 究極 (プレミアム解除)
// @name:ko        🎸 Songsterr 궁극 (프리미엄 언락)
// @name:sv        🎸 Songsterr Ultimat (Premium Upplåst)
// @name:da        🎸 Songsterr Ultimativ (Premium Låst Op)
// @namespace    http://tampermonkey.net/
// @version      4.0.0
// @description                    Unlocks all Plus features (Speed, Loop, Solo, Mute, no pauses) + Native Export (.gp & .midi). (Tested on Zen Browser)
// @description:fr                 Débloque toutes les fonctionnalités Plus (Vitesse, Loop, Solo, Mute, sans pauses) + Téléchargement natif (.gp & .midi). (Testé sur Zen Browser)
// @description:es                 Desbloquea todas las funciones Plus (Velocidad, Bucle, Solo, Mute, sin pausas) + Descarga nativa (.gp y .midi). (Probado en Zen Browser)
// @description:de                 Schaltet alle Plus-Features frei (Geschwindigkeit, Loop, Solo, Mute, ohne Pausen) + Nativer Download (.gp & .midi). (Getestet auf Zen Browser)
// @description:it                 Sblocca tutte le funzioni Plus (Velocità, Loop, Solo, Mute, senza pause) + Download nativo (.gp e .midi). (Testato su Zen Browser)
// @description:pt                 Desbloqueia todos os recursos Plus (Velocidade, Loop, Solo, Mute, sem pausas) + Download nativo (.gp e .midi). (Testado no Zen Browser)
// @description:pt-BR              Desbloqueia tudo do Plus (Velocidade, Loop, Solo, Mute, sem pausas) + Export nativo (.gp & .midi). (Testado no Zen Browser)
// @description:nl                 Ontgrendelt alle Plus-functies (Snelheid, Loop, Solo, Mute, geen pauzes) + Native download (.gp & .midi). (Getest op Zen Browser)
// @description:pl                 Odblokowuje wszystkie funkcje Plus (Prędkość, Pętla, Solo, Mute, bez przerw) + Natywny eksport (.gp i .midi). (Testowane na Zen Browser)
// @description:ru                 Разблокирует все функции Plus (Скорость, Петля, Соло, Mute, без пауз) + Нативный экспорт (.gp и .midi). (Протестировано в Zen Browser)
// @description:ja                 Plusの全機能（速度、ループ、ソロ、ミュート、無停止）を解除 + ネイティブダウンロード（.gp & .midi）。(Zen Browserでテスト済み)
// @description:ko                 모든 Plus 기능 해제 (속도, 루프, 솔로, 뮤트, 멈춤 없음) + 네이티브 다운로드 (.gp & .midi). (Zen Browser에서 테스트됨)
// @description:sv                 Låser upp alla Plus-funktioner (Hastighet, Loop, Solo, Mute, inga pauser) + Naturlig export (.gp & .midi). (Testat på Zen Browser)
// @description:da                 Låser alle Plus-funktioner op (Hastighed, Loop, Solo, Mute, ingen pauser) + Naturlig download (.gp & .midi). (Testet på Zen Browser)
// @author       Goulagman
// @supportURL   https://github.com/GoulagmanYt/Songsterr-Plus-Ultimate-Unlocker-
// @match        *://www.songsterr.com/*
// @require      https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.1/dist/alphaTab.min.js
// @connect      dqsljvtekg760.cloudfront.net
// @connect      d3d3l6a6rcgkaf.cloudfront.net
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/564818/%F0%9F%8E%B8%20Songsterr%20Ultimate%20%28Premium%20Unlocked%29.user.js
// @updateURL https://update.greasyfork.org/scripts/564818/%F0%9F%8E%B8%20Songsterr%20Ultimate%20%28Premium%20Unlocked%29.meta.js
// ==/UserScript==

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // LOGGING SYSTEM with Toggle
  // ═══════════════════════════════════════════════════════════════════
  const LOG_KEY = 'songsterr_debug_logging';
  let loggingEnabled = false;
  try {
    loggingEnabled = localStorage.getItem(LOG_KEY) === 'true';
  } catch (e) {}

  // Wrapper for console logging - supports different prefixes
  function sgdLog(level, prefix, ...args) {
    if (!loggingEnabled) return;
    const fullPrefix = prefix ? `[${prefix}]` : '[SGD]';
    if (level === 'error') console.error(fullPrefix, ...args);
    else if (level === 'warn') console.warn(fullPrefix, ...args);
    else console.log(fullPrefix, ...args);
  }

  // Toggle logging function
  window.toggleSgdLogging = function() {
    loggingEnabled = !loggingEnabled;
    try {
      localStorage.setItem(LOG_KEY, loggingEnabled);
    } catch (e) {}
    console.log(`🎸 Songsterr Ultimate — Logging ${loggingEnabled ? 'ENABLED' : 'DISABLED'}`);
    updateLogToggleUI();
  };

  // Update toggle button UI
  function updateLogToggleUI() {
    const btn = document.getElementById('sgd-log-toggle');
    if (btn) {
      btn.innerHTML = `<span style="font-size: 16px;">📋</span> <span style="font-weight: 700;">Logging</span> <span style="font-size: 14px;">${loggingEnabled ? 'ON' : 'OFF'}</span>`;
      btn.title = loggingEnabled ? 'Debug logging enabled (click to disable)' : 'Debug logging disabled (click to enable)';
      btn.classList.toggle('active', loggingEnabled);
      // Colors are handled by CSS classes (.active / :not(.active))
    }
  }

  // Inject logging toggle into Gl5687 div
  function injectLogToggle() {
    const targetDiv = document.querySelector('.Gl5687');
    if (!targetDiv || document.getElementById('sgd-log-toggle')) return;

    // Style the target div to allow centering
    targetDiv.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
      height: 100% !important;
    `;

    const btn = document.createElement('button');
    btn.id = 'sgd-log-toggle';
    btn.className = 'sgd-log-toggle-btn';
    btn.innerHTML = `<span style="font-size: 16px;">📋</span> <span style="font-weight: 700;">Logging</span> <span style="font-size: 14px;">${loggingEnabled ? 'ON' : 'OFF'}</span>`;
    btn.title = loggingEnabled ? 'Debug logging enabled (click to disable)' : 'Debug logging disabled (click to enable)';
    btn.addEventListener('click', window.toggleSgdLogging);

    // Style the button - dark theme matching Songsterr
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border: 1px solid ${loggingEnabled ? '#16a34a' : '#dc2626'};
      border-radius: 6px;
      background: ${loggingEnabled ? '#166534' : '#7f1d1d'};
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      transition: all 0.15s ease;
      min-width: 120px;
      height: 36px;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = loggingEnabled ? '#15803d' : '#991b1b';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = loggingEnabled ? '#166534' : '#7f1d1d';
    });

    targetDiv.appendChild(btn);
  }

  // Watch for Gl5687 div to appear
  const logToggleObserver = new MutationObserver(() => {
    injectLogToggle();
  });
  logToggleObserver.observe(document.documentElement, { childList: true, subtree: true });

  // Initial log
  console.log('🎸 Songsterr Ultimate — Active v4.0.0', loggingEnabled ? '(Debug logging ON)' : '');

  // Replace all console.log throughout the script with sgdLog
  // (This will be done via find/replace in subsequent edits)

  // ═══════════════════════════════════════════════════════════════════
  // YOUTUBE AUDIO-ONLY SYSTEM (contribution パプリカ)
  // ═══════════════════════════════════════════════════════════════════
  (function() {
    'use strict';

    // To avoid audio stopping issues (browser power-saving features, etc.),
    // we don't use display: none for parent elements either. Instead we use
    // size 0, transparency, and absolute positioning to completely
    // remove them from visual view while keeping them functional.
    const style = document.createElement('style');
    style.id = 'paprika-yt-styles';
    style.textContent = `
        /* Hide iframe itself (exists in DOM, audio continues playing) */
        .songsterr-yt-hidden-iframe {
            opacity: 0 !important;
            width: 0px !important;
            height: 0px !important;
            pointer-events: none !important;
            position: absolute !important;
            z-index: -9999 !important;
            border: none !important;
        }
        
        /* Hide iframe parent wrapper/background frame elements */
        .songsterr-yt-hidden-wrapper {
            opacity: 0 !important;
            width: 0px !important;
            height: 0px !important;
            min-width: 0px !important;
            min-height: 0px !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            overflow: hidden !important;
            background: transparent !important;
            position: absolute !important;
            pointer-events: none !important;
            z-index: -9999 !important;
        }
        
        /* YouTube Audio-Only toggle button - dark theme */
        #yt-toggle-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 6px;
            border: 1px solid #3a3a3a;
            background: #2a2a2a;
            color: #a5a5a5;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.15s ease;
        }
        #yt-toggle-btn:hover { background: #3a3a3a; color: #e5e5e5; }
        #yt-toggle-btn.audio-only { background: #16a34a; color: #fff; border-color: #22c55e; }
        #yt-toggle-btn.audio-only:hover { background: #15803d; border-color: #16a34a; }
    `;
    
    if (document.head) {
        document.head.appendChild(style);
    } else {
        document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    }

    // Audio-only mode state (persistent via localStorage)
    const YT_AUDIO_KEY = 'songsterr_yt_audio_only';
    let ytAudioOnlyMode = false;
    try {
        ytAudioOnlyMode = localStorage.getItem(YT_AUDIO_KEY) === 'true';
    } catch (e) {}

    /**
     * Function to detect and hide YouTube iframes and multi-level frames (black backgrounds, etc.)
     */
    function hideYouTubeIframes() {
        if (!ytAudioOnlyMode) return; // Only hide if audio-only mode is activated
        
        const iframes = document.querySelectorAll('iframe');
        const keywords = /(player|video|youtube)/i;
        
        iframes.forEach(iframe => {
            const src = iframe.src || '';
            if (src.includes('youtube.com') || src.includes('youtu.be')) {
                
                if (!iframe.classList.contains('songsterr-yt-hidden-iframe')) {
                    // 1. Make iframe itself invisible
                    iframe.classList.add('songsterr-yt-hidden-iframe');
                    
                    // 2. Process parent elements across multiple levels (up to 5 levels)
                    let currentParent = iframe.parentElement;
                    let level = 0;
                    
                    while (currentParent && level < 5) {
                        // Stop when reaching body or html
                        if (currentParent.tagName === 'BODY' || currentParent.tagName === 'HTML') {
                            break;
                        }

                        const className = typeof currentParent.className === 'string' ? currentParent.className : '';
                        const idName = currentParent.id || '';
                        
                        // Immediate wrappers (1-2 level parents) often have fixed size or black backgrounds, so hide unconditionally.
                        // For higher levels (3-5 levels), hide only if class name or ID contains player/video/youtube etc.
                        if (level < 2 || keywords.test(className) || keywords.test(idName)) {
                            currentParent.classList.add('songsterr-yt-hidden-wrapper');
                        }
                        
                        currentParent = currentParent.parentElement;
                        level++;
                    }
                }
            }
        });
    }

    // Function to show/hide iframes based on mode
    function updateYtVisibility() {
        if (ytAudioOnlyMode) {
            hideYouTubeIframes();
        } else {
            // Video mode: remove hiding classes
            document.querySelectorAll('.songsterr-yt-hidden-iframe').forEach(el => {
                el.classList.remove('songsterr-yt-hidden-iframe');
            });
            document.querySelectorAll('.songsterr-yt-hidden-wrapper').forEach(el => {
                el.classList.remove('songsterr-yt-hidden-wrapper');
            });
        }
        // Update button
        const btn = document.getElementById('yt-toggle-btn');
        if (btn) {
            btn.innerHTML = ytAudioOnlyMode ? '🎵' : '🎬';
            btn.title = ytAudioOnlyMode ? 'Audio-only mode (click to show video)' : 'Video visible (click for audio-only)';
            btn.classList.toggle('audio-only', ytAudioOnlyMode);
        }
    }

    // Expose toggle function globally
    window.toggleYtAudioOnly = function() {
        ytAudioOnlyMode = !ytAudioOnlyMode;
        try {
            localStorage.setItem(YT_AUDIO_KEY, ytAudioOnlyMode);
        } catch (e) {}
        updateYtVisibility();
    };

    // Initialize state
    hideYouTubeIframes();

    // Setup MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;

        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                shouldCheck = true;
                break;
            }
            if (mutation.type === 'attributes' && mutation.target.tagName === 'IFRAME') {
                shouldCheck = true;
                break;
            }
        }
        
        if (shouldCheck) {
            hideYouTubeIframes();
        }
    });

    function startObserving() {
        if (!document.body) return;
        
        hideYouTubeIframes();
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src']
        });
        sgdLog('log', 'Songsterr YT Hider', 'Started monitoring (パプリカ版 + toggle)');
    }

    if (document.body) {
        startObserving();
    } else {
        document.addEventListener('DOMContentLoaded', startObserving);
    }
  })();

  // ═══════════════════════════════════════════════════════════════════
  // AUTOSCROLL FIX (contribution パプリカ)
  // ═══════════════════════════════════════════════════════════════════
  (function() {
    'use strict';

    sgdLog('log', 'Songsterr Native Restore', 'Initializing native auto-scroll recovery...');

    // ==========================================
    // 1. Disable CSS interference (restore scroll container)
    // ==========================================
    // SongsterrUltimate injects `body, html { overflow: auto !important; }` into <style>,
    // but this completely breaks Songsterr's coordinate calculations for scrolling.
    // We surgically remove only this specific harmful CSS rule (while keeping
    // other Ultimate UI fixes intact).
    function fixCSS() {
        const styles = document.querySelectorAll('style');
        styles.forEach(style => {
            const cssText = style.textContent;
            // Check if it contains the specific harmful CSS rule
            if (cssText.includes('body, html') && cssText.includes('overflow: auto !important')) {
                // Safely remove only the lines blocking auto-scroll (keep other Ultimate UI fix CSS)
                style.textContent = cssText.replace(/body,\s*html\s*\{\s*overflow:\s*auto\s*!important;\s*\}/g, '');
            }
        });
        
        // As extra safety, force return to native behavior from highest priority inline styles
        // Return to normal browser default 'visible' (or 'initial') to restore scrolling in window class
        document.body.style.setProperty('overflow', 'visible', 'important');
        document.documentElement.style.setProperty('overflow', 'visible', 'important');
    }

    // ==========================================
    // 2. Prevent React state and DOM desync
    // ==========================================
    // The Ultimate script uses setInterval(1000ms) to forcefully remove
    // the `disabled` attribute. But when React still thinks "still initializing
    // so disabled=true" and only the DOM is enabled, clicking causes a
    // deadlock (desync) where React's event handlers don't respond.
    // We isolate the Autoscroll button from Ultimate's periodic execution
    // tool and return 100% native React management.
    function protectButton() {
        // Look for native buttons with data-id containing 'Autoscroll'
        const autoscrollBtns = document.querySelectorAll('[data-id*="Autoscroll"]');
        
        autoscrollBtns.forEach(btn => {
            const origId = btn.getAttribute('data-id');
                // Rename to avoid being caught by Ultimate's monitoring selector `[data-id*="Autoscroll"]`
                // (React itself doesn't use data-id for onClick etc. operations, so functionality remains)
                if (origId && origId.includes('Autoscroll') && !origId.includes('Auto-Scroll')) {
                    const safeId = origId.replace('Autoscroll', 'Auto-Scroll'); 
                btn.setAttribute('data-id', safeId);
                sgdLog('log', 'Songsterr Native Restore', 'Protected Autoscroll button from external setInterval overwrites.');
                
                // Attribute change notification to React tree (promotes re-rendering and event listener activation)
                // Direct state manipulation is avoided; we use fake events for safe indirect stimulation
                btn.dispatchEvent(new MouseEvent('focus', { bubbles: true }));
                btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                }
        });
    }

    // ==========================================
    // 3. Execution timing and continuous monitoring (MutationObserver)
    // ==========================================
    // Due to SPA configuration where DOM is dynamically rewritten, we capture
    // UI rendering timing and apply fixes.
    const observer = new MutationObserver(() => {
        let shouldFix = false;
        for (const mutation of mutations) {
            // Execute only when new nodes (buttons or style tags) are added
            if (mutation.addedNodes.length > 0) {
                shouldFix = true;
                break;
            }
        }
        
        if (shouldFix) {
            fixCSS();
            protectButton();
        }
    });

    // Start monitoring
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: false // Prevent unnecessary loopback by not tracking attribute changes
    });

    // Initialization timing (fail-safe to absorb UI rendering timing fluctuations)
    setTimeout(() => {
        fixCSS();
        protectButton();
    }, 500);
    setTimeout(() => {
        fixCSS();
        protectButton();
    }, 2000);
  })();

  // Remove Autoscroll from list to avoid conflicts with パプリカ's fix
  const PLUS_DATA_IDS = ['Speed', 'Loop', 'Solo', 'Print'];
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
  // 2. NETWORK INTERCEPTION - The heart of the exploit!
  // ═══════════════════════════════════════════════════════════════════
  // We hook fetch() very early (document-start) to intercept:
  //   A. /auth/profile → return our fake Plus profile so React thinks
  //      we have an active subscription (unlocks Speed, Loop, Solo)
  //   B. /api/songs/* or /api/tab/* → cache revision data for our
  //      download system (CDN is protected now)
  //   C. sentry/logs/analytics/useraudio → silently block telemetry
  //
// IMPORTANT NOTE: We DON'T intercept /api/edits/download because our
// GP7/MIDI download system is far superior to native .gp5 export
  // ═══════════════════════════════════════════════════════════════════
  const fetchOriginal = targetWindow.fetch;

  // Cache to store intercepted revision data from Songsterr's API
  // This replaces the need to fetch directly from the protected CDN
  window.__SGD_REVISION_CACHE = new Map();
  
  // Cache size limit to prevent memory leaks (max 50 songs)
  const CACHE_SIZE_LIMIT = 50;
  
  // Cache management helper
  function manageCacheSize() {
    if (window.__SGD_REVISION_CACHE.size >= CACHE_SIZE_LIMIT) {
      // Remove oldest entries (first 10)
      const entries = Array.from(window.__SGD_REVISION_CACHE.entries());
      for (let i = 0; i < 10 && i < entries.length; i++) {
        window.__SGD_REVISION_CACHE.delete(entries[i][0]);
      }
      sgdLog('log', 'SGD', `Cache cleanup: removed 10 old entries, size: ${window.__SGD_REVISION_CACHE.size}`);
    }
  }

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

    // --- B. TAB DATA INTERCEPTION ---
    // Intercept Songsterr's API calls to get revision data
    // This is needed because the CDN now requires authentication
    if (url.includes('/api/songs/') || url.includes('/api/tab/') || url.includes('/api/song/')) {
      try {
        const response = await fetchOriginal(resource, options);
        // Clone the response so we can read it without consuming it
        const clonedResponse = response.clone();
        const data = await clonedResponse.json().catch(() => null);
        
        // Cache the data if it contains revision information
        if (data && (data.revisions || data.revision || data.songId || data.id)) {
          const songId = data.songId || data.id || extractSongIdFromUrl(url);
          if (songId) {
            manageCacheSize(); // Prevent memory leaks
            window.__SGD_REVISION_CACHE.set(String(songId), data);
            sgdLog('log', 'SGD', 'Cached revision data for song:', songId);
          }
        }
        return response;
      } catch (err) {
        return fetchOriginal(resource, options);
      }
    }

    // --- C. TELEMETRY BLOCKING ---
    // Silently absorb outgoing analytics and error-logging requests.
    if (url.match(/(sentry|logs|analytics|useraudio)/i)) {
      return new Response('{}', { status: 200 });
    }

    // All other requests pass through unchanged
    return fetchOriginal(resource, options);
  };

  // Helper to extract song ID from API URL
  function extractSongIdFromUrl(url) {
    const matches = url.match(/\/s(\d+)(?:\/|$)/) || url.match(/\/songs?\/(\d+)/);
    return matches ? matches[1] : null;
  }

  // Stealth mode: toString() returns the original function's source to
  // defeat any integrity checks that compare fetch.toString().
  fetchHooked.toString = () => fetchOriginal.toString();

  // Robust injection with protection against replacement
  try {
    Object.defineProperty(targetWindow, 'fetch', {
      value      : fetchHooked,
      writable   : false,  // Prevent replacement
      configurable: false  // Prevent redefinition
    });
    sgdLog('log', 'SGD', '✅ Fetch hook installed with protection');
  } catch (e) {
    sgdLog('error', 'SGD', 'Failed to install protected fetch hook:', e);
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
    } catch (e) {
      sgdLog('warn', 'SGD', 'Failed to parse state JSON:', e.message);
    }
  });
  stateObserver.observe(document.documentElement, { childList: true, subtree: true });

  // ═══════════════════════════════════════════════════════════════════
  // 3b. SHOWROOM FIX — Force transition to tab view when arriving via direct link
  // When arriving directly via a link, the showroom is active (data-has-showroom="yes")
  // and the player isn't initialized. We need to force the transition to tab-only view.
  // ═══════════════════════════════════════════════════════════════════
  const showroomFixObserver = new MutationObserver(() => {
    const apptab = document.getElementById('apptab');
    if (!apptab) return;
    
    // Check if we're in showroom mode (arrived via direct link)
    if (apptab.getAttribute('data-has-showroom') === 'yes') {
      const showroom = document.getElementById('showroom');
      const tablature = document.getElementById('tablature');
      
      if (showroom && tablature) {
        // Move tablature out of showroom to preserve it
        if (tablature.parentElement === showroom) {
          apptab.insertBefore(tablature, showroom);
          sgdLog('log', 'Showroom Fix', 'Moved tablature out of showroom for proper rendering');
        }
        
        // Hide the showroom
        showroom.style.display = 'none';
        showroom.style.visibility = 'hidden';
        
        // Update the attribute to prevent re-processing
        apptab.setAttribute('data-has-showroom', 'fixed');
        
        sgdLog('log', 'Showroom Fix', 'Forced transition to tab-only view');
      }
    }
  });
  showroomFixObserver.observe(document.documentElement, { childList: true, subtree: true });

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

    /* ── IMPORTANT: Do NOT override body/html overflow - handled by Autoscroll Fix ── */
    /* NOTE: Commenté pour ne pas interférer avec le showroom */
    /* #apptab    { opacity: 1 !important; visibility: visible !important; } */

    /* ── Our button wrapper ─────────────────────────────────────────── */
    /* Inherits B3a4pa / B3agq5 classes from the replaced #c-export div,
       so vertical alignment inside the flex toolbar is automatic.      */
    #sgd-wrapper {
      display      : inline-flex;
      align-items  : center;
      gap          : 12px;
    }

    /* ── GP7 & MIDI buttons — styled to match Songsterr native dark UI ───── */
    .sgd-btn {
      display         : inline-flex;
      align-items     : center;
      justify-content : center;
      gap             : 6px;
      padding         : 0 12px;
      height          : 36px;
      border          : 1px solid #3a3a3a;
      border-radius   : 6px;
      font-size       : 13px;
      font-weight     : 500;
      cursor          : pointer;
      white-space     : nowrap;
      transition      : all 0.15s ease;
      font-family     : -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height     : 1;
      letter-spacing  : -0.01em;
      background      : #2a2a2a;
      color           : #e5e5e5;
    }
    .sgd-btn:hover {
      background : #3a3a3a;
      border-color: #4a4a4a;
    }
    .sgd-btn:active {
      background : #1a1a1a;
    }
    .sgd-btn:disabled {
      opacity    : 0.4;
      cursor     : not-allowed;
    }
    /* Primary action buttons (GP7) - blue accent matching Songsterr */
    .sgd-btn-gp {
      background : #2563eb;
      color      : #fff;
      border-color: #3b82f6;
    }
    .sgd-btn-gp:hover {
      background : #1d4ed8;
      border-color: #2563eb;
    }
    /* Secondary action buttons (MIDI) - neutral dark */
    .sgd-btn-midi {
      background : #404040;
      color      : #e5e5e5;
      border-color: #525252;
    }
    .sgd-btn-midi:hover {
      background : #525252;
      border-color: #626262;
    }

    /* ── YouTube toggle button — styled to match Songsterr dark UI ────────── */
    #yt-toggle-btn {
      display         : inline-flex;
      align-items     : center;
      justify-content : center;
      width           : 36px;
      height          : 36px;
      border-radius   : 6px;
      border          : 1px solid #3a3a3a;
      background      : #2a2a2a;
      color           : #a5a5a5;
      cursor          : pointer;
      font-size       : 16px;
      transition      : all 0.15s ease;
    }
    #yt-toggle-btn:hover {
      background : #3a3a3a;
      color      : #e5e5e5;
    }
    /* Audio-only mode active - subtle green accent */
    #yt-toggle-btn.audio-only {
      background : #16a34a;
      color      : #fff;
      border-color: #22c55e;
    }
    #yt-toggle-btn.audio-only:hover {
      background : #15803d;
      border-color: #16a34a;
    }

    /* ── Logging toggle button — styled to match Songsterr dark UI ────────── */
    #sgd-log-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      background: #2a2a2a;
      color: #e5e5e5;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    #sgd-log-toggle:hover {
      background: #3a3a3a;
      border-color: #4a4a4a;
    }
    #sgd-log-toggle.active {
      background: #166534;
      border-color: #16a34a;
      color: #fff;
    }
    #sgd-log-toggle:not(.active) {
      background: #7f1d1d;
      border-color: #dc2626;
      color: #fff;
    }

    /* ── Status toast — centered at the bottom of the viewport ──────── */
    #sgd-status {
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

  // NOTE: PLUS_DATA_IDS already declared above (Autoscroll removed - handled separately)

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

    // ── 3. Unlock Plus buttons by data-id ──
    PLUS_DATA_IDS.forEach(id => {
      const el = document.querySelector(`[data-id*="${id}"]`);
      if (el && el.hasAttribute('disabled')) {
        el.removeAttribute('disabled');
        el.classList.remove('Cny223');
        el.style.pointerEvents = 'auto';
      }
    });

    // ── 4. Handle Autoscroll button (protected by パプリカ, data-id renamed to Auto-Scroll) ──
    const autoscrollEl = document.querySelector('[data-id*="Auto-Scroll"]');
    if (autoscrollEl && autoscrollEl.hasAttribute('disabled')) {
      autoscrollEl.removeAttribute('disabled');
      autoscrollEl.classList.remove('Cny223');
      autoscrollEl.style.pointerEvents = 'auto';
    }

    // ── 5. Unlock any remaining buttons with Songsterr's lock class ──
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
    const message = String(args[0] || '');
    // More selective filtering - only filter known benign errors
    if (CONSOLE_FILTERS.some(f => message.includes(f)) && !message.includes('Songsterr') && !message.includes('SGD')) {
      return;
    }
    consoleErrorOrig.apply(console, args);
  };

  // ═══════════════════════════════════════════════════════════════════
  // ▼▼▼  GP7/MIDI DOWNLOAD SYSTEM  ▼▼▼
  // ═══════════════════════════════════════════════════════════════════
  //
  // This system is inspired by the brilliant project from Metaphysics0:
  // https://github.com/Metaphysics0/songsterr-downloader
  //
  // His genius idea: Songsterr stores tab data on protected CloudFront CDNs.
  // But the web app needs to fetch it somehow! We intercept those legitimate
  // calls to get raw data, then use alphaTab to convert to standard formats
  // (GP7/MIDI).
  //
  // The CloudFront servers: dqsljvtekg760.cloudfront.net and d3d3l6a6rcgkaf.cloudfront.net
  // are Songsterr's real servers, we just pose as Chrome.

  // ───────────────────────────────────────────────────────────────────
  // CDN HEADERS - Posing as legitimate Chrome
  // ─────────────────────────────────────────────────────────────────--
  // Songsterr stores tab data on CloudFront CDN which validates Origin
  // and Referer headers. We spoof a Chrome signature so the CDN accepts
  // our requests. GM_xmlhttpRequest is required because browser fetch()
  // would block these cross-origin requests.
  // ───────────────────────────────────────────────────────────────────
  const CDN_BASE = 'https://dqsljvtekg760.cloudfront.net';
  const CDN_BASE_2 = 'https://d3d3l6a6rcgkaf.cloudfront.net'; // Fallback CDN

  const CDN_HEADERS = {
    'User-Agent'        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept'            : 'application/json, text/plain, */*',
    'Accept-Language'   : 'en-US,en;q=0.9',
    'Accept-Encoding'   : 'gzip, deflate, br',
    'sec-ch-ua'         : '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile'  : '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-site'    : 'same-site',
    'sec-fetch-mode'    : 'cors',
    'sec-fetch-dest'    : 'empty',
    'Referer'           : 'https://www.songsterr.com/',
    'Origin'            : 'https://www.songsterr.com',
    'Connection'        : 'keep-alive',
    'Cache-Control'     : 'no-cache',
    'Pragma'            : 'no-cache'
  };

  // ═══════════════════════════════════════════════════════════════════
  // API METADATA FETCH — Direct API call to get fresh song metadata
  // When the DOM state is stale, we fetch directly from Songsterr's API
  // ═══════════════════════════════════════════════════════════════════
  async function fetchMetaFromAPI(songId) {
    const url = `https://www.songsterr.com/api/meta/${songId}?allowOwnUnpublished=true`;
    sgdLog('log', 'SGD Debug', `Fetching fresh metadata from API: ${url}`);
    
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        headers: {
          'Accept': 'application/json',
          'Referer': 'https://www.songsterr.com/',
          'Origin': 'https://www.songsterr.com'
        },
        responseType: 'json',
        onload: (res) => {
          if (res.status >= 200 && res.status < 300) {
            sgdLog('log', 'SGD Debug', '✅ API metadata fetched successfully');
            resolve(res.response);
          } else {
            reject(new Error(`API returned ${res.status}`));
          }
        },
        onerror: (err) => reject(new Error(`Network error: ${err}`))
      });
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // STEP 1 — READ PAGE METADATA (with API fallback)
  // ─────────────────────────────────────────────────────────────────--
  // Songsterr embeds all song metadata in <script id="state">
  // But after SPA navigation, React takes time to update it.
  // So we first check the DOM, and if stale, fetch fresh data from API.
  // ═══════════════════════════════════════════════════════════════════
  async function getStateFromPage() {
    sgdLog('log', 'SGD Debug', 'Reading page state...');
    sgdLog('log', 'SGD Debug', 'Current URL:', location.href);
    sgdLog('log', 'SGD Debug', 'Current path:', location.pathname);
    
    // Extract songId from URL
    const urlMatch = location.pathname.match(/-s(\d+)$/);
    const urlSongId = urlMatch ? urlMatch[1] : null;
    sgdLog('log', 'SGD Debug', 'SongId from URL:', urlSongId);
    
    if (!urlSongId) {
      throw new Error('Could not extract songId from URL');
    }
    
    // First try: check DOM state quickly
    const el = document.getElementById('state');
    if (el) {
      try {
        const parsed = JSON.parse(el.textContent || el.innerText);
        const cur = parsed?.meta?.current;
        
        if (cur?.songId && String(cur.songId) === String(urlSongId) && cur?.revisionId && cur?.image) {
          sgdLog('log', 'SGD Debug', '✅ Using fresh DOM state');
          return extractResult(cur);
        }
      } catch (e) {
        sgdLog('warn', 'SGD', 'Failed to parse DOM state:', e.message);
      }
    }
    
    // Second try: fetch fresh metadata from API
    sgdLog('log', 'SGD Debug', 'DOM state stale, fetching from API...');
    showStatus('⏳ Fetching fresh song data...', '', 0);
    
    try {
      const apiData = await fetchMetaFromAPI(urlSongId);
      
      // API returns data directly at root level, not under 'current' property
      if (!apiData?.revisionId || !apiData?.songId) {
        throw new Error('API response missing required fields');
      }
      
      const cur = apiData;
      sgdLog('log', 'SGD Debug', '✅ API data received:', {
        songId: urlSongId,
        title: cur.title,
        artist: cur.artist,
        revisionId: cur.revisionId
      });
      
      // Build result from API data - API returns flat structure
      const result = {
        songId    : parseInt(urlSongId),
        revisionId: cur.revisionId,
        image     : cur.image || cur.imageId || '', // image might be named differently
        title     : cur.title  || 'Song',
        artist    : cur.artist || 'Unknown Artist',
        tracks    : Array.isArray(cur.tracks) ? cur.tracks : []
      };
      
      // Also cache the revision data for later use
      if (window.__SGD_REVISION_CACHE && cur.revisions) {
        manageCacheSize(); // Prevent memory leaks
        window.__SGD_REVISION_CACHE.set(String(urlSongId), cur);
        sgdLog('log', 'SGD Debug', 'Cached revision data for song:', urlSongId);
      }
      
      return result;
      
    } catch (apiErr) {
      sgdLog('error', 'SGD Debug', 'API fetch failed:', apiErr.message);
      throw new Error(`Failed to get song data: ${apiErr.message}. Please refresh the page.`);
    }
  }
  
  function extractResult(cur) {
    const result = {
      songId    : cur.songId,
      revisionId: cur.revisionId,
      image     : cur.image,
      title     : cur.title  || 'Song',
      artist    : cur.artist || 'Unknown Artist',
      tracks    : Array.isArray(cur.tracks) ? cur.tracks : []
    };
    
    sgdLog('log', 'SGD Debug', '✅ State validated and extracted:', {
      songId: result.songId,
      revisionId: result.revisionId,
      title: result.title,
      artist: result.artist,
      trackCount: result.tracks.length,
      image: result.image
    });
    sgdLog('log', 'SGD Debug', 'Tracks:', result.tracks.map(t => ({ partId: t.partId, title: t.title, instrumentId: t.instrumentId })));
    
    return result;
  }

  // ───────────────────────────────────────────────────────────────────
  // ÉTAPE 2 — RÉCUPÉRATION DES JSON DE RÉVISIONS DEPUIS LE CDN (avec fallback)
  // ─────────────────────────────────────────────────────────────────--
  // Les données de chaque piste sont stockées dans des fichiers JSON séparés sur le CDN :
  //   URL pattern: {CDN_BASE}/{songId}/{revisionId}/{image}/{partId}.json
  // Toutes les pistes sont récupérées en parallèle via Promise.all.
  // GM_xmlhttpRequest est utilisé pour contourner les restrictions CORS du navigateur.
  // 
  // STRATÉGIE DE FALLBACK (inspirée de songsterr-downloader):
  // 1. Essayer le CDN primaire (dqsljvtekg760.cloudfront.net)
  // 2. Si échec, essayer le CDN alternatif (d3d3l6a6rcgkaf.cloudfront.net)
  // 3. Si les deux échouent, essayer les données API interceptées des appels Songsterr
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

  // Build revision URL with given CDN base
  function buildRevisionUrl(songId, revisionId, image, partId, cdnBase = CDN_BASE) {
    return `${cdnBase}/${songId}/${revisionId}/${image}/${partId}.json`;
  }

  // Fetch with fallback to alternate CDN
  async function fetchRevisionWithFallback(songId, revisionId, image, partId) {
    const primaryUrl = buildRevisionUrl(songId, revisionId, image, partId, CDN_BASE);
    const fallbackUrl = buildRevisionUrl(songId, revisionId, image, partId, CDN_BASE_2);
    
    // Try primary CDN first
    try {
      const response = await fetchRevisionJson(primaryUrl);
      return response;
    } catch (primaryError) {
      sgdLog('warn', 'SGD', `Primary CDN failed for part ${partId}, trying fallback...`);
    }
    
    // Try fallback CDN
    try {
      const response = await fetchRevisionJson(fallbackUrl);
      sgdLog('log', 'SGD', `Fallback CDN succeeded for part ${partId}`);
      return response;
    } catch (fallbackError) {
      throw new Error(`Both CDNs failed for part ${partId}`);
    }
  }

  // Extract revision data from intercepted API response (with debug)
  function getRevisionFromCache(songId, revisionId, partId) {
    const cache = window.__SGD_REVISION_CACHE;
    sgdLog('log', 'SGD Debug', `Cache lookup for songId=${songId}, revisionId=${revisionId}, partId=${partId}`);
    sgdLog('log', 'SGD Debug', `Cache exists: ${!!cache}, Cache size: ${cache ? cache.size : 0}`);
    
    if (!cache || cache.size === 0) {
      sgdLog('log', 'SGD Debug', 'Cache empty, skipping');
      return null;
    }
    
    const cachedData = cache.get(String(songId));
    if (!cachedData) {
      sgdLog('log', 'SGD Debug', `No cached data for songId=${songId}. Available keys:`, Array.from(cache.keys()));
      return null;
    }
    
    sgdLog('log', 'SGD Debug', `Found cached data for songId=${songId}, keys:`, Object.keys(cachedData));
    
    // Try to find the revision data in various formats
    if (cachedData.revisions && Array.isArray(cachedData.revisions)) {
      sgdLog('log', 'SGD Debug', `Looking in cachedData.revisions (${cachedData.revisions.length} items)`);
      const revision = cachedData.revisions.find(r => 
        String(r.revisionId || r.id) === String(revisionId)
      );
      if (revision) {
        sgdLog('log', 'SGD Debug', 'Found revision in cachedData.revisions');
        return revision;
      }
    }
    
    if (cachedData.revision) {
      sgdLog('log', 'SGD Debug', 'Found revision in cachedData.revision');
      return cachedData.revision;
    }
    
    // Try to find by partId in tracks
    if (cachedData.tracks && Array.isArray(cachedData.tracks)) {
      sgdLog('log', 'SGD Debug', `Looking in cachedData.tracks (${cachedData.tracks.length} items)`);
      const track = cachedData.tracks.find(t => t.partId === partId);
      if (track && track.revision) {
        sgdLog('log', 'SGD Debug', `Found revision in track.partId=${partId}`);
        return track.revision;
      }
    }
    
    sgdLog('log', 'SGD Debug', `No revision found in cache for partId=${partId}`);
    return null;
  }

  async function fetchAllRevisions(meta) {
    const { songId, revisionId, image, tracks } = meta;
    sgdLog('log', 'SGD Debug', `fetchAllRevisions called: songId=${songId}, revisionId=${revisionId}, image=${image}`);
    sgdLog('log', 'SGD Debug', `Total tracks in meta: ${tracks.length}`);
    
    // Debug: show first track structure
    if (tracks.length > 0) {
      sgdLog('log', 'SGD Debug', 'First track keys:', Object.keys(tracks[0]));
      sgdLog('log', 'SGD Debug', 'First track:', JSON.stringify(tracks[0], null, 2).substring(0, 300));
    }
    
    // API tracks don't have partId, use array index instead
    const validTracks = tracks
      .map((t, idx) => ({ ...t, partId: t.partId ?? idx })) // Add partId from index if missing
      .filter(t => typeof t.partId === 'number')
      .sort((a, b) => a.partId - b.partId);

    sgdLog('log', 'SGD Debug', `Valid tracks (with partId): ${validTracks.length}`);
    validTracks.forEach(t => sgdLog('log', 'SGD Debug', `Track: partId=${t.partId}, title=${t.title}`));

    if (validTracks.length === 0) throw new Error('No valid tracks found in page metadata.');

    // Check if we have intercepted API data
    const cacheAvailable = window.__SGD_REVISION_CACHE && window.__SGD_REVISION_CACHE.size > 0;
    sgdLog('log', 'SGD Debug', `API cache available: ${cacheAvailable}`);
    
    let cacheHits = 0;
    let cdnHits = 0;
    let failures = 0;
    
    const results = await Promise.all(
      validTracks.map(async track => {
        sgdLog('log', 'SGD Debug', `Processing track partId=${track.partId}`);
        
        // First: try intercepted API cache (most reliable)
        if (cacheAvailable) {
          const cachedRevision = getRevisionFromCache(songId, revisionId, track.partId);
          if (cachedRevision) {
            cacheHits++;
            sgdLog('log', 'SGD Debug', `✅ CACHE HIT for partId=${track.partId}`);
            return { trackMeta: track, revision: cachedRevision };
          }
        }
        
        // Second: try CDN with fallback
        sgdLog('log', 'SGD Debug', `Cache miss, trying CDN for partId=${track.partId}`);
        try {
          const revision = await fetchRevisionWithFallback(songId, revisionId, image, track.partId);
          cdnHits++;
          sgdLog('log', 'SGD Debug', `✅ CDN SUCCESS for partId=${track.partId}`);
          return { trackMeta: track, revision };
        } catch (err) {
          failures++;
          sgdLog('warn', 'SGD Debug', `❌ FAILED for partId=${track.partId}:`, err.message);
          return null;
        }
      })
    );

    const revisions = results.filter(Boolean);
    sgdLog('log', 'SGD Debug', `Fetch complete: ${revisions.length}/${validTracks.length} tracks`);
    sgdLog('log', 'SGD Debug', `Stats: cacheHits=${cacheHits}, cdnHits=${cdnHits}, failures=${failures}`);
    
    if (revisions.length === 0) {
      throw new Error('Could not fetch any track data. ' +
        'Both CDNs returned errors and no API data was intercepted. ' +
        'Try refreshing the page and playing the tab to populate the cache.');
    }
    return revisions;
  }

  // ───────────────────────────────────────────────────────────────────
  // CONVERSION — Songsterr duration [num, den] → alphaTab Duration + dots
  // ─────────────────────────────────────────────────────────────────--
  // Songsterr encode les durées en fraction [numérateur, dénominateur].
  // alphaTab utilise une enum (Whole=1, Half=2, Quarter=4…) plus un compteur de points.
  // On trouve la meilleure correspondance en minimisant le delta sur toutes les
  // durées de base combinées avec 0, 1, ou 2 points d'augmentation.
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

  // ─────────────────────────────────────────────────────────────────--
  // CONVERSION — Songsterr Note → alphaTab Note
  // ─────────────────────────────────────────────────────────────────--
  // Two CRUCIAL coordinate differences:
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

      if (!voices || voices.length === 0) {
        // No voices - add a single voice with rests
        const v = new alphaTab.model.Voice();
        fillWithRests(v, mb);
        bar.addVoice(v);
      } else {
        let hasValidVoice = false;
        for (const sv of voices) {
          const v    = new alphaTab.model.Voice();
          const bts  = sv?.beats || [];
          if (!bts || bts.length === 0 || sv?.rest) {
            fillWithRests(v, mb);
          } else {
            for (const bd of bts) {
              if (bd) v.addBeat(mapBeat(bd, mb, isPerc, numStrings));
            }
            if (v.beats.length === 0) fillWithRests(v, mb);
          }
          if (v.beats.length > 0) hasValidVoice = true;
          bar.addVoice(v);
        }
        // Ensure at least one voice exists
        if (!hasValidVoice && bar.voices.length === 0) {
          const v = new alphaTab.model.Voice();
          fillWithRests(v, mb);
          bar.addVoice(v);
        }
      }
      staff.addBar(bar);
    }

    track.addStaff(staff);
    score.addTrack(track);
  }

  // ─────────────────────────────────────────────────────────────────--
  // CONVERSION — Assemble the complete alphaTab Score
  // Handles:
  //   • The track with the most measures is elected as the "master" track
  //     whose measure data drives MasterBar construction.
  //   • MIDI channels 0–15 are assigned sequentially; channel 9 is always
  //     reserved for percussion (General MIDI specification).
  //   • score.finish() is mandatory before any export — it finalises all
  //     internal cross-references within the score model.
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

  // ─────────────────────────────────────────────────────────────────--
  // EXPORT GP7 — Returns a Uint8Array in Guitar Pro 7 (.gp) format
  // ─────────────────────────────────────────────────────────────────--
  function exportGP7(meta, revisions) {
    const { score, settings } = buildScore(meta, revisions);
    return new alphaTab.exporter.Gp7Exporter().export(score, settings);
  }

  // ─────────────────────────────────────────────────────────────────--
  // EXPORT MIDI — Returns a Uint8Array in standard MIDI (.mid) format
  // ─────────────────────────────────────────────────────────────────--
  function exportMIDI(meta, revisions) {
    const { score, settings } = buildScore(meta, revisions);
    const midiFile  = new alphaTab.midi.MidiFile();
    const handler   = new alphaTab.midi.AlphaSynthMidiFileHandler(midiFile, true);
    new alphaTab.midi.MidiFileGenerator(score, settings, handler).generate();
    return midiFile.toBinary();
  }

  // ─────────────────────────────────────────────────────────────────--
  // UTILITY — Trigger a browser file download from a Uint8Array
  // ─────────────────────────────────────────────────────────────────--
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
    sgdLog('log', 'SGD Debug', '========================================');
    sgdLog('log', 'SGD Debug', `DOWNLOAD STARTED: format=${format}`);
    sgdLog('log', 'SGD Debug', `Current URL: ${location.href}`);
    sgdLog('log', 'SGD Debug', `Current path: ${location.pathname}`);
    sgdLog('log', 'SGD Debug', '========================================');
    
    btnGP.disabled  = true;
    btnMID.disabled = true;
    showStatus('⏳ Reading page state…', '', 0);

    try {
      // Step 1 — extract metadata from #state (with retry logic for SPA nav)
      sgdLog('log', 'SGD Debug', 'Step 1: Reading page state...');
      const meta = await getStateFromPage();
      sgdLog('log', 'SGD Debug', `Got metadata: ${meta.artist} - ${meta.title} (${meta.tracks.length} tracks)`);
      showStatus(`⏳ Fetching ${meta.tracks.length} track(s) from CDN…`, '', 0);

      // Step 2 — download all revision JSONs
      sgdLog('log', 'SGD Debug', 'Step 2: Fetching revisions...');
      const revisions = await fetchAllRevisions(meta);
      sgdLog('log', 'SGD Debug', `Got ${revisions.length} revisions`);
      revisions.forEach((r, i) => {
        sgdLog('log', 'SGD Debug', `Revision ${i}: track="${r.trackMeta.title}", measures=${r.revision?.measures?.length || 0}`);
      });
      showStatus(`⚙️ Converting ${revisions.length} track(s) → ${format.toUpperCase()}…`, '', 0);

      // Step 3 — build and export
      sgdLog('log', 'SGD Debug', 'Step 3: Building and exporting...');
      const name = safeName(`${meta.artist} - ${meta.title}`);
      sgdLog('log', 'SGD Debug', `Sanitized filename: ${name}`);
      let bytes, fileName, mime;

      if (format === 'gp') {
        sgdLog('log', 'SGD Debug', 'Exporting as GP7...');
        bytes    = exportGP7(meta, revisions);
        fileName = `${name}.gp`;
        mime     = 'application/gp';
      } else {
        sgdLog('log', 'SGD Debug', 'Exporting as MIDI...');
        bytes    = exportMIDI(meta, revisions);
        fileName = `${name}.mid`;
        mime     = 'audio/midi';
      }
      sgdLog('log', 'SGD Debug', `Export complete: ${bytes.length} bytes`);

      // Step 4 — trigger browser download
      sgdLog('log', 'SGD Debug', 'Step 4: Triggering download...');
      triggerDownload(bytes, fileName, mime);
      sgdLog('log', 'SGD Debug', `✅ Download triggered: ${fileName}`);
      showStatus(`✅ "${fileName}" downloaded!`, 'ok');

    } catch (err) {
      sgdLog('error', 'SGD Debug', '❌ Download failed:', err);
      sgdLog('error', 'SGD Debug', 'Error stack:', err.stack);
      showStatus(`❌ ${err.message}`, 'err', 7000);
    } finally {
      btnGP.disabled  = false;
      btnMID.disabled = false;
      sgdLog('log', 'SGD Debug', '========================================\n');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. BUTTON INJECTION — Replaces the native export button
  // ═══════════════════════════════════════════════════════════════════
  //
  // DOM structure (reverse-engineering Songsterr's HTML):
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

  // Global flag to track if we're in a transition
  let _isPageTransitioning = false;
  
  // Debounce injection attempts to prevent race conditions
  let _injectionTimeout = null;
  
  function debouncedInjection() {
    if (_injectionTimeout) clearTimeout(_injectionTimeout);
    _injectionTimeout = setTimeout(() => {
      tryInjectButtons();
      _injectionTimeout = null;
    }, 100);
  }

  // Only inject on tab/chords song pages, not on the homepage or artist pages
  function isTabPage() {
    return /\/a\/wsa\/.+/.test(location.pathname);
  }

  function createOurButtons() {
    // Reuse the native container's CSS classes for automatic flex alignment
    const wrapper     = document.createElement('div');
    wrapper.id        = 'sgd-wrapper';
    wrapper.className = 'B3a4pa B3agq5'; // same classes as the replaced #c-export div

    // YouTube Audio-Only Toggle Button
    let ytAudioOnlyMode = false;
    try { ytAudioOnlyMode = localStorage.getItem('songsterr_yt_audio_only') === 'true'; } catch (e) {}
    const btnYT = document.createElement('button');
    btnYT.id = 'yt-toggle-btn';
    btnYT.innerHTML = ytAudioOnlyMode ? '🎵' : '🎬';
    btnYT.title = ytAudioOnlyMode ? 'Mode audio uniquement (cliquer pour afficher la vidéo)' : 'Vidéo visible (cliquer pour audio uniquement)';
    if (ytAudioOnlyMode) btnYT.classList.add('audio-only');
    btnYT.addEventListener('click', () => { if (typeof toggleYtAudioOnly === 'function') toggleYtAudioOnly(); });

    const btnGP      = document.createElement('button');
    btnGP.className  = 'sgd-btn sgd-btn-gp';
    btnGP.innerHTML  = '🎸 GP7';
    btnGP.title      = 'Download Guitar Pro 7 (.gp)';

    const btnMID     = document.createElement('button');
    btnMID.className = 'sgd-btn sgd-btn-midi';
    btnMID.innerHTML = '🎹 MIDI';
    btnMID.title     = 'Download MIDI (.mid)';

    // Check if page is ready before allowing download (just check the flag)
    const canDownload = () => {
      if (_isPageTransitioning) {
        showStatus('⏳ Page loading, please wait...', '', 2000);
        return false;
      }
      return true; // Trust checkPageReady() which already validated via API
    };

    btnGP.addEventListener('click',  () => {
      if (!canDownload()) return;
      handleDownload('gp',   btnGP, btnMID);
    });
    btnMID.addEventListener('click', () => {
      if (!canDownload()) return;
      handleDownload('midi', btnGP, btnMID);
    });

    wrapper.appendChild(btnYT);
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
      sgdLog('log', 'SGD', '✅ Injected (#c-export)');
      return true;
    }

    // ── Fallback 1: parent of #control-export button ─────────────────
    const ctrlExport = document.getElementById('control-export');
    if (ctrlExport) {
      (ctrlExport.closest('div') || ctrlExport.parentElement).replaceWith(createOurButtons());
      sgdLog('log', 'SGD', '✅ Injected (#control-export parent)');
      return true;
    }

    // ── Fallback 2: any element with a download-related title/data-id ─
    const nativeBtn = document.querySelector(
      '[data-id*="Download"], [data-id*="Export"], [title*="Download tab"]'
    );
    if (nativeBtn) {
      (nativeBtn.closest('div') || nativeBtn.parentElement).replaceWith(createOurButtons());
      sgdLog('log', 'SGD', '✅ Injected (fallback title/data-id)');
      return true;
    }

    return false; // Target not in DOM yet — will retry via MutationObserver
  }

  // Permanent MutationObserver: re-injects whenever #sgd-wrapper is
  // removed from the DOM (React re-render after tab ↔ chords switch)
  const btnObserver = new MutationObserver(() => {
    if (!document.getElementById('sgd-wrapper')?.isConnected) {
      debouncedInjection(); // Use debounced injection
    }
  });

  // SPA navigation hook.
  // React Router uses history.pushState to navigate without a page reload.
  // We schedule three injection attempts with increasing delays to cover
  // slow initial renders and lazy-loaded components.
  // IMPORTANT: Track current song and clear cache when changing songs
  let _lastSongPath = location.pathname;
  function onSpaNavigate() {
    const currentPath = location.pathname;
    sgdLog('log', 'SGD Debug', 'SPA Navigation detected:', { from: _lastSongPath, to: currentPath });
    
    // Mark transition start to block downloads
    if (currentPath !== _lastSongPath) {
      _isPageTransitioning = true;
      sgdLog('log', 'SGD Debug', '🚫 Page transition started, downloads blocked');
    }
    
    // Only clear cache if we actually changed songs (not just Tab/Chords toggle)
    if (currentPath !== _lastSongPath) {
      if (window.__SGD_REVISION_CACHE) {
        const oldSize = window.__SGD_REVISION_CACHE.size;
        window.__SGD_REVISION_CACHE.clear();
        sgdLog('log', 'SGD Debug', `✅ Cache cleared (${oldSize} entries) - song changed`);
      } else {
        sgdLog('log', 'SGD Debug', 'No cache to clear');
      }
    } else {
      sgdLog('log', 'SGD Debug', 'Same path, cache preserved');
    }
    _lastSongPath = currentPath;
    
    // Use debounced injection to prevent race conditions
    debouncedInjection();
    setTimeout(() => debouncedInjection(), 500);
    setTimeout(() => debouncedInjection(), 1200);
    
    // Check when page is ready
    checkPageReady();
  }
  
  // Check if state matches URL and allow downloads (uses API when DOM is stale)
  async function checkPageReady() {
    const urlMatch = location.pathname.match(/-s(\d+)$/);
    const urlSongId = urlMatch ? urlMatch[1] : null;
    if (!urlSongId) {
      _isPageTransitioning = false;
      return;
    }
    
    // Quick DOM check first
    const el = document.getElementById('state');
    if (el) {
      try {
        const parsed = JSON.parse(el.textContent || el.innerText);
        const cur = parsed?.meta?.current;
        if (String(cur?.songId) === String(urlSongId)) {
          _isPageTransitioning = false;
          sgdLog('log', 'SGD Debug', '✅ Page ready (DOM), downloads enabled');
          return;
        }
      } catch (e) {
        sgdLog('warn', 'SGD', 'Failed to parse DOM state during ready check:', e.message);
      }
    }
    
    // DOM is stale - use API to verify page is ready
    sgdLog('log', 'SGD Debug', 'DOM stale, checking via API...');
    try {
      const apiData = await fetchMetaFromAPI(urlSongId);
      sgdLog('log', 'SGD Debug', 'API response received, unblocking downloads');
      // API returns flat structure, check for revisionId at root level
      if (apiData?.revisionId) {
        _isPageTransitioning = false;
        sgdLog('log', 'SGD Debug', '✅ Page ready (API), downloads enabled');
        showStatus('✅ Ready to download!', 'ok', 1500);
      } else {
        sgdLog('log', 'SGD Debug', '❌ API response missing revisionId');
      }
    } catch (err) {
      sgdLog('log', 'SGD Debug', 'API check failed:', err.message);
      // Keep blocked, will retry on next navigation
    }
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
      debouncedInjection(); // Use debounced injection
    };
    if (document.body) go();
    else document.addEventListener('DOMContentLoaded', go);
  }

  startObserving();

})();