# Wedding Memories gallery delivery and review

## Executive summary

The shared gallery now opens as an editorial album with separate Photos, Wishes and Voice notes tabs. The compact wedding header and fixed guest navigation use the completed home design. Photos have a denser square grid and a full-screen viewer. Wishes preserve the original text, including line breaks. The voice player loads one recording on demand and reports real playback timing.

## Implementation and ownership

| Workstream | Model | Files and outcomes |
|---|---|---|
| Gallery shell and filters | GPT-6.2 Sol, low reasoning | `MemoryGallery.tsx` and its CSS. Wedding header, sticky tabs, filter sheet, responsive grid, loading and empty states, and visibility notice. |
| Photos and detail | GPT-6.2 Sol, low reasoning | `MemoryGalleryPhoto.tsx` and its CSS. Square thumbnails, private favourites, native modal, original and styled downloads, and local preview retry. The personal album still uses its own tile presentation. |
| Wishes, audio and queue | GPT-6.2 Sol, low reasoning | `MemoryGalleryMessages.tsx`, its CSS, `memoriesQueue.ts` and `wedding-memories-drafts.test.mjs`. Editorial wishes, real playback controls, audio error investigation and backwards-compatible queue serialization. |
| Integration and acceptance | Lead agent | `MemoryExperience.tsx`, shared CSS cleanup, fragment history, media subscriptions, state preservation, browser fixtures and acceptance review. |

The three implementation workstreams used the same lightweight model. There were no model escalations. The gallery starts each public feed on first visit to its tab. Each feed retains its own loading, failure, and data state. The photos feed retains the previous ordering, scope filters and incremental pagination. Personal albums, reservations, upload retries and contribution panels stay within the existing coordinator.

## Rendered evidence

The initial worktree held the completed home screenshots. The available older phone screenshot showed My album. I compared the gallery against a local render of the preceding production build and used controlled data for final review. The images and text below are demo fixtures, including photos drawn from the repository's existing sample assets.

| Viewport | Photos | Wishes | Voice notes |
|---|---|---|---|
| 320 × 568 | [Photos](gallery-evidence/photos-320.png) | [Wishes](gallery-evidence/wishes-320.png) | [Voice notes](gallery-evidence/voice-notes-320.png) |
| 375 × 667 | [Photos](gallery-evidence/photos-375.png) | [Wishes](gallery-evidence/wishes-375.png) | [Voice notes](gallery-evidence/voice-notes-375.png) |
| 390 × 844 | [Photos](gallery-evidence/photos-390.png) | [Wishes](gallery-evidence/wishes-390.png) | [Voice notes](gallery-evidence/voice-notes-390.png) |
| 430 × 932 | [Photos](gallery-evidence/photos-430.png) | [Wishes](gallery-evidence/wishes-430.png) | [Voice notes](gallery-evidence/voice-notes-430.png) |
| 768 × 1024 | [Photos](gallery-evidence/photos-768.png) | [Wishes](gallery-evidence/wishes-768.png) | [Voice notes](gallery-evidence/voice-notes-768.png) |
| 1440 × 900 | [Photos](gallery-evidence/photos-1440.png) | [Wishes](gallery-evidence/wishes-1440.png) | [Voice notes](gallery-evidence/voice-notes-1440.png) |

- [Previous gallery](gallery-evidence/baseline-390.png), [sticky tabs](gallery-evidence/photos-sticky.png), [filter sheet](gallery-evidence/filter-sheet.png), [narrow filter sheet](gallery-evidence/filter-sheet-320.png), [guest filter](gallery-evidence/active-photo-filter.png), [favourites](gallery-evidence/favourites.png) [photo viewer](gallery-evidence/photo-viewer.png) and [isolated photo failure](gallery-evidence/photo-load-error.png)
- [Empty photos](gallery-evidence/empty-photos.png), [empty wishes](gallery-evidence/empty-wishes.png) and [empty voice notes](gallery-evidence/empty-voice-notes.png)
- [Audio loading](gallery-evidence/voice-loading.png), [known-duration playback](gallery-evidence/voice-playing.png), [legacy playback](gallery-evidence/voice-legacy-playing.png) and [missing recording](gallery-evidence/voice-failure.png)
- [Photos at 200% text](gallery-evidence/photos-390-large.png), [wishes at 200%](gallery-evidence/wishes-390-large.png) and [voice notes at 200%](gallery-evidence/voice-notes-390-large.png)

The header measured 159–169 CSS pixels. The grid used three, four and five columns across the tested widths. In each of the 18 viewport and tab combinations, one selected panel rendered and the document width matched the viewport. Tab buttons measured 48 pixels, core gallery actions at least 44 pixels, and the sticky tab bar stayed accessible at the top while scrolling. The desktop reading column remains 520 pixels while photos can use a wider column.

## Review findings and refinements

| Finding | Severity | Disposition |
|---|---|---|
| Wish dates on linen fell below normal-text contrast | Major | Used the existing ink token. Contrast is 8.36:1 and all three selected panels passed the follow-up axe scan with zero violations. |
| Tab keyboard activation needed explicit handling after manual focus movement | Major | Handled Enter and Space and verified arrow focus followed by activation. |
| A late settings snapshot could start duplicate original requests | Minor | Deduplicated in-flight Storage reads and capped the gallery cache at 36 derived thumbnails. |
| Default blue radio selection and focus in the filter sheet | Minor | Matched radio selection and focus to the shared sage token. The 320 px sheet had no horizontal overflow, and axe found zero violations in the filter sheet. |
| Audio could continue under My album | Major | Pause on entry to existing contribution or album surfaces and require deliberate Play again. Verified in Chrome that audio pauses under My album and stops on leaving for Home. |

Axe requested a manual review of the header image behind text. The artwork is limited to faded side crops, with the text primarily on warm ivory. Shared palette contrast references remain 4.60:1 for botanical on ivory, 4.91:1 for muted on ivory and 7.49:1 for white on sage. The 200% text review retained access to the tabs and content.

## Functional review

| Area | Result | Evidence |
|---|---|---|
| Tabs and navigation | Passed in Chrome | Direct fragment links select the correct panel, browser Back and Forward switch tabs, filters survive tab changes, and the shared Gallery navigation is active. |
| Photo retrieval and filtering | Passed in Chrome and Firebase emulators | First page showed 24 loaded, then pagination reached 29. The sheet discarded unapplied edits, combined guest and scope filters, reset correctly and showed an empty personal scope for the test guest. One intercepted Storage failure stayed in its tile, and Retry recovered the image. |
| Favourites | Passed in Chrome and Firebase emulators | Heart updates did not open a photo. The selection survived reload. Firestore tests covered per-guest access. |
| Photo detail | Passed in Chrome | Full image used contain fitting. Contributor and date rendered. Both downloads completed. Browser Back closed the viewer and restored the opener, URL and scroll position within 2 CSS pixels. |
| Wishes | Passed in Chrome and Firebase emulators | Multiline text rendered. The existing contribution flow retained the wish across first-time name entry and the sent wish appeared in the gallery. |
| Voice | Passed in Chrome and Firebase emulators | Lazy media fetch, finite timing, seeking, pause and replay, one source at a time, streamed WebM completion and a missing-file state. A newly recorded message uploaded and played back. A second recording survived offline navigation and resumed from the existing queue on reconnect. |
| Visibility and identity | Passed in Chrome and Firebase emulators | Pending and private voice fixtures stayed out of Gallery. The empty second event stayed isolated. The existing identity and My album were available after contribution. |

## Audio investigation

The reported Blob/File wording matches IndexedDB Blob persistence failures documented by WebKit. The previous Gallery player called Firebase Storage for a URL and did not write to IndexedDB. The recording path wrote a Blob into the upload-job object store before publish. A test that injects the browser's Blob-write refusal reproduced the vulnerable storage operation, and the new representation stored the same voice bytes and MIME type with an ArrayBuffer. The queue still reads and retries old Blob rows, preserving the upload key, phases and public or private intent. In Chrome I injected the same exception at the IndexedDB boundary, staged a voice recording offline, navigated from Gallery to Home, and verified that the recording uploaded on reconnect and played after acknowledgement. The original device and the reported clip were unavailable, so the report-specific trigger remains unconfirmed. [WebKit IndexedDB issue 188438](https://bugs.webkit.org/show_bug.cgi?id=188438)

The duration symptom was reproduced separately. A new finalized Chrome WebM had a duration around 2.8 seconds. A streamed MediaRecorder WebM reported `NaN` before metadata and `Infinity` at metadata. In the gallery it played with advancing elapsed time and an omitted total, and the actual total appeared on completion. Finite audio displayed a seek control and supported keyboard seeking. This is consistent with Chromium's MediaRecorder documentation on WebM recordings without duration or seek metadata. [Chromium MediaRecorder notes](https://chromium.googlesource.com/chromium/src/third_party/+/refs/heads/main/blink/renderer/modules/mediarecorder/README.md#the-produced-recording-doesn_t-have-duration-or-is-not-seekable)

The player reports unavailable media locally and offers retry for recoverable failures. Browser and Storage diagnostics stay in the console. The demo exercised a confirmed metadata row whose Storage object was missing, plus a new recording through the actual local upload and read paths.

## Technical validation

- TypeScript and scoped ESLint and Stylelint passed. The complete Firebase demo suites passed 41 Wedding Memories tests and 7 Firestore tests. Draft tests include injected Blob write refusal and legacy Blob retry.
- Repository-wide checks still report existing JavaScript and CSS lint findings and JSON formatting in the RSVP export. The adjacent invitation suite reproduced the same two invitation-render fixture failures as the home baseline. Its other 24 tests passed.
- The first production build hit an existing Next.js font-loader parse error while resolving Lora for the organiser dashboard. The retry and the final build after visual refinement succeeded.
- The route's first-load JavaScript rose from 334 kB in the preceding build to 345 kB. The 390 px first-view photo probe observed 18 unique Storage photo URLs against a 24-row first page. Opening a Wishes deep link sent zero original-photo or voice-media requests. Opening idle Voice notes fetched zero audio media before Play. Existing photo data has no stored derivatives. Gallery thumbnails render at up to 400 pixels after an original is fetched near the viewport, and repeat views reuse bounded previews. No new runtime dependency was added.

## Deferred enhancements and limitations

| Item | Fallback and impact |
|---|---|
| Stored photo thumbnails | Existing objects have original bytes only. The app fetches near the viewport and caches derived previews. A first view of a large photo can still transfer its original. |
| Accurate waveform | The seek bar uses media-reported duration and range. Legacy recordings can lack seek metadata, in which case playback and elapsed time remain available. |
| Swipe and next/previous navigation in the viewer | Each photo opens in the existing filter context, with accessible close controls and tested scroll restoration. Guests return to the grid to select another photo. |
| Original reported clip and physical iOS or Android | Local Chromium covered the reproduced duration symptom, and the injected queue test covered Blob write refusal. Native permissions, playback activation and the original device or clip remain for environment sign-off. |

## Review scorecard

| Dimension | Weight | Rating | Points | Evidence |
|---|---:|---:|---:|---|
| Functional correctness | 25% | 9.2 | 23.0 | Browser contribution and playback flows and demo emulator rules passed. Physical media behavior remains. |
| Content presentation | 15% | 9.3 | 13.95 | Square photo previews and unobstructed detail, multiline guestbook cards and contextual audio states. |
| Navigation and discoverability | 15% | 9.4 | 14.1 | Three sticky tabs, fragment history, one filter toolbar and shared bottom navigation. |
| Premium aesthetic | 15% | 9.2 | 13.8 | Restrained florals and compact calligraphy frame photography, with linen and sage message cards. |
| Mobile usability | 10% | 9.4 | 9.4 | Six viewports, three tabs at each, touch targets, narrow sheet and restored scroll. |
| Design-system consistency | 10% | 9.6 | 9.6 | Actual home palette, typography, icons, filter sheet primitives and navigation. |
| Accessibility | 5% | 9.0 | 4.5 | Automated scans, contrast measurements, manual keyboard flow and 200% text. |
| Performance | 5% | 8.6 | 4.3 | Visible-range preview fetching and on-demand audio. Initial visible originals remain larger than derivatives. |
| **Total** | **100%** | | **92.65** | **92.7/100** rounded |

## Final acceptance

**Ready for final device and environment validation.** The integrated gallery passed the rendered and functional acceptance review in Chrome and local Firebase. The review found no unresolved critical or major issues in that environment. The original report and physical iOS playback remain open validation items. The core release evidence supports proceeding to device sign-off.
