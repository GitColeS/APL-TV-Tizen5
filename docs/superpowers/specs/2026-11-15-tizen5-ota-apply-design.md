# Tizen 5 OTA status and apply control

## Intent

Make the app report the version it is actually running and make downloaded OTA updates easy to apply without waiting on the Home screen. This is for the Tizen 5 fork and must preserve playback unless the viewer confirms a restart that will stop it.

## Goals

- Derive the startup/About version from the version selected by `boot.js` (`TV_UPDATE.running`) instead of a hard-coded label.
- Keep the current packaged version clearly identified as the fallback version in the “Back to Installed Version” control.
- After a manual update check downloads and saves a newer bundle, offer “Restart to Apply”.
- If playback is active, explain that applying now will stop playback and require confirmation. “Later” leaves the bundle saved and retains the existing safe restart behavior.
- Keep automatic updates queued until Home is idle or the app is in the background, and only when no player is open.

## Non-goals and constraints

- Do not change the Tizen 5 install floor, helper service, OTA repository or signing/package flow.
- Do not restart automatically from a manual check while playback is active.
- Preserve the existing downloaded bundle storage and startup fallback behavior.
- Work only in `APL-TV-Tizen5`.

## Approaches

1. **Show the current running version and offer an explicit apply action** — selected. Manual check continues downloading and saving the bundle; the user can restart into it immediately from the ready prompt. If playback is active, ask first. Automatic checks retain the existing wait-for-Home behavior. This meets the user's request while keeping playback safe by default.
2. **Reload immediately after a manual check downloads** — rejected because opening Settings to check could stop a movie without a separate apply choice.
3. **Keep the current wait-for-Home behavior and only clarify labels** — rejected because it leaves the user waiting for the idle restart with no direct apply action.

## Design

Use `TV_UPDATE.running` as the primary runtime version, with `TV_BUILD.version` as a fallback for preview/older boot contexts. Make the revert control explicitly describe the packaged version it returns to, distinct from the running OTA bundle.

When a manual check downloads a newer bundle, keep the existing ready message and add a restart action. Choosing it reloads the app. If `TV.player.current()` reports active playback, first show a confirmation that restarting will stop playback; declining leaves the update stored and the current playback untouched. The existing `restartWhenIdle()` continues applying saved bundles when the app reaches Home or goes to the background, but only when no player is open; this prevents a background or Home transition from cutting off playback.

The user selected the restart action with a playback warning. A follow-up build can include this app-code-only change in the Tizen 5 OTA bundle.
