# Developer prompt: Safe-area and layout padding

Use this as a clear prompt for a developer (or AI) to implement padding correctly.

---

**Task:** Add correct top and bottom padding to the PWA so content is not hidden behind the device notch, home indicator, or system UI.

**Requirements:**
1. **Top:** Respect `env(safe-area-inset-top)` so the header and any content under it are not covered by the status bar or notch. Apply this to the main app shell (e.g. header and/or main content area).
2. **Bottom:** Respect `env(safe-area-inset-bottom)` so the bottom navigation and any fixed elements (e.g. the Quick Add FAB) are not covered by the home indicator or system gesture area on notched devices.
3. Use CSS environment variables: `padding-top: env(safe-area-inset-top, 0px)` and `padding-bottom: env(safe-area-inset-bottom, 0px)` (or equivalent) on the relevant containers.
4. Ensure the layout remains correct on desktop (where safe-area insets are typically 0) and on mobile/PWA when installed (where insets may be non-zero).

**Files to check:** `AppLayout.tsx` (header and bottom nav already use safe-area in some places), `index.css` if global layout is defined, and any fixed-position elements (e.g. the Quick Add button).

---
