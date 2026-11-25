 # Wedding Memories — My Album Page Specification

## 1. Objective

Redesign the existing My album experience into a premium, mobile-first personal wedding camera roll with integrated upload management.

The experience must enable guests to:

- View their personal photographs.
- Understand which memories have been shared.
- Access photographs awaiting review or submission.
- Manage pending and failed uploads.
- Capture additional photographs.
- Add photographs from their device.
- Understand their remaining photo allowance.

The redesign must prioritise guest confidence, photo preservation, upload reliability and visual consistency with the completed Home, Gallery and Camera experiences.

## 2. Source of Truth

Review and follow:

- DESIGN_BRIEF.md.
- DESIGN_SYSTEM.md.
- HOME_PAGE_SPEC.md.
- GALLERY_PAGE_SPEC.md.
- CAMERA_PAGE_SPEC.md.
- Existing completed application implementations.
- Supplied My album screenshots.
- Existing repository conventions.

Reuse actual implemented design tokens, components, typography, icons and navigation patterns.

Do not independently redefine the design system.

## 3. Design Direction

### Personal Wedding Camera Roll

The experience should combine:

- The familiarity of a native smartphone photo library.
- The warmth of a personal wedding photography album.
- Clear and trustworthy upload-management interactions.

The desired visual characteristics are:

- Personal.
- Premium.
- Calm.
- Minimal.
- Reassuring.
- Intuitive.
- Photography-led.

My album should not feel like a technical file manager, administrative dashboard or generic upload utility.

The interface should prioritise the guest's photographs while providing immediate visibility of any unresolved contribution issues.

## 4. Technical Discovery

Before implementation, inspect:

- Existing My album components and entry points.
- Existing modal or bottom-sheet architecture.
- Shared application navigation.
- Existing personal-photo retrieval.
- Existing camera-review experience.
- Existing guest identity and persistence.
- Existing photo allowance calculation.
- Existing local photograph storage.
- Existing photo-library selection.
- Existing file validation.
- Existing upload queue.
- Existing upload-state definitions.
- Existing upload retry mechanisms.
- Existing server-side upload acknowledgement.
- Existing upload reconciliation mechanisms.
- Existing favourite functionality.
- Existing photo-detail experience.
- Existing photo deletion rules.
- Existing contribution visibility rules.
- Existing error handling.

Determine the exact meaning of:

- Captured photographs.
- Locally saved photographs.
- Photographs awaiting review.
- Photographs awaiting submission.
- Queued photographs.
- Active uploads.
- Interrupted uploads.
- Failed uploads.
- Successfully shared photographs.

Do not assume that these states are interchangeable.

Investigate the repeated “Checking photo” status accompanied by “Retry upload” shown in the supplied screenshots.

Determine whether this represents:

- A normal validation state.
- An active upload operation.
- A server-status reconciliation operation.
- An interrupted operation.
- A recoverable failure.
- Stale or inconsistent persisted state.
- Another existing application-specific condition.

The screenshots do not establish the root cause.

Use diagnostic evidence and source-code inspection to determine actual behaviour.

Do not simply rename or visually conceal a confirmed underlying defect.

## 5. Information Architecture

Organise My album into:

1. Compact personal header.
2. Camera and photo allowance summary.
3. Contextual contribution or upload-status summary.
4. Content tabs.
5. Selected tab content.
6. Contextual visibility information.
7. Existing bottom application navigation.

The primary content tabs are:

- Photos.
- Uploads.

Photos is the default tab unless the guest enters through an existing upload-related action or supported deep link.

Do not display a long photo collection followed by an unbounded list of upload cards.

## 6. Page Architecture and Navigation

### 6.1 Dedicated Page

Preferred implementation:

Convert My album from its existing large modal or bottom-sheet presentation into a dedicated guest-facing application destination.

Reuse the same application shell and navigation architecture used by Home and Gallery.

Requirements:

- My album occupies the available application viewport.
- Existing shared bottom navigation remains visible.
- My album is correctly identified as the active destination.
- The page uses the established ivory background.
- The page scrolls naturally.
- Nested modal scrolling is avoided.
- Existing guest identity remains consistent.
- Existing personal photograph state remains consistent.
- Existing upload operations are preserved.

The primary My album destination should not require a close button to return to Home.

### 6.2 Existing Contextual Entry Points

Preserve access from:

- Home.
- Shared bottom navigation.
- Existing upload-status actions.
- Camera thumbnail or review flow, where applicable.
- Existing supported routes and deep links.

Do not force every contextual camera-review interaction to use the same full-page presentation if this would disrupt the existing capture workflow.

The camera may retain its existing specialised photo-review experience.

Reuse shared data and functional logic rather than introducing separate storage or upload mechanisms.

### 6.3 Architectural Fallback

If converting My album into a dedicated route introduces substantial architectural or release risk:

- Implement an equivalent full-height or full-screen experience using the existing architecture.
- Preserve predictable navigation.
- Avoid unnecessary nested scrolling.
- Maintain access to essential application destinations.
- Document the architectural constraint and resulting experience limitation.

Do not destabilise existing photo persistence or upload operations solely to change the page presentation.

## 7. Target Composition

The following wireframe represents the intended information architecture.

```text
┌──────────────────────────────────┐
│                                  │
│  My album                   (F)  │
│  Little moments, seen through    │
│  your eyes.                      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Your camera   8 shots left │  │
│  │ ▪▪▪▪▪▪▪▪▫▫▫▫▫▫▫▫▫▫▫▫       │  │
│  │                            │  │
│  │ [Take a photo] [Add photos]│  │
│  └────────────────────────────┘  │
│                                  │
│  [Contextual upload summary  ›]  │
│                                  │
│       Photos        Uploads (3)  │
│       ━━━━━━                     │
│                                  │
│  Your memories          6 photos │
│                                  │
│  ┌────────┐┌────────┐┌────────┐  │
│  │ Photo  ││ Photo  ││ Photo  │  │
│  └────────┘└────────┘└────────┘  │
│  ┌────────┐┌────────┐┌────────┐  │
│  │ Photo  ││ Photo  ││ Photo  │  │
│  └────────┘└────────┘└────────┘  │
│                                  │
│  Visibility information          │
│                                  │
├──────────────────────────────────┤
│     Home     Gallery    My album │
└──────────────────────────────────┘
```

All displayed counts are illustrative.

Use actual application state.

## 8. Personal Header

### Content

Heading:

My album

Supporting description:

Little moments, seen through your eyes.

### Visual Requirements

- Left-aligned composition.
- Existing editorial serif typography for the heading.
- Existing functional typography for the supporting description.
- Compact spacing.
- No large wedding banner.
- No repeated wedding date.
- No oversized decorative floral artwork.
- No unnecessary enclosing border.

The guest's photographs should remain the primary visual content.

### Optional Guest Identity Control

Display a small initials avatar where suitable.

Specifications:

- Approximately 40–44px.
- Soft sage background.
- Deep sage initials.
- Use the actual existing guest name.
- Do not fabricate identity information.

Where existing functionality supports it, selecting the avatar may open a guest-details sheet.

Suggested content:

- Guest name.
- Existing supported name-editing action.
- Close or Done action.

Do not introduce new account registration or identity architecture.

Do not allow identity changes to bypass quota enforcement or unintentionally expose another guest's photographs.

If guest editing is unsupported, omit the interactive avatar or provide a non-interactive identity treatment.

## 9. Camera Summary

### Purpose

Provide convenient access to additional photo contribution while communicating remaining allowance.

### Composition

- Section heading.
- Remaining photo allowance.
- Shared allowance indicator, where implemented.
- Camera action.
- Photo-library action.

Heading:

Your camera

Example allowance:

8 shots left

Primary action:

Take a photo

Secondary action:

Add photos

### Visual Requirements

- Soft sage surface.
- Approximately 16px internal padding.
- Shared card radius.
- Compact composition.
- Consistent button styling.
- Camera action visually stronger than photo-library action.
- Two equal-width actions on standard mobile screens.

Allow actions to stack on narrower screens when required for legibility or accessibility.

### Functional Requirements

- Use the authoritative existing photo allowance state.
- Reuse existing allowance presentation components where suitable.
- Do not introduce a separate quota-calculation mechanism.
- Do not hardcode the allowance or remaining count.
- Preserve existing quota-consumption and restoration rules.
- Take a photo opens the existing camera.
- Add photos opens the existing photo-library selection flow.
- Preserve existing multiple-photo selection where supported.
- Preserve existing file validation.
- Preserve existing guest identity.
- Preserve existing upload restrictions.

Do not infer the number of shared photographs from the remaining photo allowance.

Locally saved photographs and pending photographs may affect quota differently from successfully shared photographs.

### Exhausted Allowance

When no allowance remains:

- Communicate the actual remaining allowance.
- Prevent new photo contributions according to existing rules.
- Preserve access to existing photographs.
- Preserve review and upload management.
- Preserve valid retries.
- Preserve existing deletion and quota-restoration behaviour.

Suggested copy:

You've captured all your moments!

Do not imply that all photographs have been shared merely because the allowance has been exhausted.

## 10. Contextual Upload Summary

### Purpose

Make unresolved contributions discoverable without requiring guests to scroll through their photograph collection.

### Placement

Immediately below the camera summary and above the content tabs.

### Behaviour

Display only when there is relevant contribution or upload information.

Selecting the summary opens or selects the Uploads tab.

The summary must use the same authoritative upload state as Home and the existing upload mechanism.

### Active Upload State

Suggested title:

Uploading your memories…

Supporting information should reflect actual progress.

Examples:

3 photos uploading

2 of 5 photos shared

Only display completed-versus-total information when an accurate batch or collection total is available.

### Failed Upload State

Suggested title:

3 photos need your attention

Supporting description:

View uploads and try again.

Use the actual actionable failure count.

### Local Draft State

Where photographs have been saved but not submitted:

Suggested title:

You have photos ready to share

Supporting action:

Review photos

Do not classify unsubmitted photographs as failed uploads.

### Waiting for Connection State

Suggested title:

Waiting for a connection

Communicate whether photographs are locally preserved only when that information is confirmed.

### Mixed States

When multiple relevant states coexist, display distinct and understandable counts.

Example:

2 uploading · 3 need attention

Do not combine active and failed uploads into an ambiguous total without explaining the distinction.

### No Unresolved Items

Hide the summary when it is unnecessary.

A recent successful completion confirmation may appear temporarily.

Do not permanently display an empty status container.

## 11. Content Tabs

Implement:

- Photos.
- Uploads.

Reuse the content-tab presentation introduced during the Gallery redesign.

### Visual Requirements

- Two evenly distributed tabs.
- Functional typography.
- Optional small outlined icons.
- Clear active-state underline.
- Consistent spacing.
- Minimum preferred 44px touch targets.
- Optional actual photo count.
- Unresolved-item count badge on Uploads when relevant.

The Uploads badge must reflect the defined unresolved collection.

Do not count completed historical jobs as unresolved uploads.

If the collection includes local drafts as well as upload jobs, clearly document the badge-count semantics.

### Behaviour

- Photos is selected by default.
- Only the selected content is displayed.
- Selecting Uploads exposes unresolved contributions and relevant upload-management controls.
- Selecting Photos restores the personal photo collection.
- Preserve applicable tab state when returning from photo details.
- Preserve applicable scroll position.
- Do not restart active uploads when switching tabs.
- Do not reinitialise the upload queue solely because the tab changes.
- Support accessible tab semantics and keyboard navigation.

Sticky positioning may be used when beneficial.

Do not allow sticky tabs to obscure content or excessively reduce usable viewport space.

## 12. Photos Tab

### Purpose

Provide an intuitive personal photo-browsing experience.

### Section Heading

Your memories

Optional supporting count:

6 photos

Use the actual collection count.

Do not imply that a loaded subset represents the complete collection when the total is unavailable.

### Collection Semantics

Inspect the existing personal-photo collection before implementation.

If it includes only successfully shared photographs, label it appropriately.

If it includes both shared and locally saved photographs, clearly distinguish their states.

Do not silently redefine which photographs belong in My album.

Do not duplicate the same logical photograph unnecessarily because both a local and remote record exist.

Use existing supported identifiers and reconciliation rules.

### Photo Grid

Reuse the established Gallery photo-grid component where appropriate.

Specifications:

- Three columns on standard mobile widths.
- Square thumbnail aspect ratio.
- Approximately 4–6px spacing.
- Existing gallery thumbnail radius.
- Object-fit cover for thumbnails.
- Minimal decorative framing.
- No unnecessary shadows.
- Consistent loading placeholders.

Use adaptive columns on larger screens according to existing application conventions.

### Contributor Attribution

Remove redundant guest-name overlays from every personal photograph.

Retain relevant contributor metadata in the photo-detail experience where necessary.

### Photo Status Indicators

When mixed contribution states exist, use discreet indicators.

Possible statuses:

- Shared.
- Ready to share.
- Uploading.
- Needs attention.

Only display states supported by the existing application.

Provide accessible text equivalents.

Do not rely solely on colour.

Avoid placing multiple large icons or labels over the same photograph.

If the collection contains exclusively shared photographs, avoid adding a redundant success badge to every image.

### Favourites

Preserve existing favourite functionality and persistence.

Reuse the shared Gallery favourite logic.

Favourite controls may be moved into the photo-detail viewer when appropriate, provided functionality and reasonable discoverability are preserved.

Do not introduce separate favourites state for My album.

### Photo Detail

Reuse the existing photograph viewer where suitable.

Requirements:

- Display the correct full photograph.
- Preserve original image proportions.
- Display actual applicable contribution status.
- Preserve existing supported photo actions.
- Preserve existing favourite functionality.
- Preserve existing review or sharing functionality.
- Preserve existing deletion controls where permitted.
- Preserve scroll position and selected tab when returning.
- Maintain accessible close and navigation controls.

Do not introduce new sharing, download or deletion permissions.

## 13. Uploads Tab

### Purpose

Provide a focused management experience for unresolved personal photograph contributions.

### Section Heading

Your uploads

Supporting description:

Keep track of your memories.

### Content Organisation

Group relevant entries according to their actual state.

Preferred grouping:

1. Needs attention.
2. Ready to share.
3. Uploading.
4. Waiting.

Only render groups containing actual entries.

Completed uploads may remain accessible if required by existing functionality, but should not dominate the unresolved-work view.

Do not treat unsubmitted local drafts as active uploads.

### Upload Entry Composition

Each entry should contain:

- Actual photo thumbnail where available.
- Understandable photo identifier.
- Current guest-facing status.
- Supporting details when necessary.
- Relevant action.

Preferred dimensions:

- Thumbnail: approximately 52–60px square.
- Row height: approximately 72–88px minimum, expandable for content.
- Row spacing: approximately 12px.
- Thin divider or restrained background separation.
- Functional typography.
- Comfortable touch targets.

Avoid the existing oversized individual bordered upload cards.

Do not use arbitrary photo numbering when a more reliable existing identifier or capture timestamp is available.

Do not invent capture metadata.

### Thumbnail Requirements

Use the actual photograph associated with the upload or local draft.

If unavailable, use a neutral photo placeholder.

Do not use unrelated images.

Reuse existing optimised thumbnails or object URLs where appropriate.

Avoid decoding unnecessarily large image files solely to display a small thumbnail.

Clean up temporary object URLs and resources appropriately.

### Upload Status Mapping

Inspect the existing application state model and establish an approved mapping between internal states and guest-facing presentation.

Suggested presentation:

| Actual condition | Guest-facing label |
|---|---|
| Local draft awaiting submission | Ready to share |
| Queued contribution | Waiting to upload |
| Active validation | Preparing your photo… |
| Active upload | Uploading… |
| Server reconciliation | Confirming upload… |
| Recoverable network interruption | Waiting for connection |
| Recoverable failure | Couldn't upload |
| Missing local media | Photo unavailable |
| Confirmed publication | Shared |

These are proposed presentation categories, not new business-state definitions.

Do not create unsupported states or replace the authoritative upload-state model unnecessarily.

### Validation and Checking States

Investigate the existing “Checking photo” presentation.

Requirements:

- Determine what operation is actually running.
- Identify whether the operation can remain stuck.
- Determine why Retry upload is simultaneously displayed.
- Communicate active and recoverable states accurately.
- Preserve existing valid reconciliation behaviour.
- Avoid duplicate network operations.
- Resolve confirmed defects or explicitly escalate them.

Do not introduce arbitrary timeouts that incorrectly classify successful or slow uploads as failed.

### Determinate Progress

Where actual byte-level or equivalent reliable progress is available:

- Display a slim progress bar.
- Display an accurate percentage if useful.
- Update progress from the authoritative operation.
- Communicate completed server acknowledgement separately from transferred bytes.

A progress value of 100% must not automatically imply successful publication if server processing or acknowledgement remains outstanding.

### Indeterminate Progress

Where no reliable percentage exists:

- Use a subtle loading indicator.
- Display accurate processing-state text.
- Do not fabricate a percentage.
- Do not display a static full-width grey bar that resembles completed progress.

### Failed Uploads

For a recoverable failure:

- Display clear contextual feedback.
- Show a Retry action.
- Preserve local photographs where supported.
- Communicate confirmed local persistence accurately.

Suggested title:

Couldn't upload

Suggested supporting description, only when true:

Saved on this device

If local media is unavailable, do not falsely communicate that it remains saved.

Provide appropriate recovery instructions where supported.

### Individual Retry

Use the existing retry mechanism.

Requirements:

- Retry only the selected eligible contribution.
- Prevent conflicting or duplicate operations.
- Preserve the original logical contribution identity where supported.
- Update status accurately.
- Preserve local media until appropriate acknowledgement.
- Preserve existing quota rules.

Do not reconsume photo allowance for a retry unless explicitly required by existing business logic.

### Retry All

Conditional enhancement.

Provide Retry all when multiple eligible failed uploads exist and the existing queue can safely support batch retry.

Requirements:

- Retry only eligible failed or interrupted operations.
- Do not retry successfully shared photographs.
- Do not submit local drafts without the guest's intended publication action.
- Do not duplicate active operations.
- Respect existing queue concurrency.
- Prevent duplicate publication.
- Preserve authoritative quota state.

If safe batch retry is unsupported, retain individual Retry actions.

### Local Drafts

Where captured or selected photographs require review before publication:

- Display them as ready to share.
- Provide an existing review or submission entry point.
- Preserve review, selection and deletion functionality.
- Preserve existing publication consent.
- Preserve contribution visibility rules.

Do not automatically publish photographs merely because the guest opens My album or selects Retry all.

### Offline Behaviour

Communicate actual supported offline behaviour.

Do not claim photographs will automatically upload after connectivity returns unless this behaviour exists and is verified.

Do not claim uploads continue after browser closure unless genuinely supported.

Where the page must remain open, communicate this concisely.

### Shared Upload Manager

Reuse the existing application upload mechanism.

Do not create a second upload queue for My album.

State should remain consistent across:

- Home.
- My album.
- Camera review.
- Existing upload operations.

Navigating between these destinations must not unnecessarily restart or duplicate operations.

## 14. Empty States

### No Personal Photos

Title:

Your story starts here.

Description:

Capture your first little moment from today.

Actions:

Take a photo

Add photos

Use existing supported contribution actions.

### No Unresolved Uploads

Title:

All caught up.

Description:

There are no pending uploads.

Action:

View my photos

Only display a stronger statement such as “All your memories have been shared” when the application can establish that no local drafts or unshared contributions remain.

### Loading States

- Use appropriately sized photo or upload-row placeholders.
- Preserve stable layout dimensions.
- Do not confuse loading with an empty collection.

### Retrieval Failure

Suggested title:

Couldn't load your album

Suggested supporting description:

Please try again.

Provide an appropriate retry action where supported.

Do not discard existing locally available photographs because remote retrieval failed.

Do not present a failed retrieval as an empty album.

## 15. Visibility and Privacy

Preserve existing personal-photo access and shared-gallery visibility rules.

The existing application states that anyone with the album link can view shared photographs.

Suggested copy:

Photos you share can be viewed by anyone with the album link.

Place this information in an understated location, such as beneath the photo collection.

Also preserve or provide appropriate visibility information before publication.

Do not imply that the shared gallery is restricted exclusively to invited guests unless this is actually enforced.

Do not expose:

- Another guest's private photographs.
- Another guest's local drafts.
- Another guest's upload queue.
- Another guest's private favourite state.
- Contributions belonging to another event.
- Private or unshared content outside its authorised context.

Do not alter existing access-control rules without approval.

## 16. Photo Deletion and Data Integrity

Preserve existing supported deletion functionality.

Distinguish local deletion from removal of a shared contribution where existing functionality supports both.

Communicate the actual consequence of deletion.

Do not imply that deleting a local copy removes an already shared photograph unless this is true.

Require appropriate confirmation for irreversible destructive operations.

Do not introduce unsupported deletion capabilities.

Preserve existing quota-restoration behaviour.

Do not allow deletion or retries to create inconsistent quota state.

## 17. Responsive Design

Validate at:

- 320px.
- 375px.
- 390px.
- 430px.
- 768px.
- 1440px.

Requirements:

- No horizontal overflow.
- No clipped labels.
- No overlapping controls.
- No unnecessarily oversized upload rows.
- Photo grid remains balanced.
- Camera actions remain accessible.
- Upload actions remain accessible.
- Upload states remain readable.
- Bottom navigation respects safe-area insets.
- No essential content obscured by navigation.
- Guest-details sheets accommodate the mobile keyboard.
- Desktop composition follows existing application conventions.

Avoid fixed heights that prevent longer error messages from wrapping.

## 18. Accessibility

Follow DESIGN_SYSTEM.md and its existing WCAG 2.2 AA targets.

Additional requirements:

- Accessible photo and upload-entry controls.
- Meaningful accessible names for status indicators.
- Accessible tab semantics.
- Appropriate selected-state announcements.
- Screen-reader-compatible upload feedback.
- Avoid excessive repeated live announcements during progress changes.
- Meaningful progress-bar semantics where applicable.
- Accessible Retry actions.
- Visible keyboard focus.
- Preferred minimum 44 × 44 CSS pixel touch targets.
- Sufficient functional contrast.
- Appropriate modal focus management.
- Reduced-motion support.

Do not communicate publication status or upload failure through colour alone.

## 19. Performance and Reliability

Prioritise:

- Reliable photograph preservation.
- Accurate upload state.
- Responsive photo browsing.
- Efficient thumbnail loading.
- Stable upload processing.
- Consistent state across navigation.

Avoid:

- Duplicate upload queues.
- Unbounded upload concurrency.
- Unnecessary full-resolution image decoding.
- Excessive object URL creation.
- Repeated polling without justification.
- Unnecessary upload restarts.
- Unnecessary album-data refetching.
- Unbounded completed-job rendering.
- New heavyweight dependencies.

Preserve existing supported local-persistence mechanisms.

Use appropriate cleanup for media resources, event listeners and timers.

Do not report performance improvements without supporting evidence.

## 20. Scope Exclusions

Do not introduce:

- New guest account registration.
- A separate cloud-storage architecture.
- A new upload queue.
- New photo-sharing permissions.
- New photo-deletion permissions.
- A separate favourites system.
- A complex media-management dashboard.
- New photo-editing functionality.
- Unrelated Home, Gallery or Camera redesigns.
- New wishes or voice-note management capabilities unless already part of My album.

Preserve any existing supported capabilities.

## 21. Implementation Priorities

### P0 — Mandatory

- Establish My album as a coherent primary application destination.
- Reuse the completed application design system.
- Introduce a compact personal header.
- Improve photo allowance presentation.
- Preserve camera and photo-library entry points.
- Separate photo browsing from upload management.
- Surface unresolved contribution states above the photo collection.
- Replace oversized upload cards with compact upload rows.
- Accurately differentiate local drafts, active uploads and recoverable failures.
- Investigate the existing repeated Checking photo presentation.
- Preserve existing retry functionality.
- Preserve local photograph persistence.
- Preserve quota enforcement.
- Preserve guest identity and isolation.
- Preserve existing photo-detail and review functionality.
- Preserve existing visibility rules.
- Provide appropriate loading, empty and error states.
- Maintain responsive and accessible presentation.

### P1 — Conditional Enhancements

- Dedicated page-level route where architecture supports it.
- Actual upload-entry thumbnails.
- Retry all.
- Optional guest-details sheet.
- Direct entry into Uploads from Home.
- Exact scroll-position restoration.
- Shared-photo status indicators for mixed collections.

Implement when compatible with the existing architecture and release constraints.

Document deferred enhancements and their functional fallbacks.

### P2 — Optional Enhancements

- Subtle upload-completion animations.
- Refined photo transitions.
- Additional restrained visual polish.

Do not compromise upload reliability or release stability for optional enhancements.

## 22. Implementation Constraints

Implementation sub-agents must:

- Follow approved design contracts.
- Reuse the established design system.
- Preserve existing guest identity.
- Preserve existing quota enforcement.
- Preserve existing local photographs.
- Preserve existing upload mechanisms.
- Preserve existing visibility rules.
- Avoid duplicate state-management mechanisms.
- Avoid speculative architectural changes.
- Avoid unnecessary dependencies.
- Report architectural conflicts to the main agent.

The main agent must independently review the integrated rendered experience and validate photo and upload integrity before final acceptance.

## 23. Completion

The redesign is complete only when My album provides a cohesive, premium personal-photo experience and guests can confidently understand and manage their contributions.

Successful compilation, visual improvements or hidden technical errors alone do not constitute completion.