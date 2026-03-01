# 🎸 Songsterr Plus (v1.5.0)

> **An advanced Tampermonkey script that unlocks all Songsterr "Plus" features, including native download (.gp5), by exploiting a server-side logic flaw, dynamic IDs, and on-the-fly GZIP manipulation.**

---

## 🧐 About

This project is the result of a deep analysis (Reverse Engineering) of Songsterr's React application and API. Unlike classic scripts that only modify the interface (CSS/DOM), this script intercepts and manipulates network requests in real-time to:

1.  **Trick the Interface (Client-Side):** Deceive the application into believing the user has a valid "Plus" subscription.
2.  **Bypass Security & Rate Limits (Server-Side):** Exploit dynamically generated "Magic Guest" profiles that retain privileged access rights on Songsterr's servers while bypassing daily download quotas.

## ✨ Features

### 🔓 Total Unlock
- **Native Download (.gp5 / .mid)**: Works directly via the official download button (Bypasses the `401 Unauthorized` and `429 Too Many Requests` errors).
- **Plus Player**: Unlocks Speed control, Looping, and Solo/Mute track modes.
- **Printing**: Enables clean, high-quality printing without advertisements.

### 🛡️ Privacy Shield & Advanced Evasion
- **Ad Removal**: Blocks banners, "Subscribe" popups, and promotional videos.
- **Anti-Tracking**: Silently blocks outgoing requests to Sentry, Google Analytics, and error loggers to protect your privacy.
- **Payload Manipulation (GZIP)**: Capable of intercepting, decompressing, modifying, and recompressing binary/GZIP requests to bypass frontend obfuscation.
- **Dynamic Anonymization**: Generates random User IDs for each session to bypass server-side rate limits and bans.

---

## 🚀 Installation

1.  Install the **Tampermonkey** extension for your browser:
    - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    - [Firefox](https://addons.mozilla.org/fr/firefox/addon/tampermonkey/)
    - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2.  Create a **New Script** and paste the full code from the provided `.js` file.

3.  Save (`Ctrl+S`) and enable the script.

4.  Go to [songsterr.com](https://www.songsterr.com) (works a lot better in private search!).

---

## 🧠 Technical Breakdown (Cyber Analysis)

This script utilizes a local **Man-in-the-Middle (MITM)** technique via the browser's `fetch` API.

### The Problem (Why other scripts fail)
1. **Cookie Validation**: Songsterr's server verifies session cookies during the file download process. If a free-tier user attempts to download a file, the server detects the "Free" session cookie and rejects the request with a `401 Unauthorized` error.
2. **Rate Limiting**: The server tracks downloads per User ID. Using a static "Guest" ID quickly leads to a `429 Too Many Requests` (Daily limit reached) ban.
3. **Payload Compression**: For larger tabs, the frontend compresses the POST request body into a binary GZIP format before sending it, making standard string interception and JSON parsing crash.

### The Solution (v1.5.0)
This script implements a robust multi-step strategy to bypass these checks:

1.  **Dynamic Profile Injection**:
    It intercepts the `/auth/profile` request and responds with a spoofed JSON profile. Instead of a static ID, it generates a random 9-digit ID (e.g., `458129301`) for every session. This ensures the server treats every download as coming from a fresh, unthrottled user.

2.  **GZIP Decompression & Recompression**:
    When the "Download" button is clicked, the script intercepts the `/api/edits/download` request. It checks the `content-encoding` headers. If the payload is compressed, it uses native `DecompressionStream` APIs to unpack the binary Blob into readable text, injects the new random User ID into the JSON, and seamlessly recompresses it using `CompressionStream` before sending it to the server.

3.  **Request Anonymization (Credentials Omit)**:
    It surgically removes the cookies (`credentials: 'omit'`) and authorization headers from the download request. 
    *Result:* The server receives an authenticated-looking "Guest" request containing a fresh Magic ID in the GZIP body. Since it sees no "Free" cookie to contradict the claim and the ID hasn't reached its quota, it validates the request and serves the file (`200 OK`).

---

## ⚠️ Disclaimer

<code style="color : Red">
This project has only been tested on ZEN Browser (Firefox-based), so MIDI and Guitar Pro downloads leveraging native DecompressionStream/CompressionStream APIs might behave differently on older browsers.
</code>

**This project is for educational and cybersecurity research purposes only :)**
It aims to demonstrate logic vulnerabilities in server-side rights validation (Insecure Direct Object References / Broken Access Control) and client-side payload tampering.
If you enjoy Songsterr and use the application regularly, please support the developers by subscribing to an official plan.
