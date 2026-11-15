# Guest hub and camera review

## Review findings passed to implementation

- Keep existing gallery/export image aspect ratios; apply the explicit camera
  crop only when framing a camera shot. Default rendering must preserve old photos.
- Use proportional stamp typography and gradient bounds across preview and saved
  resolutions. A native canvas comparison initially found a 17.26/255 mean RGB
  difference in the stamp region; removing the absolute font-size cap reduced
  that difference to 1.48/255 on the same synthetic frame.
- Draw the couple names and capture date even when the custom stamp is empty.
  Isolate canvas drawing state so repeated preview paints remain consistent.
- Keep the frozen frame when local persistence fails. Persist before acknowledging
  Use photo; retain unfiltered source data and immutable selected styling.
- Invalidate pending camera/microphone permissions on close or visibility changes
  and stop late streams. Retaking does not reserve a slot.
- Carry theme variables into portal panels, preserve configured cover artwork,
  show feature feedback inside its active panel, and manage nested photo dialogs
  as the topmost keyboard/focus target.
- A missing name during an album upload must return focus to the visible hub
  field. Do not open a phone keyboard on initial load.
- Use a wide review confirmation button; the live circular shutter does not fit
  a Use photo label and icon comfortably.

## Independent interaction check

A temporary local-only QA page feeds a synthetic canvas stream into the actual
camera component. No physical camera permission or real guest upload is used.
The live Warm filter, visible wedding stamp, frozen shutter review, review filter
selection, successful Use photo, and remaining-count change from 20 to 19 were
observed in Chrome. Temporary QA routes will be removed before delivery.

## Phone viewport review

Safari rendered the real guest hub and synthetic camera inside 375 × 667 CSS-pixel
iframes. The hub's name field and all feature actions are discoverable together.
The camera initially clipped its canvas vertically: its intrinsic grid track was
taller than the available stage, hiding the entire stamp. The follow-up change
uses constrained `minmax(0, 1fr)` grid tracks and a contained canvas sized within
the stage. The full frame now scales within the available bounds. The review
confirmation also uses a rectangular button rather than the circular shutter.

## Acceptance

The implementation agent addressed the findings above through successive
reviews. Final source review confirms one shared photo renderer, per-photo
styling in thumbnails/lightbox/download/ZIP, backward-compatible metadata,
local persistence before camera acknowledgement, and cleanup of late streams.
Invitation source and public album URLs remain unchanged.

- Memories emulator suite: 13 passed, 0 failed on clean demo data.
- Existing invitation Firestore regression suite: 7 passed, 0 failed.
- TypeScript and production build: passed.
- Whitespace/error check: `git diff --check` passed.
- Independent native canvas comparison: approximately 1.48/255 mean RGB
  difference in the stamp region between preview and reduced full output,
  including expected rasterization differences.
- Temporary QA routes were removed. No live Firebase changes were made.

Accepted for local delivery. Physical phone camera/microphone checks and live
Firebase activation remain operational checks; the updated Firestore rules must
be deployed with the new photo metadata before live use.
