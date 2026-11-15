# Tizen 5 OTA status and apply control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the true running app version and let the viewer apply a downloaded OTA bundle immediately with a playback warning.

**Architecture:** `boot.js` already publishes the selected bundle version as `TV_UPDATE.running`, while `updater.js` saves downloaded bundles to localStorage and schedules safe restarts. Use the runtime version in `app.js`, clarify the packaged fallback in Settings, and add an explicit manual apply prompt while preserving the existing automatic idle restart.

**Tech Stack:** ES5 JavaScript, the existing Tizen TV UI and translations, `tools/make-build.py` OTA manifest generation.

**Spec:** `docs/superpowers/specs/2026-11-15-tizen5-ota-apply-design.md`

## Global Constraints

- Work only in the `APL-TV-Tizen5` repository.
- Keep Tizen 5 support and `LOADER` / reinstall floors unchanged.
- Keep automatic OTA restarts queued until Home is idle or the app is in the background.
- Do not restart while `TV.player.current()` is truthy, including in the background.
- An explicit restart while playback is active requires confirmation.
- Preserve the existing bundle localStorage key and boot fallback behavior.

## Review Focus

- The startup and About labels show the downloaded bundle version when one is running.
- The revert control clearly identifies the packaged version as the fallback version.
- A manual check with no newer version does not offer restart.
- A downloaded update can be applied immediately from the ready prompt.
- Declining an active-playback restart keeps playback and the saved bundle; accepting restarts into the bundle.
- Automatic checks keep the existing idle / background restart path.
- Active playback prevents both automatic and “Later” restarts until playback is stopped.

No automated tests are planned or run for this change.

---

### Task 1: Report running and installed versions accurately

**Files:**
- Modify: `app/js/app.js:14`
- Modify: `app/js/settings.js:167-169`
- Modify: `app/js/lang-fr.js` and `app/js/lang-pl.js` only if new UI wording needs translations

**Interfaces:**
- Consumes: `global.TV_UPDATE.running`, `global.TV_UPDATE.installed`, and `TV.updater.running()` / `TV.updater.installed()`.
- Produces: `TV.VERSION` reflecting the version selected by `boot.js`; Settings wording distinguishes the active version from the installed package fallback.

- [x] Set `TV.VERSION` from `global.TV_UPDATE.running`, falling back to `global.TV_BUILD.version` and then the existing safe default.
- [x] Clarify the “Back to the Installed Version” row so its displayed version is identified as the packaged fallback rather than the currently running version.
- [x] Review the startup diagnostic and About label call sites to ensure both use `TV.VERSION`.

### Task 2: Offer an explicit apply choice after a manual download

**Files:**
- Modify: `app/js/updater.js:30-90`
- Modify: `app/js/settings.js:165-169` if Settings needs to coordinate the manual result
- Modify: `app/js/lang-fr.js` and `app/js/lang-pl.js` for new prompt text

**Interfaces:**
- Consumes: `check(manual)`, `save(bundle)`, `TV.player.current()`, and the existing `restartWhenIdle()` behavior.
- Produces: a ready prompt with a Restart Now action; active playback requires an explicit confirmation before reload.

- [x] After a successful manual download, offer “Restart to Apply” and “Later”. Keep the bundle saved before showing the choice.
- [x] If playback is active, explain that restarting stops playback and confirm before reloading; declining leaves playback untouched.
- [x] Keep automatic update checks on the existing idle / background restart path and keep “Later” queued for that path.
- [x] Require no open player before either the idle or background path reloads the app.
- [x] Review the no-update, held-update, insufficient-storage, declined-confirmation, no-playback, active-playback, and automatic-update paths.

### Task 3: Prepare the OTA bundle version

**Files:**
- Modify: `app/config.xml`
- Regenerate: `app/version.json`, `app/js/build.js`

**Interfaces:**
- Consumes: source changes from Tasks 1–2 and the version embedded in `app/config.xml`.
- Produces: a versioned OTA manifest containing the updated scripts and styles.

- [x] Bump the app code version from `1.1.6` to `1.1.7` without changing Tizen’s reinstall floor.
- [x] Run `python3 tools/make-build.py --notes "Tizen 5 fixes, provider controls, sports listings, and season navigation"`.
- [x] Inspect the generated manifest and build version fields for `1.1.7` and the unchanged Tizen reinstall floor.
