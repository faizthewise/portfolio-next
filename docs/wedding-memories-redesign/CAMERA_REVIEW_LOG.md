# Wedding Memories camera delivery and review

## Summary and release assessment

**Ready for final device validation.** The redesigned camera has a compact allowance toolbar, an uninterrupted live viewfinder, an ivory shutter, a latest-photo review control and a collapsible film picker. The existing original capture, guest-scoped drafts, quota checks and approval-based uploads power the new interface. Local review found no open critical or major defects. Physical iOS Safari and Android Chrome camera operation remain the release gate.

The review used the six design and acceptance documents and the working Home, Gallery and camera code. The attachment included the brief text. A local render of the preceding camera from `295cab5` supplied the visual baseline. [Previous camera](camera-evidence/baseline-390.png) · [Redesigned camera](camera-evidence/camera-390.png)

## Changes and preserved behaviour

| File or component | Change |
|---|---|
| `MemoryCamera.tsx` | Connects stream acquisition, measured viewfinder geometry, shared capture, media state, one-at-a-time shutter handling, save retry and focus management. |
| `MemoryCameraControls.tsx` and its CSS module | Dedicated dark camera surface, compact close and quota toolbar, fixed control positions, ivory shutter, latest-photo badge and contextual camera states. |
| `MemoryCameraFilm.tsx` and its CSS module | Collapsible text descriptions for the four existing film presets. Selection keeps the live viewfinder and shutter in place. |
| `MemoryCameraTray.tsx` and its CSS module | Existing review, deletion, selection and upload actions in a sheet using Wedding Memories typography and colours. Keeps visibility information and queue feedback accessible. |
| `MemoryExperience.tsx` and `Memories.module.css` | Supplies the existing quota, identity and queue callbacks, scopes the camera dialog to the foreground and removes obsolete camera styles. |

Home entry and My album still use the same guest identity and enforce the same 20-photo allowance, including local drafts and reservations. The review badge counts local drafts and still-reviewable approved uploads. The existing device picker, shot stamping, upload validation and album-link visibility rules continue through the existing queue. The default FP2 look, original JPEG quality, 1,600 px maximum dimension, thumbnail fallback and four film definitions are preserved. All test writes went to the local `demo-wedding` emulators.

## Independent visual review

| Viewport | Viewfinder | Result |
|---|---:|---|
| [320 × 568](camera-evidence/camera-320.png) | 320 × 388 | Compact toolbar and a 72 px centred shutter. Film descriptions fully readable. |
| [375 × 667](camera-evidence/camera-375.png) | 375 × 461 | Distinct shutter, picker, add-photo and switch controls with no overlap. |
| [390 × 844](camera-evidence/camera-390.png) | 390 × 638 | Photograph dominates the screen. Clear film selection, allowance and 76 px shutter. |
| [430 × 932](camera-evidence/camera-430.png) | 430 × 726 | Controls stay within thumb reach below the display region. |
| [768 × 1024](camera-evidence/camera-768.png) | 768 × 818 | Portrait control spacing holds on a tablet-sized display. |
| [1440 × 900](camera-evidence/camera-1440.png) | 1440 × 694 | Full-width viewfinder and controls grouped at the centre of the deck. |
| [390 × 500](camera-evidence/camera-390-compact.png) | 390 × 320 | Reduced vertical space keeps the close, film, shutter and review controls visible. |
| [844 × 390](camera-evidence/camera-landscape.png) | 684 × 338 | Side deck keeps more scene height. The shutter is centred across that deck. |

All eight layouts showed no horizontal overflow or page scrolling. Every primary control measured at least 44 × 44 CSS pixels. The shutter stayed centred in the bottom deck and opening the film panel left the shutter and viewfinder geometry unchanged. The close and deck controls account for safe-area insets in CSS. The viewport-height and landscape tests used emulation. Device notches and moving browser chrome still need physical review.

- Camera states. [Opening](camera-evidence/opening.png) · [Permission denied](camera-evidence/permission-denied.png) · [Unavailable](camera-evidence/camera-unavailable.png) · [Switching](camera-evidence/switching.png)
- Film and capture states. [Expanded at 320 px](camera-evidence/film-320.png) · [Expanded at compact height](camera-evidence/film-390-compact.png) · [Expanded in landscape](camera-evidence/film-landscape.png) · [FS16 selected and save confirmed](camera-evidence/photo-saved.png)
- Local state and review. [Two local photos and updated allowance](camera-evidence/camera-two-drafts.png) · [Tray](camera-evidence/review-tray.png) · [Selected photo](camera-evidence/review-selected.png) · [Capture error](camera-evidence/capture-failure.png) · [Persistence error and retry](camera-evidence/persistence-failure.png) · [Allowance exhausted](camera-evidence/quota-exhausted.png)
- Upload states. [Upload confirmed by the demo server](camera-evidence/upload-confirmed.png) · [Failed upload stays in the review queue](camera-evidence/upload-failed.png)

## Capture and framing results

The browser emitted a controlled 1,280 × 720 media stream with edge markers and a directional arrow. The rear and front fixtures each supplied distinct patterns. The review compared live viewfinder pixels with the actual JPEG decoded from IndexedDB. The sample metric sums the absolute red, green and blue differences at six matching normalised positions. Values vary slightly with video and JPEG sampling.

| Capture | Preview and persisted JPEG | Result |
|---|---|---|
| Rear portrait, Original | 390 × 638 to 978 × 1,600 | Matching boundary positions and direction. Sample differences 1–7 on the final run. [Viewfinder](camera-evidence/rear-portrait-viewfinder.png) · [JPEG](camera-evidence/rear-portrait-saved.jpg) |
| Front landscape, Original | 684 × 338 to 1,600 × 791 | Matching boundary positions, orientation and arrow direction. Sample differences 0–4. [Viewfinder](camera-evidence/front-landscape-viewfinder.png) · [JPEG](camera-evidence/front-landscape-saved.jpg) |
| FP2 with WebGL disabled | 390 × 638 stage and 220 × 360 live fallback raster | Persisted JPEG remains 1,600 px on its long edge. The processed thumbnail and live fallback matched at five samples, with differences of 1–5. [Fallback viewfinder](camera-evidence/fp2-2d-viewfinder.png) |

The app preserved the original unmirrored preview and capture for both simulated directions. Raw Original uses the browser video in cover mode. The GPU preview, 2D fallback and original JPEG use geometry measured from the visible stage. Integer rounding at each raster size accounts for the small aspect-ratio differences. Film and the existing optional stamp are retained in metadata. The styled preview and upload use that metadata with the original as input, and the live viewfinder omits the stamp for a clear composition.

Each film was selected, captured and read back with its own style metadata and 320 px processed thumbnail. Twenty-four sampled RGB triplets distinguished Original, FP2, FS16 and FV5. Changing film left the earlier draft byte-identical. Existing render tests also compare the compositions and film processing paths. [Original output](camera-evidence/film-output-none.jpg) · [FP2 output](camera-evidence/film-output-fp2.jpg) · [FS16 output](camera-evidence/film-output-fs16.jpg) · [FV5 output](camera-evidence/film-output-fv5.jpg)

## Functional acceptance

| Criteria | Evidence and result |
|---|---|
| CAM-001–006 | Entered from Home as a first-time named guest. Verified camera opening, usable preview, denied and missing-camera states, same identity on return, and no bottom navigation in the camera. A simulated first-frame timeout turned into a recoverable error and stopped a late-arriving stream. |
| CAM-007–008 | Compared actual portrait rear and landscape front captures with boundary-marked previews. Tested film fallback geometry separately. Real lens orientation remains part of the device gate. |
| CAM-009–014 | Four sequential captures, then exactly one additional draft from 15 rapid clicks. An encoder failure left five valid photos and the allowance unchanged and displayed no success message. No shutter capture while processing or lacking a ready stream. |
| CAM-015–018 | Verified the same remaining allowance on Home and Camera. Fixture reservations exhausted it, the shutter disabled and existing drafts remained reviewable. Deleting a qualifying draft restored one shot and re-enabled capture. The segmented indicator reflected the same quota. |
| CAM-019–022 | Aborted the real IndexedDB write and checked that the existing five drafts and available shots were unchanged. Retry stored the same encoded JPEG with no additional encode. Verified returning from review, closing, reopening and refreshing with local drafts. Review thumbnail URLs and optional preview URLs are scoped and released. |
| CAM-023–026 | Empty slot opens the file picker. A selected PNG was validated and saved locally. The latest capture occupied a 50 px frame with a readable count and label. Selection, deletion and return worked. The review count included approved queued photos. |
| CAM-027–030 | Observed transition progress and stop of the replaced stream. An injected switching error offered recovery, and the replacement front stream produced a matching JPEG. Attempted switching during encoding opened no concurrent stream. Verified one active track after resume and zero on close, failed switch, timeout, background and browser Back navigation. |
| CAM-031–036, 038 | FP2 remained the default. Real Original, FP2, FS16 and FV5 outputs were read back. The picker keeps descriptive text and pressed state, closes cleanly and preserves the selected look through review, switch and repeated captures. |
| CAM-039–042 | Photo saved feedback followed the completed IndexedDB transaction. A separate message followed upload acknowledgement. The permanent save instruction is gone, with persistent review access and contextual permission, switch, capture and persistence errors. |
| CAM-043–045 | Closed with unsent drafts and recovered them after refresh. Existing review, deletion and approved upload worked against local Auth, Firestore and Storage. A forced Storage refusal kept the photo reviewable and a retry succeeded after access was restored. An encoded photo with a failed save carries a data-loss confirmation on close. |

## Accessibility and performance

Chromium keyboard checks covered both directions of focus wrap, Escape through the film panel, tray and camera, and focus restoration to Home. The dialog takes initial focus, provides named controls and makes the background inert while active. Counts, selection and state messages have text alternatives. Reduced-motion emulation removed the shutter transition. axe reported zero WCAG A or AA violations on the normal camera. Its document bypass check required manual review, and keyboard verification established that focus stays in the camera. VoiceOver and TalkBack remain unverified.

The same local fixture at 390 × 844 took approximately 106 ms on the previous camera and 119 ms on the redesigned one from shutter interaction to observed save acknowledgement in one paired observation. The figures include browser automation polling. The on-screen preview stayed responsive through repeated captures and film changes. The preview uses the existing GPU rendering and paced 2D fallback, and the tray uses a 320 px preview when available. No dependencies were added.

## Issues and refinement

| ID | Severity | Expected and observed | Evidence | Owner | Resolution |
|---|---|---|---|---|---|
| CAMERA-R01 | Minor | Latest-photo frame stays square and Review stays visible. Initial image layout displaced the label at the bottom of the deck. | [Two drafts after correction](camera-evidence/camera-two-drafts.png) | Controls agent | Resolved. Independent measurement confirmed a 50 × 50 px frame, 48 × 48 px image and visible label below. |
| CAMERA-R02 | Minor | Film labels and descriptions are fully readable at the representative compact sizes. The initial panel clipped the final description in compact portrait and short landscape. | [Compact portrait](camera-evidence/film-390-compact.png) · [Short landscape](camera-evidence/film-landscape.png) | Film agent | Resolved. Raised the usable height and cleared the landscape toolbar while retaining scroll on shorter screens. |
| CAMERA-QA01 | Validation fixture | The photographic fixture retains its source proportions. The first fixture stretched a source image into a portrait stream. | [Final photographic fixture](camera-evidence/camera-390.png) · [Boundary-marked capture](camera-evidence/rear-portrait-saved.jpg) | Lead | Corrected the fixture's cover scaling and repeated the visual check. Saved JPEG tests use a separate deterministic pattern. |
| CAMERA-D01 | Release gate | Confirm sensor, permission, viewport and lifecycle behaviour on both physical platforms. Hardware was unavailable in this workspace. | Device matrix below | Lead | Pending physical iOS Safari and Android Chrome verification. |

## Review scorecard

| Dimension | Rating / 10 | Weight | Weighted | Evidence and remaining checks |
|---|---:|---:|---:|---|
| Capture reliability and functional correctness | 9.3 | 30% | 27.9 | Capture, burst, save recovery and approved upload passed locally. Real sensors and interruption handling need a device pass. |
| Intuitiveness and interaction quality | 9.4 | 15% | 14.1 | Ivory shutter, visible review count and persistent film label. Validate thumb reach on physical phones. |
| Viewfinder quality and framing | 9.6 | 15% | 14.4 | Persisted portrait and landscape JPEGs align with the test stream, plus FP2 fallback parity. Test real front-camera orientation. |
| Visual hierarchy and premium aesthetic | 9.4 | 10% | 9.4 | Quiet sage accents, clear text and a balanced control deck. Gallery-style imagery and serif type return in review. |
| Mobile usability | 9.2 | 10% | 9.2 | Essential controls fit at 320 px and 500 px available height. Validate notches, browser toolbars and rotation on phones. |
| State integrity and persistence | 9.6 | 10% | 9.6 | Aborted save, retry, reload, exhaustion, delete and upload confirmed. Test storage and suspension behaviour on phones. |
| Accessibility | 9.2 | 5% | 4.6 | 44 px targets, named controls, axe and keyboard checks. Verify announcements using mobile screen readers. |
| Performance | 9.0 | 5% | 4.5 | Paired local acknowledgement timings and stable repeated capture. Measure low-end phone preview and capture under load. |
| **Total** | | **100%** | **93.7** | The required target is 90. The device release gate still applies. |

## Technical checks and browser coverage

| Check | Result |
|---|---|
| TypeScript and `git diff --check` | Passed. |
| Scoped ESLint and Stylelint | Camera components and new CSS passed. The integration file has one unchanged pre-existing image warning. |
| Repository-wide lint | Ran JS, CSS and JSON individually. Existing formatting and style violations remain in older source and styles, and Prettier flags `outputs/bride-rsvps-20261124/rsvps-source.json`. |
| Wedding Memories unit and integration suite | 41/41 passed. Includes shared camera lifecycle, capture geometry, film rendering, local drafts, quota and upload-state coverage. |
| Firestore rules integration | 7/7 passed against the local demo emulators. |
| Adjacent invitation and opening suites | 24/26. The same two failures appear on the preceding revision. They cover invitation gifts and registry content, and Salam Kaut link visibility. |
| Browser E2E | Local desktop Chrome 157 used responsive emulation and controlled canvas media streams with real browser video, canvas, JPEG encoding and IndexedDB. Real Auth, Firestore and Storage emulator services exercised application callbacks, including a rejected Storage request and a successful retry. |
| Production build | Passed. The repo skips lint and type checking during Next.js production builds, so both were run separately. |

| Platform | Verification | Before unconditional release |
|---|---|---|
| Desktop Chrome 157 | Responsive emulation, injected streams and controlled local services. | Validate a native camera if desktop hardware is in the support scope. |
| Physical iOS Safari | Unavailable. | Grant and deny permission, switch native cameras, capture and review all films in portrait and landscape, verify orientation and framing, move the toolbar, background and resume, and exercise local persistence, back navigation, upload and VoiceOver. |
| Physical Android Chrome | Unavailable. | Repeat camera, permission, capture, back navigation, toolbar, suspension and storage checks. Verify TalkBack and native camera selection on a multi-camera handset. |

## Workstream models and deferred enhancements

| Workstream | Model and ownership |
|---|---|
| Controls and shell | `gpt-6.2-sol`, low reasoning. Owned the toolbar, viewport, control deck, latest thumbnail and review-label correction. |
| Film picker | `gpt-6.2-sol`, low reasoning. Owned the picker and both compact height corrections. |
| Review tray | `gpt-6.2-sol`, low reasoning. Owned tray presentation, accessibility and queue status rendering. |
| Integration and acceptance | Lead retained architectural decisions, capture analysis, final integration, visual judgement and testing. No model escalations. |

The optional static film samples and composition grid are deferred. The available live filter preview and panel descriptions explain all presets, and the full viewfinder supports framing. The release uses a short shutter press treatment and a timed save notice. Added flash, thumbnail animation and decorative motion are deferred to keep the scene stable and capture feedback quiet.
