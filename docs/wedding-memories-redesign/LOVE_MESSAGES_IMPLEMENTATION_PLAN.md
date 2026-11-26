# Wedding Memories Love Messages implementation plan

## Foundation

Use the completed Home and existing wedding invitation tokens, fonts and Lucide icons. Both experiences share the current guest modal's portal, document scroll lock and focus lifecycle, with a contribution layout that uses the mobile bottom sheet and centred desktop dialog. Home and Gallery entry points stay on their current routes.

## Data and state contracts

- Wishes remain in the current event's public wishes collection via `saveWish` and the existing browser guest identity. The compose signature and greeting are decorative. Validate non-blank raw input up to 2,000 characters, keep over-limit text editable with a clear count, and block repeated submission synchronously. Preserve the draft across the name prompt and recoverable failures. Confirm only after Firestore acknowledgement.
- The recorder replaces the old record-and-send behaviour. Flow is idle → requesting permission → recording → finalising → review. A manual or automatic stop ends capture and changes only local review state. Invalid or interrupted media returns to a recoverable error. Review audio stays in memory until Share message, supports its own playback, and never uses public download tokens.
- Shared is the existing default. Submission snapshots the selected destination and retains the existing UID-scoped audio upload, format checks, IndexedDB queue, Firestore metadata and Storage paths. Retry uses the same durable job for the same contribution and destination. A recoverable failure before a job is created keeps the original review audio in memory. Existing approved jobs retain queue recovery. Keep the existing first-time voice identity gate and defer the wish identity prompt until Share wish.
- Composer close, Escape and backdrop use the same unsaved confirmation. Confirm before replacing a recording. Unmounting, leaving the route, and an abandoned microphone request clean up resources. Modal confirmation has one keyboard focus boundary. A success state appears on acknowledged publication only. Shared success targets the relevant Gallery tab. Private success has only Done.
- Private metadata and audio remain in existing restricted collections and paths. Independently verify direct read denial for a different signed-in guest and anonymous public access, plus owner and contributor permissions, using local emulators. Use only controlled local test contributions.

## Workstreams and ownership

| Owner | Exclusive files | Contract and measurable completion |
|---|---|---|
| Shared presentation | `MemoryGuestPanel.tsx`, new `MemoryContributionSheet.tsx` and CSS | Optional contribution presentation, leaving upload and identity stable. Mobile and desktop layouts have internal scroll, safe edges, original action focus on close and support for visual viewport geometry. Expose a common header, success, confirmation, friendly error, and Home action classes. |
| Recording lifecycle | New `useMemoryVoiceRecorder.ts` | Single MediaRecorder per mount. Use the existing audio formats, permission only on user action, monotonic timer with a 30-second ceiling and actual amplitude when supported. Review exposes a real Blob, duration and URL. Abort stale operations and stop tracks, timers, analysis and URL allocations. No queue, submission or styling. |
| Voice presentation | New `MemoryVoiceContribution.tsx` and CSS | Present the agreed recorder contract, initial/review states, labelled radio destination, confirmation-driven re-recording, and real local play/pause and progress. Accessible 44 px controls, no overflow at 320 px, no upload on stop. No Firebase or guest ownership changes. |
| Lead integration and wish | `MemoryExperience.tsx`, new `MemoryWishContribution.tsx` and CSS, scoped queue/SDK changes if needed, tests and documentation | Compose and identity state, delivery locking, contextual routing, evidence and privacy checks. Own final integration and visual judgement. |

The common contracts precede independent implementation. The lead will review the existing screens, then record all required states in an isolated browser. Targeted work returns to the owner of the affected files. Production build, type checking, scoped lint, rules checks and the reviewer’s scorecard follow integration.

All workstreams and targeted corrections are integrated. The local review covers eight viewport layouts, actual acknowledged contributions, the 30-second recording boundary, retries and direct voice access checks. [Delivery report and evidence](LOVE_MESSAGES_REVIEW_LOG.md)
