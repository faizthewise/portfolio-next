# Camera preview performance

## Findings

The current live preview uses a 120 ms interval: at most 8.3 frames/second. Each
tick copies video to 2D canvas, reads every pixel, runs JavaScript color grading,
writes pixels back, draws/measures the imprint, then measures it again for layout.
This imposes a low frame-rate ceiling and repeats expensive work on the main
thread. Camera buttons also blur the constantly changing video behind them.

The public Kenang demo implementation uses a normal video element with cover
framing and lightweight CSS live effects. Its photo processing happens on a
still image. This was verified from the demo's public HTML/JavaScript; no physical
camera access was granted and no phone frame-rate benchmark was taken.

Source: https://kenang.my/e/demo

## Implementation plan

- Keep Original on the browser's native video pipeline. Use a WebGL live preview
  for film looks, reproducing the existing CPU color formulas. Reuse GPU program,
  buffers and texture; do no per-frame pixel readback or canvas text work.
- Draw the film imprint on its own transparent canvas. Repaint only when its
  content/layout changes, including a minute boundary. Keep shared layout and
  rendering code so capture/review/downloads still match.
- Schedule filtered previews with video-frame callbacks, falling back to animation
  frames with duplicate-frame suppression. Target approximately 30 camera frames
  per second; remove the fixed 120 ms interval. Use reasonable video constraints.
- Keep the CPU renderer for still capture, review and exports. If GPU creation,
  shader compilation or context availability fails, use a lower-resolution CPU
  live path at frame cadence, with the same color treatment.
- Cancel callbacks and release resources correctly, including late requests,
  visibility changes, camera switches and review transitions. Reuse GPU resources
  across filter changes/retakes. Remove per-button camera backdrop blur.
- Keep full-viewport framing, canonical imprint orientation, unfiltered originals,
  Firebase paths and metadata unchanged.

## Review

Test scheduler cadence/cleanup, GPU allocation and failure behavior, absence of
live pixel readbacks, stamp repaint cadence and CPU/GPU color agreement. Attempt
actual shader execution in a suitable local test context. Review implementation
and request focused corrections before acceptance. Run relevant existing tests,
TypeScript and a production build in the isolated copy, preserving the existing
development server. Report phone performance limits honestly.

Browser API references:
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback
- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

## Implementation review results

- Original now uses full-size native video. Film looks use a reusable WebGL
  shader and decoded video-frame callbacks, with animation-frame scheduling on
  older browsers. Media requests target 1280 × 720 at up to 30 fps.
- The transparent imprint is independent of video updates and refreshes at minute
  boundaries or content/layout changes. Camera button backdrop blurs are removed.
- Review corrections included removing a double vertical flip, reallocating the
  texture when camera dimensions change, catching context acquisition failures,
  and preventing rescheduling when disposal happens inside a render callback.
- Independent execution in a real windowless WebGL context passed 40 cases:
  all five film presets, portrait/landscape center crops, changing source sizes,
  resource reuse and disposal. The largest RGB channel difference against the
  CPU reference was zero for these test images. This is a graphics correctness
  check, not a mobile performance measurement.
- Native canvas regression comparisons produced byte-identical still-photo PNGs
  against the previous renderer for all seven supported current/legacy looks.
- Separate imprint compositing passed 15 portrait/landscape/square comparisons
  and repeated-redraw checks. Placement is unchanged; two-stage antialiasing
  introduces a mean channel difference of 0.003/255 (maximum 3 at glyph edges).
- All 22 memories tests passed against local demo Firebase emulators, including
  10 camera tests. TypeScript and an isolated production build passed. The
  existing development server/cache was preserved.
- No Firebase schema, rules, paths or persisted photo metadata change is needed.

The old 8.3 fps timer ceiling and normal-path CPU readbacks are removed. Actual
frame rate still depends on the phone, browser, lighting and GPU availability.
The 360-pixel CPU fallback prioritizes compatibility and may be less smooth.
