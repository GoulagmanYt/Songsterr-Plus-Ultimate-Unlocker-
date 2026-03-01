// ==UserScript==
// @name         Songsterr Plus
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Unlocks all Plus features (Speed, Loop, Solo) and Native Download (.gp5). (Tested on Zen Browser)
// @author       Goulagman
// @supportURL   https://github.com/GoulagmanYt/Songsterr-Plus-Ultimate-Unlocker-
// @match        *://www.songsterr.com/*
// @grant        unsafeWindow
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log("🛡️ songsterr Unlocker - Active (Universal Mode v1.5.0)");

    // 1. PREVENTIVE CLEANUP
    try { localStorage.removeItem('persist:root'); } catch(e) {}

    // Cross-browser window reference
    const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // Generate a random ID to bypass the daily download limit (HTTP 429)
    const RANDOM_MAGIC_ID = Math.floor(Math.random() * 900000000) + 100000000;

    // THE "MAGIC" PROFILE
    const MAGIC_PROFILE = {
        id: RANDOM_MAGIC_ID,
        uid: RANDOM_MAGIC_ID,
        email: `plususer${RANDOM_MAGIC_ID}@songsterr.com`,
        name: "Plus User (Unlocked)",
        plan: "plus",
        hasPlus: true,
        permissions: [],
        subscription: { plan: { id: "plus" } },
        bonusPurchasedFeatures: [],
        signature: "patched_signature",
        hadPlusBeforeSE: true
    };

    // ============================================
    // 2. NETWORK INTERCEPTION (The Core Logic)
    // ============================================

    // Save the original fetch immediately
    const originalFetch = targetWindow.fetch;

    // Define the hooked fetch function
    const hookedFetch = async function(resource, options) {
        // Determine if the resource is a String (URL) or a Request instance
        let isRequestObj = typeof resource === 'object' && resource instanceof Request;
        let url = isRequestObj ? resource.url : (resource || "");

        // --- A. PROFILE SPOOFING ---
        if (url.includes("/auth/profile")) {
            return new Response(JSON.stringify(MAGIC_PROFILE), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- B. DOWNLOAD UNLOCK ---
        if (url.includes("/api/edits/download")) {
            console.log(`🔥 Download request intercepted - Anonymizing with ID: ${RANDOM_MAGIC_ID}...`);

            // 1. Initialize new options
            let newOptions = { ...(options || {}) };
            newOptions.credentials = 'omit'; // Omit cookies/credentials

            // 2. Clean up headers properly (Compatible with the native Headers class)
            let newHeaders = new Headers(newOptions.headers || (isRequestObj ? resource.headers : {}));
            newHeaders.delete('Authorization');
            newHeaders.delete('authorization');
            newOptions.headers = newHeaders;

            // 3. Extract the Body (from options or from the original Request object)
            let reqBody = newOptions.body;
            if (!reqBody && isRequestObj) {
                // Clone the request to read its body without exhausting the original stream
                reqBody = await resource.clone().blob();
            }

            // 4. Modify the JSON payload, handling GZIP compression if present
            if (reqBody) {
                try {
                    const isGzip = newHeaders.get('content-encoding') === 'gzip' || newHeaders.get('Content-Encoding') === 'gzip';

                    if (isGzip) {
                        // Decompress the GZIP body
                        const ds = new DecompressionStream('gzip');
                        const decompressedStream = new Response(reqBody).body.pipeThrough(ds);
                        const text = await new Response(decompressedStream).text();

                        let bodyJson = JSON.parse(text);
                        bodyJson.userId = RANDOM_MAGIC_ID; // Apply the random Magic Guest ID

                        // Recompress to GZIP
                        const cs = new CompressionStream('gzip');
                        const compressedStream = new Response(JSON.stringify(bodyJson)).body.pipeThrough(cs);
                        newOptions.body = await new Response(compressedStream).blob();
                    } else if (typeof reqBody === 'string') {
                        // Case where it is not compressed (usually smaller tabs)
                        let bodyJson = JSON.parse(reqBody);
                        bodyJson.userId = RANDOM_MAGIC_ID; // Apply the random Magic Guest ID
                        newOptions.body = JSON.stringify(bodyJson);
                    }
                } catch(e) {
                    console.error("🛡️ Unlocker: Error while modifying the payload", e);
                }
            }

            // 5. Rebuild and send the final robust request
            let reqUrl = isRequestObj ? resource.url : url;
            let modifiedRequest = isRequestObj ? new Request(resource.clone(), newOptions) : new Request(reqUrl, newOptions);

            return originalFetch(modifiedRequest);
        }

        // --- C. LOG BLOCKING ---
        if (url.match(/(sentry|logs|analytics|useraudio)/i)) {
            return new Response("{}", { status: 200 });
        }

        return originalFetch(resource, options);
    };

    // STEALTH MODE: Hide the fact that fetch is modified
    hookedFetch.toString = () => originalFetch.toString();

    // ROBUST INJECTION
    try {
        Object.defineProperty(targetWindow, 'fetch', {
            value: hookedFetch,
            writable: true,
            configurable: true
        });
    } catch(e) {
        // Fallback for older browsers
        targetWindow.fetch = hookedFetch;
    }

    // ============================================
    // 3. STATE INJECTION
    // ============================================
    const observer = new MutationObserver((mutations) => {
        const s = document.getElementById("state");
        if (s) {
            try {
                let text = s.textContent.trim();
                if (!text) return;
                let d = JSON.parse(text);

                if (!d.user) d.user = {};
                d.user.hasPlus = true;
                d.user.isLoggedIn = true;
                d.user.profile = MAGIC_PROFILE;
                d.consent = { loading: false, suite: "tcf", view: "none" };

                const newJson = JSON.stringify(d);
                if (s.textContent !== newJson) s.textContent = newJson;
            } catch (e) {}
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // ============================================
    // 4. UI CLEANUP & UNLOCK
    // ============================================
    const style = document.createElement('style');
    style.innerHTML = `
        section[data-consent="summary"], div[class*="Consent"],
        #onetrust-banner-sdk, [id*="ad-"], [class*="ad-"], div[id^="div-gpt-ad"],
        div[class*="Error"]
        { display: none !important; visibility: hidden !important; }

        body, html { overflow: auto !important; }
        #apptab { opacity: 1 !important; visibility: visible !important; }
    `;
    document.documentElement.appendChild(style);

    setInterval(() => {
        const p = document.querySelector('[data-id^="Print--"]');
        if (p) p.setAttribute('data-id', 'Print--plus');

        document.querySelectorAll('button[disabled], svg use[href*="lock"]').forEach(el => {
            if (el.tagName.toLowerCase() === 'use') {
                el.closest('svg')?.remove();
            } else {
                el.removeAttribute('disabled');
                el.classList.remove('Cny223');
                el.style.pointerEvents = 'auto';
            }
        });
    }, 1000);

    // ============================================
    // 5. CONSOLE CLEANUP
    // ============================================
    const origError = console.error;
    const filters = ["AudioContext", "source-map", "unreachable", "buffer", "Secure-YEC", "Aborted", "401"];
    console.error = function(...args) {
        if(filters.some(f => String(args[0]).includes(f))) return;
        origError.apply(console, args);
    };

})();
