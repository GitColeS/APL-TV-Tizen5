# Tizen 5 Fork Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Keep the Tizen 5 fork aligned with compatible upstream fixes and make multi-view clearly unavailable on Tizen 5 while preparing the app code for its existing OTA updater.

**Architecture:** Selectively apply the upstream Polish fixes, retain the fork’s Tizen 5 patch and Canadian NHL broadcaster change, and gate multi-view through one shared platform check and menu-item helper. Bump the app version and regenerate the OTA manifest/build list through the existing build script.

**Tech Stack:** ES5 JavaScript, CSS, Python build tooling, Git.

**Spec:** `docs/superpowers/specs/2026-11-14-tizen5-updates-design.md`

## Global Constraints

- Work only in the `APL-TV-Tizen5` repository.
- Keep `required_version="5.0"` and preserve `tizen5-patch.js` and `tizen5-patch.css`.
- Do not merge upstream’s reset to a Tizen 6 minimum.
- Keep the Pluto stream workaround scoped to Pluto hosts.
- Do not publish or push an OTA update.
- Do not add or run tests; the user did not request testing.

## Review Focus

- Tizen 5 reports a platform version below 6.0: every multi-view menu item is dimmed, selecting it shows the unavailable message, and direct calls cannot open multi-view.
- Tizen 6+ Samsung TVs: multi-view remains available.
- Non-Samsung platforms: multi-view remains available.
- Unknown Tizen version: fail safely by treating multi-view as unavailable.
- French and Polish UI: new unavailable and Live TV hint strings have translations.

---

### Task 1: Sync compatible upstream content and prepare OTA version

**Files:**
- Modify: `app/js/smart.js`
- Modify: `app/js/lang-pl.js`
- Modify: `app/config.xml`
- Modify: `app/js/app.js`
- Modify: `app/service/service.js`
- Regenerate: `app/version.json`
- Regenerate: `app/js/build.js`

**Interfaces:**
- Consume the two-file upstream fix in commit `ee4a078` only; the Canadian broadcaster file already matches upstream at blob `67c063ca4b7c2374ebc4eb0bdfe8ef2658c2a502`.
- Produce version `1.1.7` and OTA notes covering the Tizen 5 multi-view availability change, upstream fixes, and follow-up improvements.

- [x] Apply commit `ee4a078`’s changes to `smart.js` and `lang-pl.js`, keeping all Tizen 5-only files intact.
- [x] Set the app’s version fields to `1.1.7`; keep the Tizen required version at `5.0` and keep existing reinstall floors unchanged.
- [x] Run the repository’s manifest generator with OTA notes so `app/version.json` and `app/js/build.js` describe the updated code and version.
- [x] Review the resulting diff to confirm no unrelated upstream compatibility resets entered the fork.

### Task 2: Gate multi-view on Tizen 5

**Files:**
- Modify: `app/js/core.js`
- Modify: `app/js/multiview.js`
- Modify: `app/js/ui.js`
- Modify: `app/js/live.js`
- Modify: `app/js/home.js`
- Modify: `app/js/guide.js`
- Modify: `app/js/osd.js`
- Modify: `app/css/tv.css`
- Modify: `app/js/lang-fr.js`
- Modify: `app/js/lang-pl.js`

**Interfaces:**
- `TV.multiview.available() -> boolean`: returns false for Tizen versions below 6.0 and when the Tizen version cannot be read; returns true on Tizen 6+ and non-Tizen platforms.
- `TV.multiview.menuItem(channel, beforeOpen?) -> menu item`: supplies the translated label/icon and disabled appearance when unavailable; selecting an unavailable item shows `Not available on this TV`.
- `TV.multiview.open(channels)`: retains a defensive availability check and shows the same toast before returning when unavailable.

- [x] Read the Tizen platform version through `tizen.systeminfo.getCapabilities().platformVersion` in `core.js`, parsing the major version and using an unknown sentinel if unavailable.
- [x] Add the shared availability and menu-item helpers in `multiview.js`; guard the `open` entry point.
- [x] Teach `TV.menu` to render `disabled` items with a dim style while still allowing their callback to show the explanatory toast.
- [x] Replace the four “Watch in Multiview” menu entries in Live TV, Home, Guide, and the player OSD with the shared menu item helper; preserve each screen’s existing close/finish behavior when opening is allowed.
- [x] Update the Live TV hint to omit the multi-view claim on Tizen 5.
- [x] Add the unavailable message and alternate Live TV hint translations in French and Polish.
- [x] Review all multi-view entry points and the final diff. Do not run test commands.
