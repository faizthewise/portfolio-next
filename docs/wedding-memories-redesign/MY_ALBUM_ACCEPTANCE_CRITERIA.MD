# Wedding Memories — My Album Acceptance Criteria

## 1. Purpose

Define the visual, functional, technical and release-readiness requirements for the My album redesign.

The main agent is responsible for independent review and final acceptance.

Implementation sub-agents are responsible for validating their assigned workstreams.

Use the following sources of truth:

- DESIGN_BRIEF.md.
- DESIGN_SYSTEM.md.
- MY_ALBUM_PAGE_SPEC.md.
- Completed Home, Gallery and Camera implementations.
- Existing My album screenshots.
- Existing application business rules.

Acceptance must be based on actual rendered output and functional evidence.

## 2. Acceptance Classification

### Mandatory

Requirements that must be satisfied before unconditional release approval.

### Conditional

Enhancements dependent on existing architecture or supported functionality.

If deferred, document:

- Reason.
- Technical constraint.
- Functional fallback.
- Impact on guest experience.

### Optional

Non-essential enhancements that must not introduce release risk.

Unless otherwise specified, acceptance criteria are mandatory.

## 3. Visual Design Acceptance Criteria

- [ ] My album feels like a premium personal wedding camera roll.
- [ ] The visual identity is consistent with the completed Home and Gallery pages.
- [ ] Existing shared typography and design tokens are reused.
- [ ] The personal header is compact and readable.
- [ ] The camera summary is visually cohesive.
- [ ] Photo contribution actions are clearly distinguishable.
- [ ] Upload problems are discoverable without scrolling through the complete photo collection.
- [ ] Photos and upload management are clearly separated.
- [ ] Content tabs have identifiable active states.
- [ ] The photo grid follows the shared Gallery presentation.
- [ ] Redundant contributor-name overlays are removed.
- [ ] Photo status indicators are restrained and meaningful.
- [ ] Upload rows are substantially more compact than the existing oversized cards.
- [ ] Upload errors are understandable.
- [ ] Progress indicators accurately represent their actual purpose.
- [ ] Raw technical exceptions are not exposed to guests.
- [ ] The interface avoids generic file-manager and dashboard aesthetics.
- [ ] The final composition feels cohesive and professionally designed.

## 4. Navigation

### ALB-001 — My Album Entry

Given a guest selects My album from an existing supported entry point,

Then:

- The correct personal collection is displayed.
- Existing guest identity is preserved.
- Existing photographs remain available.
- Existing upload operations remain consistent.
- The guest can navigate back to other application destinations.

### ALB-002 — Primary Destination

- [ ] My album behaves consistently with other primary application destinations.
- [ ] The presentation avoids unnecessary nested modal scrolling.
- [ ] Essential application navigation remains accessible.
- [ ] Existing routes and supported entry points remain functional.

### ALB-003 — Dedicated Page Route

Classification: Conditional.

If implemented:

- [ ] My album uses a dedicated page-level presentation.
- [ ] Shared bottom navigation remains available.
- [ ] My album is correctly identified as active.
- [ ] Browser back and forward navigation work appropriately.
- [ ] Existing deep links remain functional.
- [ ] Photo and upload state are not unintentionally reset.

If deferred, document the architecture-compatible full-screen or equivalent fallback.

### ALB-004 — Camera Review Integration

Given a guest accesses photograph review from the camera,

Then:

- The existing reviewable collection remains available.
- Existing review and submission behaviour remains functional.
- Returning to the camera remains possible.
- Unsent photographs are preserved.
- Selected film look and photo allowance follow existing session rules.

### ALB-005 — Upload Status Entry

Classification: Conditional.

Where supported, selecting an upload-related action on Home should open My album with the Uploads tab selected.

If deferred, the guest must still have a clear and reliable route to upload management.

## 5. Guest Identity

### ALB-006 — Personal Collection Integrity

Given an identified guest accesses My album,

Then:

- Displayed personal photographs correspond to the correct guest.
- Existing upload records correspond to the correct guest.
- Remaining allowance corresponds to the correct guest.
- Contributions from other events are not exposed.

### ALB-007 — Returning Guest

Given an existing valid guest session is available,

Then:

- Existing identity is reused.
- Unnecessary repeated name entry is avoided.
- Existing personal contributions remain accessible.
- Existing photo allowance remains consistent.

### ALB-008 — Guest Details

Classification: Conditional.

If a guest-details control is implemented:

- [ ] Displayed initials and name reflect actual identity.
- [ ] Existing name-editing restrictions remain enforced.
- [ ] Identity changes do not bypass quota rules.
- [ ] Identity changes do not expose another guest's personal collection.
- [ ] No unnecessary registration or account architecture is introduced.

## 6. Photo Allowance and Contribution Actions

### ALB-009 — Allowance Accuracy

- [ ] Remaining allowance reflects authoritative application state.
- [ ] Configured limits are not hardcoded.
- [ ] Reserved and consumed allowance follow existing business rules.
- [ ] Remaining allowance does not become negative.
- [ ] Allowance remains consistent with Home and Camera.
- [ ] Shared-photo counts are not incorrectly derived from allowance consumption.

### ALB-010 — Take a Photo

Given the guest is eligible to capture another photograph,

When Take a photo is selected,

Then the existing camera experience opens and existing guest identity, quota and capture rules remain functional.

### ALB-011 — Add Photos

Given the guest is eligible to add photographs,

When Add photos is selected,

Then:

- The existing supported photo-selection mechanism opens.
- Existing multiple-selection support remains functional.
- Existing file validation remains enforced.
- Existing quota restrictions remain enforced.
- Existing review and submission rules remain functional.

### ALB-012 — Exhausted Allowance

Given no additional photo allowance remains,

Then:

- The displayed allowance is accurate.
- Additional photo contributions are prevented according to existing rules.
- Existing photographs remain accessible.
- Existing review functionality remains available.
- Existing eligible retries remain available.
- Existing upload management remains functional.

## 7. Content Tabs

### ALB-013 — Default Tab

When My album is opened without a specific content destination,

Then Photos is selected by default.

### ALB-014 — Content Switching

Given My album is open,

When the guest switches between Photos and Uploads,

Then:

- The selected content is displayed.
- The selected tab is accurately represented.
- Active upload operations are not unintentionally restarted.
- Existing local photographs are not discarded.
- Guest identity remains consistent.

### ALB-015 — Upload Badge

Where an unresolved-item badge is displayed:

- [ ] The count accurately reflects its defined collection.
- [ ] Completed historical jobs are not incorrectly included.
- [ ] The count updates when relevant states change.
- [ ] The count is not fabricated.
- [ ] Local drafts are not misleadingly represented as failed uploads.

## 8. Personal Photo Collection

### ALB-016 — Photo Retrieval

- [ ] Existing personal photographs load correctly.
- [ ] Existing collection semantics are preserved.
- [ ] Locally available photographs remain accessible where supported.
- [ ] Existing photo ordering is preserved unless explicitly approved otherwise.
- [ ] Existing pagination remains functional where applicable.
- [ ] Unrelated photographs are not displayed.

### ALB-017 — Logical Photo Reconciliation

Given the same logical photograph has local and remote representations,

Then:

- The collection does not unnecessarily display duplicates.
- Existing supported reconciliation rules remain functional.
- Appropriate local media is retained until the existing acknowledgement and cleanup conditions are satisfied.
- The correct contribution status is displayed.

### ALB-018 — Photo Status Accuracy

Where photo-state indicators are displayed:

- [ ] Shared photographs have confirmed shared status.
- [ ] Local drafts are distinguishable where relevant.
- [ ] Failed uploads are not represented as successfully shared.
- [ ] Active operations are not represented as failed without supporting state.
- [ ] Important status information does not depend solely on colour.

### ALB-019 — Photo Detail

Given a guest selects a photograph,

Then:

- The correct photograph opens.
- Original proportions are preserved.
- Existing permitted actions remain available.
- Actual contribution status is communicated appropriately.
- The guest can dismiss the viewer.
- Returning preserves applicable album context.

### ALB-020 — Favourites

- [ ] Existing favourite functionality remains accessible.
- [ ] Favourite state remains consistent with Gallery.
- [ ] Existing favourite persistence is preserved.
- [ ] No separate conflicting favourites mechanism is introduced.

### ALB-021 — Photo Deletion

Where deletion is supported:

- [ ] The correct photograph is affected.
- [ ] The guest understands the consequence of deletion.
- [ ] Irreversible deletion has appropriate confirmation.
- [ ] Local and remote deletion effects are not misrepresented.
- [ ] Existing quota-restoration rules remain enforced.
- [ ] Unrelated photographs remain intact.

## 9. Contextual Upload Summary

### ALB-022 — Active Upload Summary

Given active uploads exist,

Then:

- The summary is discoverable near the top of My album.
- Active counts are accurate.
- Progress reflects actual available information.
- The guest can access relevant upload details.

### ALB-023 — Failed Upload Summary

Given actionable failed uploads exist,

Then:

- Failures are discoverable without scrolling through the full photo collection.
- Failure counts are accurate.
- Recovery options remain accessible.
- Failed contributions are not misleadingly described as shared.

### ALB-024 — Local Draft Summary

Given photographs are locally saved but not submitted,

Then:

- They are not incorrectly classified as failed uploads.
- Appropriate review or submission functionality remains accessible.
- Their actual persistence state is communicated accurately.

### ALB-025 — Mixed Upload Summary

Given multiple relevant states coexist,

Then active, waiting, unsubmitted and failed contributions are distinguished as appropriate.

The summary does not obscure which contributions require guest intervention.

### ALB-026 — No Unresolved Contributions

Given no relevant unresolved contributions exist,

Then:

- An unnecessary persistent status container is not displayed.
- No fabricated pending count is displayed.
- The surrounding page remains visually balanced.

## 10. Upload Management

### ALB-027 — Compact Upload Rows

- [ ] Upload entries use a compact presentation.
- [ ] Each entry has an understandable identity.
- [ ] Each entry communicates its actual status.
- [ ] Relevant recovery controls remain accessible.
- [ ] Large redundant borders and unused vertical space are removed.
- [ ] Longer messages can wrap without clipping.

### ALB-028 — Upload Thumbnails

Classification: Conditional.

If implemented:

- [ ] Each thumbnail corresponds to the correct photograph.
- [ ] Missing thumbnails use a neutral placeholder.
- [ ] No unrelated photograph is displayed.
- [ ] Thumbnail rendering avoids unnecessary full-resolution processing.
- [ ] Temporary resources are managed appropriately.

### ALB-029 — Checking Photo Investigation

The existing repeated Checking photo state accompanied by Retry upload must be investigated.

Acceptance requires:

- [ ] The actual internal state and operation are identified where possible.
- [ ] Diagnostic evidence is collected.
- [ ] The reason Retry upload is displayed is understood.
- [ ] Stale or inconsistent states are investigated.
- [ ] Confirmed defects are resolved or explicitly escalated.
- [ ] Active processing is distinguished from recoverable failure.
- [ ] Legitimate reconciliation behaviour is preserved.
- [ ] Duplicate operations are prevented.
- [ ] The guest receives accurate and understandable feedback.

Changing the displayed label or hiding the existing progress bar is not sufficient evidence that an underlying defect has been resolved.

### ALB-030 — Actual Upload Progress

Where determinate progress is available:

- [ ] Displayed progress reflects actual operation data.
- [ ] Percentages are not fabricated.
- [ ] Progress updates correctly.
- [ ] Completion of transfer is not confused with confirmed publication.

### ALB-031 — Indeterminate Processing

Where reliable progress percentages are unavailable:

- [ ] Appropriate indeterminate processing feedback is displayed.
- [ ] The actual operation is represented accurately.
- [ ] A fabricated completion percentage is not displayed.
- [ ] The interface does not remain indefinitely in unexplained processing.

### ALB-032 — Successful Publication

Given the existing publication operation receives the required successful acknowledgement,

Then:

- Shared status is displayed accurately.
- The corresponding upload state updates correctly.
- Existing collection reconciliation remains functional.
- Existing quota state remains correct.
- Local media is cleaned up only according to supported persistence rules.

### ALB-033 — Failed Upload

Given an upload fails,

Then:

- The failure is communicated clearly.
- Relevant recoverability is represented accurately.
- A meaningful recovery action is available where supported.
- Existing locally saved photographs remain intact where supported.
- No false publication confirmation is displayed.
- Unrelated uploads remain functional.

### ALB-034 — Individual Retry

Given an eligible upload has failed,

When Retry is selected,

Then:

- The correct upload is retried.
- Existing retry logic is reused.
- Duplicate active operations are prevented.
- The contribution is not unnecessarily duplicated.
- Quota remains consistent with existing retry rules.
- Status updates accurately.

### ALB-035 — Retry All

Classification: Conditional.

If implemented:

- [ ] Only eligible failed or interrupted jobs are retried.
- [ ] Completed jobs are not retried.
- [ ] Active jobs are not duplicated.
- [ ] Unsubmitted local drafts are not automatically published.
- [ ] Existing concurrency limits remain enforced.
- [ ] Existing quota rules remain intact.
- [ ] Failed retries receive appropriate feedback.
- [ ] The action does not create duplicate shared contributions.

If deferred, individual retries remain available.

### ALB-036 — Offline and Interrupted Uploads

Given connectivity is interrupted,

Then:

- Existing operations transition according to supported behaviour.
- Guest-facing feedback reflects the actual state.
- Existing local persistence remains functional.
- Supported recovery mechanisms remain available.
- Background upload capabilities are not misrepresented.
- The application does not falsely claim successful publication.

### ALB-037 — Missing Local Media

Given an unresolved upload no longer has access to its required local media,

Then:

- The application does not falsely claim that the photograph is safely stored.
- The guest receives accurate feedback.
- Unsupported retry actions are not misleadingly presented.
- Existing supported recovery or re-selection options remain available.
- Other valid photographs remain intact.

### ALB-038 — Local Draft Publication

Given an unsubmitted locally saved photograph exists,

Then:

- The photograph remains accessible through its supported review flow.
- Existing publication consent remains enforced.
- Opening My album does not automatically publish it.
- Retrying unrelated failed uploads does not automatically publish it.
- Existing visibility and quota rules remain intact.

### ALB-039 — Shared Upload State

- [ ] Home and My album communicate consistent upload information.
- [ ] Camera review remains consistent with the existing queue.
- [ ] Navigation does not create duplicate upload managers.
- [ ] Navigating between tabs does not unnecessarily restart uploads.
- [ ] Persisted operations reconcile appropriately after supported interruption or resumption.

## 11. Persistence and Data Integrity

### ALB-040 — Navigation Preservation

Given valid locally saved or pending photographs exist,

When the guest navigates between Home, Gallery, Camera and My album,

Then:

- Existing supported persistence behaviour remains functional.
- Photographs are not unintentionally discarded.
- Existing upload operations remain consistent.
- Existing guest identity remains consistent.

### ALB-041 — Browser Refresh and Resume

Where supported by the existing persistence mechanism:

- [ ] Locally saved photographs remain available.
- [ ] Existing upload records remain recoverable.
- [ ] Active and interrupted operations reconcile appropriately.
- [ ] Quota information remains accurate.
- [ ] Duplicate publication is prevented.

Do not claim persistence across browser closure or storage eviction unless genuinely supported and verified.

### ALB-042 — Data Isolation

- [ ] Another guest's private photographs are not exposed.
- [ ] Another guest's local drafts are not exposed.
- [ ] Another guest's upload records are not exposed.
- [ ] Contributions from another event are not exposed.
- [ ] Existing shared and private visibility rules remain enforced.

### ALB-043 — Visibility Communication

- [ ] Publication visibility is communicated accurately.
- [ ] Shared photographs are not described as private when accessible through the album link.
- [ ] Local drafts are not represented as published.
- [ ] Existing visibility and publication consent rules remain enforced.

## 12. Loading, Empty and Error States

### ALB-044 — Empty Personal Collection

- [ ] An appropriate emotional empty state is displayed.
- [ ] Existing photo contribution actions remain available.
- [ ] No fabricated photographs are displayed.
- [ ] A retrieval failure is not incorrectly presented as an empty collection.

### ALB-045 — Empty Upload Collection

- [ ] An appropriate all-caught-up state is displayed.
- [ ] No fabricated upload activity is displayed.
- [ ] The guest can return to their personal photographs.
- [ ] Unshared drafts are not incorrectly represented as successfully published.

### ALB-046 — Retrieval Failure

- [ ] The failure is communicated clearly.
- [ ] Appropriate recovery is available where supported.
- [ ] Existing locally available photographs are preserved.
- [ ] Raw technical exceptions are not exposed.
- [ ] The application remains usable where possible.

## 13. Responsive Validation

Inspect the rendered experience at:

| Width | Suggested Height |
|---:|---:|
| 320px | 568px |
| 375px | 667px |
| 390px | 844px |
| 430px | 932px |
| 768px | 1024px |
| 1440px | 900px |

Validate both Photos and Uploads tabs.

Requirements:

- [ ] No horizontal overflow.
- [ ] No clipped text.
- [ ] No overlapping controls.
- [ ] Camera actions remain accessible.
- [ ] Photo-grid proportions remain consistent.
- [ ] Upload rows remain readable.
- [ ] Retry actions remain accessible.
- [ ] Bottom navigation does not obscure content.
- [ ] Safe-area insets are respected.
- [ ] The page scrolls naturally.
- [ ] The composition remains coherent at intermediate widths.

## 14. Accessibility

Follow the established WCAG 2.2 AA design-system requirements.

- [ ] Meaningful accessible names.
- [ ] Accessible content tabs.
- [ ] Programmatically identifiable selected states.
- [ ] Preferred minimum 44px interactive touch targets.
- [ ] Sufficient functional contrast.
- [ ] Visible keyboard focus.
- [ ] Accessible Retry actions.
- [ ] Accessible photo-status information.
- [ ] Appropriate progress semantics.
- [ ] Meaningful status announcements.
- [ ] No essential status communicated solely through colour.
- [ ] Appropriate dialog focus management.
- [ ] Reduced-motion support.
- [ ] Text scaling without loss of essential functionality.

## 15. Performance and Stability

- [ ] No duplicate upload queues are introduced.
- [ ] Existing upload concurrency remains appropriate.
- [ ] Active operations are not unnecessarily restarted.
- [ ] No unnecessary full-resolution image loading is introduced.
- [ ] Thumbnail resources are managed appropriately.
- [ ] Existing pagination remains functional.
- [ ] Existing photo browsing remains responsive.
- [ ] Upload failures do not block unrelated browsing.
- [ ] No unnecessary heavyweight dependencies are introduced.
- [ ] Existing application performance does not materially regress.

Document actual findings and measurements.

Do not fabricate performance results.

## 16. Regression Test Matrix

| Scenario | Required |
|---|---|
| My album entry from Home | Yes |
| My album entry from bottom navigation | Yes |
| Existing camera-review integration | Yes |
| First-time guest access | Yes |
| Returning guest access | Yes |
| Guest identity preservation | Yes |
| Guest data isolation | Yes |
| Personal photo retrieval | Yes |
| Photo-detail viewer | Yes |
| Existing favourites | Yes |
| Existing supported deletion | Yes |
| Photo allowance accuracy | Yes |
| Photo allowance exhaustion | Yes |
| Additional camera capture | Yes |
| Existing photo-library selection | Yes |
| Multiple photo selection | Where supported |
| Local draft preservation | Yes |
| Active upload state | Yes |
| Failed upload state | Yes |
| Mixed upload states | Yes |
| Checking photo reconciliation | Yes |
| Successful publication | Yes |
| Individual upload retry | Yes |
| Duplicate-operation prevention | Yes |
| Interrupted network connectivity | Yes |
| Missing local media | Where reproducible |
| Navigation during uploads | Yes |
| Refresh and resume | Where supported |
| Empty personal collection | Yes |
| Empty upload collection | Yes |
| Existing visibility rules | Yes |
| Retry all | If implemented |
| Guest-details sheet | If implemented |
| Upload-entry thumbnails | If implemented |

Use controlled test events, fixtures and authorised test sessions.

Do not publish or delete real wedding contributions as part of testing without an authorised mechanism.

## 17. Technical Validation

Run all applicable:

- Linting.
- Type checking.
- Unit tests.
- Integration tests.
- End-to-end tests.
- Production builds.

Verify:

- Existing repository conventions are followed.
- Existing technology stack is preserved.
- Existing guest identity remains functional.
- Existing quota mechanisms remain authoritative.
- Existing local storage remains functional.
- Existing upload mechanisms remain functional.
- Existing API contracts remain compatible.
- No conflicting upload-state architecture is introduced.
- Unrelated application modules are not unnecessarily rewritten.

Document unavailable checks and pre-existing failures.

Do not report unexecuted checks as passed.

## 18. Required Review Evidence

Collect available screenshots or equivalent rendered evidence for:

- Normal My album state.
- Photos tab with contributions.
- Uploads tab with unresolved contributions.
- Active upload.
- Failed upload.
- Mixed upload states.
- Local drafts awaiting review.
- Exhausted photo allowance.
- Empty personal collection.
- Empty upload collection.
- Photo-detail viewer.
- Narrow mobile viewport.
- Standard mobile viewport.
- Desktop viewport.

Collect functional evidence for:

- Successful upload acknowledgement.
- Individual retry.
- Duplicate-operation prevention.
- Local photograph preservation.
- Guest identity isolation.
- Quota consistency.
- Checking photo investigation.
- Interrupted connectivity recovery.
- Navigation during upload operations.

Do not fabricate screenshots or validation results.

## 19. Review Scorecard

The main agent must independently evaluate the integrated experience.

| Dimension | Weight |
|---|---:|
| Upload reliability and functional correctness | 25% |
| State integrity and photograph preservation | 20% |
| Information hierarchy and clarity | 15% |
| Mobile usability | 10% |
| Premium aesthetic | 10% |
| Design-system consistency | 10% |
| Accessibility | 5% |
| Performance | 5% |
| Total | 100% |

Rate each dimension from 0 to 10.

Weighted contribution:

Rating / 10 × dimension weight.

Target overall score: at least 90/100.

For each rating, provide supporting observations and relevant functional or visual evidence.

The score is a subjective review aid.

It must not override failed mandatory criteria or unresolved critical functionality.

## 20. Issue Severity

### Critical

Examples:

- Lost locally saved photographs.
- Duplicate publication.
- Incorrect guest data isolation.
- Broken upload or retry functionality.
- Quota bypass.
- Unintended publication of local drafts.
- Unauthorised photograph deletion.
- Significant persistence regression.

Critical issues block release.

### Major

Examples:

- Uploads remain indefinitely stuck.
- Successful and failed operations are materially misrepresented.
- Guests cannot discover unresolved contributions.
- Personal photographs are inaccessible.
- Existing photo review is broken.
- Essential mobile controls are inaccessible.
- Material deviation from the approved design direction.

Major issues must be resolved before acceptance.

### Minor

Examples:

- Localised spacing inconsistencies.
- Minor visual alignment issues.
- Non-essential animation refinements.
- Small decorative differences.

Minor issues may be deferred when they do not affect mandatory criteria.

Document deferred issues.

## 21. Review and Refinement

The main agent must:

1. Inspect the existing My album architecture.
2. Understand the authoritative contribution and upload-state model.
3. Establish shared component contracts.
4. Delegate focused implementation tasks.
5. Review and integrate completed work.
6. Inspect the actual rendered experience.
7. Validate photo preservation and upload functionality.
8. Investigate the reported Checking photo behaviour.
9. Record visual and functional deficiencies.
10. Delegate targeted corrections.
11. Reinspect the corrected implementation.
12. Repeat relevant regression checks.
13. Confirm mandatory acceptance criteria are satisfied.

Do not approve solely because the interface looks improved or automated tests pass.

## 22. Release Gate

My album is ready for unconditional release only when:

- [ ] Mandatory acceptance criteria are satisfied.
- [ ] No unresolved critical issues remain.
- [ ] No unresolved major issues remain.
- [ ] Existing personal photographs remain accessible.
- [ ] Existing local photograph persistence remains intact.
- [ ] Upload states are accurate.
- [ ] Existing retry mechanisms remain functional.
- [ ] Duplicate publication is prevented.
- [ ] Existing quota enforcement remains intact.
- [ ] Existing guest isolation remains intact.
- [ ] Existing review functionality remains intact.
- [ ] The Checking photo behaviour has been investigated.
- [ ] Confirmed material underlying defects are resolved.
- [ ] The rendered experience has undergone visual review.
- [ ] Applicable technical validation has passed.
- [ ] Deferred requirements have appropriate fallbacks.

Unverified critical persistence or upload functionality prevents unconditional release approval.

## 23. Final Delivery Report

The main agent must provide:

1. Executive summary.
2. Implemented My album improvements.
3. Changed files and components.
4. Visual review screenshots.
5. Weighted review scorecard.
6. Personal-photo retrieval and persistence findings.
7. Checking photo investigation findings.
8. Upload-state mapping.
9. Upload and retry validation.
10. Duplicate-operation prevention findings.
11. Guest identity and quota validation.
12. Responsive and accessibility results.
13. Technical validation results.
14. Existing functionality preserved.
15. Sub-agent model selection.
16. Justified model escalations.
17. Deferred requirements and functional fallbacks.
18. Remaining limitations.
19. Final release-readiness assessment.

The main agent remains accountable for final design quality, photograph preservation and upload reliability.