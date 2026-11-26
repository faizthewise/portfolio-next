# Wedding Memories — Photo Styling and Viewer Specification

## 1. Objective

Enhance the existing photograph presentation and full-screen photo viewer to deliver a premium, nostalgic digital wedding film album.

All shared photographs must have a consistent wedding-specific photographic identity.

The redesign must:

- Apply the wedding film timestamp consistently.
- Display stylised photographs throughout the application.
- Provide an immersive photo-viewing experience.
- Simplify photograph downloads.
- Improve navigation between photographs.
- Preserve existing photograph integrity and functionality.

## 2. Source of Truth

Review:

- DESIGN_BRIEF.md
- DESIGN_SYSTEM.md
- GALLERY_PAGE_SPEC.md
- CAMERA_PAGE_SPEC.md
- MY_ALBUM_PAGE_SPEC.md
- Existing completed implementations.
- Supplied Gallery and photo-viewer screenshots.
- Supplied reference photograph featuring a vertical orange film timestamp.

Reuse the existing application design system, photographic processing mechanisms and component architecture.

Do not redesign unrelated application pages.

## 3. Design Direction

Premium digital wedding film album.

Combine:

- Native smartphone photo-library familiarity.
- Analogue film photography aesthetics.
- Minimal editorial design.
- Immersive photographic presentation.
- Understated wedding branding.

The photograph must remain the primary visual focus.

Avoid generic lightbox aesthetics, excessive controls, oversized buttons, decorative UI elements and unnecessary technical terminology.

## 4. Technical Discovery

Before implementation, inspect:

- Existing photograph capture pipeline.
- Existing film-look processing.
- Existing photograph-library import pipeline.
- Existing timestamp-generation functionality.
- Existing original and styled photograph representations.
- Existing thumbnail generation.
- Existing photograph metadata.
- Existing upload and storage architecture.
- Existing photograph viewer.
- Existing download-original functionality.
- Existing download-styled-photo functionality.
- Existing favourite functionality.
- Existing Gallery and My album components.

Determine why the current viewer does not consistently display the stylised photograph.

Identify whether existing styled photographs are generated:

- During capture.
- During upload.
- During server-side processing.
- During rendering.
- During download.
- Through another existing mechanism.

Reuse the existing implementation wherever suitable.

Do not introduce a second independent photographic processing pipeline unnecessarily.

## 5. Canonical Styled Photograph

Establish a consistent styled representation of each shared photograph.

The styled representation must include:

1. The photograph.
2. Its selected film look, where applicable.
3. The wedding-specific film timestamp.

The same visual treatment must be used throughout the guest-facing application.

Do not repeatedly apply film filters or timestamps to photographs that have already been processed.

Preserve the original source photograph internally according to existing storage and business rules.

Removing the original-download button does not authorise deleting original photographs.

## 6. Film Timestamp

### 6.1 Content

Use the following format:

HARISSA & FAIZ | 28 NOV 2026 12:35 PM

The displayed date and time are illustrative.

Use actual photograph metadata and event configuration.

Do not hardcode the couple names, date or time into reusable processing components.

### 6.2 Typography

Use a monospaced digital film-style typeface.

Desired characteristics:

- Vintage camera date-imprint aesthetic.
- Uppercase lettering.
- Consistent character spacing.
- Medium or bold weight.
- Compact and legible presentation.

Prefer existing suitable typefaces or lightweight bundled font assets.

Avoid generic decorative script typography for the timestamp.

### 6.3 Colour

Use warm amber-orange.

Suggested colour:

#E98A43

The main agent may refine the exact colour against the supplied photographic reference.

The timestamp should resemble an analogue camera date imprint rather than a modern graphic watermark.

Use a restrained shadow only when necessary for legibility.

Do not introduce an opaque background panel behind the timestamp.

### 6.4 Position and Orientation

- Position along the lower-left edge.
- Rotate the text 90 degrees counterclockwise.
- Text reads from bottom to top.
- Anchor the timestamp near the bottom-left corner.
- Maintain an inset of approximately 3–4% of the photograph width.
- Scale typography proportionally to the photograph dimensions.
- Maintain appropriate bottom clearance.
- Prevent clipping.
- Preserve the original photograph aspect ratio.

For portrait photographs, the timestamp should occupy approximately 45–65% of the image height where appropriate.

Adapt placement and typography for landscape and square photographs.

Do not stretch the photograph or excessively enlarge the timestamp to achieve a fixed relative length.

### 6.5 Date and Time Accuracy

Determine the authoritative photograph timestamp.

Preferred sources:

1. Reliable original capture metadata.
2. Existing camera-capture timestamp.
3. Existing contribution or import timestamp when capture metadata is unavailable.

Use the event timezone, Asia/Kuala_Lumpur, for this wedding.

Do not substitute the wedding date for the actual photograph date.

Do not use the current viewing or download time.

Do not silently represent an import or upload timestamp as the original capture time.

Where original capture time is unavailable, use an approved fallback and document its meaning.

Do not fabricate missing metadata.

### 6.6 Branding

Use the couple names as the photographic branding.

Do not add:

- Website watermarks.
- Third-party logos.
- Large decorative borders.
- Floral illustrations over photographs.
- Additional hashtag overlays.

The photographic treatment must remain understated.

## 7. Film Looks

Preserve existing film-look options and processing behaviour.

The timestamp must be applied consistently regardless of the selected film look.

Where the Original film look is selected, preserve the unfiltered photographic appearance while applying the wedding timestamp to the guest-facing styled representation.

Do not force a new film filter onto all existing photographs.

Do not apply filters twice.

Do not introduce new film presets as part of this workstream.

## 8. Gallery and My Album Integration

Display the styled photographic representation in:

- Shared Gallery thumbnails.
- Shared Gallery full-screen viewer.
- My album shared-photo thumbnails.
- My album shared-photo viewer.
- Other existing shared-photo presentation components where applicable.

Preserve existing local-draft and camera-review behaviour.

Where drafts are previewed using the selected film look, ensure the final styled result remains consistent with the intended shared photograph.

### Thumbnail Presentation

Reuse the existing three-column Gallery grid.

Preserve:

- Existing thumbnail dimensions.
- Existing grid spacing.
- Existing corner radius.
- Existing favourite controls.
- Existing loading behaviour.
- Existing filtering functionality.

Do not redesign the completed Gallery page.

The timestamp should remain visible in thumbnails where practical.

Because existing square thumbnails may crop portrait or landscape photographs, ensure the chosen thumbnail-generation approach preserves the timestamp without distorting the source photograph.

Do not switch the entire Gallery to inconsistent aspect ratios solely to accommodate the timestamp.

A thumbnail-specific representation may be used when necessary, provided the full-screen and downloaded photographs retain the approved timestamp treatment.

## 9. Full-Screen Photo Viewer

Redesign the existing viewer as an immersive, premium photographic experience.

### 9.1 Layout

Use the following structure:

1. Compact top toolbar.
2. Current photograph position.
3. Main photograph viewing area.
4. Horizontal thumbnail filmstrip.
5. Single download action.
6. Optional understated emotional footer.

The viewer should occupy the available application viewport.

Hide the regular bottom application navigation while the viewer is open.

Preserve existing browser navigation and dismissal behaviour.

### 9.2 Background

Use the existing dark Camera and photo-viewer visual language.

Suggested background:

#171B17

Use warm ivory for primary controls and muted sage-grey for secondary information.

Do not introduce floral backgrounds, gradients or decorative wedding borders into the viewer.

### 9.3 Top Toolbar

Left:

Close icon.

Centre:

Shared by [guest name]

Actual photograph date or existing supported contribution date.

Right:

Favourite icon.

Requirements:

- Compact composition.
- Approximately 20–24px visible icons.
- Minimum preferred 44px interactive touch targets.
- No oversized outlined circular close button.
- Consistent alignment.
- Accessible control names.
- Clearly distinguish selected and unselected favourite states.

Preserve existing favourite functionality and persistence.

Handle long contributor names gracefully.

### 9.4 Photograph Counter

Display the current photograph position.

Example:

1 / 6

Use the actual active collection.

The active collection must respect existing Gallery filters, personal-album context and loaded-photo availability.

Do not display a fabricated total.

Where pagination prevents an accurate total, use an appropriate alternative.

### 9.5 Main Photograph

Display the complete styled photograph.

Requirements:

- Preserve original aspect ratio.
- Use contain-based fitting.
- Do not crop important photographic content.
- Maximise the available viewing area.
- Adapt to portrait, landscape and square photographs.
- Avoid unnecessary fixed vertical spacing.
- Keep the photograph centred.
- Avoid heavy borders and shadows.
- Maintain safe separation from interactive controls.

Use dynamic viewport sizing and existing safe-area handling.

Do not allow browser chrome or viewer controls to obscure the photograph.

### 9.6 Swipe Navigation

Support horizontal swipe gestures to navigate between photographs in the active collection.

Requirements:

- Swipe left to view the next photograph.
- Swipe right to view the previous photograph.
- Preserve the active collection and filter context.
- Update the contributor information.
- Update the photograph counter.
- Update favourite state.
- Update the selected filmstrip thumbnail.
- Update the download target.
- Prevent accidental navigation during zooming.
- Handle first and last photographs predictably.

Do not require guests to close and reopen the viewer for every photograph.

Provide accessible alternative navigation for keyboard and assistive-technology users.

### 9.7 Thumbnail Filmstrip

Display a compact horizontal strip of neighbouring photographs.

Specifications:

- Approximately 40–48px thumbnail dimensions.
- Small consistent corner radius.
- Approximately 4–6px spacing.
- Clear selected-thumbnail outline.
- Horizontal scrolling.
- Automatically keep the active thumbnail visible.
- Reuse existing optimised thumbnail assets.

Selecting a thumbnail opens the corresponding photograph.

The filmstrip must not load every full-resolution photograph.

For single-photograph collections, omit the unnecessary filmstrip.

On short mobile viewports, reduce or conditionally hide the filmstrip before compromising essential photograph viewing and controls.

### 9.8 Immersive Mode

Conditional enhancement.

Tapping the photograph toggles surrounding viewer controls.

Requirements:

- Preserve photograph position.
- Provide an intuitive way to restore controls.
- Maintain an accessible dismissal mechanism.
- Do not interfere with swipe navigation.
- Do not interfere with supported zoom gestures.

### 9.9 Zoom

Preserve existing supported photograph zoom functionality.

Where technically appropriate, support:

- Pinch to zoom.
- Double-tap to zoom.
- Pan while zoomed.
- Reset zoom when navigating to another photograph.

Do not introduce gesture conflicts or disable browser accessibility unnecessarily.

## 10. Download Experience

Remove the separate guest-facing actions:

- Download original.
- Download styled photo.

Replace them with one action:

Download photo

### Visual Treatment

- Full-width primary action.
- Existing download icon.
- Warm ivory or approved light-sage surface.
- Deep sage text.
- Consistent button radius.
- Approximately 48–52px minimum height.
- Comfortable safe-area spacing.

### Functional Requirements

Selecting Download photo must download the styled photograph currently displayed.

The downloaded image must include:

- The selected film look, where applicable.
- The embedded wedding timestamp.
- The correct photograph content.
- The original aspect ratio.
- Appropriate output resolution.

The timestamp must be embedded into the exported image pixels.

Do not download a screenshot of the viewer.

Do not include viewer controls, surrounding background, favourite icons or UI elements.

Reuse the existing styled-download mechanism where suitable.

Preserve existing download permissions.

Do not delete or modify stored original photographs solely because original downloading is removed from the guest interface.

### Download Feedback

Communicate relevant states:

- Preparing photo…
- Download failure with an appropriate retry action.

Prevent unintended duplicate download requests while processing.

Do not claim that a photograph has been saved to the guest's device unless this can be confirmed.

Preserve supported iOS and Android browser download behaviour.

## 11. Existing Photograph Compatibility

Existing uploaded photographs must remain accessible.

Determine how previously uploaded photographs can receive the approved styled representation.

Prefer reusing existing stored styled assets or existing processing capabilities.

If previously uploaded photographs require on-demand styling:

- Avoid repeated expensive processing.
- Reuse generated results where appropriate.
- Prevent duplicate timestamp application.
- Preserve original photographs.
- Preserve existing identifiers.
- Preserve favourites.
- Preserve guest attribution.
- Preserve contribution visibility.

Do not perform destructive bulk migrations.

Any material storage or backend architecture change requires main-agent review.

## 12. Performance

Prioritise fast photograph browsing on mobile networks.

Requirements:

- Use optimised thumbnail assets.
- Load the active photograph at appropriate resolution.
- Prefetch neighbouring photographs where beneficial.
- Avoid preloading the entire full-resolution collection.
- Avoid repeated film processing.
- Avoid unnecessary image encoding.
- Avoid excessive canvas memory usage.
- Release temporary object URLs.
- Preserve photograph quality during export.

Do not introduce heavyweight dependencies without justification.

## 13. Responsive and Accessibility Requirements

Validate at 320px, 375px, 390px, 430px, 768px and 1440px widths.

Validate short mobile viewports and landscape orientation.

Requirements:

- No horizontal overflow.
- No clipped controls.
- No overlapping photograph and toolbar.
- No inaccessible download action.
- Accessible close and favourite actions.
- Accessible previous and next navigation.
- Visible keyboard focus.
- Appropriate modal focus management.
- Screen-reader-compatible photograph position.
- Reduced-motion support.
- Preferred 44px interactive touch targets.
- Appropriate safe-area handling.

## 14. Scope Exclusions

Do not introduce:

- A complete Gallery redesign.
- A new photo-editing application.
- New film presets.
- New photo-sharing permissions.
- New storage architecture without approval.
- Destructive modification of original photographs.
- Third-party watermarks.
- Unrelated Home or Camera redesigns.

## 15. Implementation Priorities

### P0 — Mandatory

- Consistent wedding timestamp.
- Styled photograph presentation in Gallery and My album.
- Styled full-screen photograph preview.
- One styled-download action.
- Embedded timestamp in downloaded image.
- Original photograph preservation.
- Compact viewer toolbar.
- Adaptive photograph sizing.
- Swipe navigation.
- Accurate photograph counter where available.
- Existing favourite functionality.
- Existing guest attribution.
- Existing collection context.
- Responsive and accessible viewer.

### P1 — Enhancements

- Thumbnail filmstrip.
- Immersive control-hiding mode.
- Enhanced zoom interactions.
- Neighbouring photograph prefetching.
- Refined photograph transitions.

Prioritise photograph integrity and release stability over optional enhancements.

## 16. Completion

The redesign is successful when the photograph displayed in the viewer is visually consistent with the photograph downloaded by the guest.

Guests should experience a coherent wedding film album rather than separate original, preview and styled-photo experiences.