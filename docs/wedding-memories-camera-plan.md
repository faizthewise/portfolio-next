# Guest hub and camera improvement plan

## User request and retained choices

Use the two supplied Kenang screenshots as interaction/layout references. All
primary guest actions should be discoverable together. The camera should fill
the screen and show selectable filters plus the text that will appear on the
saved photo. Keep English copy, garden/songket themes, the hashtag, 20-photo
quota, separate Firebase events, public URLs `harissa-faiz` and `faiz-harossa`,
and no links from the invitations to memories. Reference couple photos are not
assets for this wedding; reuse existing theme artwork and configured cover.

## Implementation

1. Replace the guest page's large hero and stacked feature forms with a compact
   mobile-first hub (about 520 px wide on desktop). Put the couple names/date,
   short welcome, shots remaining, name field and primary camera action together.
   Below them show My album, Voice note and Write a wish buttons, then Salam
   Kaut and Shared gallery. Keep primary actions visible near the first phone
   viewport; no initial empty personal gallery pushing the name field down.
   Supporting feature forms/albums should open accessible panels/dialogs, with
   back/close and focus restoration. Include local upload status/retry where
   relevant. Camera, wishes and voice validate/focus the shared name field.
2. Create a dedicated camera component, rendered in a portal/fixed viewport
   overlay with 100dvh/safe areas, body scroll locking and accessible close/Escape.
   It must work without the browser's optional Fullscreen API. Native fullscreen
   can be an enhancement, never a requirement. Show names/date, remaining shots,
   large shutter, three selectable filters (Original/Warm/Soft), camera flip
   where supported, and existing-photo upload. Use the two event accent palettes.
   Do not add fake flash/zoom controls. Release all tracks, animation loops and
   pending permissions on close, switch, visibility/unmount and error paths.
3. Render the camera scene through a shared canvas pipeline: its crop, filter
   and text geometry must match the final render. Reuse a persistent preview
   canvas and throttle processing to a reasonable mobile frame rate/resolution.
   Canvas 2D `filter` is not supported everywhere; provide a deterministic RGB
   transform/pixel fallback (or a shared cross-browser renderer), so filters
   actually appear on iPhone as well. Avoid relying solely on CSS filtering a
   video while saving an unfiltered/differently framed result. Keep the stamp
   unfiltered and include names, Malaysia date/time and the configured hashtag.
4. Shutter freezes the exact composed frame and capture time, then shows an
   immediate review with Retake and Use photo. Filters can be changed on the
   frozen review. Retaking/closing must not reserve a photo slot. Use photo
   first persists the raw unfiltered framed JPEG and a snapshot of its rendering
   choices, then enters the existing quota/retry queue. Keep the camera open
   for further shots after a successful save or give an explicit Take another
   action. Disable duplicate shutter/save operations and handle camera errors
   with an upload fallback. Original bytes must remain unfiltered.
5. Persist optional per-photo rendering metadata (`photoStyle`: selected film,
   stamp string, capturedAt milliseconds) through IndexedDB jobs, upload helpers
   and immutable Firestore photo records. Derive couple ordering from event.
   Existing queued jobs/docs without metadata must continue to work using the
   owner defaults. New explicitly selected shots use their saved choices for
   every thumbnail, full preview, styled download and ZIP entry; later owner
   default changes must not silently replace those guest choices. Validate this
   optional map and bounds in Firestore rules; preserve quota/access rules and
   existing original Storage paths. Add no live Firebase deployment.
6. Centralize rendering option resolution and frame/crop math. Update gallery,
   camera, review and ZIP to use it consistently. Keep components maintainable;
   do not expand the already large MemoryExperience with another giant inline
   camera. Update setup docs for optional metadata and required rules changes.

## Validation and review

- Tests should execute the actual crop/render helpers, filter transforms,
  capture/review metadata and queue persistence, and prove original/styled
  separation plus metadata survival through retry. Test rules accepting valid
  new metadata, rejecting malformed/extra metadata, and accepting legacy records.
- Check camera cleanup with mocked streams/pending permissions, retake without
  quota use, repeated capture protection, and preview/final crop consistency.
- Run relevant existing emulator suites, typecheck and production build. Use
  only demo-wedding and local emulators. Parent reviews the implementation and
  requests focused improvements before acceptance.
- Parent visually checks the hub at phone/desktop sizes where UI access allows.
  Actual personal camera/mic permissions should not be granted for automation;
  use mocked streams for lifecycle tests and report real-device validation limits.
