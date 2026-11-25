# Wedding Memories My album delivery and review

## Summary and release assessment

My album is now a primary Wedding Memories destination with a personal photo roll, a shared camera allowance card and a separate Uploads tab. Unresolved contributions are discoverable above the photo collection. The upload manager distinguishes a live operation from a persisted phase, retains local photographs through recoverable failures and waits for publication acknowledgement before listing a photo as shared.

**Ready for final device validation.** The final gate is native iOS Safari and Android Chrome verification of photo selection, storage and recovery. All browser test writes used the local `demo-wedding` Auth, Firestore and Storage emulators. The available historical mobile screenshot in Downloads showed the modal and oversized photo cards. The pasted brief described the Checking photo rows. The [baseline reproduction](my-album-evidence/baseline-checking-photo.png) was captured locally from `abf0cc1` and shows the reported state with preserved fixture photographs.

## Changes and ownership

| Component or file | Delivered change |
|---|---|
| `MemoryAlbum` and its CSS module | Standing album page, personal header and initials, authoritative camera allowance, copy and actions, content panels, empty states and quiet route links. |
| `MemoryAlbumUploads` and its CSS module | Mixed-state summary, grouped compact rows, actual available thumbnails, neutral missing-media placeholders, transfer progress and targeted retry or review. |
| `MemoryContentTabs`, `MemoryGallery` and `MemoryGalleryPhoto` | One Gallery and Album tab pattern. Reuses square, cached 400 px thumbnails, shared favourites and the original-ratio viewer. Personal tiles omit the repeated name overlay, with contributor and Shared status in the viewer. |
| `[[...experience]].tsx`, `MemoryGuestNav` and `MemoryExperience` | Preserves Home and Gallery URLs and adds `/my-album`. The same event owner stays mounted across all three views. Nav marks the active route, and Home upload actions open Uploads directly. |
| `memoriesUploadStatus`, `memoriesUploads`, `memories` and upload-state tests | Uses actual activity and transfer phase, handles phase-write and cleanup failures, retains diagnostics, filters out unacknowledged local document writes and tests the new state mapping. |
| `MemoryCamera`, `MemoryCameraTray` and `MemoryHomeUploadStatus` | The review action opens the exact selected draft. Camera keeps local deletion with confirmation and unavailable media stays isolated. Home and Camera use matching approved-photo states and counts. |

The existing anonymous identity, event filters, confirmed-personal-photo subscription, chronological ordering and pagination remain authoritative. Photos is the acknowledged collection. Uploads contains unresolved approved photo jobs and unsubmitted local drafts. The badge counts that whole collection. The two sections use the stable `uploadKey` to reconcile a published photo whose queue entry is still present. File type and size validation, multiple-file selection, camera review, original and styled downloads, favourites and the existing shared-album permission rules remain available. The album explains public-link visibility before or alongside contribution, and local drafts require review and an explicit upload action. Only unshared local deletion is available to guests.

## Checking photo investigation

The old `processUploadJobOnce` saved `Checking photo` before validating bytes and saving the next phase. The album rendered that durable text as current activity, then used an independent in-memory active-ID set to enable Retry. It also initialized progress to zero on entry, before any byte callback. A saved phase can outlive its operation when a browser interrupts the task, or when later error-state writes fail.

The baseline browser used the existing multi-file picker, two actual files and real IndexedDB transactions. After both approved rows reached `Checking photo`, the fixture aborted `Checking account` and then `Needs retry`. The old interface showed two `Checking photo` rows, two Retry actions and progress tracks. IndexedDB still held both originals at 2,919,537 and 79 bytes, with neither slot assigned. The rows stayed stale until action, and a manual retry successfully continued an original job after writes were restored. This reproduces a concrete failure mechanism for the reported UI. The original production device’s storage and network logs were unavailable.

The shared upload code now updates the live UI with the observed failure even if that diagnostic write also fails. Persisted phase labels alone never imply live work. Recoverable interrupted jobs resume through the original ID and upload key, and hard failures remain manually actionable. The byte-transfer callback starts progress only when transfer is underway. A completed transfer enters confirmation while the Firestore document is awaiting acknowledgement. If acknowledgement succeeds and local cleanup fails, the guest still sees success. Future reconciliation checks the same stored object and stable photo document before removing the leftover job. [Corrected failure controls for the reproduced case](my-album-evidence/recovered-checking-photo.png)

| Evidence | Guest-facing state | Available action |
|---|---|---|
| An unsubmitted camera draft with durable local media | Ready to share · Saved on this device | Open the exact draft in Camera review. |
| A live validation, account or reservation step | Preparing your photo… | Indeterminate status with the current task running. |
| A live Storage byte transfer | Uploading… | A determinate progress bar when the SDK callback provides a value. |
| Active Storage lookup or transferred bytes awaiting publication | Confirming upload… | Indeterminate while reconciliation or publication runs. |
| A durable processing phase without a live operation | Upload interrupted | Resume the original job through the shared queue. |
| Failed eligible job with original data | Couldn’t upload | Retry this job when online. |
| Approved pending job or active job while disconnected | Waiting to upload or Waiting for connection | Existing resume path while the guest app is open and online. |
| Missing local original | Photo unavailable | Check the device library for a copy. The approved row has no Retry without media. |
| Server acknowledgement received | Shared | Appears in Photos and is excluded from unresolved totals. |

## Rendered visual evidence and responsiveness

| Viewport | Photos | Uploads | Observed layout |
|---|---|---|---|
| 320 × 568 | [Photos](my-album-evidence/photos-320.png) | [Uploads](my-album-evidence/uploads-320.png) | Three 91 px square tiles, wrapped status text and reachable controls. [Scroll at 320 px](my-album-evidence/uploads-320-scrolled.png) |
| 375 × 667 | [Photos](my-album-evidence/photos-375.png) | [Uploads](my-album-evidence/uploads-375.png) | Three 107 px tiles and separate contribution buttons. |
| 390 × 844 | [Photos](my-album-evidence/photos-390.png) | [Uploads](my-album-evidence/uploads-390.png) | Three 111 px tiles. Mixed states and active destination are clear. |
| 430 × 932 | [Photos](my-album-evidence/photos-430.png) | [Uploads](my-album-evidence/uploads-430.png) | Three 125 px tiles. Rows wrap vertically within their columns. |
| 768 × 1024 | [Photos](my-album-evidence/photos-768.png) | [Uploads](my-album-evidence/uploads-768.png) | Four 171 px tiles. The cream reading region is centred. |
| 1440 × 900 | [Photos](my-album-evidence/photos-1440.png) | [Uploads](my-album-evidence/uploads-1440.png) | Five 159 px tiles in the centred application shell. |

All sizes used the naturally scrolling document and the existing 64 px bottom navigation. Browser measurements found no horizontal overflow, square photo tiles and 48 px tabs. Review and Retry hit areas measured at least 44 px. The page's safe-area padding follows Home. At 320 px and 200% text, both tabs reflowed and the final links stayed above the navigation at maximum scroll. Physical notches and mobile toolbars remain on the device checklist. [Scaled Photos](my-album-evidence/photos-320-text-scaled.png) · [Scaled Uploads](my-album-evidence/uploads-320-text-scaled.png)

- Collection and viewer. [Normal Photos](my-album-evidence/photos-normal.png) · [First-use empty Photos](my-album-evidence/photos-empty.png) · [Empty Uploads](my-album-evidence/uploads-empty.png) · [Shared photo detail](my-album-evidence/photo-detail.png)
- Activity and recovery. [Active and mixed](my-album-evidence/upload-active.png) · [Active row](my-album-evidence/upload-active-row.png) · [Awaiting publication](my-album-evidence/upload-confirming-row.png) · [Failed](my-album-evidence/upload-failed.png) · [Offline](my-album-evidence/upload-offline.png) · [Publication acknowledged](my-album-evidence/upload-acknowledged.png)
- Loading and retrieval. [Loading Photos](my-album-evidence/photos-loading.png) · [Loading Uploads](my-album-evidence/uploads-loading.png) · [Offline retrieval error](my-album-evidence/photos-retrieval-error.png)
- Local integrity. [Ready to share](my-album-evidence/local-draft.png) · [Camera review](my-album-evidence/draft-review.png) · [Exhausted allowance](my-album-evidence/quota-exhausted.png) · [Valid Camera review beside missing media](my-album-evidence/quota-missing-media-review.png)

## Functional acceptance

| Acceptance coverage | Browser and test evidence |
|---|---|
| ALB-001–008 · Navigation and guest identity | Home, Gallery and My album used distinct static URLs while retaining the authenticated event owner. Verified first-use entry, remembered name, browser Back and Forward, a direct Uploads query and access from Home status. Gallery retained keyboard and hash navigation on all three tabs. Camera review returned to the selected Album tab. |
| ALB-009–015 · Quota, intake and tabs | The configured quota matched Home and Camera. Six real multi-selected files, rejection of a bogus JPEG, a Camera capture and the same acknowledged quota were verified. Exhaustion disabled new contribution while preserving review and Retry. Badge and accessible tab selection reflected current unresolved items. |
| ALB-016–021 · Collection, viewer and deletion | Eight acknowledged photos appeared with real thumbnails. The viewer showed the correct full source, Shared status and existing favourite actions. Gallery saw the same favourite. Confirmed local deletion restored one shot and left the shared collection intact. |
| ALB-022–028 · Summary and compact presentation | The summary distinguished active, failed and unsubmitted items before the tabs. Empty state hid the summary. Actual available thumbnails and a neutral missing-media placeholder appeared in the grouped rows. |
| ALB-029–035 · Processing and retry | Two IndexedDB phase and failure-record writes were blocked in the browser. Both originals remained durable and resumed by their original keys on reload. The emulator held a Firestore publication request after transfer. Photos remained at the six acknowledged images until the commit. A twelve-click manual retry produced one transfer and reused the original upload key and slot. |
| ALB-036–043 · Interruption, persistence and visibility | Active jobs stayed active across route and tab changes. Verified Chromium connection loss during transfer and successful resumption under the same key. After publication, a forced IndexedDB cleanup failure reconciled on reload with zero new Storage transfers, one shared document and the same slot. A different anonymous guest with the same locally stored display name saw a fresh quota and collection. Camera drafts stayed unsubmitted until explicitly approved. |
| ALB-044–046 · Empty, loading and retrieval failure | Verified both empty states, held Auth creation to inspect both loading states, and saw a retryable retrieval error after disconnecting with an empty collection. |

## Iterative review log

| ID | Severity | Expected and observed | Owner | Resolution and evidence |
|---|---|---|---|---|
| ALB-R01 | Major | Interrupted phase displays truthful recovery. The previous durable `Checking photo` survived the failed next-phase and failure writes while the in-memory task ended. | Lead | Updated the real execution and recovery path, and separated live transfer from durable phase. [Original reproduction](my-album-evidence/baseline-checking-photo.png) |
| ALB-R02 | Minor | The summary has a meaningful role and a clear separation from the selected panel. Initial Uploads retained the same-tab button, with its heading too close to the divider. | Upload rows agent | Uploads displays a static breakdown and aligned 12 px heading inset, while Photos retains the entry action. [Rechecked Uploads](my-album-evidence/uploads-390.png) |
| ALB-R03 | Major | A missing approved upload cannot block other drafts. A queue record without a Blob caused `URL.createObjectURL` to throw and unmount the Camera review. | Upload rows agent, lead integration | Guarded missing, empty and invalid media, added placeholder and narrowed approval to actual media. Reopened a valid draft with the missing row present. [Corrected Camera tray](my-album-evidence/quota-missing-media-review.png) |
| ALB-R04 | Minor | Scaled page content stays above fixed navigation. At 200% and 320 px, the last album links overlapped the fixed nav by about 14 px. | Album composition agent | Added album-only text-scaled clearance and stacked upload actions beneath their row copy when necessary. At 320 px and 200% text, both footers cleared the nav by at least 17 px. The 100% upload rows retained their horizontal layout. [Scaled Uploads](my-album-evidence/uploads-320-text-scaled.png) |
| ALB-D01 | Release gate | Native mobile photo-library, local storage and connection recovery should be verified on each target device. | Lead | Physical iOS and Android hardware unavailable in this workspace. |

## Weighted review scorecard

| Dimension | Rating / 10 | Weight | Weighted | Supporting observations and limitations |
|---|---:|---:|---:|---|
| Upload reliability and functional correctness | 9.4 | 25% | 23.5 | Local fault injection, real Storage writes and server acknowledgement. Physical network suspension still needs a device pass. |
| State integrity and photograph preservation | 9.6 | 20% | 19.2 | Original bytes, draft-only consent, reload and event isolation validated. Device storage eviction remains outside the verified persistence window. |
| Information hierarchy and clarity | 9.4 | 15% | 14.1 | Separate Photos and Uploads with distinct status counts and one appropriate summary action. |
| Mobile usability | 9.2 | 10% | 9.2 | Visible actions, proper scrolling and reflow from 320 px. Physical safe-area check remains. |
| Premium aesthetic | 9.3 | 10% | 9.3 | Quiet surface and personal heading keep the square photography in focus. |
| Design-system consistency | 9.5 | 10% | 9.5 | Uses existing typography, Home camera allowance, Gallery tabs and viewer, shared nav and Camera tray. |
| Accessibility | 9.2 | 5% | 4.6 | Keyboard tab navigation, viewer focus, measured targets and automated audit. Physical screen readers remain unverified. |
| Performance | 9.0 | 5% | 4.5 | One transfer through route changes and manual retry, cached thumbnail paths and no new dependencies. Low-end phone latency remains unmeasured. |
| **Total** | | **100%** | **93.9** | Above the 90-point review target. Physical device validation remains the release gate. |

## Technical checks and browser scope

| Check | Result |
|---|---|
| Browser end to end | Desktop Chrome 157, responsive emulation, real UI and local Auth, Firestore and Storage. Browser file-picker automation selected multiple real images. Camera used a controlled media stream. |
| Accessibility | axe A and AA scans at 390 px returned zero violations on both tabs. Measured 44 px or larger interactive targets and used keyboard navigation and focus restoration. |
| TypeScript and diff validation | Passed separately from the Next.js production build. |
| Scoped ESLint and Stylelint | New and updated UI and upload-state files passed. `MemoryExperience` retains one pre-existing image warning. `memories.ts` retains pre-existing formatting violations and one unused import warning. |
| Repository-wide lint | JS, CSS and JSON lint ran individually. Existing older formatting and style violations remain. JSON formatting still flags `outputs/bride-rsvps-20261124/rsvps-source.json`. |
| Wedding Memories tests | 41/41 passed, including the new processing phase and unavailable-media checks and a fake IndexedDB regression that verifies the actual failure and unchanged persisted bytes. |
| Firestore rules integration | 7/7 passed against the demo event. |
| Adjacent invitation and opening suites | 24/26. The two pre-existing failures concern invitation gift and registry content, and Salam Kaut link visibility. |
| Production build | Passed. Static generation includes Home, Gallery and My album for both event slugs, alongside the existing QR and dashboard pages. |

No heavyweight dependencies, extra upload stores, polling or new access rules were introduced. Existing Gallery preview generation uses one capped client cache and lazy viewport loading for both collections. Album upload rows use saved preview blobs or small legacy source blobs and revoke object URLs. Observed network evidence showed one transfer through route changes with the same operation and one transfer from a rapid Retry burst. This measures duplicate-operation prevention in the tested paths. Physical-device rendering and network latency remain unmeasured.

## Sub-agent selection and conditional work

The page composition, shared Gallery primitives and upload rows workstreams used `gpt-6.2-sol` at low reasoning. The upload rows agent also handled the targeted Camera media correction. The lead retained architecture, state investigation, integration, independent rendering and release judgement. No model escalation was needed.

Retry all was deferred to preserve explicit, individual recovery and the established shared queue concurrency. Guests can retry each eligible photo from Uploads. The optional identity treatment is a static display of the existing guest's initials. Guest editing and a details sheet were deferred because the existing session has no edit flow. Photo-detail dismissal restores the existing scroll position and focus. Extra per-tab scroll memory and decorative transition work were deferred. Browser closure, device storage eviction, physical iOS/Android permission and picker behaviour, and VoiceOver/TalkBack remain unverified. Legacy unowned approved records require the matching stored guest name on the originating browser, while new uploads bind the authenticated guest before storage. Existing rules preserve occupied reservations, including missing-media cases. Guests can add a replacement from the device library where allowance remains.
