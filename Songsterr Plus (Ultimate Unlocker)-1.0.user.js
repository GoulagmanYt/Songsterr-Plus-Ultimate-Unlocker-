// ==UserScript==
// @name         Songsterr Plus (Ultimate Unlocker)
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Unlocks all Plus features (Speed, Loop, Solo) and Native Download (.gp5) by exploiting the Magic Guest Profile and server-side anonymization. Works on Chrome, Edge, Firefox & Zen.
// @author       Goulagman
// @supportURL   https://github.com/GoulagmanYt/Songsterr-Plus-Ultimate-Unlocker-
// @match        *://www.songsterr.com/*
// @grant        unsafeWindow
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log("🛡️ Songsterr Unlocker - Active (Universal Mode)");

    // 1. PREVENTIVE CLEANUP
    try { localStorage.removeItem('persist:root'); } catch(e) {}

    // Cross-browser window reference
    const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // THE "MAGIC" PROFILE
    const MAGIC_PROFILE = {
        id: 100000000,
        uid: 100000000,
        email: "plususer@songsterr.com",
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
        let url = typeof resource === 'string' ? resource : (resource.url || "");

        // --- A. PROFILE SPOOFING ---
        if (url.includes("/auth/profile")) {
            return new Response(JSON.stringify(MAGIC_PROFILE), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- B. DOWNLOAD UNLOCK ---
        if (url.includes("/api/edits/download")) {
            console.log("🔥 Download request intercepted - Anonymizing...");

            const newOptions = { ...options };
            
            // Bypass Logic: Remove auth to force Guest mode on server side
            newOptions.credentials = 'omit';
            if (newOptions.headers) {
                delete newOptions.headers['Authorization'];
            }

            if (newOptions.body) {
                try {
                    let body = JSON.parse(newOptions.body);
                    body.userId = 100000000;
                    newOptions.body = JSON.stringify(body);
                } catch(e) {}
            }

            return originalFetch(resource, newOptions);
        }

        // --- C. LOG BLOCKING ---
        if (url.match(/(sentry|logs|analytics|useraudio)/i)) {
            return new Response("{}", { status: 200 });
        }

        return originalFetch(resource, options);
    };

    // STEALTH MODE: Hide the fact that fetch is modified
    // This is crucial for Chrome/Edge compatibility if the site checks integrity
    hookedFetch.toString = () => originalFetch.toString();

    // ROBUST INJECTION: Use defineProperty instead of simple assignment
    // This ensures better compatibility with strict strict mode or read-only properties
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
