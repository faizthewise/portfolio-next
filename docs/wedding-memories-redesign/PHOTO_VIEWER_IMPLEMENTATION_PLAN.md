# Wedding Memories photograph and viewer implementation plan

## Processing and collection contracts

- The existing Storage object at `originalPath` is the source of truth. The app currently stores original bytes and, when present, per-photo film metadata. Its existing styled download and tile image are browser-generated. A canonical styled canvas will reuse the film renderer and paint one new vertical timestamp. Gallery and My album use a square, centre-cropped 400 px derivative. Full viewer and guest download use the same JPEG from a proportional render capped at a 4,096 px long edge. The owner ZIP keeps the exact originals and uses the same treatment for its styled copies.
- Prefer original EXIF capture time when it has a valid date and explicit offset, then the existing recorded `photoStyle.capturedAt`, then the acknowledged contribution date. Display the actual source in the viewer when known. A date with no trustworthy source is omitted. Format supported dates in Asia/Kuala_Lumpur and use current event couple names from `MEMORY_PUBLIC_ALBUMS`. New code uses no viewing time, event date or second hashtag imprint.
- Film comes from the stored per-photo choice or the existing event default for records that did not store a choice. Viewer, tiles and export derive from original bytes or reuse the resulting encoded asset. A styled thumbnail is never input to the full render. Camera acquisition, quota, consent and protected storage remain on existing paths.
- One dialog receives a snapshot of the current filtered or personal loaded collection when a tile is opened. The viewer uses live favourite values, stays open when a current item is unfavourited, and only navigates to available loaded records. An incomplete collection uses a qualified count. Back closes the viewer and restores grid scroll and focus. Forward can reopen the same viewer session. The optional filmstrip shows bounded neighbours from the shared thumbnail cache.

## Ownership

| Workstream | Exclusive files | Contract |
|---|---|---|
| Canonical stamp and render | `memoriesRender.ts` and focused stamp tests | Add `renderWeddingPhoto` using the existing original-to-canvas functions. Keep legacy low-level overlay and capture interfaces intact. |
| Thumbnail and browser asset cache | `memoriesPhotoAssets.ts`, `MemoryGalleryPhoto.tsx`, `MemoryGalleryPhoto.module.css` | Render derivatives from protected originals with bounded caches. Tile sends its clicked button to the viewer controller. |
| Immersive viewer | `MemoryPhotoViewer.tsx`, `MemoryPhotoViewer.module.css` | Present accessible layout, photos, keyboard and swipe controls without fetching or altering a photograph. |
| Metadata, data and integration | `memoriesPhotoTime.ts`, `memories.ts`, `MemoryExperience.tsx`, Camera draft preview wiring, viewer controller and QA | Resolve authoritative metadata, integrate all entry points, preserve one download target and independently review real images and exports. |

The presentation workstreams are isolated. Timestamp and metadata APIs are fixed before starting the shared asset work. The lead verifies the existing Gallery, viewer and analogue reference first, then checks the integrated viewer plus its exports at the prescribed viewports. Use the local `demo-wedding` event for uploads and tests.

The three implementation workstreams and their follow-up corrections are complete. The lead integrated the existing entry points and reviewed eight viewport layouts, five actual JPEG downloads and the emulator regressions. Physical-device checks remain the final release gate. [Delivery report and evidence](PHOTO_VIEWER_REVIEW_LOG.md)
