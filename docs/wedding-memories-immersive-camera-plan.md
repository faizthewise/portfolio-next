# Edge-to-edge camera correction

The requested camera is a full viewport image with interface controls floating
on top. The existing full-screen dialog still puts a framed photo between a
header and footer; that layout does not satisfy the request.

1. Fill the viewport with the actual camera image. Remove frame margins, corner
   rounding and width limits. Position the header, close button, film strip,
   shutter/upload/flip and review actions over the image, with translucent
   surfaces and safe-area padding. Remove the visible technical help paragraph.
2. Derive the image crop from the viewport aspect ratio, using an observed stage
   size. Render preview and capture with the same crop. Avoid enlarging a stamped
   4:5 image with CSS cover, which would cut off its text and change framing.
3. Keep the wedding stamp visible. Share the renderer's stamp-band measurements
   with the overlay layout, so the action controls float above the stamp instead
   of obscuring it. The image continues behind both regions.
4. Keep frozen review and saving consistent after a viewport/orientation change:
   recompose the frozen source for the current viewport and persist that framing.
   Keep filters, capture time, unfiltered originals, quota and local retry behavior.
   Interface buttons must never appear in the saved photo.
5. Keep this correction independent of Firebase schema and invitation routes.
   Captured raw image dimensions carry the framing already.

Validate real geometry for portrait, landscape and desktop sizes, native canvas
preview/capture consistency, overlay placement in a synthetic-stream browser
preview, TypeScript and production build. Root reviews the lightweight agent's
implementation and sends any needed corrections before accepting it.

## Review findings and follow-up

- Removed the CSS-pixel limit on capture output: phone captures target a 1600 px
  long edge, independent of the screen's CSS dimensions.
- Keep the live stamp clock current, then freeze its timestamp at shutter.
- Preserve the unfiltered full camera frame until confirmation, allowing review
  to reframe after rotation; save the crop shown by the current viewport.
- Reuse the decoded frozen image for filter changes, resizing and saving.
- Center the unavailable-camera message, and avoid a review badge overlapping a
  wrapped header. Review controls already communicate the frozen-photo state.
- Test actual preview/save renderer crop arguments after an orientation change.

Independent native canvas checks confirm identical existing-photo output for
all seven supported looks. The viewport matrix (375×667, 390×844, 844×390 and
1440×900) produces preview/capture differences below 0.4/255 mean RGB on a stamped
test scene. The canvas occupies the viewport and the interface is absolutely
positioned above it; no Firebase schema changes are needed.

## Final validation

- Full memories emulator suite: 15 passed, 0 failed.
- Focused camera/renderer tests, TypeScript and diff checks: passed.
- Production build: passed in an isolated temporary source copy, preserving the
  existing development server's build files.
- Temporary QA routes were removed; owned preview servers/emulators stopped.
- Browser visual recheck was attempted with synthetic streams, but native
  automation could not reliably access the preview window (offscreen/empty UI).
  Acceptance rests on source review, actual canvas comparisons and frame/render
  tests; a physical phone visual check remains.
