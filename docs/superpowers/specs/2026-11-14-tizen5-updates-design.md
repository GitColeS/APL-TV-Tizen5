# Tizen 5 fork updates

## Intent

Keep the APL-TV-Tizen5 fork aligned with compatible changes in the main APL TV repository while preserving its Tizen 5 support. Make multi-view clearly unavailable on Tizen 5 Samsung TVs.

## Goals

- Apply the upstream Polish playlist-recognition and frozen-picture wording fixes.
- Verify that the Canadian NHL broadcaster code matches the merged upstream PR. The current fork and upstream PR head have identical `app/js/sports.js` content, so no broadcaster code change is needed unless a different PR or commit is identified.
- On Tizen 5, show multi-view as unavailable in every menu, dim the item, show “Not available on this TV” when selected, and prevent direct calls from opening it.
- Preserve the Pluto HLS workaround’s Pluto-only scope. It removes a separate audio rendition and is safe only for streams whose video rendition already contains audio; other feeds need a concrete sample before being included.

## Non-goals and constraints

- Work only in the cloned `APL-TV-Tizen5` repository.
- Do not merge upstream changes that revert the fork to a Tizen 6 minimum or remove the Tizen 5 compatibility patch.
- Do not publish or push an over-the-air update as part of this work.

## Approaches

1. Merge upstream wholesale: rejected because upstream has removed the fork’s Tizen 5 support.
2. Selectively port upstream changes while keeping the fork’s compatibility layer: recommended because it preserves Tizen 5 and keeps matching changes traceable.
3. Reimplement the compatible upstream fixes manually: possible, but less direct than applying the exact upstream change.

## Proposed implementation

Apply the upstream `ee4a078` changes to `app/js/smart.js` and `app/js/lang-pl.js`. Confirm the broadcaster implementation remains aligned with the upstream PR. Add a Tizen-version check used by a shared multi-view availability guard; dim all multi-view menu items on Tizen 5, show the unavailable toast on selection, and guard the multi-view entry point. Update the Live TV hint to avoid advertising the unavailable action. Keep the Pluto workaround scoped to Pluto hosts.

## Open detail

The exact maintainer edits the user recalls to the broadcaster PR are not present in the current upstream PR head or `main`. If the user points to a different PR or commit, compare and include it if compatible with Tizen 5.
