# Camera preview performance

## Findings

The initial live preview used a 120 ms interval: at most 8.3 frames/second. Each
tick copied video to 2D canvas, read every pixel, ran JavaScript color grading,
wrote pixels back, and drew/measured the imprint on the main thread. That design
imposed a low frame-rate ceiling. The replacement GPU path removed that work.

The public Kenang demo implementation uses a normal video element with cover
framing and lightweight CSS live effects. Its photo processing happens on a
still image. This was verified from the demo's public HTML/JavaScript; no physical
camera access was granted and no phone frame-rate benchmark was taken.

After the WebGL preview shipped, a user reported that Original remained smooth
but selecting a film look froze on an iPhone 16 Pro Max in Chrome. The current
filtered path uses `requestVideoFrameCallback`, places a GPU canvas over the
source video, and refreshes a persistent texture from live video. WebKit reports
describe callback delivery and video-texture refresh edge cases that could
contribute. The specific failure mechanism has not been reproduced on that
phone, so these are plausible mechanisms rather than a confirmed diagnosis.

Source: https://kenang.my/e/demo

## Implementation plan

- Keep Original on the browser's native video pipeline. Use a WebGL live preview
  for film looks, reproducing the existing CPU color formulas. Reuse GPU program,
  buffers and texture; do no per-frame pixel readback or canvas text work.
- Draw the film imprint on its own transparent canvas. Repaint only when its
  content/layout changes, including a minute boundary. Keep shared layout and
  rendering code so capture/review/downloads still match.
- Schedule filtered previews with video-frame callbacks and a 200 ms delivery
  watchdog. If callbacks do not start or stop arriving, fall back permanently for
  that preview loop to paced animation frames (32 ms minimum). Treat callback
  delivery as the signal and do not require `mediaTime` or `currentTime` to
  change. Target approximately 30 camera frames per second; use reasonable video
  constraints.
- Reuse the GPU texture object and upload each current video frame with
  `texImage2D`, avoiding dependence on same-size live-video `texSubImage2D`
  refresh behavior.
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
- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Animating_textures_in_WebGL
- https://bugs.webkit.org/show_bug.cgi?id=282797

## Implementation review results

- Original now uses full-size native video. Film looks use a reusable WebGL
  shader and decoded video-frame callbacks, with a 200 ms watchdog and paced
  animation-frame fallback if callback delivery stalls. Each draw refreshes the
  existing texture using `texImage2D`. Media requests target 1280 × 720 at up to
  30 fps.
- The transparent imprint is independent of video updates and refreshes at minute
  boundaries or content/layout changes. Camera button backdrop blurs are removed.
- Review corrections included removing a double vertical flip, refreshing the
  same texture object for each video frame and source-size change, catching
  context acquisition failures, and preventing rescheduling when disposal
  happens inside a render callback.
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
- A further moving-video WebGL test passed 120 draws: 8 distinct source frames
  for each of 5 film looks across 3 crops. All 5 looks kept updating as source
  pixel data changed; maximum RGB difference versus CPU was 1/255. It used one
  program, buffer and texture with 120 `texImage2D` uploads and no
  `texSubImage2D` uploads. This is windowless graphics verification, not iPhone
  verification.
- The focused camera suite passed 13/13 tests, covering absent/stopped/repeated
  rVFC delivery, paced static-clock fallback, cleanup and texture refresh. The
  focused helper suite passed 7/7 against demo emulators. TypeScript passed.
  The full 22-test memories suite had passed before the latest frontend-only
  watchdog change. The final production build passed using an independent source
  snapshot verified against the final implementation; the shared development
  server/cache was kept.
- No Firebase schema, rules, paths or persisted photo metadata change is needed.

- The reported iPhone freeze is not independently reproduced on physical
  hardware. Deterministic tests model absent, stopped, repeated-timestamp and
  healthy callback delivery, plus teardown races. The user-device failure cause
  remains unverified.

The old 8.3 fps timer ceiling and normal-path CPU readbacks are removed. Actual
frame rate still depends on the phone, browser, lighting and GPU availability.
The 360-pixel CPU fallback prioritizes compatibility and may be less smooth.
