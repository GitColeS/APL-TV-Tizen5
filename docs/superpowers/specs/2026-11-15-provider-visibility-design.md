# Tizen 5 provider visibility and pause

## Intent

Let the viewer temporarily turn a playlist, IPTV account, or media server off without deleting it. This supports testing providers while keeping their cached catalog and the viewer's saved choices intact.

## Goals

- Add an On/Off control to each provider's existing Settings page and show disabled status in the provider list.
- When off, remove the provider's channels, movies, series, favorites, groups, guide, search results, sports matches' channel choices, and media-server tab from app surfaces.
- Preserve its source configuration, cached catalog, favorite IDs, grouped channel IDs, and category visibility preferences.
- Pause automatic catalog, guide, and media-server refresh work for disabled providers. “Refresh All Playlists” includes enabled providers only.
- On re-enable, restore cached content immediately and refresh the provider if its catalog is missing, older than the existing six-hour `MAX_AGE`, or below the existing `CATALOG_V` schema.
- If all providers are disabled, show a clear “No providers enabled” state on Home and Movies/Series with a route back to Settings, rather than the first-run setup prompt. Live TV, Guide, Search, and Sports keep their existing empty states.
- If a background refresh is already in flight when a source is disabled, let it finish updating the hidden cache; do not merge its results or start later automatic retries while the provider remains disabled.
- Keep a direct “Refresh Now” action on the disabled provider's Settings page; this is an explicit user request and updates its cache without making it visible.

## Non-goals and constraints

- Do not delete provider data or rewrite favorite, group, or category-preference storage.
- Do not change provider parsing, authentication, catalog formats, or Tizen install requirements.
- Keep all providers visible in Settings so the viewer can re-enable them.
- Work only in the Tizen 5 repository.

## Approaches

1. **Persist an enabled flag on each saved source and filter active app work** — selected. Existing sources default to enabled; disabling hides their merged content and pauses automatic refresh without removing the saved source or cache. Re-enabling restores the cached catalog immediately and checks freshness. This matches the requested behavior and the viewer's choice to pause background refreshes.
2. **Hide content but continue refreshing** — rejected because an off provider would still use network and TV catalog work.
3. **Remove and re-add providers** — rejected because it risks the saved channel state the viewer wants to keep.

## Design

Store `enabled: false` on a disabled source in the existing `sources` list; a missing or true value means enabled for backward compatibility. Add `D.enabledSources()` and use it for merged catalog construction, automatic startup refreshes, default `D.refresh()`, the Settings “Refresh All Playlists” action, Jellyfin/Emby background freshness, and media-server tabs. `D.sources()` remains the full list for Settings and source lookup.

Load saved IndexedDB catalogs for all sources at startup so toggling a source back on can restore its last catalog immediately. Do not auto-download missing, partial, or stale data for disabled sources. `D.setSourceEnabled(id, on)` persists the flag and rebuilds the merged catalog; turning a source on schedules a refresh when its cache is absent, older than `MAX_AGE`, or below `CATALOG_V`. Turning it off does not alter favorites, channel groups, or hidden category preferences. If an automatic fetch was already underway, it may finish and update the hidden cache; `rebuild()` still excludes the source, and any queued automatic refresh is discarded if the provider remains disabled. A manual Refresh Now from that source's own page remains available while disabled, but the refreshed catalog stays excluded until re-enabled.

When no provider is enabled, Home and Movies/Series show a clear off-state; the first-run setup prompt is only shown when the source list is empty. Settings continues listing every source with an Off marker and the source page's On/Off control.

The viewer selected pausing background refresh while disabled. Calls already in flight may finish into the hidden cache because the current loader has no cancellation handle; this saves that work for later without exposing it. Existing catalog age/version thresholds remain in use. The off-state is limited to Home and Movies/Series; other routes retain their existing empty states. Placement on the provider settings page and retaining explicit per-provider Refresh Now are implementation choices.
