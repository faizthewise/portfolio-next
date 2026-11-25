# Wedding Memories — Design System

## 1. Purpose

This document defines the visual design system for the Wedding Memories application redesign.

All implementation workstreams must follow this design system to ensure a cohesive and consistent visual experience.

The design system should be implemented using the application's existing styling architecture and technology stack.

Reuse existing design tokens and components where appropriate. Do not introduce a separate styling framework or component library unnecessarily.

## 2. Visual Foundation

### Design Direction

Modern Botanical Editorial.

The visual system combines romantic wedding branding with contemporary mobile interface design.

The interface must feel elegant, warm, restrained and thoughtfully composed.

Visual consistency is more important than introducing unique styling for individual sections.

## 3. Colour System

### 3.1 Core Colour Tokens

| Token | Name | Hex Value |
|---|---|---|
| color.background | Warm Ivory | #FAF8F3 |
| color.surface | Porcelain | #FFFFFF |
| color.primary | Deep Sage | #405B46 |
| color.primary.hover | Dark Sage | #354C3A |
| color.primary.pressed | Forest Sage | #2D4232 |
| color.brand | Botanical Green | #60775E |
| color.surface.secondary | Soft Sage | #EDF0E7 |
| color.surface.warm | Warm Linen | #F1ECE2 |
| color.text.primary | Forest Ink | #34483A |
| color.text.secondary | Muted Olive | #637064 |
| color.text.onPrimary | White | #FFFFFF |
| color.accent | Champagne Gold | #B29B76 |
| color.border | Warm Stone | #DFDFD5 |
| color.border.strong | Muted Sage Border | #B8C1B3 |

These colours establish the proposed visual direction.

The main agent may refine individual values during technical discovery to better match existing wedding invitation assets or satisfy accessibility requirements.

Once approved, all implementation agents must use the same final colour tokens.

### 3.2 Semantic Status Colours

| Token | Hex Value | Usage |
|---|---|---|
| color.success | #406746 | Successful operations |
| color.success.surface | #E8F0E7 | Success backgrounds |
| color.warning | #80601D | Pending or interrupted operations |
| color.warning.surface | #F5EFE0 | Warning backgrounds |
| color.error | #A04444 | Errors and failed operations |
| color.error.surface | #F8ECE9 | Error backgrounds |

Status colours should be applied sparingly and only when functionally meaningful.

Do not use colour alone to communicate status.

Always accompany important statuses with readable text and, where appropriate, an icon.

### 3.3 Colour Usage

Warm Ivory:
- Primary application background.
- Bottom navigation background.
- General page surfaces.

Deep Sage:
- Primary buttons.
- Active navigation states.
- Important interactive elements.

Botanical Green:
- Wedding branding.
- Floral accents.
- Decorative details.
- Photo allowance indicator.

Soft Sage:
- Secondary contribution cards.
- Subtle section highlights.
- Non-dominant interactive surfaces.

Forest Ink:
- Primary content.
- Editorial headings.
- Functional labels.

Muted Olive:
- Supporting descriptions.
- Secondary metadata.
- Helper text.

Champagne Gold:
- Small ornamental details.
- Wedding monogram accents.
- Decorative dividers.

Do not use Champagne Gold for essential small text unless the resulting contrast satisfies accessibility requirements.

Avoid:
- Large gold surfaces.
- Metallic gradients.
- Highly saturated colours.
- Excessive colour variation between components.
- Decorative colour usage that creates visual competition with primary actions.

## 4. Typography

### 4.1 Typography Roles

Use three distinct typography roles.

#### Signature Typography

Purpose:
- Couple's names.
- Wedding monogram.
- Selected wedding branding elements.

Font:
- Existing wedding invitation calligraphic font.

Requirements:
- Reuse the existing wedding signature typeface wherever possible.
- Do not introduce a different decorative script without a compelling reason.
- Do not use calligraphy for functional text, buttons or form labels.

#### Editorial Typography

Purpose:
- Hero headings.
- Section headings.
- Selected emotional or editorial copy.

Preferred font:
- Cormorant Garamond.
- Alternatively, an appropriate existing invitation serif typeface.

The main agent should select one editorial typeface during discovery and establish it as a shared design token.

#### Functional Typography

Purpose:
- Body text.
- Buttons.
- Form labels.
- Inputs.
- Navigation.
- Status messages.
- Supporting information.

Preferred font:
- DM Sans.
- Alternatively, a suitable existing sans-serif typeface.

Functional text should feel clear, contemporary and highly legible.

Do not introduce additional fonts when existing typefaces can achieve the intended visual result.

### 4.2 Typography Scale

| Token | Size | Line Height | Weight |
|---|---:|---:|---:|
| text.signature | 36–44px | 1.2 | Existing font default |
| text.hero | 30px | 1.15 | 500 |
| text.section | 24–26px | 1.2 | 500–600 |
| text.card.title | 15px | 1.4 | 600 |
| text.body | 15px | 1.5 | 400 |
| text.body.small | 14px | 1.5 | 400 |
| text.button.primary | 16px | 1.25 | 600 |
| text.button.secondary | 15px | 1.3 | 500 |
| text.input | 16px | 1.5 | 400 |
| text.label | 14px | 1.4 | 500 |
| text.caption | 13px | 1.45 | 400 |
| text.navigation | 12px | 1.3 | 500 |
| text.eyebrow | 10–11px | 1.4 | 500 |

Typography sizes may scale responsively using the existing design architecture.

Do not force headings or couple names onto a single line if they cannot fit comfortably on smaller screens.

### 4.3 Letter Spacing

| Usage | Letter Spacing |
|---|---|
| Wedding eyebrow | 0.20em–0.25em |
| Wedding date | 0.12em–0.18em |
| Editorial headings | Normal or slightly tightened |
| Body text | Normal |
| Buttons | Normal |
| Navigation | Normal |

Do not apply excessive letter spacing to functional content.

### 4.4 Typography Rules

- Use signature typography sparingly.
- Use editorial typography to establish emotional character and visual hierarchy.
- Use sans-serif typography for interactive and informational content.
- Maintain comfortable line heights.
- Avoid excessive font-weight variations.
- Avoid long uppercase functional text.
- Use sentence case for buttons and navigation.
- Use a minimum input font size of 16px to avoid unnecessary automatic zoom on iOS Safari.
- Allow text to resize and wrap without clipping.

## 5. Spacing System

Use a 4px-based spacing system.

| Token | Value |
|---|---:|
| space.1 | 4px |
| space.2 | 8px |
| space.3 | 12px |
| space.4 | 16px |
| space.5 | 20px |
| space.6 | 24px |
| space.7 | 28px |
| space.8 | 32px |
| space.10 | 40px |
| space.12 | 48px |
| space.16 | 64px |

### Spacing Usage

| Element | Recommended Spacing |
|---|---|
| Mobile page horizontal padding | 24px |
| Narrow mobile page padding | 16–20px |
| Section separation | 28–32px |
| Heading-to-content spacing | 12–16px |
| Heading-to-description spacing | 4–8px |
| Related control spacing | 8–12px |
| Card internal padding | 16px |
| Grid column spacing | 12px |
| Icon-to-label spacing | 8px |
| Gallery thumbnail spacing | 4–6px |

Spacing should communicate relationships between elements.

Related content should be visually grouped without requiring excessive borders.

Avoid applying large vertical margins mechanically. Preserve a compact and balanced mobile composition.

## 6. Layout System

### 6.1 Page Container

- Mobile-first single-column layout.
- Full-width background.
- Standard horizontal content padding of 24px.
- Reduce horizontal padding on narrower screens.
- Maximum primary content width of approximately 520px on larger displays.
- Centre the content container on desktop.
- Allow the document to scroll naturally.

Do not enclose the entire page within a single large bordered card.

Do not stretch mobile content across the full width of a desktop viewport.

### 6.2 Responsive Layout

| Viewport Width | Layout Behaviour |
|---|---|
| 320–359px | Compact padding and flexible text wrapping |
| 360–479px | Standard mobile layout |
| 480–767px | Centred mobile composition |
| 768px and above | Centred constrained-width layout |

The implementation may use the project's existing breakpoints where appropriate.

The visual layout must remain coherent at intermediate widths.

### 6.3 Mobile Safe Areas

Respect:

- Top and bottom safe-area insets.
- Mobile browser toolbars.
- Dynamic viewport height.
- Device notches.
- On-screen keyboards.

Fixed navigation must not obscure scrollable content.

Modal and bottom-sheet content must remain accessible when the keyboard is open.

Avoid relying on a static viewport height where browser chrome can change the available space.

## 7. Shape and Elevation

### 7.1 Border Radius

| Token | Value | Usage |
|---|---:|---|
| radius.small | 6px | Gallery thumbnails |
| radius.medium | 10px | Inputs and compact controls |
| radius.button | 12px | Standard buttons |
| radius.card | 16px | Contribution cards |
| radius.sheet | 24px | Bottom sheets |
| radius.full | 9999px | Small circular elements |

Do not make every component pill-shaped.

Use consistent border radii across related components.

### 7.2 Borders

Use 1px borders where necessary.

Preferred border colours:
- color.border
- color.border.strong

Use borders for:
- Secondary buttons.
- Inputs.
- Navigation separators.
- Subtle structural dividers.

Avoid borders around every section.

### 7.3 Shadows

The default interface should rely on colour, spacing and composition rather than shadows.

Shadows should generally be limited to:
- Bottom sheets.
- Floating elements that genuinely require elevation.
- Overlays.

Suggested soft elevation:

0 8px 24px rgba(52, 72, 58, 0.08)

Avoid heavy or highly visible shadows.

## 8. Component Design

### 8.1 Primary Button

Used for the principal action within an interaction context.

Specifications:
- Background: color.primary.
- Text: color.text.onPrimary.
- Height: minimum 56px for the home-page camera action.
- Horizontal padding: 16–20px.
- Border radius: radius.button.
- Typography: text.button.primary.
- Icon size: 22–24px.
- No heavy shadow.

Interaction states:
- Default.
- Hover, where supported.
- Pressed.
- Focus-visible.
- Loading.
- Disabled.

Primary actions must be visually distinct from secondary actions.

Avoid displaying multiple equally dominant primary buttons within the same section.

### 8.2 Secondary Button

Used for supporting actions.

Specifications:
- Background: transparent or color.surface.
- Text: color.primary.
- Border: 1px solid color.border.strong.
- Height: minimum 48px.
- Border radius: radius.button.
- Typography: text.button.secondary.
- Icon size: 20px.

The secondary button must have lower visual prominence than the primary button while remaining clearly interactive.

### 8.3 Tertiary Action

Used for low-priority navigation or supporting actions.

Specifications:
- Text: color.primary.
- Optional supporting icon.
- Transparent background.
- Minimum touch target: 44px.
- Clear hover, pressed and focus states.

Do not use low-contrast decorative text as an interactive action.

### 8.4 Contribution Card

Used for written wishes and voice messages.

Specifications:
- Background: color.surface.secondary.
- Border radius: radius.card.
- Internal padding: 16px.
- Left-aligned content.
- Icon size: 24px.
- Title: text.card.title.
- Description: text.caption.
- Entire card must be interactive.
- No heavy border or shadow.

Recommended content order:
1. Icon.
2. Title.
3. Supporting description.

Cards within the same group must maintain consistent heights, alignment and internal spacing.

Allow text to wrap naturally on narrow devices.

### 8.5 Interactive List Row

Used for lower-priority features such as Salam Kaut.

Specifications:
- Horizontal composition.
- Optional leading icon.
- Primary label.
- Optional description.
- Trailing chevron.
- Minimum height: 56px.
- Comfortable touch area.
- Minimal or no enclosing border.

Use a subtle divider where necessary.

### 8.6 Text Input

Specifications:
- Background: color.surface.
- Border: 1px solid color.border.strong.
- Border radius: radius.medium.
- Minimum height: 48px.
- Font size: minimum 16px.
- Clear persistent field label.
- Visible focus state.
- Inline validation feedback.

Do not rely on placeholder text as the only field label.

### 8.7 Bottom Sheet

Used for lightweight contextual interactions such as first-time guest identification.

Specifications:
- Background: color.background.
- Top border radius: radius.sheet.
- Content padding: 24px.
- Optional subtle drag handle.
- Clear heading.
- Supporting explanation.
- Relevant fields.
- One clearly identifiable primary action.
- Safe-area padding.

Requirements:
- Appropriate modal semantics.
- Predictable focus management.
- Keyboard compatibility.
- Accessible dismissal.
- Preservation of unsent user content.

### 8.8 Photo Allowance Indicator

The segmented indicator should evoke the limited exposures of a disposable camera.

Specifications:
- Render segments based on the configured maximum photo allowance.
- Default event allowance: 20.
- Remaining segments: color.brand.
- Consumed segments: color.border.
- Segment height: approximately 4–5px.
- Segment gap: approximately 3–4px.
- Small rounded segment edges.
- Equal segment widths where possible.

Display an accessible accompanying text value, such as:

10 shots left

The visual indicator must not be the only representation of the remaining allowance.

The indicator must reflect the existing quota state and not create a separate quota-calculation mechanism.

### 8.9 Upload Status

Use a compact and contextual status component.

Recommended composition:
- Leading status icon.
- Human-readable status title.
- Supporting details.
- Progress indicator where applicable.
- Relevant action or navigation affordance.

Use distinct presentations for:
- Active uploads.
- Successful uploads.
- Failed uploads.
- Waiting for connection.

Do not display an unnecessary empty status container when no uploads are pending.

Do not fabricate percentage progress if the existing upload mechanism only provides item-level status.

### 8.10 Gallery Preview

Specifications:
- Three-column thumbnail layout.
- Consistent aspect ratio, preferably square or 4:3.
- Object-fit cover.
- Small corner radius.
- Minimal spacing.
- Lazy loading where appropriate.
- No unnecessary borders around images.

Only show actual shared guest contributions.

Do not use stock photography as though it were genuine wedding content.

### 8.11 Bottom Navigation

Specifications:
- Three equally spaced destinations.
- Icons above labels.
- Icon size: 22–24px.
- Labels: text.navigation.
- Active state: color.primary.
- Inactive state: color.text.secondary.
- Background: color.background.
- Subtle top border.
- Safe-area padding.
- Minimum touch target: 44px.

Recommended destinations:
- Home.
- Gallery.
- My album.

The active destination should be communicated through more than colour alone, such as font weight or an appropriate visual indicator.

Avoid excessive active-state backgrounds or large pill-shaped containers.

## 9. Iconography

Reuse the application's existing icon library.

Use consistent outlined icons with a restrained stroke weight.

Recommended visual associations:

| Feature | Icon |
|---|---|
| Take a photo | Camera |
| Upload photos | Image plus or upload |
| Write a wish | Pen |
| Record a message | Microphone |
| Gallery | Images |
| My album | Album or library |
| Home | House |
| Salam Kaut | Gift |
| Uploading | Cloud upload |
| Upload success | Check circle |
| Upload failure | Cloud off or warning |
| Retry | Refresh |
| Navigation | Chevron |

Avoid mixing multiple icon styles.

Do not use emojis as substitutes for functional interface icons.

Decorative icons should not be exposed unnecessarily to assistive technologies.

## 10. Botanical Artwork

Reuse existing wedding floral assets.

Preferred placement:
- Upper corners of the wedding hero.
- Outer decorative page edges.
- Selected non-interactive branding areas.

Requirements:
- Keep illustrations visually subordinate to text.
- Preserve their original visual proportions.
- Use opacity or cropping where appropriate.
- Avoid placing detailed artwork behind functional controls.
- Avoid introducing distracting decoration behind status messages or forms.
- Avoid repeating floral motifs in every section.

Decorative artwork must not reduce text contrast or obstruct touch interactions.

## 11. Motion

Use short, subtle and purposeful transitions.

| Interaction | Duration |
|---|---:|
| Button press | 100–150ms |
| Standard state transition | 150–200ms |
| Page entrance | 200–250ms |
| Bottom-sheet transition | 200–300ms |
| Success feedback | 200–300ms |

Motion should support:
- Interaction feedback.
- Context changes.
- Status transitions.
- Visual continuity.

Avoid:
- Continuous decorative animation.
- Floating petals.
- Dramatic page transitions.
- Delayed access to primary functionality.
- Replaying lengthy entrance animations on navigation.

Respect prefers-reduced-motion.

The application must remain fully usable when animations are disabled.

## 12. Accessibility

Target WCAG 2.2 AA for the redesigned interface.

Requirements:
- Normal text contrast of at least 4.5:1.
- Large text contrast of at least 3:1.
- Applicable interactive control and graphical boundary contrast of at least 3:1.
- Visible keyboard focus states.
- Accessible names for controls.
- Semantic buttons and links.
- Minimum preferred touch target of 44 × 44 CSS pixels.
- Text wrapping without clipping.
- Meaningful status announcements.
- No reliance on colour alone.
- Appropriate modal focus management.
- Support for reduced motion.
- Support for browser text scaling.

Validate actual colour combinations rather than assuming that all palette values are accessible in every context.

## 13. Design System Implementation Rules

All implementation agents must:

- Use approved shared design tokens.
- Follow existing project conventions.
- Reuse suitable existing components.
- Avoid duplicating component styles.
- Avoid introducing competing typography systems.
- Avoid hardcoding inconsistent colours and spacing values.
- Preserve visual consistency across sections.
- Report necessary design-system deviations to the main agent.

The main agent is responsible for approving modifications to shared design decisions.

Individual implementation agents must not independently redefine the design system.