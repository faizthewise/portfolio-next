# Wedding Memories — Camera Page Specification

## 1. Objective

Refine the existing camera experience into a premium, intuitive and immersive digital disposable camera.

The camera should feel closer to a native smartphone camera than a conventional web application.

The redesign must prioritise:

- Fast and effortless photo capture.
- Familiar camera interactions.
- Maximum practical viewfinder space.
- Minimal visual distractions.
- Reliable local photo persistence.
- Accurate photo allowance information.
- Intuitive film-look selection.
- Seamless review of multiple captured photographs.
- Comfortable one-handed operation.

Unlike the home page and gallery, the camera should prioritise functional minimalism over decorative wedding branding.

## 2. Source of Truth

Review and follow:

- DESIGN_BRIEF.md.
- DESIGN_SYSTEM.md.
- HOME_PAGE_SPEC.md.
- GALLERY_PAGE_SPEC.md.
- Existing completed home page implementation.
- Existing camera implementation.
- Existing camera screenshot.
- Existing repository conventions.

Reuse established design tokens, functional typography, icons and suitable shared components.

The camera may introduce a specialised dark visual treatment while maintaining consistency with the wider application.

## 3. Design Direction

### Modern Disposable Film Camera

The camera should combine:

- The familiarity of the native iPhone Camera application.
- The simplicity of a disposable film camera.
- The personality of the existing film-look presets.
- Subtle visual references to the wedding's botanical identity.

The desired experience should feel:

- Immersive.
- Minimal.
- Responsive.
- Familiar.
- Refined.
- Photographic.
- Intentional.

The camera interface should almost disappear while guests are composing photographs.

Avoid making the camera resemble a conventional website with buttons overlaid on a video stream.

## 4. Existing Functionality

Preserve all existing camera capabilities, including:

- Camera access and permission handling.
- Live camera preview.
- Photograph capture.
- Front and rear camera switching.
- Existing film-look presets.
- Film filter processing.
- Remaining photo allowance.
- Local photograph persistence.
- Multiple consecutive photograph captures.
- Captured-photo thumbnail.
- Photograph review.
- Existing upload workflow.
- Guest identity and session behaviour.

Do not introduce changes to existing business rules unless explicitly approved.

## 5. Technical Discovery

Before implementation, inspect:

- Existing camera component architecture.
- MediaDevices and getUserMedia usage.
- Camera stream lifecycle.
- Front and rear camera selection.
- Video element configuration.
- Camera stream resolution and aspect ratio.
- Live preview rendering.
- Photograph capture pipeline.
- Canvas or image-processing mechanisms.
- Film preset implementation.
- Film filter processing and export.
- Local photograph persistence.
- Existing upload queue.
- Photo allowance calculation.
- Guest identification.
- Review-screen navigation.
- Camera error handling.
- Existing responsive layout.
- Existing browser compatibility mechanisms.

Determine how the existing application handles:

- Camera permission denial.
- Camera device unavailability.
- Camera switching.
- Rapid consecutive captures.
- Capture failures.
- Local storage failures.
- Pending photographs.
- Exiting the camera with unsent photographs.
- Resuming a previous capture session.
- Exhausted photo allowance.
- Browser backgrounding and interruptions.

Preserve the existing working capture pipeline wherever possible.

Do not replace stable camera or image-processing functionality solely for visual reasons.

## 6. Information Architecture

Organise the camera into three primary regions:

1. Top camera toolbar.
2. Live camera viewfinder.
3. Bottom camera control deck.

The bottom control deck contains:

- Film-look control.
- Latest captured-photo thumbnail.
- Primary shutter.
- Front/rear camera switch.

Transient status messages may appear within an appropriate unobtrusive area.

Do not display the application's standard bottom navigation while the immersive camera experience is active.

## 7. Target Camera Composition

The following wireframe defines the intended layout.

```text
┌─────────────────────────────────┐
│                                 │
│  ×         9 shots left         │
│         ▪▪▪▪▪▪▪▪▪▫▫▫▫▫▫▫▫▫▫▫▫ │
│                                 │
├─────────────────────────────────┤
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│       LIVE CAMERA PREVIEW       │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│                                 │
│          Film look · FP2        │
│                                 │
│   ┌─────┐                       │
│   │Photo│6        ◎        ⇄    │
│   └─────┘                       │
│   Review                        │
│                                 │
└─────────────────────────────────┘
```

The wireframe describes the structural intent rather than fixed dimensions.

Adapt the viewfinder and control deck to the actual available viewport and camera stream proportions.

The primary shutter must remain horizontally centred regardless of the content displayed on either side.

## 8. Camera-Specific Design Tokens

Use the existing design system wherever suitable.

Introduce camera-specific semantic tokens only where required.

| Token | Proposed Value | Usage |
|---|---|---|
| camera.background | #191D19 | Camera control surfaces |
| camera.surface | #303630 | Secondary camera controls |
| camera.text.primary | #FAF8F3 | Primary controls and text |
| camera.text.secondary | #BFC6BD | Supporting information |
| camera.accent | #A7BB9B | Selected states and available film segments |
| camera.brand | #60775E | Count badges and subtle branding |
| camera.track | #484F47 | Inactive indicators |
| camera.border | #D8D9D2 | Subtle control borders |

These are proposed values.

Reuse equivalent existing design tokens when available.

The main agent must approve any additional camera-specific tokens before implementation.

### Visual Treatment

- Near-black camera control surfaces.
- Ivory primary controls.
- Restrained sage-green accents.
- Functional sans-serif typography.
- Consistent outlined icons.
- Minimal borders.
- No heavy shadows.
- No floral decorations within camera controls.
- No decorative wedding calligraphy.
- No champagne-gold ornamentation.

The camera should remain recognisable as part of the Wedding Memories application without sacrificing camera usability.

## 9. Top Camera Toolbar

### 9.1 Purpose

Provide only essential information and controls.

Remove the existing:

- Couple names.
- Full wedding date.
- Large bordered close button.
- Redundant decorative information.

The guest has already entered the correct wedding experience and does not need repeated event information while capturing photographs.

### 9.2 Layout

Left:

Close camera control.

Centre:

Remaining photo allowance.

Right:

Reserve appropriate balancing space, or place an existing genuinely useful camera control if justified.

Do not introduce a duplicate film-look control when one is already available in the bottom control deck.

### 9.3 Close Camera Control

Use a simple X icon.

Requirements:

- Minimum preferred touch target of 44 × 44 CSS pixels.
- Visible icon size of approximately 24px.
- High contrast against the camera surface.
- No unnecessarily large decorative border.
- Accessible label: Close camera.

Preserve existing camera-exit behaviour.

When unsent photographs exist, ensure closing the camera does not unintentionally discard them.

Only introduce a confirmation dialog when exiting would genuinely cause irreversible data loss.

Do not interrupt normal navigation with unnecessary confirmation dialogs when photographs are safely persisted.

### 9.4 Remaining Photo Allowance

Display the authoritative remaining photo allowance.

Example:

9 shots left

Use the configured application state.

Do not hardcode the number.

Use functional typography with a medium font weight.

Preferred enhancement:

Display a compact segmented film-style indicator beneath the remaining-shot text.

- Each segment represents an allowance unit where practical.
- Remaining segments use the light sage accent.
- Consumed segments use the inactive camera track colour.
- The indicator updates when the authoritative allowance changes.
- The textual allowance remains available for accessibility.

Reuse the same underlying quota state used by the home page.

Do not introduce a separate quota-calculation mechanism.

Do not independently change when an allowance unit is consumed, reserved or restored.

The remaining allowance and the reviewable-photo count represent different information and must remain clearly distinguishable.

### 9.5 Toolbar Dimensions

Recommended:

- Approximately 56–72px height, excluding applicable safe-area padding.
- Compact horizontal padding.
- Vertically aligned controls.
- Balanced centre positioning.

Allow natural adaptation for smaller viewports.

## 10. Live Camera Viewfinder

### 10.1 Purpose

Provide the largest practical uninterrupted live camera preview.

The viewfinder is the primary visual content of the camera page.

### 10.2 Layout

- Position between the top toolbar and bottom control deck.
- Use the available viewport space efficiently.
- Avoid placing unnecessary labels or controls over the preview.
- Maintain appropriate camera-stream proportions.
- Use predictable dark control surfaces around the preview.

Prefer separating camera controls from the live feed to ensure consistent control contrast.

Where a completely separated layout would unnecessarily reduce usable preview space, restrained dark gradient overlays may be used.

The main agent must evaluate the actual rendered composition before deciding.

### 10.3 Framing Accuracy

The displayed viewfinder must accurately communicate the composition of the resulting photograph.

Investigate the relationship between:

- Camera video resolution.
- Video element dimensions.
- CSS object-fit behaviour.
- Display cropping.
- Capture canvas dimensions.
- Final photograph aspect ratio.
- Camera orientation.
- Front-camera mirroring.
- Film-processing output.

Do not assume that the displayed preview and captured photograph have identical framing.

If the preview is cropped, ensure the captured output follows the intended visible composition or that the capture boundary is clearly communicated.

Avoid:

- Unexpected cropping.
- Stretched photographs.
- Distorted aspect ratios.
- Incorrect orientation.
- Accidental mirroring changes.
- Inconsistent preview and output composition.

Preserve the intended existing capture dimensions and image-quality requirements.

Framing accuracy is mandatory. Architectural changes required to correct a confirmed mismatch must be assessed by the main agent.

### 10.4 Camera Loading State

While the camera stream is initialising:

- Display an appropriate dark viewfinder placeholder.
- Communicate that the camera is opening.
- Prevent capture until the stream is ready.
- Keep the close control available.
- Avoid displaying stale frames as an active camera preview.

Suggested copy:

Opening camera…

### 10.5 Camera Permission State

When camera permission is denied or unavailable:

Title:

Camera access is needed

Description:

Allow camera access in your browser to capture wedding memories.

Provide appropriate supported actions:

- Try again.
- Return to Home.

Do not repeatedly trigger browser permission prompts when permission has been permanently denied.

Provide accurate recovery instructions based on the existing browser-handling capabilities.

### 10.6 Optional Composition Grid

A rule-of-thirds composition grid may be introduced as an optional enhancement.

Requirements:

- Subtle lines.
- Low visual prominence.
- User-controllable visibility.
- No interference with captured output.
- No impact on camera performance.

Do not introduce this enhancement if it would unnecessarily complicate the existing camera experience.

## 11. Bottom Camera Control Deck

### 11.1 Layout

The bottom control deck contains:

1. Film-look control.
2. Primary capture-control row.

The primary capture-control row contains:

- Latest-photo thumbnail on the left.
- Shutter button in the centre.
- Camera-switch control on the right.

Use three balanced layout regions to ensure the shutter remains centred.

Do not allow changing photo counts or label widths to shift the shutter horizontally.

### 11.2 Visual Treatment

- Near-black background.
- High-contrast ivory controls.
- Subtle sage accents.
- Compact vertical composition.
- Comfortable thumb accessibility.
- Safe-area-aware bottom padding.

The control deck must remain accessible without unnecessary scrolling.

Do not consume more viewfinder space than necessary.

## 12. Primary Shutter

### 12.1 Visual Design

Replace the existing sage-green camera-icon button with a native-inspired circular shutter.

Specifications:

- Outer diameter: approximately 72–80px.
- Outer ring: 2–3px warm ivory.
- Inner circle: solid warm ivory.
- Separation between inner circle and outer ring: approximately 3–4px.
- No camera icon.
- No visible text label.
- No heavy shadow.

The shutter must remain the strongest functional element in the camera experience.

### 12.2 Accessibility

Provide an accessible name:

Take a photo

The absence of a visible label must not reduce accessibility.

Support the existing applicable keyboard interaction mechanisms.

### 12.3 Capture Behaviour

When the shutter is selected:

- Invoke the existing capture pipeline.
- Apply the selected film look according to existing business rules.
- Persist the resulting photograph through the existing mechanism.
- Update the reviewable-photo count after successful capture and persistence.
- Update the remaining allowance according to existing quota rules.
- Update the latest-photo thumbnail.
- Provide immediate capture feedback.

Do not introduce a mandatory review screen after every capture.

Guests must be able to capture multiple photographs consecutively.

### 12.4 Capture Concurrency

Prevent unintended duplicate or overlapping capture operations.

Use the existing capture guards or introduce an appropriate guard if required.

Do not impose unnecessary artificial delays.

Do not allow rapid interaction to bypass the photo allowance.

Do not show successful capture feedback when the operation has failed.

### 12.5 Disabled State

Disable capture when appropriate, including:

- Camera stream is not ready.
- Camera switching is in progress.
- Photo allowance is exhausted.
- Capture is temporarily unavailable.
- An existing safety or processing constraint prevents another capture.

Communicate the disabled state clearly.

Do not unnecessarily disable unrelated controls.

## 13. Captured-Photo Thumbnail

### 13.1 Purpose

Provide a compact entry point into the existing photograph-review experience.

Take inspiration from the native iPhone Camera thumbnail.

### 13.2 Visual Design

- Latest successfully captured photograph.
- Approximately 48–52px square visual size.
- Approximately 8px corner radius.
- Subtle contrasting border if required.
- Small count badge positioned near the upper-right corner.
- Optional concise Review label beneath the thumbnail.

The count badge uses the actual number of photographs available in the associated review flow.

Do not hardcode the count.

Do not display a fabricated photograph or count.

### 13.3 Empty State

When no reviewable photographs exist:

- Display a restrained placeholder if needed to maintain alignment.
- Do not imply that photographs have been captured.
- Disable the review interaction unless existing previously captured photographs are available.

### 13.4 Behaviour

After successful capture and persistence:

- Update the thumbnail to the latest reviewable photograph.
- Update the count accurately.
- Preserve the guest's ability to continue capturing photographs.
- Do not open the review screen automatically.

When selected:

- Open the existing photograph-review experience.
- Preserve existing photograph state.
- Preserve selected film look where appropriate.
- Preserve authoritative photo allowance.
- Support returning to the camera.

The thumbnail must not be replaced by a large persistent carousel.

### 13.5 State Integrity

Ensure that the thumbnail and count remain consistent when:

- A photograph is captured.
- A photograph is deleted.
- A photograph is uploaded.
- A photograph is restored from local persistence.
- The guest returns from the review screen.
- A capture or save operation fails.

Use the existing definition of reviewable photographs.

Do not independently redefine the review count or include unrelated shared gallery photographs.

## 14. Camera Switching

### 14.1 Visual Design

Use the existing suitable camera-switch icon.

Specifications:

- Approximately 44–48px interactive area.
- Approximately 22–24px icon.
- Circular charcoal-sage background where appropriate.
- Ivory icon.

Remove the redundant visible Flip label if the icon remains understandable.

Accessible label:

Switch camera

### 14.2 Behaviour

- Preserve existing front/rear camera switching.
- Prevent conflicting capture operations while switching.
- Provide an appropriate loading state during stream transition.
- Maintain selected film look.
- Maintain captured photographs.
- Maintain photo allowance.
- Maintain guest identity.
- Restore the live preview when the replacement stream is ready.

Handle camera-switch failures gracefully.

If the device has no supported alternative camera, hide or disable the action appropriately.

Do not display an unsupported camera-switch capability.

### 14.3 Stream Lifecycle

Preserve or improve existing stream lifecycle management.

Ensure:

- Unused camera tracks are stopped appropriately.
- Camera resources are released when exiting the experience.
- Camera switching does not accumulate unnecessary active streams.
- Returning to the camera reinitialises the correct stream where required.
- Backgrounding and resuming the browser are handled appropriately.

Do not introduce camera-resource leaks.

## 15. Film Looks

### 15.1 Purpose

Preserve the film presets as a signature characteristic of the Wedding Memories camera.

Existing presets include:

- Original.
- FP2.
- FS16.
- FV5.

Use the existing configured film definitions.

Do not independently redefine the appearance or processing characteristics of these presets.

### 15.2 Default Collapsed Presentation

Preferred presentation:

A compact expandable control positioned above the shutter row.

Example:

Film look · FP2

Include an appropriate outlined filter or layers icon and a subtle expansion affordance.

Requirements:

- Clearly communicate the currently selected film look.
- Use light sage to indicate an active non-original preset where appropriate.
- Maintain a comfortable touch target.
- Keep the control visually subordinate to the shutter.
- Avoid large permanent pill buttons.

Preserve the application's existing default film selection.

Do not assume that FP2 should become the default merely because it is selected in the reference screenshot.

### 15.3 Expanded Film Selector

When the film-look control is selected, display the available presets within a compact expandable panel.

Preferred layout:

- Four film options in a horizontal arrangement.
- Visual preview thumbnail where available.
- Preset name beneath each preview.
- Clearly identifiable selected state.
- Optional Film looks heading.
- Existing film information action.
- Clear collapse affordance.

The selected option should be distinguished through an appropriate border, accent or other visible selection treatment.

Do not rely on colour alone.

### 15.4 Film Preview Thumbnails

Optional enhancement:

Use the same reference image with each actual implemented film preset applied.

Requirements:

- Consistent reference image across all presets.
- Accurate representation of the actual filter effects.
- Consistent thumbnail dimensions.
- Efficient processing.
- No unnecessary continuous rendering of multiple live camera streams.

A static reference image processed through the existing filter mechanism is preferred over computationally expensive simultaneous live previews.

Do not fabricate arbitrary filter colours and present them as the actual film output.

If accurate previews cannot be implemented efficiently, use a compact text-based selector.

### 15.5 Film Selection Behaviour

When a film look is selected:

- Update the selected state immediately.
- Apply the film look to the live camera preview if supported by the existing implementation.
- Preserve existing capture-processing behaviour.
- Ensure the captured output uses the intended selected preset.
- Retain the selected preset across consecutive captures.
- Preserve selected state when entering and returning from review where appropriate.

Changing the selected film look must not unintentionally alter previously captured photographs.

Do not introduce duplicate film processing or apply the same filter twice.

Preserve existing output-quality requirements.

### 15.6 Expanded Panel Behaviour

- The selector can be collapsed without changing the selected preset.
- Selecting a preset should not require unnecessary confirmation.
- Guests should remain able to capture photographs efficiently.
- The expanded panel must not permanently obscure essential controls.
- Maintain appropriate layout stability.
- Avoid unexpected shutter movement when possible.
- Preserve viewfinder usability on shorter mobile screens.

The main agent should determine whether the selector remains open or collapses after selection based on the rendered interaction.

### 15.7 Film Information

Preserve the existing film information functionality.

Use accurate descriptions based on the actual implemented presets.

Do not invent characteristics for FP2, FS16 or FV5.

Keep information accessible without cluttering the default camera interface.

### 15.8 Fallback

If the expandable selector introduces excessive implementation complexity or reduces camera usability, retain an always-visible compact segmented film selector.

The existing large pill-shaped buttons should still be visually refined.

All existing film presets must remain accessible.

## 16. Capture Feedback

### 16.1 Shutter Press

Provide immediate, subtle press feedback.

Suggested treatment:

- Small scale reduction.
- Approximately 100–150ms transition.
- Immediate return to the resting state.

Do not delay the capture operation to complete an animation.

### 16.2 Viewfinder Capture Feedback

Optional visual treatment:

A brief subtle viewfinder flash or shutter transition lasting approximately 80–120ms.

Requirements:

- Do not interfere with the actual captured image.
- Do not simulate a physical camera flash.
- Respect prefers-reduced-motion.
- Avoid visually overwhelming rapid repeated capture interactions.

### 16.3 Successful Local Save

Replace the persistent instruction:

“Saved on this device. Review it before uploading.”

With contextual feedback after a photograph is successfully persisted.

Suggested short confirmation:

Photo saved

On the first successful capture, a slightly more informative message may be used:

Photo saved. Tap Review when you're ready to share.

The confirmation should dismiss automatically after an appropriate interval.

Suggested duration:

Approximately 1.5–2.5 seconds.

Only communicate that the photograph is saved on the device when local persistence has genuinely succeeded.

Do not use:

- Photo uploaded.
- Photo shared.
- Memory published.

Unless the relevant server operation has actually completed.

### 16.4 Persistent Review Discoverability

The captured-photo thumbnail and review count should provide persistent feedback that photographs are available.

Do not rely solely on a transient toast to explain how photographs can be reviewed and uploaded.

Retain an understandable Review label or equivalent affordance if necessary.

### 16.5 Failed Capture or Save

Provide a clear contextual error.

Suggested capture error:

Couldn't take this photo. Please try again.

Suggested persistence error:

Couldn't save this photo on your device.

Provide meaningful recovery instructions based on the actual failure.

Do not increase the successfully captured-photo count when persistence fails.

Do not silently discard recoverable photographs.

Preserve existing error diagnostics without exposing raw technical exceptions to guests.

## 17. Photo Allowance Exhaustion

When no photo allowance remains:

- Display the actual remaining allowance.
- Disable the shutter according to existing business rules.
- Preserve the captured-photo thumbnail.
- Preserve access to photograph review.
- Preserve pending upload management.
- Allow the guest to exit the camera.
- Communicate the next available action.

Suggested message:

You've captured all your moments!

Supporting description:

Review your photos and share your favourite memories.

Provide an appropriate review entry point.

Do not automatically discard photographs or force the guest out of the camera.

Do not prevent valid retries or uploads of already captured photographs.

If deleting a photograph restores allowance under existing rules, the displayed state must update accordingly.

## 18. Photograph Review and Upload Integration

The redesign must preserve the existing photograph-review and upload experience.

Requirements:

- Multiple captured photographs remain available for review.
- Captured photographs are not automatically published solely because the shutter was pressed.
- Existing review, deletion and selection functionality remains available.
- Existing upload validation remains enforced.
- Existing local persistence remains functional.
- Existing upload queues and retry mechanisms remain functional.
- Returning to the camera does not unintentionally discard unsent photographs.
- Guest identity and quota remain consistent across navigation.

A complete redesign of the photograph-review page is outside this workstream unless required to support essential integration.

Do not introduce a separate photograph storage model or upload queue.

## 19. Responsive Layout

The camera must accommodate the actual available browser viewport.

Target viewport widths:

- 320px.
- 375px.
- 390px.
- 430px.
- 768px.
- Desktop widths supported by the existing application.

Requirements:

- No horizontal overflow.
- No unnecessary vertical page scrolling during normal capture.
- No controls obscured by browser chrome.
- No controls obscured by safe-area insets.
- Primary shutter remains accessible.
- Close control remains accessible.
- Film selector remains usable.
- Viewfinder occupies the remaining practical space.
- Shorter viewport heights are handled appropriately.
- Expanded film controls remain usable on compact devices.
- Orientation changes are handled without significant breakage.

Use dynamic viewport units and suitable fallbacks consistent with the existing application.

Do not assume that the browser's address bar or bottom toolbar is part of the application.

Do not attempt to imitate native browser controls.

Do not depend on forcing browser fullscreen mode.

## 20. Accessibility

Follow the established DESIGN_SYSTEM.md.

Additional camera-specific requirements:

- Accessible names for icon-only controls.
- Minimum preferred 44 × 44 CSS pixel touch targets.
- High-contrast controls.
- Understandable selected film state.
- Understandable remaining photo allowance.
- Meaningful capture and persistence feedback.
- Screen-reader-compatible error messages.
- Appropriate focus management.
- Visible keyboard focus where applicable.
- Reduced-motion support.
- No essential information conveyed solely through colour.
- No unnecessary flashing effects.

The camera must remain understandable even when decorative animations are disabled.

## 21. Performance and Reliability

The camera is a performance-sensitive experience.

Prioritise:

- Responsive live preview.
- Low capture latency.
- Reliable local persistence.
- Efficient image processing.
- Predictable camera switching.
- Stable memory consumption.
- Accurate quota updates.

Avoid:

- Introducing multiple unnecessary live-video elements.
- Continuously processing several filter previews simultaneously.
- Expensive decorative animations.
- Unnecessary image-processing libraries.
- Reinitialising the camera on unrelated state changes.
- Unnecessary full-resolution thumbnail rendering.
- Unbounded object URL creation.
- Unnecessary network requests during capture.
- Excessive memory retention.

Follow appropriate resource cleanup for existing:

- Media streams.
- Event listeners.
- Object URLs.
- Temporary images.
- Canvas resources.
- Timers.

Do not claim performance improvements without relevant evidence.

## 22. Features Outside Scope

Do not introduce the following unless explicitly approved:

- Video recording.
- Portrait mode.
- Artificial background blur.
- Advanced exposure adjustment.
- Camera timer.
- Artificial shutter sounds.
- New film presets.
- New photo-editing architecture.
- New camera framework.
- New upload architecture.
- Unsupported zoom controls.
- Unsupported flash controls.
- Unsupported tap-to-focus interactions.
- Decorative wedding overlays embedded into captured photographs.

Preserve any existing supported capabilities.

Do not simulate camera hardware functionality that is unavailable through the current browser or device.

## 23. Implementation Priorities

### P0 — Mandatory

- Simplify the camera toolbar.
- Remove redundant wedding information.
- Introduce the native-inspired shutter.
- Simplify the close and camera-switch controls.
- Refine the latest-photo thumbnail.
- Display accurate reviewable-photo counts.
- Improve camera control contrast.
- Remove persistent redundant save instructions.
- Introduce accurate contextual capture feedback.
- Preserve all existing camera functionality.
- Preserve film processing.
- Preserve guest identity and quota enforcement.
- Preserve local photograph persistence.
- Preserve multiple consecutive captures.
- Preserve review and upload integration.
- Validate preview and captured-image framing.
- Validate essential responsive and accessibility requirements.

### P1 — Conditional Enhancements

- Segmented film-style allowance indicator.
- Expandable film selector.
- Refined film-selection transitions.
- Subtle capture animation.
- Thumbnail update animation.
- Improved review discoverability.
- Targeted framing corrections where technically required.

Implement where compatible with the existing architecture and release constraints.

A confirmed framing defect affecting captured output must not be deferred solely because framing improvements appear in this category.

### P2 — Optional Enhancements

- Accurate visual film-preview thumbnails.
- Optional composition grid.
- Additional restrained camera microinteractions.

Do not compromise camera reliability to implement optional enhancements.

## 24. Implementation Constraints

Implementation sub-agents must:

- Follow the approved camera design direction.
- Reuse shared design tokens and components.
- Preserve the existing camera capture pipeline.
- Preserve existing film-processing behaviour.
- Preserve local photograph persistence.
- Preserve photo allowance rules.
- Preserve existing guest identity.
- Preserve review and upload behaviour.
- Avoid speculative architecture changes.
- Avoid introducing unnecessary dependencies.
- Avoid modifying unrelated application pages.
- Report cross-workstream dependencies and architectural conflicts to the main agent.

The main agent is responsible for resolving architectural decisions and reviewing the integrated camera experience.

## 25. Completion

The implementation is complete only when:

- The rendered camera has undergone visual review.
- The camera feels familiar, minimal and premium.
- Essential camera functionality remains reliable.
- Captured photographs are preserved.
- Existing film presets remain functional.
- Preview framing is validated.
- Existing quota rules remain enforced.
- Responsive behaviour is validated.
- Applicable acceptance criteria are satisfied.

Successful compilation alone does not constitute completion.