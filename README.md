# 🎸 Songsterr Plus - Ultimate Unlocker

> **An advanced Tampermonkey script that unlocks all Songsterr "Plus" features, including native download (.gp5), by exploiting a server-side logic flaw. **

---

## 🧐 About

This project is the result of a deep analysis (Reverse Engineering) of Songsterr's React application and API. Unlike classic scripts that only modify the interface (CSS/DOM), this script intercepts and manipulates network requests in real-time to:

1.  **Trick the Interface (Client-Side):** Deceive the application into believing the user has a valid "Plus" subscription.
2.  **Bypass Security (Server-Side):** Exploit a specific "Magic Guest" profile (ID `100000000`) that retains privileged access rights on Songsterr's servers.

## ✨ Features

### 🔓 Total Unlock
- **Native Download (.gp5 / .mid)**: Works directly via the official download button (Bypasses the 401 Unauthorized error).
- **Plus Player**: Unlocks Speed control, Looping, and Solo/Mute track modes.
- **Printing**: Enables clean, high-quality printing without advertisements.

### 🛡️ Privacy Shield & Cleanup
- **Ad Removal**: Blocks banners, "Subscribe" popups, and promotional videos.
- **Anti-Tracking**: Silently blocks outgoing requests to Sentry, Google Analytics, and error loggers to protect your privacy.
- **Anonymization**: Strips tracking cookies from download requests to prevent server-side blocking.

---

## 🚀 Installation

1.  Install the **Tampermonkey** extension for your browser:
    - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    - [Firefox](https://addons.mozilla.org/fr/firefox/addon/tampermonkey/)
    - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2.  Create a **New Script** and paste the full code from the `Songsterr_Unlocker_V37.js` file.

3.  Save (`Ctrl+S`) and enable the script.

4.  Go to [Songsterr.com](https://www.songsterr.com) (works a lot better in private search !) .

---

## 🧠 Technical Breakdown (Cyber Analysis)

This script utilizes a local **Man-in-the-Middle (MITM)** technique via the browser's `fetch` API.

### The Problem (Why other scripts fail)
Songsterr's server verifies session cookies during the file download process. If a free-tier user attempts to download a file (even with a patched UI), the server detects the "Free" session cookie and rejects the request with a `401 Unauthorized` error.

### The Solution (V37 - The Native Flow)
This script implements a two-step strategy to bypass this check:

1.  **Profile Injection (ID 100000000)**:
    It intercepts the `/auth/profile` request and responds with a spoofed JSON profile containing User ID `100000000`. This specific ID appears to be a *backdoor* or an internal test account authorized by the server.

2.  **Request Anonymization (Credentials Omit)**:
    When the "Download" button is clicked, the script intercepts the request to `/api/edits/download`. It surgically removes the cookies (`credentials: 'omit'`) and authorization headers.
    *Result:* The server receives a "Guest" request containing the Magic ID in the body. Since it sees no "Free" cookie to contradict the claim, it validates the request and serves the file (`200 OK`).

---

## ⚠️ Disclaimer

<code style="color : Red">
This project as only been tested on ZEN Browser (firefox based) so MIDI and Guitar pro downloads can fail on other Browsers
</code>

**This project is for educational and cybersecurity research purposes only :)**
It aims to demonstrate logic vulnerabilities in server-side rights validation (Insecure Direct Object References / Broken Access Control).
If you enjoy Songsterr and use the application regularly, please support the developers by subscribing to an official plan.
