# My album implementation plan

## Architecture

- Generate Home, Gallery and `/my-album` from a shared guest page entry point. Keep one `MemoryExperience` mounted per event when navigating these destinations. The existing caller retains query subscriptions, guest identity, local drafts, pending jobs, upload execution and favourites. The Camera review stays in its existing overlay. Existing gallery and Home URLs, invitation routes and separate dashboard and QR routes retain their addresses.
- Use the existing guest-scoped Firestore `complete` collection for Photos. Keep local drafts and approved jobs in Uploads. Stable job and upload keys, reserved slots, and the server photo document remain authoritative. The Uploads badge counts the union of local drafts and unresolved approved photo jobs. Voice uploads retain their existing Home and voice-panel entry points.
- Keep the existing multiple-file selection and submission consent in the Add photos sheet. If the guest chooses to add photos, the existing validation and approved-queue path applies. Local camera drafts require explicit review and submission. Route Home upload review and upload-sheet navigation to `/my-album?tab=uploads`.
- Use the existing Home colour and type tokens, Gallery content tabs and photo viewer, and Camera review. Reuse the event's existing quota and supported deletion rules. No new cloud or local stores are required.

## Upload presentation contract

| Existing evidence | Group and guest-facing state | Controls |
|---|---|---|
| Unsubmitted IndexedDB camera draft | Ready to share | Open the existing pre-publication review. |
| Approved job in the actual in-flight set, validation/account/reservation | Uploading · Preparing your photo… | Indeterminate, no Retry. |
| Active byte transfer | Uploading · Uploading… | Real progress when received, no Retry. |
| Active storage lookup or transfer finished, awaiting publication | Uploading · Confirming upload… | Indeterminate, no Retry. |
| Job persisted with an active-phase label and no in-flight operation | Needs attention · Upload interrupted | Resume through the original job ID and upload key. |
| Eligible failed job | Needs attention · Couldn’t upload | Retry the original job. Show local persistence only when bytes are present. |
| Missing local photograph | Needs attention · Photo unavailable | Explain local recovery or re-selection. No repeat processing of absent bytes. |
| Queued job or offline interrupted transfer | Waiting · Waiting to upload / Waiting for connection | Preserve the original row. No Retry action during a live execution or while offline. |
| Metadata publication acknowledged | Shared in Photos, absent from unresolved queue | Existing photo viewer and favourites. |

The persisted processing label records a phase. The real in-flight set determines whether that phase is active. Reconnect and restart use the existing idempotent upload path. The page displays progress from the byte-transfer callback only.

## Ownership and dependencies

| Workstream | Exclusive files | Dependencies |
|---|---|---|
| Album page composition | `MemoryAlbum.tsx` and `MemoryAlbum.module.css` | Shared tab contract and Gallery grid classes. Receives authenticated photo states, quota and upload content as props. |
| Uploads presentation | `MemoryAlbumUploads.tsx` and `MemoryAlbumUploads.module.css` | Flat preclassified items and mutation callbacks. Owns row layout, grouping, thumbnail URLs and compact summary. |
| Gallery reuse | `MemoryContentTabs.tsx`, `MemoryGallery.tsx`, `MemoryGallery.module.css`, `MemoryGalleryPhoto.tsx` and `MemoryGalleryPhoto.module.css` | Extract shared tab mechanics and reuse the same square grid and cached photo presentation in album mode. |
| Route, data and acceptance | `MemoryExperience.tsx`, `MemoryGuestNav.tsx`, guest route files and upload libraries | Lead owns persistent route integration, upload diagnosis, recovery changes, emulator verification and final acceptance. |

The three presentation workstreams have independent files. The lead integrates them and repeats the affected visual and functional checks after targeted corrections.

## Execution and release sequence

1. Reproduce the old phase/status mismatch using aborted IndexedDB transactions and capture the visible result from the preceding revision.
2. Integrate the album page, upload rows and Gallery primitives. Retain the authoritative event scope, allowance, favourite and upload callbacks in `MemoryExperience`.
3. Test the established local stores, publication acknowledgement, partial failure, connectivity, repeated retry, refresh and browser navigation with the existing demo Firebase emulators. Exercise Camera review with a valid draft beside a missing upload.
4. Review both tabs at the six specified viewport sizes and test keyboard, focus and contrast. Return visual and functional corrections to their scoped owners and recheck the final render.
5. Record the observed state mapping, test results, release gate and individual-device gaps in [the delivery and review log](MY_ALBUM_REVIEW_LOG.md).

All three presentation workstreams used explicitly selected `gpt-6.2-sol` agents at low reasoning. The lead retained architecture, persistence diagnosis, integration and final acceptance. The controls were validated with a controlled local event and existing photo fixtures.
