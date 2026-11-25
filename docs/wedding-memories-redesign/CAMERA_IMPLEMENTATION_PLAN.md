# Wedding Memories camera implementation plan

## Decisions and shared contracts

- Keep camera acquisition, WebGL preview, paced 2D fallback, original JPEG capture, film metadata, local draft persistence and upload approval in the existing architecture. Measure the actual viewfinder region and pass that same geometry to both preview renderers and capture. Keep the existing 1,600 px long edge and original JPEG quality. Preserve the existing unmirrored preview and capture.
- Use dedicated near-black control surfaces with the specification's ivory and sage tokens. Toolbar, viewfinder and control deck occupy separate rows. On very short landscape viewports a bounded side deck preserves a practical viewfinder. The shutter stays centred between two equally weighted side slots in the capture row.
- The toolbar takes the same authoritative remaining allowance and configured maximum that Home receives. The review count is the sum of staged drafts and approved uploads available in the tray. Show the most recent item across both collections. Keep file selection discoverable with an Add photo affordance when the tray is empty.
- Keep the film presets unchanged. Open an overlay above the control deck so switching looks cannot resize the capture frame. A text picker exposes each real preset and its description. Skip optional static film thumbnails and composition grid.
- Surface loading, switching, permission, capture and save states without exposing raw exceptions. Reuse guarded capture and stage data once. A failed save retains one candidate in memory for retry or explicit discard. A transient save acknowledgement follows durable persistence.
- Keep review, deletion, selection, uploads and retry callbacks attached to the existing queue. Validate all writes using the local demo project. Use a deterministic boundary-marked camera stream for preview-to-file comparisons.

## Workstreams

| Workstream | Exclusive files | Contract |
|---|---|---|
| Camera chrome and shell | `MemoryCameraControls.tsx`, `MemoryCameraControls.module.css` | Portal surface tokens, viewport grid, viewfinder classes, toolbar, shutter deck, latest thumbnail and actionable state presentation |
| Film picker | `MemoryCameraFilm.tsx`, `MemoryCameraFilm.module.css` | Existing film definitions, controlled selection and expandable panel that leaves the measured stage geometry fixed |
| Photo tray presentation | `MemoryCameraTray.tsx`, `MemoryCameraTray.module.css` | Existing review and upload state exposed through explicit callbacks. Keep source previews, disclosure, progress and cleanup |
| Integration and acceptance | `MemoryCamera.tsx`, `MemoryExperience.tsx`, targeted tests and evidence | Session lifecycle, composition geometry, persistence handling, integration and independent rendered review |

The presentation workstreams can run in parallel. The lead integrates the contracts before collecting final evidence and delegates corrections to the relevant owner.

## Execution and acceptance sequence

1. Capture the preceding camera baseline, then map stream acquisition, preview geometry, draft storage, and upload approval.
2. Integrate the three presentation workstreams with the existing capture and queue. Keep all new state scoped to the camera session.
3. Review the six prescribed viewports plus compact portrait and short landscape. Give layout corrections to the component owner and recapture the affected states.
4. Exercise boundary-marked captures, each film, browser lifecycle, persistence, quota, review and demo uploads. Run type checking, lint, emulator tests and the production build on the integrated version.
5. Record local acceptance and evidence in the [camera delivery and review log](CAMERA_REVIEW_LOG.md). Physical iOS Safari and Android Chrome checks are the remaining release gate.

Controls, film and tray used explicitly selected `gpt-6.2-sol` agents at low reasoning. The lead retained complex pipeline decisions and final acceptance. No model escalations were needed.
