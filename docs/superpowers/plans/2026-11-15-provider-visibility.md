# Provider visibility and pause Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Let viewers disable providers without deleting their cached catalogs, favorites, or category visibility choices.

**Architecture:** Persist `enabled: false` in each existing source record, with missing/true meaning enabled. Keep `D.sources()` as the full Settings/source-lookup list and add `D.enabledSources()` for catalog composition and background work. Rebuild the active catalog from enabled sources while retaining disabled source caches and user choices.

**Tech Stack:** ES5 JavaScript, existing Tizen TV Settings and catalog code, `tools/make-build.py` OTA metadata generator.

**Spec:** `docs/superpowers/specs/2026-11-15-provider-visibility-design.md`

## Global Constraints

- Work only in the `APL-TV-Tizen5` repository.
- Keep favorites, groups, category visibility, provider credentials, and cached catalogs intact when disabling a provider.
- Existing sources with no `enabled` property remain enabled.
- Disabled sources are omitted from automatic refreshes; an in-flight request may finish into the hidden cache.
- A disabled source's explicit Settings “Refresh Now” action remains available.
- Preserve app version `1.1.7` and Tizen reinstall floor `1.0.1` for this unpublished update bundle.
- No automated tests are added or run for this change.

## Review Focus

- A favorite from a disabled source disappears from all active lists without its ID being removed; re-enable resolves it again.
- Category hide/visible settings survive off/on, including after app restart.
- Disabled missing, partial, stale, or retry-queued sources do not auto-fetch; a request already in flight can only update hidden cache.
- Re-enabling shows cache immediately and refreshes only when missing, older than `MAX_AGE`, or below `CATALOG_V`.
- “Refresh All Playlists” and background media freshness exclude disabled sources; explicit “Refresh Now” still refreshes one disabled source.
- Disabling a media server removes its dynamic tab; re-enabling restores it.
- All providers off does not launch first-run setup and gives Home / Movies / Series a Settings route.

---

### Task 1: Add persisted enabled-source filtering

**Files:**
- Modify: `app/js/data.js`
- Modify: `app/js/media.js`

**Interfaces:**
- Consumes: current `sources`, `cats`, `MAX_AGE`, `CATALOG_V`, `whenQuiet`, and `rebuild()`.
- Produces: `D.enabledSources()` and `D.setSourceEnabled(id, enabled)`; `D.sources()` continues returning every provider.

- [x] Add `enabledSources()` that treats `source.enabled !== false` as active.
- [x] Add `setSourceEnabled(id, enabled)` to persist the state and rebuild immediately without modifying other source fields or saved user preferences.
- [x] Build `merged` from enabled sources only, so disabled catalogs cannot appear in channels, favorites, groups, Movies, Series, search, guide, sports matching, or Home collections.
- [x] At startup, load cached IndexedDB catalogs for every source, but only auto-load missing/partial sources and auto-refresh stale sources that are enabled.
- [x] Make default `refresh()` and queued retries discard disabled sources; keep explicit `loadSource(src)` available for per-provider manual refresh.
- [x] On re-enable, expose the loaded cache immediately and use the existing six-hour `MAX_AGE` and `CATALOG_V` checks to schedule refresh if needed.
- [x] Filter background Jellyfin/Emby freshness requests to enabled sources.

### Task 2: Add provider controls to Settings

**Files:**
- Modify: `app/js/settings.js`
- Modify: `app/js/lang-fr.js`
- Modify: `app/js/lang-pl.js`

**Interfaces:**
- Consumes: `D.sources()`, `D.enabledSources()`, and `D.setSourceEnabled()`.
- Produces: per-provider On/Off control and an Off marker in the Settings provider list.

- [x] Show disabled state alongside provider counts in the main Playlists list.
- [x] Add a Provider On/Off row to each existing provider detail page; changing it calls `D.setSourceEnabled()` and redraws the page.
- [x] Keep the explicit per-provider “Refresh Now” action available when disabled.
- [x] Make “Refresh All Playlists” process enabled providers only and refresh the guide from the active catalog.
- [x] Add French and Polish strings for the provider toggle description and all-off guidance.

### Task 3: Handle all-off state and media tabs

**Files:**
- Modify: `app/js/app.js`
- Modify: `app/js/home.js`
- Modify: `app/js/vod.js`
- Modify: `app/js/library.js`

**Interfaces:**
- Consumes: `D.enabledSources()` and the data-change event emitted by `D.rebuild()`.
- Produces: correct first-run selection, all-off Home/VOD guidance, and dynamic media tabs for active sources only.

- [x] Determine startup playable-data/setup state from enabled sources; do not launch first-run setup solely because every saved provider is off.
- [x] On Home with saved but disabled providers, show “No providers enabled” and a Settings action; keep the existing setup prompt when there are no saved providers.
- [x] On Movies/Series with all providers off, show clear turn-on guidance rather than “No playlist yet.”
- [x] Build dynamic Jellyfin/Emby/Plex tabs from enabled sources only, allowing the existing data-change handler to return to Home if the current server tab is disabled.

### Task 4: Regenerate OTA metadata

**Files:**
- Regenerate: `app/version.json`, `app/js/build.js`

**Interfaces:**
- Consumes: updated source files and the existing version `1.1.7` in `app/config.xml`.
- Produces: OTA metadata containing the completed app code at `1.1.7`, retaining the Tizen reinstall floor.

- [x] Run `python3 tools/make-build.py --notes "Provider visibility, sports broadcasters, and season navigation improvements"`.
- [x] Inspect generated version and Tizen reinstall fields; keep version `1.1.7`, loader `1`, and Tizen reinstall `1.0.1`.
