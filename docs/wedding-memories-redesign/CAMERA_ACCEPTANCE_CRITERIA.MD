# Wedding Memories — Camera Acceptance Criteria

## 1. Purpose

Define the visual, functional, technical and release-readiness requirements for the Wedding Memories camera redesign.

The main agent is responsible for independent validation and final acceptance.

Implementation sub-agents are responsible for validating their assigned workstreams.

Use the following sources of truth:

- DESIGN_BRIEF.md.
- DESIGN_SYSTEM.md.
- CAMERA_PAGE_SPEC.md.
- Existing working camera implementation.
- Completed home page and gallery implementations.
- Supplied camera screenshot.

Acceptance must be based on actual rendered output and available functional evidence.

Do not approve the camera solely because the code compiles or implementation sub-agents report completion.

## 2. Acceptance Classification

### Mandatory

Requirements that must be satisfied before unconditional release approval.

### Conditional

Requirements that should be implemented where compatible with the existing architecture.

If deferred, document:

- Reason.
- Technical constraint.
- Functional fallback.
- Impact on the guest experience.

### Optional

Enhancements that improve visual polish without affecting essential functionality.

Optional enhancements must not delay or destabilise the release.

Unless otherwise specified, acceptance criteria are mandatory.

## 3. Visual Design Acceptance Criteria

### 3.1 Camera Identity

- [ ] The camera resembles a dedicated smartphone camera rather than a conventional webpage.
- [ ] The interface feels minimal, familiar and premium.
- [ ] The visual design remains consistent with the broader Wedding Memories identity.
- [ ] Sage-green accents are restrained.
- [ ] Decorative wedding elements do not distract from photography.
- [ ] Unnecessary wedding information is removed from the camera interface.

### 3.2 Visual Hierarchy

- [ ] The live viewfinder receives the greatest practical visual space.
- [ ] The shutter is the strongest functional control.
- [ ] The remaining photo allowance is easy to identify.
- [ ] Reviewable photographs are easy to access.
- [ ] Film controls remain discoverable without dominating the interface.
- [ ] Camera switching is visually subordinate to the shutter.
- [ ] Close-camera functionality is clearly discoverable.

### 3.3 Composition

- [ ] The top toolbar is compact.
- [ ] The bottom control deck is balanced.
- [ ] The shutter remains horizontally centred.
- [ ] The thumbnail and camera-switch controls are appropriately aligned.
- [ ] Changing photo counts does not shift the shutter.
- [ ] Functional controls do not unnecessarily obscure the viewfinder.
- [ ] The camera layout does not contain unnecessary borders or decorative cards.
- [ ] All essential controls have predictable contrast.

### 3.4 Premium Quality

- [ ] Typography is clear and understated.
- [ ] Spacing is intentional.
- [ ] Camera controls have consistent proportions.
- [ ] The shutter feels familiar and refined.
- [ ] Selected states are visually coherent.
- [ ] Feedback animations are restrained.
- [ ] The camera does not exhibit generic web-form aesthetics.
- [ ] The integrated experience feels professionally designed.

## 4. Camera Entry and Permissions

### CAM-001 — Camera Entry

Given an eligible guest selects the existing camera entry point,

When the camera opens,

Then:

- The correct camera experience is displayed.
- Existing guest identity is preserved.
- Existing photo allowance is preserved.
- Existing captured photographs remain available where applicable.
- The camera stream initialises correctly.
- The close-camera control remains available.
- The standard application bottom navigation does not interfere with the immersive camera.

### CAM-002 — Initialisation State

Given the camera stream is initialising,

When the camera page renders,

Then:

- Appropriate loading feedback is displayed.
- The shutter is not available prematurely.
- Stale imagery is not misrepresented as an active camera feed.
- The guest can exit the camera.
- The application does not remain indefinitely in an unexplained loading state.

### CAM-003 — Permission Granted

Given camera permission is granted,

When initialisation completes,

Then:

- A valid live camera preview is displayed.
- Capture becomes available when existing eligibility rules permit it.
- Remaining photo allowance is accurate.
- The selected film state is correct.

### CAM-004 — Permission Denied

Given camera permission is denied,

When the guest accesses the camera,

Then:

- A clear permission-related message is displayed.
- Appropriate recovery instructions are provided.
- Unsupported permission recovery is not implied.
- The guest can return to the existing application.
- The camera does not become permanently stuck.
- Raw browser exceptions are not displayed.

### CAM-005 — Camera Unavailable

Given no usable camera is available or camera initialisation fails,

Then:

- The application communicates the problem accurately.
- Capture remains unavailable.
- Appropriate recovery is offered where supported.
- The close action remains available.
- Existing captured photographs are not discarded.

## 5. Live Viewfinder

### CAM-006 — Live Preview

- [ ] The live preview displays the active camera stream.
- [ ] The preview is not unnecessarily distorted.
- [ ] The preview remains responsive.
- [ ] Controls do not excessively obscure the composition.
- [ ] Unrelated application-state changes do not unnecessarily reinitialise the stream.
- [ ] Camera control contrast remains acceptable against bright and dark scenes.

### CAM-007 — Preview and Capture Framing

Given a guest frames a subject within the live viewfinder,

When a photograph is captured and reviewed,

Then:

- The resulting photograph follows the intended visible composition.
- Unexpected cropping does not occur.
- The captured photograph is not stretched.
- Orientation is correct.
- Original image proportions follow the existing capture requirements.
- Any intentional difference between preview and captured output is clearly understood and documented.

Validate using recognisable subjects or test patterns positioned near the viewfinder boundaries.

Inspect actual captured photographs rather than relying solely on source-code assumptions.

### CAM-008 — Front-Camera Orientation and Mirroring

Where a front-facing camera is supported:

- [ ] The existing intended preview-mirroring behaviour is preserved.
- [ ] Captured output follows the intended mirroring rules.
- [ ] Photographs are not accidentally mirrored twice.
- [ ] Orientation remains correct.
- [ ] Preview and capture behaviour remain understandable.

## 6. Shutter and Photograph Capture

### CAM-009 — Shutter Presentation

- [ ] The shutter uses the approved native-inspired circular treatment.
- [ ] The shutter does not require an unnecessary camera icon.
- [ ] The shutter has an accessible name.
- [ ] The shutter remains the primary visual control.
- [ ] The shutter has a comfortable touch target.
- [ ] Loading and disabled states are understandable.

### CAM-010 — Successful Photograph Capture

Given the camera is ready and the guest has available allowance,

When the guest selects the shutter,

Then:

- The existing capture pipeline is invoked.
- The correct camera frame is captured.
- The selected film look is applied according to existing rules.
- The photograph is persisted through the existing mechanism.
- The latest-photo thumbnail updates appropriately.
- The reviewable-photo count updates accurately.
- The remaining allowance updates according to existing rules.
- Appropriate successful-capture feedback is displayed.

### CAM-011 — Consecutive Captures

Given the guest has sufficient remaining allowance,

When the guest captures multiple photographs consecutively,

Then:

- Each valid capture is handled correctly.
- The camera remains usable between captures.
- The guest is not forced to review every photograph individually.
- Previously captured photographs remain available.
- Counts remain accurate.
- Existing quota enforcement remains functional.

### CAM-012 — Rapid Repeated Interaction

Given the guest presses the shutter rapidly,

Then:

- Unintended duplicate captures are prevented.
- Capture processing does not corrupt photographs.
- The application does not exceed the permitted allowance.
- Capture state remains consistent.
- The camera recovers to a usable state.

Do not introduce unnecessary artificial delays to achieve this criterion.

### CAM-013 — Capture Failure

Given the capture operation fails,

Then:

- The guest receives understandable feedback.
- A false success confirmation is not displayed.
- Successfully captured-photo counts are not incorrectly incremented.
- Existing photographs remain intact.
- The guest can retry where supported.
- The camera does not become permanently unusable.

### CAM-014 — Capture Unavailable

Given capture is temporarily unavailable,

Then:

- The shutter appropriately communicates its disabled state.
- Unsupported capture operations are prevented.
- Unrelated controls remain available where appropriate.
- The guest can understand or recover from the unavailable state.

## 7. Photo Allowance

### CAM-015 — Allowance Accuracy

- [ ] Remaining allowance comes from the existing authoritative quota state.
- [ ] Configured allowance is not hardcoded into reusable components.
- [ ] Remaining allowance does not become negative.
- [ ] Pending and reserved photographs follow existing business rules.
- [ ] Existing quota-consumption rules are unchanged.
- [ ] Existing quota-restoration rules are unchanged.
- [ ] Allowance remains consistent between Home, Camera and My album.

### CAM-016 — Segmented Allowance Indicator

Classification: Conditional.

If implemented:

- [ ] The segment count represents the configured allowance where practical.
- [ ] Remaining and consumed segments are visually distinguishable.
- [ ] Segment states correspond to authoritative allowance information.
- [ ] The indicator updates correctly.
- [ ] A readable textual allowance remains available.
- [ ] The indicator does not introduce an independent quota-calculation mechanism.

If deferred, retain accurate and understandable textual allowance information.

### CAM-017 — Allowance Exhausted

Given no remaining allowance exists,

When the guest accesses or continues using the camera,

Then:

- Remaining allowance is displayed accurately.
- Additional captures are prevented according to existing rules.
- The guest understands why capture is unavailable.
- Existing photographs remain available for review.
- Pending uploads remain manageable.
- The guest can exit the camera.
- No existing photographs are discarded.

### CAM-018 — Allowance Restoration

Where existing rules permit allowance restoration:

Given a qualifying photograph is deleted or another supported restoration event occurs,

Then:

- Remaining allowance updates accurately.
- The shutter availability updates appropriately.
- The review count remains consistent.
- No independent or conflicting restoration logic is introduced.

## 8. Local Photograph Persistence

### CAM-019 — Successful Persistence

Given a photograph is successfully captured,

When the existing persistence mechanism completes,

Then:

- The photograph is available through the existing review flow.
- The application accurately communicates local persistence.
- The photograph is not represented as uploaded before server acknowledgement.
- Existing image metadata and processing results remain intact.

### CAM-020 — Persistence Failure

Given local photograph persistence fails,

Then:

- The application does not falsely claim that the photograph was saved.
- The guest receives understandable feedback.
- Existing successfully saved photographs remain intact.
- Review counts remain accurate.
- Allowance handling remains consistent with existing business rules.
- Recoverable photograph data is not unnecessarily discarded.
- Relevant diagnostic information is retained according to existing conventions.

### CAM-021 — Navigation and Persistence

Given unsent photographs exist,

When the guest:

- Opens the review screen.
- Returns to the camera.
- Closes the camera.
- Returns through Home.
- Refreshes or resumes the application where persistence supports it.

Then:

- Existing supported persistence behaviour remains functional.
- Photographs are not unintentionally discarded.
- Guest identity remains consistent.
- Review counts remain accurate.
- Existing upload status remains consistent.

Do not claim persistence across browser closure unless this behaviour is supported and verified.

### CAM-022 — Storage and Resource Management

- [ ] Existing storage mechanisms are preserved.
- [ ] No duplicate photograph storage architecture is introduced.
- [ ] Unnecessary object URLs are cleaned up.
- [ ] Temporary image resources are released appropriately.
- [ ] Repeated captures do not introduce obvious unbounded resource growth.
- [ ] Existing storage failure handling remains functional.

## 9. Captured-Photo Thumbnail

### CAM-023 — Empty Thumbnail State

Given no reviewable photographs exist,

Then:

- The thumbnail does not display fabricated content.
- The displayed count is accurate.
- Unsupported review interactions are not presented as available.
- The shutter remains correctly positioned.

### CAM-024 — Latest Photograph Thumbnail

Given one or more reviewable photographs exist,

Then:

- The latest applicable photograph is displayed.
- The thumbnail represents the correct photograph.
- The count represents the actual reviewable collection.
- The thumbnail remains compact.
- The interface does not automatically expand into a large carousel.

### CAM-025 — Thumbnail Updates

Given the reviewable collection changes,

Then:

- The thumbnail updates according to the existing review definition.
- The count updates accurately.
- Deleted photographs are not incorrectly retained as the latest thumbnail.
- Uploaded photographs follow existing collection rules.
- Failed captures are not incorrectly included.
- The shutter remains horizontally centred.

### CAM-026 — Photograph Review

Given reviewable photographs exist,

When the guest selects the thumbnail,

Then:

- The existing photograph-review experience opens.
- The correct reviewable collection is available.
- Existing review and deletion functionality remains functional.
- Existing upload entry points remain available.
- Returning to the camera preserves applicable state.

## 10. Camera Switching

### CAM-027 — Front and Rear Camera Switching

Given an alternative supported camera is available,

When the guest selects Switch camera,

Then:

- The application switches to the correct supported camera.
- Appropriate transition feedback is displayed.
- The preview resumes correctly.
- Capture resumes when the replacement stream is ready.
- Existing photographs remain intact.
- Film selection remains consistent.
- Photo allowance remains consistent.

### CAM-028 — Switching During Capture

Given a capture or persistence operation is in progress,

When the guest attempts to switch cameras,

Then:

- Conflicting operations are handled safely.
- Photographs are not corrupted.
- Existing capture state remains consistent.
- The application eventually returns to a usable state.

### CAM-029 — Camera-Switch Failure

Given camera switching fails,

Then:

- The failure is communicated appropriately.
- Existing photographs are preserved.
- The guest can recover or exit.
- The interface does not falsely represent an unavailable stream as active.
- Capture does not remain enabled against an invalid stream.

### CAM-030 — Camera Resource Cleanup

- [ ] Unused camera tracks are stopped appropriately.
- [ ] Repeated switching does not accumulate unnecessary active streams.
- [ ] Exiting the camera releases applicable camera resources.
- [ ] Reopening the camera reinitialises the correct stream.
- [ ] Existing browser backgrounding behaviour remains functional.
- [ ] No obvious camera-resource leak is introduced.

## 11. Film Looks

### CAM-031 — Available Film Presets

- [ ] Original remains available.
- [ ] FP2 remains available.
- [ ] FS16 remains available.
- [ ] FV5 remains available.
- [ ] Additional configured existing presets remain available where applicable.
- [ ] Existing preset definitions remain unchanged.
- [ ] Existing default selection remains unchanged unless explicitly approved.

### CAM-032 — Film Selection

Given a guest selects an available film preset,

Then:

- The correct preset becomes selected.
- The selected state is clearly communicated.
- Existing live-preview behaviour remains functional.
- Existing capture-processing behaviour remains functional.
- Selecting a preset does not unexpectedly reset the camera session.

### CAM-033 — Film Output Accuracy

Given a film preset is selected,

When a photograph is captured,

Then:

- The intended film preset is applied according to existing rules.
- The filter is not applied twice.
- The output is not unexpectedly distorted.
- Existing image-quality requirements remain intact.
- The output is consistent with the existing preset implementation.

Validate using actual captured output or appropriate deterministic image-processing tests.

Do not rely solely on the selected button state.

### CAM-034 — Film Selection Persistence

Given a film preset is selected,

When the guest:

- Captures another photograph.
- Opens and closes the film selector.
- Switches cameras.
- Enters and returns from review.

Then the selected preset remains consistent with the intended existing session behaviour.

### CAM-035 — Previously Captured Photographs

Given photographs were captured using an earlier film preset,

When a different film preset is selected,

Then previously captured photographs are not unintentionally reprocessed or altered.

### CAM-036 — Expandable Film Selector

Classification: Conditional.

If implemented:

- [ ] The collapsed control communicates the selected preset.
- [ ] The film selector can be opened.
- [ ] All existing presets are accessible.
- [ ] Selected states are understandable.
- [ ] The selector can be collapsed.
- [ ] Collapsing does not reset the selected preset.
- [ ] The shutter remains accessible.
- [ ] The selector remains usable on compact mobile screens.
- [ ] The selector does not introduce unnecessary capture delays.

If deferred, retain an appropriately refined compact film selector.

### CAM-037 — Film Preview Thumbnails

Classification: Optional.

If implemented:

- [ ] Each preview uses the same reference image.
- [ ] Each preview represents the actual implemented preset.
- [ ] Selection is visually distinguishable.
- [ ] Preview generation does not introduce significant processing overhead.
- [ ] Multiple unnecessary live streams are not created.
- [ ] Preview content is not misleading.

### CAM-038 — Film Information

- [ ] Existing film information remains accessible.
- [ ] Descriptions reflect actual preset characteristics.
- [ ] Information does not introduce unnecessary permanent visual clutter.
- [ ] Opening film information does not unintentionally discard photographs or reset selection.

## 12. Capture Feedback and Application States

### CAM-039 — Successful Capture Feedback

Given a photograph has been successfully persisted,

Then:

- The guest receives appropriate confirmation.
- The confirmation does not falsely imply server upload.
- The thumbnail provides persistent visual evidence of the captured photograph.
- The confirmation does not block subsequent capture.
- The confirmation dismisses appropriately if transient.

### CAM-040 — Persistent Instruction Removal

- [ ] The previous persistent save instruction no longer unnecessarily occupies camera space.
- [ ] Guests can still understand how to review captured photographs.
- [ ] Review discoverability does not depend exclusively on a transient message.
- [ ] Relevant upload or persistence warnings remain accessible when genuinely necessary.

### CAM-041 — Capture Animation

Classification: Conditional.

If implemented:

- [ ] The animation is brief and restrained.
- [ ] The animation does not delay capture.
- [ ] The animation does not interfere with saved image content.
- [ ] Rapid captures remain usable.
- [ ] Reduced-motion preferences are respected.

### CAM-042 — Error Feedback

- [ ] Capture failures receive contextual feedback.
- [ ] Persistence failures receive contextual feedback.
- [ ] Camera-switch failures receive contextual feedback.
- [ ] Permission failures receive contextual feedback.
- [ ] Error messages communicate appropriate recovery actions.
- [ ] Raw browser and storage exceptions are not displayed.
- [ ] Valid previously captured photographs are preserved.

## 13. Camera Exit and Review Integration

### CAM-043 — Close Camera

Given the camera is active,

When the guest selects Close camera,

Then:

- Existing navigation behaviour is preserved.
- Applicable camera resources are released.
- Guest identity remains intact.
- Existing captured photographs are preserved according to supported persistence rules.
- Pending uploads are not unintentionally discarded.

### CAM-044 — Exit With Unsent Photographs

Given unsent photographs exist,

When the guest exits the camera,

Then:

- Safely persisted photographs remain available.
- Genuine risks of data loss are accurately communicated.
- Unnecessary confirmation dialogs are not introduced when no data-loss risk exists.
- The guest can recover or review existing photographs through supported entry points.

### CAM-045 — Existing Upload Integration

- [ ] Existing photograph-review functionality remains available.
- [ ] Existing deletion functionality remains available.
- [ ] Existing upload functionality remains available.
- [ ] Existing upload validation remains enforced.
- [ ] Existing retry behaviour remains functional.
- [ ] Existing guest identity remains consistent.
- [ ] Existing visibility rules remain enforced.
- [ ] Capturing a photograph does not unintentionally publish it.

## 14. Responsive Design

Validate representative viewport sizes.

| Width | Suggested Height |
|---:|---:|
| 320px | 568px |
| 375px | 667px |
| 390px | 844px |
| 430px | 932px |
| 768px | 1024px |
| 1440px | 900px |

Also validate compact available heights caused by mobile browser toolbars.

Requirements:

- [ ] No horizontal overflow.
- [ ] No unnecessary scrolling during normal capture.
- [ ] Close-camera control remains accessible.
- [ ] Shutter remains accessible.
- [ ] Review thumbnail remains accessible.
- [ ] Camera-switch control remains accessible where supported.
- [ ] Film selection remains accessible.
- [ ] No overlapping controls.
- [ ] No clipped essential labels.
- [ ] Safe-area insets are respected.
- [ ] Browser chrome does not obscure essential controls.
- [ ] The viewfinder retains appropriate proportions.
- [ ] Expanded film controls remain usable.
- [ ] Orientation changes do not cause significant breakage.
- [ ] The layout remains coherent at intermediate viewport sizes.

Responsive emulation validates layout but does not establish physical-device camera compatibility.

## 15. Accessibility

Follow the existing WCAG 2.2 AA design-system requirements.

Validate:

- [ ] Accessible shutter name.
- [ ] Accessible close-camera name.
- [ ] Accessible camera-switch name.
- [ ] Accessible review-thumbnail name.
- [ ] Accessible film-selection controls.
- [ ] Programmatically identifiable selected film state.
- [ ] Understandable textual photo allowance.
- [ ] Minimum preferred 44 × 44 CSS pixel touch targets.
- [ ] Sufficient functional contrast.
- [ ] Visible focus states.
- [ ] Appropriate keyboard interaction.
- [ ] Screen-reader-compatible status feedback.
- [ ] Reduced-motion support.
- [ ] Appropriate focus management when dialogs are present.
- [ ] No essential state communicated solely through colour.

## 16. Performance and Stability

- [ ] The live camera preview remains responsive.
- [ ] Capture does not introduce unnecessary delays.
- [ ] Film selection does not unnecessarily reinitialise the stream.
- [ ] Repeated captures remain usable.
- [ ] Existing image-processing performance does not materially regress.
- [ ] Thumbnail rendering does not unnecessarily process full-resolution images.
- [ ] Camera switching does not create unnecessary concurrent streams.
- [ ] Object URLs and temporary resources are managed appropriately.
- [ ] No unnecessary heavyweight dependencies are introduced.
- [ ] Optional film previews do not significantly degrade performance.
- [ ] Decorative animations do not interfere with camera operation.
- [ ] Existing capture reliability remains intact.

Where practical, compare against the existing implementation.

Record actual observations and measurements.

Do not fabricate capture-latency or performance results.

## 17. Device and Browser Compatibility

Target:

- iOS Safari.
- Android Chrome.
- Other browsers supported by the existing application.

Validate where available:

- Camera permission handling.
- Rear-camera access.
- Front-camera access.
- Camera switching.
- Live preview.
- Photograph capture.
- Film processing.
- Photograph orientation.
- Preview-to-capture framing.
- Local photograph persistence.
- Browser backgrounding and resuming.
- Dynamic viewport behaviour.
- Browser back navigation.
- Photograph-review integration.

Use actual physical-device validation where possible.

Distinguish:

- Verified on a physical device.
- Verified using browser emulation.
- Verified using a mocked media stream.
- Verified through automated testing.
- Not verified.

Mocked camera streams and browser emulation must not be reported as proof of real-device camera compatibility.

## 18. Regression Test Matrix

| Scenario | Required |
|---|---|
| Camera entry from Home | Yes |
| Guest identity preservation | Yes |
| Camera permission granted | Yes |
| Camera permission denied | Yes |
| Camera unavailable | Yes |
| Rear-camera capture | Yes |
| Front-camera capture | Where supported |
| Camera switching | Where supported |
| Multiple consecutive captures | Yes |
| Rapid shutter interaction | Yes |
| Capture failure | Yes |
| Local persistence success | Yes |
| Local persistence failure | Yes |
| Preview-to-capture framing | Yes |
| Original film output | Yes |
| FP2 film output | Yes |
| FS16 film output | Yes |
| FV5 film output | Yes |
| Film selection persistence | Yes |
| Photo allowance enforcement | Yes |
| Photo allowance exhaustion | Yes |
| Allowance restoration | Where supported |
| Latest-photo thumbnail | Yes |
| Reviewable-photo count | Yes |
| Opening photograph review | Yes |
| Returning from review | Yes |
| Closing camera with unsent photographs | Yes |
| Existing upload integration | Yes |
| Camera resource cleanup | Yes |
| Browser background and resume | Where supported |
| Expanded film selector | If implemented |
| Film preview thumbnails | If implemented |
| Composition grid | If implemented |

Use controlled test sessions and fixtures.

Do not upload test photographs to the live wedding gallery without an authorised testing mechanism.

## 19. Technical Acceptance

- [ ] Existing repository conventions are followed.
- [ ] Existing technology stack is preserved.
- [ ] Existing camera architecture is preserved wherever appropriate.
- [ ] Existing capture pipeline remains functional.
- [ ] Existing film-processing architecture remains functional.
- [ ] Existing guest identity remains functional.
- [ ] Existing quota logic remains authoritative.
- [ ] Existing local persistence remains functional.
- [ ] Existing upload architecture remains functional.
- [ ] No duplicate state-management mechanisms are introduced.
- [ ] No unnecessary dependencies are introduced.
- [ ] Unrelated application modules are not unnecessarily rewritten.
- [ ] Applicable linting passes.
- [ ] Applicable type checking passes.
- [ ] Applicable unit tests pass.
- [ ] Applicable integration tests pass.
- [ ] Applicable end-to-end tests pass.
- [ ] The production build succeeds.

Document unavailable validation commands and unrelated pre-existing failures accurately.

Do not report unexecuted checks as passed.

## 20. Required Review Evidence

Collect available screenshots or equivalent rendered evidence for:

- Normal camera state.
- Camera loading state.
- Camera permission-denied state.
- Empty captured-photo state.
- Camera with multiple captured photographs.
- Remaining allowance indicator.
- Exhausted allowance state.
- Collapsed film selector.
- Expanded film selector, if implemented.
- Selected film preset.
- Capture-success feedback.
- Capture-failure feedback.
- Persistence-failure feedback.
- Camera-switching state.
- Narrow mobile viewport.
- Standard mobile viewport.
- Compact available viewport height.

Also collect functional evidence for:

- Actual captured photographs.
- Preview-to-capture framing comparison.
- Film-filter output.
- Consecutive capture behaviour.
- Local persistence.
- Camera resource cleanup.
- Review and upload integration.

Do not fabricate screenshots, captured photographs or validation results.

## 21. Review Scorecard

The main agent must independently evaluate the integrated camera experience.

| Dimension | Weight |
|---|---:|
| Capture reliability and functional correctness | 30% |
| Intuitiveness and interaction quality | 15% |
| Viewfinder quality and framing | 15% |
| Visual hierarchy and premium aesthetic | 10% |
| Mobile usability | 10% |
| State integrity and persistence | 10% |
| Accessibility | 5% |
| Performance | 5% |
| Total | 100% |

Assign each dimension a score from 0 to 10.

Weighted score:

Rating / 10 × dimension weight.

Target overall score: at least 90/100.

For every rating, provide:

- Supporting observations.
- Relevant screenshots or test evidence.
- Identified shortcomings.
- Required corrections, if applicable.

The score is a subjective review aid.

A high aggregate score must not override failed mandatory acceptance criteria.

## 22. Issue Severity

### Critical

Examples:

- Captured photographs are lost.
- Camera capture is broken.
- Existing film processing is broken.
- Quota enforcement can be bypassed.
- Existing guest isolation is compromised.
- Photographs are unintentionally published.
- Local persistence is broken.
- Significant camera-resource leaks occur.

Critical issues block release.

### Major

Examples:

- Essential controls are inaccessible.
- Preview and captured photographs have materially inconsistent framing.
- Camera switching is broken on supported devices.
- Film selection does not affect captured output correctly.
- Reviewable-photo counts are materially incorrect.
- Guests receive false successful-save confirmations.
- Capture becomes unusable after repeated interactions.
- Mobile browser chrome obscures essential controls.
- Material deviation from the approved design direction.

Major issues must be resolved before acceptance.

### Minor

Examples:

- Localised spacing inconsistencies.
- Minor icon alignment issues.
- Small visual differences.
- Optional animation refinements.
- Non-essential decorative polish.

Minor issues may be deferred when they do not affect mandatory acceptance criteria.

Document every deferred issue.

## 23. Review and Refinement

The main agent must:

1. Inspect the existing camera before implementation.
2. Establish shared camera design contracts.
3. Delegate focused implementation workstreams.
4. Review completed changes.
5. Inspect the integrated rendered camera.
6. Validate actual supported capture behaviour.
7. Evaluate preview and captured-image consistency.
8. Verify existing persistence and quota behaviour.
9. Record identified issues.
10. Delegate targeted corrections.
11. Repeat relevant visual and functional reviews.
12. Confirm mandatory acceptance criteria are satisfied.

Do not approve the redesign solely because:

- Sub-agents report completion.
- The interface visually resembles a native camera.
- The application compiles.
- Automated tests pass.
- A mocked camera preview renders correctly.

## 24. Release Gate

The camera redesign is ready for unconditional release only when:

- [ ] Mandatory acceptance criteria are satisfied.
- [ ] No unresolved critical issues remain.
- [ ] No unresolved major issues remain.
- [ ] Existing photograph capture remains functional.
- [ ] Existing film presets remain functional.
- [ ] Existing quota enforcement remains intact.
- [ ] Existing local photograph persistence remains intact.
- [ ] Existing review and upload flows remain functional.
- [ ] Actual rendered output has undergone visual review.
- [ ] Applicable technical validation has passed.
- [ ] Required device validation has been performed.
- [ ] Deferred enhancements have appropriate fallbacks.
- [ ] Remaining limitations are documented.

Unverified essential physical-device camera functionality prevents unconditional release approval.

Where physical-device validation cannot be performed, classify the implementation as ready for final device validation rather than fully release-ready.

## 25. Final Delivery Report

The main agent must provide:

1. Executive summary.
2. Implemented camera improvements.
3. Changed files and components.
4. Existing functionality preserved.
5. Visual review screenshots.
6. Review scorecard.
7. Capture and persistence validation.
8. Preview-to-capture framing findings.
9. Film-processing validation.
10. Camera-switching and resource-cleanup findings.
11. Responsive validation results.
12. Browser and device compatibility results.
13. Technical validation results.
14. Sub-agent model selection.
15. Any justified model escalations.
16. Deferred requirements and functional fallbacks.
17. Remaining limitations.
18. Final release-readiness assessment.

The main agent is accountable for the quality and reliability of the final camera experience.