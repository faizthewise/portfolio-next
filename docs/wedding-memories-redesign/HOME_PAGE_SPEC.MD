# Wedding Memories — Home Page Specification

## 1. Objective

Redesign the guest-facing Wedding Memories home page according to the DESIGN_BRIEF.md and DESIGN_SYSTEM.md.

The home page must provide a clear and intuitive entry point for capturing photographs, sharing memories, leaving personal messages and exploring contributions from other wedding guests.

Preserve existing business logic and functional capabilities.

## 2. Reference Materials

- DESIGN_BRIEF.md
- DESIGN_SYSTEM.md
- ACCEPTANCE_CRITERIA.md
- Existing application screenshot.
- Existing wedding invitation and branding assets.
- Target design reference, if available.
- Existing repository conventions.

Wedding invitation:

https://www.faizhasnul.com/jemputan-walimatulurus-harissa-faiz

## 3. Information Architecture

Arrange the home page in the following order:

1. Wedding hero.
2. Camera and photo-sharing section.
3. Contextual upload status, when applicable.
4. Personal messages section.
5. Shared gallery section.
6. Salam Kaut section.
7. Closing message.
8. Bottom navigation.

Do not enclose the entire page within one large decorative card.

The page should use a continuous ivory background, distinct content sections and consistent spacing.

The most important functional actions should appear within or close to the initial mobile viewport.

## 4. Target Page Composition

The following wireframe describes the intended information architecture and visual hierarchy.

```text
┌───────────────────────────────────┐
│                                   │
│          THE WEDDING OF           │
│                                   │
│          Harissa & Faiz           │
│                                   │
│         28 NOVEMBER 2026          │
│               ───                 │
│                                   │
│         Through your eyes         │
│    Capture the little moments     │
│  and make them part of our forever│
│                                   │
│  ───────────────────────────────  │
│                                   │
│  Your camera        10 shots left │
│  ▪▪▪▪▪▪▪▪▪▪▫▫▫▫▫▫▫▫▫▫            │
│                                   │
│  ┌─────────────────────────────┐  │
│  │       Take a photo          │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │       Upload photos         │  │
│  └─────────────────────────────┘  │
│                                   │
│  [Contextual upload status]       │
│                                   │
│  Leave us a little love           │
│                                   │
│  ┌──────────────┐ ┌────────────┐ │
│  │ Pen icon     │ │ Mic icon   │ │
│  │              │ │            │ │
│  │ Write a wish │ │ Record a   │ │
│  │ A few heart- │ │ message    │ │
│  │ felt words   │ │            │ │
│  └──────────────┘ └────────────┘ │
│                                   │
│  Our day, together                │
│  Memories through everyone's eyes│
│                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐│
│  │ Photo  │ │ Photo  │ │ Photo  ││
│  └────────┘ └────────┘ └────────┘│
│                                   │
│       Explore the gallery →       │
│                                   │
│  ───────────────────────────────  │
│                                   │
│  Gift   Salam Kaut              › │
│         A little blessing for     │
│         our new beginning.        │
│                                   │
│      With love, Harissa & Faiz     │
│                                   │
├───────────────────────────────────┤
│     Home       Gallery    My album│
└───────────────────────────────────┘
```

The wireframe represents structural intent rather than pixel-perfect dimensions.

Use professional judgement to achieve the intended composition while following the shared design system.

## 5. Section 1 — Wedding Hero

### Purpose

Establish the wedding identity and immediately communicate the emotional purpose of the application.

The hero should not replicate a full wedding invitation.

### Content

Eyebrow:

THE WEDDING OF

Signature heading:

Harissa & Faiz

Event date:

28 NOVEMBER 2026

Editorial heading:

Through your eyes

Supporting description:

Capture the little moments and make them part of our forever.

### Visual Requirements

- Centre-aligned composition.
- Existing wedding calligraphy for the couple's names.
- Editorial serif for the emotional heading.
- Sans-serif for supporting descriptions.
- Small letter-spaced typography for eyebrow and date.
- Optional subtle ornamental divider.
- Existing floral artwork positioned around the upper corners or outer edges.
- No large enclosing border.
- No heavy card background.
- No oversized decorative elements.

Target hero height: approximately 200–230 CSS pixels at standard mobile widths.

Treat this height as a design target rather than a fixed constraint. Allow content to expand naturally on narrow screens or with enlarged text.

### Data Requirements

Retrieve the couple's names and wedding date from existing event configuration where available.

Do not hardcode Harissa & Faiz or the event date into a reusable page component.

The venue is not required within the primary hero.

Retain event venue information elsewhere if it is necessary for existing application functionality.

### Acceptance Intent

The hero should communicate the wedding identity without delaying access to the primary action.

## 6. Section 2 — Camera and Photo Sharing

### Purpose

Provide the application's primary contribution experience.

The camera should be the most visually prominent action on the home page.

### 6.1 Section Header

Left-aligned heading:

Your camera

Right-aligned supporting text:

10 shots left

The displayed quantity must reflect the actual remaining photo allowance.

The layout must accommodate smaller screens and varying text lengths.

### 6.2 Segmented Photo Allowance

Introduce a film-inspired segmented allowance indicator.

Requirements:
- One segment per configured photo allowance unit, where practical.
- Filled sage segments represent remaining available photos.
- Muted neutral segments represent consumed allowance.
- Update the indicator when the underlying allowance changes.
- Include a readable textual representation.
- Remove the redundant “10 of 20 used” counter.

Use the application's existing authoritative quota state.

Do not independently redefine when an allowance unit is consumed or restored.

If pending photographs reserve quota under the existing rules, reflect that behaviour accurately.

### 6.3 Primary Camera Action

Label:

Take a photo

Icon:

Camera

Design:
- Full-width primary button.
- Deep sage background.
- White icon and label.
- Minimum height of 56px.
- Shared button radius.
- Highest visual prominence.

Behaviour:
- Invoke existing camera functionality.
- Preserve camera permissions and existing capture behaviour.
- Preserve captured photographs during subsequent contribution steps.
- Display existing permission or device errors appropriately.
- Do not introduce unrelated navigation steps.

### 6.4 Secondary Upload Action

Label:

Upload photos

Icon:

Image plus or upload.

Design:
- Full-width secondary outlined button.
- Visually subordinate to the camera action.
- Minimum height of 48px.
- Consistent spacing and alignment.

Behaviour:
- Expose existing photo-library upload functionality if available and permitted by current business rules.
- Support multiple photo selection if already compatible with the upload mechanism.
- Preserve file validation, photo limits and upload restrictions.
- Do not introduce a new photo submission method that bypasses intended disposable-camera rules.

If direct photo-library upload is unsupported or conflicts with the application's intended contribution model, retain the existing supported functionality and document the deviation.

### 6.5 Photo Allowance Exhausted

When the remaining photo allowance reaches zero:

- Display the remaining allowance accurately.
- Render the segmented indicator in its exhausted state.
- Prevent further photo submissions according to existing business rules.
- Clearly communicate why photo contribution is unavailable.
- Keep personal messages, gallery and My album accessible.
- Allow pending uploads and retries according to existing quota rules.

Suggested copy:

You've captured all 20 of your moments!

The number must reflect the configured allowance.

Do not imply that successful uploads have occurred if photographs are still pending.

### 6.6 Loading or Unavailable Allowance

While the photo allowance is loading:

- Display a suitable loading representation.
- Do not temporarily display inaccurate allowance information.
- Prevent quota-related actions only where necessary.
- Preserve access to unrelated functionality.

When allowance retrieval fails:

- Communicate the issue clearly.
- Provide recovery or retry where appropriate.
- Do not bypass quota restrictions.

## 7. Section 3 — Contextual Upload Status

### Purpose

Provide immediate, understandable feedback about photo uploads.

Replace the existing generic paragraph describing uploads in progress or ready to retry.

### Placement

Position immediately below the camera and photo-upload actions.

Do not render this section when there is no relevant upload status.

The status component must not permanently occupy unnecessary vertical space.

### 7.1 Active Uploads

Suggested title:

Uploading your memories…

Supporting information should reflect actual state.

Examples:

3 photos uploading

3 of 5 photos uploaded

Provide:
- Upload icon.
- Relevant progress representation.
- Access to My album or existing upload details.

Do not display fabricated byte-level percentages when only item-level progress is available.

### 7.2 Successful Uploads

Suggested title:

Your memories have been shared.

Supporting information:

All 5 photos uploaded successfully.

Only display success after confirmed server acknowledgement.

A successful status may dismiss automatically after an appropriate interval, provided it remains accessible long enough to be understood.

### 7.3 Failed Uploads

Suggested title:

2 photos couldn't upload.

Supporting description:

Please try again when your connection improves.

Provide:
- Clear failure indication.
- Retry action where supported.
- Access to affected contributions in My album.

Do not discard failed photographs automatically.

### 7.4 Offline or Interrupted Uploads

Suggested title:

Waiting for a connection

Supporting description:

Your photos will be ready to upload when your connection returns.

Only use this wording if the photographs are genuinely preserved and can be retried.

Where appropriate, explain whether the guest must keep the page open.

Do not claim that uploads will continue after closing the browser unless this behaviour is actually supported.

### 7.5 Mixed Upload States

Active and failed uploads may exist simultaneously.

Present each actionable state clearly.

For example:

3 photos uploading

2 photos couldn't upload — Retry

Do not merge these into an ambiguous combined status.

### 7.6 Functional Requirements

- Preserve the existing upload queue.
- Preserve existing retry behaviour.
- Maintain accurate upload status.
- Prevent duplicate submissions.
- Preserve unsent content according to the existing persistence mechanism.
- Do not introduce a separate conflicting upload-state model.

If the existing architecture cannot support a proposed recovery behaviour, identify the limitation and retain accurate communication.

## 8. Section 4 — Personal Messages

### Purpose

Group written wishes and voice recordings into a single emotionally coherent contribution area.

### Section Heading

Leave us a little love

### Layout

Two equal-width contribution cards displayed side by side on standard mobile screens.

Use flexible sizing and natural text wrapping.

On exceptionally narrow screens or with enlarged text, allow the layout to stack if necessary to preserve usability.

Both cards should have consistent visual weight.

### 8.1 Written Wish Card

Icon:

Pen

Title:

Write a wish

Description:

A few heartfelt words

Behaviour:

Open the existing wish creation experience.

### 8.2 Voice Message Card

Icon:

Microphone

Title:

Record a message

Description:

Let us hear your voice

Behaviour:

Open the existing voice recording experience.

### 8.3 Card Design

- Soft sage background.
- Left-aligned content.
- Icon positioned above the title.
- Shared contribution-card styling.
- Approximately 16px internal padding.
- Subtle or no border.
- No heavy shadow.
- Entire card is interactive.
- Consistent icon placement.
- Consistent card height within the same row.

The cards should feel welcoming and premium without competing with the primary camera action.

### 8.4 Functional Requirements

- Preserve existing wish and voice recording functionality.
- Preserve existing submission validation.
- Handle microphone permission denial using the existing supported behaviour.
- Preserve unsent content when requesting guest identification.
- Communicate contribution visibility before submission.

## 9. Section 5 — Shared Gallery

### Purpose

Encourage guests to explore memories contributed by other wedding guests and create additional motivation to participate.

### Section Heading

Our day, together

### Supporting Description

Memories through everyone's eyes.

### 9.1 Gallery Preview

Where supported by the existing data architecture, display up to three recent shared photographs.

Requirements:
- Three-column layout.
- Consistent image aspect ratios.
- Object-fit cover.
- Small corner radii.
- Minimal spacing.
- Responsive image loading.
- Use existing thumbnail assets or image optimisation where available.
- Only show contributions belonging to the current event.
- Only show contributions that are approved for shared visibility under existing rules.

Do not introduce additional large image downloads unnecessarily.

Do not expose private or pending guest contributions.

### 9.2 Gallery Action

Label:

Explore the gallery

Provide a subtle directional arrow if appropriate.

Behaviour:

Navigate to the existing shared gallery.

The gallery entry point should remain available even if the preview cannot be loaded.

### 9.3 Empty State

When no shared photographs are available:

Title:

Every memory starts somewhere.

Description:

Be the first to share a little moment from today.

Provide an appropriate path to photo contribution.

Do not show fabricated images or placeholder photographs as real contributions.

### 9.4 Loading State

Display restrained skeleton placeholders matching the thumbnail dimensions.

Do not block the camera or other home-page functionality while the gallery preview loads.

### 9.5 Error State

If the preview cannot be retrieved:

- Keep the section compact.
- Avoid displaying a large technical error.
- Preserve the gallery navigation action.

Suggested copy:

The gallery preview is temporarily unavailable.

### 9.6 Implementation Constraint

The live preview is an enhancement.

If implementation requires significant backend changes or introduces performance risks, retain the section heading, supporting description and gallery navigation action without the live preview.

## 10. Section 6 — Salam Kaut

### Purpose

Keep Salam Kaut accessible while ensuring the memories-sharing experience remains the primary focus.

### Content

Icon:

Gift

Title:

Salam Kaut

Description:

A little blessing for our new beginning.

Trailing icon:

Chevron right.

### Layout

- Understated horizontal interactive row.
- Optional warm neutral background behind the leading icon.
- Left-aligned title and description.
- Trailing chevron.
- Subtle divider where appropriate.
- No large primary-coloured button.
- No prominent decorative card.

### Behaviour

Invoke the existing Salam Kaut functionality.

Do not change existing payment, gifting or related business logic.

Do not imply that participation is mandatory.

## 11. Section 7 — Closing Message

### Content

With love, Harissa & Faiz

### Design

- Centre-aligned.
- Small editorial or restrained signature typography.
- Optional small wedding monogram or heart.
- Appropriate spacing before bottom navigation.
- No large decorative footer.

Use dynamic event names where supported by the existing event configuration.

The closing message should provide a personal finishing touch without adding significant vertical space.

## 12. Section 8 — Guest Navigation

### Purpose

Organise the application around the three primary guest destinations.

### Navigation Destinations

| Destination | Icon | Purpose |
|---|---|---|
| Home | House | Capture and contribute memories |
| Gallery | Images | View shared contributions |
| My album | Album | View personal contributions and upload status |

### Visual Requirements

- Fixed or persistent bottom navigation, where compatible with existing architecture.
- Three equally spaced navigation destinations.
- Icon above each label.
- Clearly identifiable active destination.
- Ivory background.
- Subtle top divider.
- Respect mobile safe-area insets.
- Avoid obscuring page content.

### Functional Requirements

- Navigate using existing application routes.
- Preserve deep-link behaviour.
- Preserve guest identity during navigation.
- Preserve pending uploads and existing contribution state.
- Correctly update the active navigation state.
- Support browser back and forward navigation.

### Contextual Exceptions

Bottom navigation may be hidden during immersive camera capture, voice recording, modal interactions or other flows where it would interfere with the experience.

The main agent should determine this behaviour from the existing application architecture.

### Existing Navigation

Remove the following from the primary guest-facing navigation:

- All albums.
- QR card.

Preserve access to these existing capabilities through an appropriate secondary location or organiser-facing interface where required.

Do not remove existing routes or break direct access.

Do not introduce organiser permissions or security changes without understanding the existing access model.

Remove duplicated primary navigation entries.

Contextual actions such as “Explore the gallery” and upload-status access to My album are permitted because they serve specific contextual purposes.

## 13. Guest Identification

### Objective

Reduce unnecessary friction caused by a permanently visible guest name field.

### 13.1 First-Time Guest

Preferred experience:

1. Guest scans the wedding QR code.
2. Guest immediately accesses the home page.
3. Guest selects a contribution method.
4. Guest creates or selects a contribution.
5. Guest provides their name before the first submission.
6. Guest confirms the contribution.

This flow is preferred only where compatible with the existing identity, session and quota architecture.

### 13.2 Identification Bottom Sheet

Title:

Let's make a memory.

Description:

Before you share, let us know who to thank for this little moment.

Field label:

Your name

Placeholder:

Enter your name

Primary action:

Continue

Supporting text:

You only need to do this once.

### 13.3 Requirements

- Use the existing guest identification mechanism.
- Preserve existing name validation.
- Persist identity using the existing supported mechanism.
- Preserve any contribution created before identification.
- Do not lose photographs, wishes or recordings when opening or dismissing the identification sheet.
- Maintain guest data isolation.
- Maintain existing quota enforcement.
- Do not introduce unnecessary account registration.

### 13.4 Returning Guest

- Reuse the existing persisted identity.
- Do not display the permanent name input on the home page.
- Do not repeatedly request the guest's name.
- Provide an appropriate way to view or edit the name through My album or an existing identity-management entry point, if supported.

### 13.5 Architectural Constraint

If guest identification is required before accessing camera or quota functionality:

- Preserve the required identification sequence.
- Use the least intrusive presentation compatible with the existing architecture.
- Avoid compromising data isolation or quota enforcement.
- Document the deviation from the preferred interaction flow.

Do not create a new guest identity architecture solely to achieve the proposed visual redesign.

## 14. Contribution Visibility

Before publishing a contribution, clearly communicate its intended visibility.

Suggested copy for shared contributions:

Your memories will be visible to the couple and other wedding guests.

Use wording that reflects the actual visibility rules for the relevant contribution type.

Do not imply that private content is publicly visible or that public content is private.

Preserve existing review, retake, deletion and submission controls.

## 15. Interaction and Feedback

All interactive elements must provide immediate visual feedback.

Implement appropriate:
- Pressed states.
- Focus states.
- Loading states.
- Disabled states.
- Success states.
- Error states.

Prevent accidental repeated submissions.

Use short and purposeful transitions according to DESIGN_SYSTEM.md.

Do not introduce animations that delay access to primary functionality.

## 16. Responsive Behaviour

Support at minimum the following viewport widths:

- 320px.
- 375px.
- 390px.
- 430px.
- 768px.
- 1440px.

Requirements:
- No horizontal overflow.
- No overlapping controls.
- No clipped text.
- No fixed-height text containers that prevent wrapping.
- Comfortable touch targets.
- Consistent horizontal alignment.
- Bottom navigation must not obscure content.
- Supporting content must remain readable.
- The primary camera action should be visible within the initial viewport on common mobile devices wherever practical.

On desktop, maintain a centred and restrained composition.

Do not convert the home page into a multi-column dashboard.

## 17. Performance Requirements

- Reuse existing optimised wedding assets.
- Optimise decorative asset loading.
- Avoid loading the full shared gallery on the home page.
- Load only the necessary preview thumbnails.
- Lazy-load non-essential imagery.
- Avoid blocking the primary camera action with unrelated data requests.
- Avoid unnecessary dependencies.
- Preserve existing application performance.
- Maintain usable behaviour during slow or intermittent connectivity.

## 18. Implementation Priorities

### P0 — Mandatory Redesign

- Implement the revised home-page composition.
- Remove the large enclosing card.
- Compact the wedding hero.
- Establish the shared typography hierarchy.
- Establish consistent design tokens.
- Make the camera the clear primary action.
- Group wishes and voice messages.
- Improve upload-status presentation using existing state.
- Simplify redundant navigation.
- Reposition Salam Kaut.
- Preserve all existing functionality.
- Address essential mobile accessibility and responsiveness.

### P1 — Conditional Experience Enhancements

- Deferred guest identification through a bottom sheet.
- Segmented film-style photo allowance indicator.
- Direct photo-library upload entry point.
- Fixed bottom navigation.
- Improved upload retry controls where supported.

Implement these enhancements when compatible with the existing architecture and release constraints.

Document any deferred P1 requirements and provide a functional fallback.

### P2 — Optional Premium Enhancements

- Live gallery preview.
- Refined microinteractions.
- Additional ornamental details.
- Enhanced loading transitions.
- Subtle success animations.

Do not delay or destabilise the release to complete P2 requirements.

## 19. Implementation Constraints

Implementation agents must not:

- Redefine existing business rules.
- Replace working application functionality unnecessarily.
- Introduce incompatible data contracts.
- Hardcode dynamic wedding configuration.
- Create conflicting guest identity mechanisms.
- Bypass photo allowance enforcement.
- Introduce duplicate upload queues.
- Fabricate contribution data.
- Independently redefine shared design tokens.
- Modify unrelated application modules.

Report architectural conflicts and cross-workstream dependencies to the main agent.

## 20. Completion

The home page implementation is considered complete only after the main agent has reviewed the integrated and rendered experience against:

- DESIGN_BRIEF.md
- DESIGN_SYSTEM.md
- HOME_PAGE_SPEC.md
- ACCEPTANCE_CRITERIA.md

Successful compilation alone does not constitute design completion.