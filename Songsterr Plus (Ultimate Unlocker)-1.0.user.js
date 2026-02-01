// ==UserScript==
// @name         Songsterr Plus (Ultimate Unlocker)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Unlocks all Plus features (Speed, Loop, Solo) and Native Download (.gp5) by exploiting the Magic Guest Profile and server-side anonymization.
// @author       Etudiant Cyber
// @match        *://www.songsterr.com/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log("🛡️ Songsterr Unlocker - Active");

    // 1. PREVENTIVE CLEANUP
    // Clears the application cache to ensure a clean state (prevents conflicts with old sessions)
    try { localStorage.removeItem('persist:root'); } catch(e) {}

    const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // THE "MAGIC" PROFILE (ID 100000000)
    // This specific User ID is whitelisted by the server to allow downloads without a valid session cookie.
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
    const originalFetch = targetWindow.fetch;

    targetWindow.fetch = async function(resource, options) {
        let url = typeof resource === 'string' ? resource : (resource.url || "");

        // --- A. PROFILE SPOOFING (Lying to the Interface) ---
        // When the app asks "Who am I?", we answer "You are the Magic Plus User".
        if (url.includes("/auth/profile")) {
            return new Response(JSON.stringify(MAGIC_PROFILE), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- B. DOWNLOAD UNLOCK (The Critical Bypass) ---
        // When the user clicks download, we must trick the server.
        if (url.includes("/api/edits/download")) {
            console.log("🔥 Download request intercepted - Anonymizing...");

            // Clone the options to modify the request headers
            const newOptions = { ...options };

            // CRITICAL STEP: Remove all credentials (cookies) and tokens.
            // Sending the "Free Account" cookie causes a 401 error.
            // Sending NO cookie forces the server to treat us as a Guest (which is allowed via the Magic ID).
            newOptions.credentials = 'omit';
            delete newOptions.headers['Authorization'];

            // Ensure the body contains the Magic ID (server requirement for guests)
            if (newOptions.body) {
                try {
                    let body = JSON.parse(newOptions.body);
                    body.userId = 100000000;
                    newOptions.body = JSON.stringify(body);
                } catch(e) {}
            }

            // Dispatch the modified request using the native fetch
            // We return the response DIRECTLY to the app.
            // The app will see "200 OK" and trigger the file download natively.
            return originalFetch(resource, newOptions);
        }

        // --- C. LOG BLOCKING ---
        // Silence Sentry and Analytics to keep the console clean
        if (url.match(/(sentry|logs|analytics|useraudio)/i)) {
            return new Response("{}", { status: 200 });
        }

        // For everything else, proceed as normal
        return originalFetch(resource, options);
    };

    // ============================================
    // 3. STATE INJECTION (Initial Rendering)
    // ============================================
    // Modifies the JSON state embedded in the HTML to unlock the UI immediately upon load.
    const observer = new MutationObserver((mutations) => {
        const s = document.getElementById("state");
        if (s) {
            try {
                let text = s.textContent.trim();
                if (!text) return;
                let d = JSON.parse(text);

                // Force the Magic Profile into the initial state
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
        /* Hide popups, ads, GDPR banners, and "Subscribe" overlays */
        section[data-consent="summary"], div[class*="Consent"],
        #onetrust-banner-sdk, [id*="ad-"], [class*="ad-"], div[id^="div-gpt-ad"],
        div[class*="Error"]
        { display: none !important; visibility: hidden !important; }

        /* Restore scrolling and visibility */
        body, html { overflow: auto !important; }
        #apptab { opacity: 1 !important; visibility: visible !important; }
    `;
    document.documentElement.appendChild(style);

    // Maintenance loop for dynamically loaded elements
    setInterval(() => {
        // Force "Plus" status for Printing
        const p = document.querySelector('[data-id^="Print--"]');
        if (p) p.setAttribute('data-id', 'Print--plus');

        // Remove lock icons and enable disabled buttons
        document.querySelectorAll('button[disabled], svg use[href*="lock"]').forEach(el => {
            if (el.tagName.toLowerCase() === 'use') {
                el.closest('svg')?.remove();
            } else {
                el.removeAttribute('disabled');
                el.classList.remove('Cny223'); // Greyed out class
                el.style.pointerEvents = 'auto';
            }
        });
    }, 1000);

    // ============================================
    // 5. CONSOLE CLEANUP
    // ============================================
    // Filter out expected errors (like AudioContext warnings or initial 401s)
    const origError = console.error;
    const filters = ["AudioContext", "source-map", "unreachable", "buffer", "Secure-YEC", "Aborted", "401"];
    console.error = function(...args) {
        if(filters.some(f => String(args[0]).includes(f))) return;
        origError.apply(console, args);
    };

})();