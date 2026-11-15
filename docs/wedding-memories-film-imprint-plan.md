# Film date imprint

Use the user's latest reference as the visual direction: small orange monospace
lettering with spaced characters, positioned along the lower-left edge. Replace
the existing white serif caption and its dark gradient band.

- Main imprint: event couple names and the actual capture date/time in Malaysia,
  e.g. `* HARISSA & FAIZ | 28 NOV 2026 12:27 PM`.
- Portrait: rotate clockwise along the lower-left side, ending above the bottom
  inset. Landscape/square: use a horizontal bottom-left imprint for readability.
- Keep the hashtag/custom stamp as a smaller secondary line or parallel column,
  preserving `#FaIzTheOneForHarissa` exactly. Long custom text must wrap safely
  without shrinking the main event/timestamp into illegibility.
- Draw after the filter, with restrained orange glow and no logo, watermark,
  border or solid caption panel. Scale typography and geometry proportionally.
- Use one layout/renderer for live camera, frozen review, gallery, downloads and
  exports. Preserve captured time, event name order and unfiltered originals.
- Return actual imprint bounds and left/bottom clearances to the camera overlay
  so floating controls avoid the text. The vertical imprint's length must not
  become a huge footer offset. No Firebase schema changes are required.

The lightweight agent implements this, then root reviews native-canvas portrait
and landscape samples and requests any needed corrections. Validate real drawing
commands, bounds, timestamps, custom text and preview/output consistency; run
camera/renderer and emulator tests, TypeScript and an isolated production build.

## First raster review

The first actual-photo render has the correct orange color, rotated direction
and event/timestamp content. Two improvements are required:

- Reduce the main type from 4% of the short edge to approximately 2.4–2.6%, with
  an inset around 4.5–5%, matching the reference's compact imprint. Remove fixed
  10 px minimums that distort preview/output proportions.
- Separate the horizontal secondary block from the main block by the full main
  line box and a gap. The first landscape/square render overlapped the hashtag
  or custom message with the event text. Add a non-overlap regression check.

The second actual-photo proof matches the intended compact orange imprint and
has separated text blocks. Final review also requires using the measured main
font widths for `mainBounds`, and deriving orientation from the unrounded source
or frame aspect so preview rounding cannot flip the imprint direction near the
portrait/square boundary.

## Accepted renderer review

Native-canvas portrait, landscape and square proofs now use compact orange
monospace text, with separate event/time and custom-stamp blocks. Camera imprint
direction follows the canonical saved raster aspect; gallery thumbnails use the
source aspect. This also keeps fractional viewport sizes near the orientation
boundary consistent without adding stored metadata.

All seven viewport comparisons, including 413.95×450, 414×450 and 414.05×450,
agree on preview/capture/thumbnail direction. Mean RGB differences between the
preview and reduced full output were approximately 0.038–0.074/255 on a flat test
scene. The Malaysia midnight check produces `29 NOV 2026 12:05 AM` from
`2026-11-28T16:05:00Z`. The full memories emulator suite passes 15/15 and
TypeScript passes. No Firebase configuration or schema updates are required.
