# Stride Development Environment Gotchas (Chrome OS)

This document contains critical findings for future developers (and AI agents) working on the Stride project within a **Chrome OS / Linux (Crostini) container**. Following these rules will save hours of debugging time.

## 1. The "Ghost" Cache
Chrome OS containers utilize an aggressive multi-layer proxy between the Linux system and the Chrome browser. This often prevents standard "Hard Refreshes" (Ctrl+Shift+R) from invalidating the Vite dev server's transpiled files.

**THE SOLUTION:** If a code fix doesn't seem to reflect in the browser, rename the core file (e.g., `App.jsx` → `StrideApp.jsx`) and update the import in `main.jsx`. This forces the browser to request a unique file path, bypassing all caches.

## 2. Networking & Proxies
`localhost` in newer Node versions within Chrome OS often resolves to IPv6 (`::1`), which the Vite proxy and the backend Express server may not handle correctly, leading to silent "Connection Refused" errors.

**THE SOLUTION:** Always use **`127.0.0.1`** instead of `localhost` in `vite.config.js` for the proxy target.

## 3. Browser Tool Isolation
The built-in AI "browser tool" runs inside the headless Linux environment and cannot reliably simulate the user's actual Chrome OS browser experience (due to network isolation). 

**THE SOLUTION:** Trust user-provided screenshots and browser console logs over automated browser tool reports.

## 4. Hook Resilience
Always use **Optional Chaining** (`user?.role`) or **Object Fallbacks** (`user || {}`) in the top-level application component. Never assume data from the API will be available on the first React render cycle.
