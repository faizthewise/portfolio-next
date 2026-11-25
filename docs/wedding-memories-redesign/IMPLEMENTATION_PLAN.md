# Wedding Memories implementation plan

## Architecture and decisions

- Keep the event-specific Pages Router URLs, anonymous Firebase identity, side-specific saved display name, server reservations, IndexedDB drafts and queue, and existing camera, voice and gifting implementations. Use public album configuration for names and dates.
- Keep state and callbacks in MemoryExperience. MemoryGuestHub owns home composition and emits existing contribution intents. MemoryGuestNav renders the same three destinations on home and gallery. My album reuses the existing panel on both pages. All albums and QR card move into the album's secondary links.
- Use a scoped CSS module for the redesigned surfaces. Reuse Great Vibes and Cormorant Garamond, the system sans-serif, Lucide icons and static invitation artwork. Use the design system palette and spacing. Darken essential control boundaries where needed for contrast.
- Treat the quota as ready once the server count, queue and camera drafts are loaded. Pass the existing remaining value to the segmented display and gate photo submission while the allowance is unknown. Preserve draft review and retries.
- Present active, failed, offline and confirmed upload states from the existing queue, active IDs, connectivity and acknowledgement callbacks. Retain retries through My album.
- Keep camera and voice identification at the point where their existing flows require it. Allow a written wish draft before identification, retaining its content when identification is dismissed. Use the same saved identity mechanism and a contextual sheet. Reuse the multiple-file selection path behind the home upload action and disclose shared visibility before selecting.
- Keep the shared gallery link and defer the optional live preview. Existing gallery reads a full page of metadata and loads original photo renditions. A preview would add queries and image downloads on the capture-first page without an existing thumbnail path.

## Workstreams and integration order

| Workstream | Ownership | Contract |
|---|---|---|
| Home composition and navigation | Implementation agent | MemoryGuestHub, MemoryGuestNav and MemoryGuestHome CSS module. Presentation only, including photo quota state and content layout. |
| Experience and contribution wiring | Implementation agent | MemoryExperience and MemoryGuestPanel. Bind home, nav and status contracts to existing app state and flows. Keep album available on both routes. |
| Upload feedback and status tests | Implementation agent | MemoryHomeUploadStatus, its scoped CSS, and the pure upload summary helper and tests. Preserve the existing queue and retry functions. |
| Integration and acceptance | Lead | Independent diff review, rendered checks at the six specified sizes, functional regression runs and release decision. |

Run implementation in parallel with dedicated file ownership, then validate the integrated page against all four source documents. Use local browser tests and Firebase emulators or isolated fixtures for write paths.

## Delivery status

The three workstreams were implemented and integrated. Design review corrected accessible action names, focus restoration and offline retry feedback. The review log records the rendered evidence, validation results and remaining device checks.
