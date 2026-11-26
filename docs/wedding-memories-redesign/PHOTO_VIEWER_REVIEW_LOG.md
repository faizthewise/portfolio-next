# Wedding Memories photograph and viewer delivery report

## Summary and release assessment

The shared gallery and personal album now show the same analogue wedding treatment, with one vertical amber timestamp embedded into the photograph. The full-screen viewer presents the complete styled photo, the loaded collection position, live favourites, navigation and one Download photo action. Preview and download use a single encoded JPEG. The app continues storing the original media and existing photo metadata at the same protected paths.

**Ready for final device validation.** Controlled Chromium and local Auth, Firestore and Storage verification cover the mandatory browser, state and image-integrity paths. Confirm native download, touch and safe-area behaviour on physical iOS Safari and Android Chrome before unconditional release. All test writes used the local `demo-wedding` event.

The available amber photographic reference was reviewed from the local Downloads folder. It informed the restrained orange ink and monospaced letterforms. The implementation follows the written bottom-to-top requirement. Gallery and viewer state from the preceding revision were rendered locally with the same fixtures. [Baseline Gallery](photo-viewer-evidence/baseline-gallery.png) · [Baseline viewer](photo-viewer-evidence/baseline-viewer.png)

## Changes and architecture

| Files or components | Change |
|---|---|
| `memoriesRender.ts` | Reuses the existing crop and film pipeline and adds one proportional lower-left stamp. The centre-cropped thumbnail is stamped after cropping. The full canvas preserves source proportions. |
| `memoriesPhotoTime.ts` | Resolves trustworthy capture metadata from JPEG, PNG or WebP and defines recorded, contributed and no-time fallbacks. |
| `memoriesPhotoAssets.ts`, `MemoryGalleryPhoto.tsx` and its stylesheet | Shared protected-source reads, bounded caches, square Gallery and album derivatives, lazy tile loading and clean object URL lifetimes. |
| `MemorySharedPhotoViewer.tsx` and `MemoryExperience.tsx` | Places a collection snapshot behind one modal session, retains live favourites, handles browser history and downloads the exact current styled asset. |
| `MemoryPhotoViewer.tsx` and its stylesheet | Immersive dark layout, compact controls, attribution and dated provenance, contain sizing, swipe and keyboard navigation, bounded thumbnail strip and one download action. |
| `MemoryCamera.tsx`, `MemoryCameraTray.tsx` and `memories.ts` | Newly rendered camera previews, selected draft review and styled owner ZIP copies use the canonical imprint. Original capture and owner ZIP originals retain their bytes. |
| `package.json` and Wedding Memories tests | Registers focused metadata and renderer tests and updates owner archive assertions to verify canonical imprint and original bytes. |

The previous guest viewer fetched a raw image for display and regenerated the styled export on download. Its Gallery thumbnails used the film renderer, but cropping could trim the imprint. The shared path now fetches original bytes through the existing Storage SDK, resolves capture metadata once per cached original, applies the stored film once and paints the timestamp once. The full view and download both use the cached quality-0.92 JPEG. A 4,096 px maximum long edge bounds browser memory on oversized originals. Square tile derivatives use a maximum of 400 px, retain the existing grid and corner sizes, and paint the stamp within the square. There is no migration or new backend store.

Original reads use a three-worker queue and are deduplicated per original key. A separate render queue allows one full canvas at a time, prioritises ready viewer work and uses up to two workers across derivatives. Original, thumbnail and full-size caches are limited to 12, 72 and 4 entries and 32, 8 and 24 MiB respectively. The filmstrip requests up to seven thumbnail derivatives and does not prefetch full-size photos. Source and display object URLs are released after use. Download URLs have a short separate lifetime so downloading can survive viewer navigation.

### Timestamp and compatibility rules

1. Use the source file's original EXIF date with an explicit UTC offset. The parser validates the fields and bounds metadata reads. A timezone-naive or invalid EXIF date falls through. [CIPA EXIF specification](https://www.cipa.jp/std/documents/e/CIPA_DC-X008-Translation-2016-E.pdf)
2. Use the recorded `photoStyle.capturedAt` where present. The viewer labels this **Photo time** because some older Camera-library imports recorded their import time in the same field.
3. Use the acknowledged contribution timestamp, labelled **Shared** in the viewer. When there is no trustworthy time, the imprint uses the event couple names alone.

The renderer uses the event’s configured couple name order and formats each supported timestamp in `Asia/Kuala_Lumpur`. The selected per-photo film takes priority over the existing configured default for legacy records. An explicit Original choice retains the underlying tone. The legacy custom stamp value remains readable for metadata compatibility. It does not add a second imprint to the canonical representation. The shared store contains originals, with no separately stored, already-styled record to migrate. Viewer reopen, repeated export and tile-to-viewer requests reuse derivatives or render from the original. A file submitted after being edited or stamped elsewhere has no reliable marker identifying the baked effect.

## Visual review and responsive evidence

| Viewport | Observed result | Screenshot |
|---|---|---|
| 320 × 568 | Toolbar, count, photo and download fit. Seven filmstrip tiles scroll in the panel. | [Standard](photo-viewer-evidence/viewport-320.png) · [24-photo collection](photo-viewer-evidence/viewer-loaded-count.png) |
| 375 × 667 | Complete portrait with reachable arrows and one download action. | [375 px](photo-viewer-evidence/viewport-375.png) |
| 390 × 844 | Standard layout, legible attribution and a coherent photo/filmstrip hierarchy. | [390 px](photo-viewer-evidence/viewport-390.png) |
| 430 × 932 | Increased photo space with safe spacing at the bottom. | [430 px](photo-viewer-evidence/viewport-430.png) |
| 768 × 1024 | Tall photo fills available height without distortion. | [Tablet](photo-viewer-evidence/viewport-768.png) |
| 1440 × 900 | Centred composition, measured controls and a restrained action width. | [Desktop](photo-viewer-evidence/viewport-1440.png) |
| 390 × 500 | Photo and essential actions fit in reduced available height. | [Short portrait](photo-viewer-evidence/viewport-short.png) |
| 844 × 390 | Filmstrip hides and portrait remains fully contained. | [Landscape viewport](photo-viewer-evidence/viewport-rotated.png) |

- Collections. [Gallery](photo-viewer-evidence/gallery-styled.png) · [My album](photo-viewer-evidence/album-styled.png)
- Photo orientations. [Portrait](photo-viewer-evidence/viewer-portrait-390.png) · [Landscape](photo-viewer-evidence/viewer-landscape-390.png) · [Square](photo-viewer-evidence/viewer-square-390.png)
- States. [Favourite](photo-viewer-evidence/viewer-favourite.png) · [Slow loading](photo-viewer-evidence/viewer-slow.png) · [Loading failure and Retry](photo-viewer-evidence/viewer-load-failure.png) · [Download failure](photo-viewer-evidence/download-failure.png) · [Contribution-date fallback](photo-viewer-evidence/viewer-contribution-date.png)
- New contributions. [Camera draft review](photo-viewer-evidence/camera-draft-canonical.png) · [Shared camera capture](photo-viewer-evidence/viewer-new-camera.png) · [Shared imported photograph](photo-viewer-evidence/viewer-new-import.png)

## Actual export and integrity evidence

| Browser-downloaded sample | Verified result |
|---|---|
| [Portrait with Original look](photo-viewer-evidence/export-portrait-original-look.jpg) | 1,190 × 1,600 px, one bottom-to-top stamp and unchanged proportions. Pixel analysis isolated amber over a vertical run of 917 rows at the left edge. Outside the stamp column the mean absolute difference was 0.74 RGB levels per channel after JPEG recompression. |
| [Landscape with FS16](photo-viewer-evidence/export-landscape-fs16.jpg) | 1,800 × 1,125 px and complete composition. The selected colour treatment changes the photograph outside the stamp region. |
| [Square with FV5](photo-viewer-evidence/export-square-fv5.jpg) | 1,000 × 1,000 px. Selected film and the same amber type appear in the actual JPEG. |
| [New FP2 Camera capture](photo-viewer-evidence/export-new-camera-fp2.jpg) | 978 × 1,600 px. Real browser Camera capture from a controlled stream, durable draft and approved publication. Fixture raw bytes match the stored original. |
| [New library import](photo-viewer-evidence/export-new-import.jpg) | 1,190 × 1,600 px. Real file-picker submission with explicit EXIF offset. The stamp shows Malaysia time and the stored original matches the selected file. |

All five exports were compared byte-for-byte with the image displayed in the viewer and independently inspected. The three previously shared Storage originals were retrieved after download and compared to their pre-render SHA-256. The new Camera and import contributions were compared against their source bytes. The browser exported actual JPEGs with no surrounding controls or backdrop. The owner ZIP regression checks original bytes and exactly one stamp for each styled copy.

## Functional validation

| Area | Observed result |
|---|---|
| Existing photos | Legacy records with stored presets, and records with only an acknowledged contribution date, retain access and show the approved shared style. EXIF and fallback precedence are covered with generated JPEG, PNG and WebP metadata fixtures. |
| New photos | A Camera draft could be reviewed, explicitly uploaded and opened in My album. A selected library photo preserved EXIF, allowance and the existing upload acknowledgement flow. |
| Collection context | Guest-filtered and selected-favourite collections retained their position and boundaries. Removing the last favourite kept the already-open singleton usable. My album showed its personal collection only. A partially loaded Gallery correctly displayed `1 / 24 loaded`, moved to 25 after Load more, and restored the original 140 px scroll position after closing. |
| Navigation | Browser touch swipes moved in both directions and stopped at the ends. Arrow keys, buttons and filmstrip selection changed the active image and attribution. Browser Back, Forward and Escape restored the page and opener focus. |
| Loading and interruption | Delaying one protected original disabled download while pending. Moving to a ready photo worked after separating queues, and the late response did not replace current selection. Failed encoding was recoverable through Retry photo. |
| Download | The action followed the active photo. An injected browser refusal displayed useful feedback and left the current styled image available. No unsupported save confirmation was shown. |
| Favourites, permissions and draft deletion | Favourite toggling used the existing guest and event state while viewing. The shared tiles used existing reads and Storage permissions. The draft tests verified guest- and event-scoped deletion, including removal of a held draft before it could reach Firebase. Storage tests exercised the original object overwrite and cross-guest protections. |
| Accessibility | Keyboard navigation and focus restoration passed. Tested touch targets measured at least 44 × 44 px. axe returned zero automatic WCAG A or AA violations. Manual colour checks measured 15.71:1 for ivory on charcoal, 9.14:1 for sage-grey on charcoal and 10.75:1 for the download label. |

## Technical validation

| Check | Result |
|---|---|
| Wedding Memories emulator suite | 47 of 47 passed, including metadata, film renderer, archive byte preservation, drafts and upload rules. |
| Firestore rules emulator suite | 7 of 7 passed. |
| TypeScript and production build | Standalone type check passed. A clean production build compiled and generated all 22 static pages. |
| Scoped lint and patch formatting | Changed viewer, cache, Camera and integration code passed lint with one existing unused-import warning in `memories.ts`. The shared renderer's 60 errors and three warnings matched the baseline diagnostics exactly by rule and message. The viewer stylesheet checks and `git diff --check` passed. |
| Repository-wide lint and adjacent tests | Repository-wide JavaScript, CSS and JSON lint remain red on existing diagnostics, including invitation and QR styles and an RSVP export. The separate invitation and opening suite passed 24 of 26 with the two known baseline failures involving gifts, hashtag and language settings, and the conditional Salam Kaut link. |

## Iterative review log

| ID | Severity | Expected and observed | Owner | Resolution |
|---|---|---|---|---|
| PV-R01 | Major | A slow earlier original should not block a later ready photograph. The first integration held its exclusive render slot while waiting for Storage. | Asset agent | Separated original-read scheduling and render scheduling. A repeated CDP hold verified one source request and no stale image replacement. |
| PV-R02 | Major | A 320 px viewer should contain a long filmstrip. A seven-thumb intrinsic width initially made the dialog's scroll width 362 px. | Viewer interface agent | Constrained the grid column and filmstrip, preserving fixed 44 px thumbnails and horizontal scrolling. The real 24-photo retest measured 320 px for both client and scroll width. |
| PV-R03 | Minor | Text metrics reported by canvas can vary. An omitted ascent or left bearing would yield an invalid translation. | Stamp agent | Added proportional ascent and zero-left fallback with a width-only metric test. Real text metrics retain exact placement. |
| PV-Q01 | Fixture | A landscape result should be compared with a visually landscape original. A raw source used a rotation honoured by the browser. | Lead | Prepared a known 1,800 × 1,125 landscape fixture and repeated the checks. The original decode orientation is still respected. |
| PV-D01 | Release gate | Verify browser-level native download and dynamic mobile UI on phones. | Lead | Physical iOS and Android hardware were unavailable in the workspace. |

## Weighted review scorecard

| Dimension | Rating / 10 | Weight | Weighted | Basis |
|---|---:|---:|---:|---|
| Photographic treatment and timestamp quality | 9.4 | 25% | 23.50 | Warm one-line ink, verified orientation, restrained inset and appropriate scale. Small tile text remains an imprint at grid size. |
| Preview and download consistency | 9.8 | 20% | 19.60 | Identical image bytes and independent export inspection. Native browser download remains a device check. |
| Premium viewer aesthetic | 9.4 | 15% | 14.10 | Photo-first hierarchy, quiet toolbar, restrained edge-to-edge layout and one clear action. |
| Mobile viewing experience | 9.2 | 15% | 13.80 | Six sizes plus compact and rotated checks. Natural landscape image proportions leave some letterboxing on phones. |
| Navigation and interaction | 9.5 | 10% | 9.50 | Verified swipes, filmstrip, keyboard, focus, favourites and predictable boundaries. |
| Data integrity and existing functionality | 9.6 | 10% | 9.60 | Original hashes, approved Camera upload, library import, ownership scope and ZIP checks. |
| Accessibility and performance | 9.2 | 5% | 4.60 | Measured targets, axe, contrast and slow-network scheduling. Native assistive technology remains unverified. |
| **Total** | | **100%** | **94.70** | Meets the local score target. |

## Delegation and remaining work

The three implementation workstreams used explicitly selected `gpt-6.2-sol` agents at low reasoning. The lead owned metadata semantics, the canonical representation contract, integration, visual review, independent functional validation and final acceptance. Targeted fixes returned to the agents owning the affected files. No escalation was required.

Custom immersive control hiding, in-photo zoom and full-size neighbour prefetch are deferred. Native browser zoom remains available and qualifying swipes are ignored when the visual viewport is zoomed. Previous and next actions remain available when there is no filmstrip. Browser-emulated resizing verifies the responsive layouts. Device-specific zoom, pinch, screen-reader announcements and file saves remain for the final phone pass.
