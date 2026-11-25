# Wedding Memories — Gallery Acceptance Criteria

## 1. Purpose

Define the visual, functional and technical acceptance requirements for the gallery redesign.

The main agent is responsible for independent review and final acceptance.

Implementation sub-agents are responsible for validating their assigned workstreams.

Use the completed home page, DESIGN_SYSTEM.md and GALLERY_PAGE_SPEC.md as the design references.

## 2. Visual Design

### Mandatory

- [ ] The gallery feels like a bespoke digital wedding album.
- [ ] The gallery is visually consistent with the completed home page.
- [ ] Existing wedding branding and typography are preserved.
- [ ] The wedding header is compact and restrained.
- [ ] Photographs receive greater visual prominence than interface controls.
- [ ] Content tabs have a clearly identifiable active state.
- [ ] Redundant pill-shaped navigation is removed.
- [ ] Photo filters do not unnecessarily dominate the initial viewport.
- [ ] Photo thumbnails have consistent dimensions and spacing.
- [ ] Favourite controls do not excessively obscure photographs.
- [ ] Contributor attribution remains accessible.
- [ ] Written wishes have a refined editorial presentation.
- [ ] Voice notes have a visually consistent and understandable presentation.
- [ ] Empty states encourage relevant contributions.
- [ ] Raw technical error messages are not exposed to guests.
- [ ] Existing bottom navigation remains visually consistent.
- [ ] The overall composition feels cohesive and premium.

## 3. Gallery Tabs

### GAL-001 — Default Content

Given a guest opens the gallery without a content-specific deep link,

When the gallery loads,

Then Photos is selected and the photo collection is displayed.

### GAL-002 — Content Switching

Given the gallery is open,

When the guest selects Photos, Wishes or Voice notes,

Then:

- The selected content type is displayed.
- The active tab is accurately represented.
- Other content types do not remain as additional long-page sections.
- The application does not unnecessarily reset guest identity or contribution state.

### GAL-003 — Sticky Tabs

Given the guest scrolls through gallery content,

Then the content tabs remain accessible as intended without obscuring content or causing layout overlap.

## 4. Photo Gallery

### GAL-004 — Photo Retrieval

- [ ] Existing shared photographs load correctly.
- [ ] Only photographs belonging to the current event are displayed.
- [ ] Existing visibility rules are enforced.
- [ ] Existing configured ordering is preserved.
- [ ] Existing pagination or incremental loading remains functional.
- [ ] Thumbnail loading does not unnecessarily retrieve full-resolution images.

### GAL-005 — Photo Filters

Given a guest selects an existing supported filter,

Then:

- All photos returns the appropriate shared collection.
- My photos returns the appropriate personal subset.
- Favourites returns the appropriate favourite subset.
- Guest filtering returns contributions from the selected guest.
- Existing supported filter combinations remain functional.
- Active filters are understandable.
- Reset restores the default filter state.
- Empty filtered results are communicated clearly.

### GAL-006 — Filter Bottom Sheet

Classification: Conditional.

If implemented:

- [ ] Existing filters are available.
- [ ] Selected options are correctly represented.
- [ ] Applying filters updates the collection.
- [ ] Reset restores the default options.
- [ ] Dismissing without applying does not unexpectedly modify active filters.
- [ ] The sheet supports keyboard and screen-reader interaction.
- [ ] The sheet remains usable on narrow screens.

If deferred, provide a compact functional filter alternative.

### GAL-007 — Favourites

Given a guest selects the favourite control on a photograph,

Then:

- Existing favourite state updates correctly.
- Selected and unselected states are visually distinguishable.
- Existing favourite persistence is preserved.
- The photo viewer does not open unintentionally.
- Existing favourite visibility and isolation rules remain enforced.
- Failed updates receive appropriate feedback.

### GAL-008 — Photo Detail

Given a guest selects a photograph,

Then:

- The correct photograph opens.
- The original image proportions are preserved.
- Contributor attribution is accessible.
- Existing permitted actions remain available.
- The viewer can be dismissed.
- Returning to the gallery does not unexpectedly lose the active filter context.

### GAL-009 — Immersive Photo Viewer

Classification: Conditional.

If implemented:

- [ ] The viewer provides an unobstructed photo presentation.
- [ ] Close and navigation controls remain accessible.
- [ ] Mobile safe areas are respected.
- [ ] Supported swipe navigation works correctly.
- [ ] Applicable browser back behaviour works correctly.
- [ ] Returning to the gallery restores the previous scroll position.
- [ ] Applicable favourite controls remain functional.
- [ ] Sharing or downloading is available only where supported and permitted.

### GAL-010 — Photo Empty States

- [ ] An empty shared collection displays a relevant contribution invitation.
- [ ] Empty favourites display an appropriate explanation.
- [ ] Empty filtered results provide a way to clear or change filters.
- [ ] No fabricated contributions are displayed.
- [ ] Retrieval failures are not incorrectly presented as empty collections.

## 5. Written Wishes

### GAL-011 — Wish Retrieval

- [ ] Existing shared wishes load correctly.
- [ ] Contributor names are accurate.
- [ ] Existing visibility rules are enforced.
- [ ] Wishes belong to the current event.
- [ ] Existing multiline content is preserved.
- [ ] Long wishes remain readable.
- [ ] Any truncation includes a way to read the complete message.

### GAL-012 — Wish Presentation

- [ ] Wishes use consistent editorial card styling.
- [ ] Text remains readable at narrow viewport widths.
- [ ] Decorative elements do not compete with the wish content.
- [ ] Contributor information is available.
- [ ] No fabricated dates, avatars or metadata are displayed.

### GAL-013 — Wish Contribution

Given a guest selects the relevant wish contribution action,

Then the existing wish creation flow opens and existing identification, validation and submission requirements remain functional.

### GAL-014 — Wish Empty and Error States

- [ ] Empty wishes encourage participation.
- [ ] Retrieval errors communicate the actual issue.
- [ ] Retry is available where supported.
- [ ] Loading does not incorrectly appear as an empty guestbook.

## 6. Voice Notes

### GAL-015 — Voice Note Retrieval

- [ ] Existing shared recordings are retrieved correctly.
- [ ] Contributor information is accurate.
- [ ] Only recordings eligible for shared visibility are displayed.
- [ ] Recordings belong to the current event.
- [ ] Audio retrieval does not unnecessarily block unrelated content.

### GAL-016 — Playback

Given a valid voice recording is available,

When the guest selects Play,

Then:

- The correct recording plays.
- Playback state is represented accurately.
- Elapsed time updates correctly.
- Duration is accurate when available.
- Pause works correctly.
- Playback can resume appropriately.
- Playback completion restores an appropriate state.

### GAL-017 — Multiple Recordings

Given one voice recording is playing,

When the guest starts another recording,

Then the previous recording pauses or stops according to the approved playback behaviour.

Multiple recordings must not play unintentionally at the same time.

### GAL-018 — Audio Seeking

Where seeking is supported:

- [ ] The guest can seek within the valid duration.
- [ ] The displayed position reflects actual playback.
- [ ] Seeking does not corrupt playback state.
- [ ] The control remains accessible.

### GAL-019 — Audio Loading

- [ ] Loading and buffering receive appropriate feedback.
- [ ] Unknown duration is not misleadingly displayed as a completed zero-length recording.
- [ ] The interface does not remain permanently stuck in a loading state.

### GAL-020 — Audio Error Investigation

The existing Blob/File object-store error and zero-duration symptom must be investigated.

Acceptance requires:

- [ ] Relevant diagnostic evidence has been collected.
- [ ] The actual cause is documented where identifiable.
- [ ] Confirmed implementation defects are resolved or explicitly escalated.
- [ ] Raw technical messages are not displayed to guests.
- [ ] Affected recordings receive contextual feedback.
- [ ] A meaningful recovery action is available where supported.
- [ ] An individual recording failure does not break unrelated recordings or tabs.
- [ ] Valid recordings are not discarded.

Do not classify the underlying audio issue as resolved solely because the error message is hidden.

If the cause cannot be established or playback cannot be verified, document the limitation and its release impact.

### GAL-021 — Audio Waveform

Classification: Optional.

If implemented:

- [ ] Waveform data represents the actual recording.
- [ ] Playback highlighting reflects actual playback position.
- [ ] Waveform generation does not introduce unacceptable performance overhead.
- [ ] The control remains accessible.

Otherwise use a functional progress bar.

### GAL-022 — Voice Note Contribution

Given a guest selects Record a message,

Then the existing voice recording flow opens and existing permission, identification and submission requirements remain functional.

### GAL-023 — Voice Empty State

An empty voice-note collection must display an appropriate invitation to record a message.

Do not present failed retrieval as an empty collection.

## 7. Privacy and Data Integrity

### Mandatory

- [ ] Existing shared contribution visibility rules remain enforced.
- [ ] Private contributions are not exposed in the shared gallery.
- [ ] Contributions from other events are not exposed.
- [ ] Existing guest isolation rules remain enforced.
- [ ] Favourite state retains its intended visibility.
- [ ] Pending uploads are not presented as successfully shared unless allowed by existing rules.
- [ ] Visibility copy accurately reflects access through the album link.
- [ ] No misleading private-gallery claims are introduced.
- [ ] Existing media access controls remain intact.
- [ ] No fabricated content or engagement statistics are introduced.

## 8. Navigation and State Preservation

- [ ] Existing Home, Gallery and My album navigation remains functional.
- [ ] Gallery is correctly identified as the active destination.
- [ ] Existing QR-code entry remains functional.
- [ ] Existing deep links remain functional.
- [ ] Browser back and forward navigation remain functional.
- [ ] Existing guest identity persists.
- [ ] Pending contributions are not lost during navigation.
- [ ] Applicable filters are preserved when returning from photo details.
- [ ] Media playback does not continue unintentionally after leaving the relevant gallery experience.
- [ ] Fixed navigation does not obscure gallery content.

## 9. Responsive Validation

Inspect the rendered gallery at:

| Width | Suggested Height |
|---:|---:|
| 320px | 568px |
| 375px | 667px |
| 390px | 844px |
| 430px | 932px |
| 768px | 1024px |
| 1440px | 900px |

Validate all three content tabs.

Requirements:

- [ ] No horizontal overflow.
- [ ] No clipped text.
- [ ] No overlapping controls.
- [ ] Photo grids remain balanced.
- [ ] Favourite controls remain usable.
- [ ] Tab labels remain readable.
- [ ] Long wishes remain readable.
- [ ] Audio controls remain accessible.
- [ ] Sticky tabs behave correctly.
- [ ] Bottom navigation respects safe areas.
- [ ] The page remains coherent at intermediate widths.

## 10. Accessibility

Follow the existing WCAG 2.2 AA design-system requirements.

Validate:

- [ ] Meaningful accessible control names.
- [ ] Appropriate content-tab semantics.
- [ ] Accessible selected states.
- [ ] Visible keyboard focus.
- [ ] Accessible favourite controls.
- [ ] Preferred touch targets of at least 44 CSS pixels.
- [ ] Sufficient text and control contrast.
- [ ] Accessible audio playback controls.
- [ ] Appropriate modal and sheet focus management.
- [ ] Reduced-motion support.
- [ ] Text scaling without loss of essential functionality.

## 11. Performance

- [ ] The gallery does not introduce unnecessary blocking requests.
- [ ] Photo thumbnails are appropriately sized.
- [ ] Existing incremental loading remains functional.
- [ ] All full-resolution images are not eagerly loaded.
- [ ] All audio recordings are not unnecessarily downloaded in advance.
- [ ] Switching content types does not cause unnecessary repeated data retrieval.
- [ ] Image-loading failures do not break the entire grid.
- [ ] Existing scrolling performance does not materially regress.
- [ ] No unnecessary heavyweight media dependencies are introduced.

Document observed performance results without fabricating measurements.

## 12. Required Review Evidence

Collect screenshots or equivalent rendered evidence for:

- Photos tab with contributions.
- Wishes tab with contributions.
- Voice notes tab with contributions.
- Active photo filters.
- Favourites state.
- Photo detail viewer.
- Filter bottom sheet, if implemented.
- Empty photo collection.
- Empty wishes.
- Empty voice notes.
- Audio loading.
- Audio playback.
- Audio failure.
- Narrow mobile viewport.
- Standard mobile viewport.
- Desktop viewport.

Use controlled test fixtures where necessary.

Do not make destructive submissions against the live wedding event.

Do not present test-fixture content as actual guest contributions.

## 13. Technical Validation

Run all applicable:

- Linting.
- Type checking.
- Unit tests.
- Integration tests.
- End-to-end tests.
- Production builds.

Preserve existing API contracts, business logic and repository conventions.

Distinguish actual results from assumptions and unexecuted checks.

## 14. Review Scorecard

Evaluate the integrated gallery using the following dimensions.

| Dimension | Weight |
|---|---:|
| Functional correctness | 25% |
| Content presentation | 15% |
| Navigation and discoverability | 15% |
| Premium aesthetic | 15% |
| Mobile usability | 10% |
| Design-system consistency | 10% |
| Accessibility | 5% |
| Performance | 5% |

Rate each dimension from 0 to 10.

Calculate the weighted score using:

Rating / 10 × dimension weight.

Target score: at least 90/100.

Provide specific evidence supporting each rating.

The score is subjective and must not override failed mandatory criteria.

## 15. Release Gate

The gallery redesign is ready for release only when:

- Mandatory acceptance criteria are satisfied.
- No unresolved critical issues remain.
- No unresolved major issues remain.
- Photo browsing and existing filters are functional.
- Existing favourite functionality is preserved.
- Written wishes remain functional.
- Voice playback is validated or any unresolved issue is accurately classified.
- Existing visibility and data-isolation rules remain enforced.
- The rendered design has undergone visual review.
- Applicable technical checks have passed.
- Deferred enhancements have appropriate fallbacks.

Unverified critical functionality prevents an unconditional release-ready assessment.

## 16. Final Delivery Report

The main agent must provide:

1. Executive summary.
2. Implemented gallery improvements.
3. Changed components and files.
4. Visual review screenshots.
5. Weighted review scorecard.
6. Functional testing results.
7. Audio-error investigation findings.
8. Technical validation results.
9. Existing functionality preserved.
10. Deferred requirements and limitations.
11. Sub-agent model selection and any justified escalations.
12. Final release-readiness assessment.

Do not approve the redesign solely because the code compiles or the implementation sub-agents report completion.

The main agent remains accountable for final visual and functional quality.