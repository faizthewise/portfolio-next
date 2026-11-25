# Wedding Memories gallery implementation plan

## Architecture

- Keep MemoryExperience as the event, identity, contribution and upload coordinator. The gallery shell renders one selected tab and keeps the same event route and MemoryGuestNav.
- Use the existing `#photos`, `#wishes` and `#voice-notes` fragment URLs. Support direct links, browser history and keyboard tab selection. Keep filter and pagination state above the tab panels.
- Start each public Firestore subscription on first entry to its tab. Keep each visited tab's data available for return and isolate its loading and error state. Preserve existing event scopes, ordering, limits and incremental photo pagination.
- Reuse the established CSS tokens and font roles. Use a 520 px reading column for the header, wishes and voice notes, with an expandable photo grid on larger screens. Reuse the shared filter sheet and contribution panels.
- Retain existing public and personal filters, private favourites, attribution and original and styled downloads. Existing assets have no separately stored thumbnails. Keep preview fetches near the viewport and cache a bounded set of small local previews to avoid repeated original transfers within a visit.
- Keep voice metadata separate from media loading. Fetch one selected recording on demand. Diagnose recording persistence, the playback source and duration individually. Preserve existing records and permission rules.
- Use test fixtures and Firebase emulators for screenshot and contribution validation.

## Workstreams

| Scope | Exclusive files | Contract |
|---|---|---|
| Gallery shell and filters | MemoryGallery.tsx and MemoryGallery.module.css | Header, sticky tabs, filter sheet, toolbar, state panels and visibility copy. Event and data state come from MemoryExperience. |
| Photos and detail | MemoryGalleryPhoto.tsx and MemoryGalleryPhoto.module.css | Extract the existing photo card and viewer, provide a shared-gallery variant and keep personal album presentation. |
| Wishes, audio and persistence diagnosis | MemoryGalleryMessages.tsx, its CSS, queue modules and targeted media tests | Editorial wishes, playback and validated voice persistence correction. |
| Integration and acceptance | MemoryExperience.tsx and QA evidence | Data lifecycles, fragment history, state preservation, shared navigation and independent rendered and functional review. |

The shell, photo and message workstreams can proceed in parallel after contracts are established. The lead integrates them before browser testing. Findings are delegated to their original owners for targeted correction.

## Delivery status

The three workstreams were integrated. Review corrected keyboard activation, wish contrast, filter radio colour, duplicate in-flight image reads and playback beneath guest panels. The gallery review log records the final evidence, sound diagnostics and device checks.
