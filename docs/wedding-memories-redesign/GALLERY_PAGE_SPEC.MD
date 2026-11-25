# Wedding Memories — Gallery Page Specification

## 1. Objective

Redesign the existing shared gallery page into a premium, mobile-first wedding album and digital guestbook experience.

The gallery should allow wedding guests to experience the wedding through photographs, written wishes and shared voice messages contributed by others.

The home page encourages participation. The gallery enables discovery and emotional engagement.

The gallery must feel like a curated wedding keepsake rather than a conventional media-management interface.

## 2. Source of Truth

Review and follow:

- DESIGN_BRIEF.md.
- DESIGN_SYSTEM.md.
- HOME_PAGE_SPEC.md.
- The completed home page implementation.
- Existing gallery screenshots.
- Existing wedding branding assets.
- Existing repository conventions.

The completed home page is the primary implementation reference for visual consistency.

Reuse its actual design tokens, typography, icons, shared components and navigation.

Do not independently redefine the design system.

## 3. Design Direction

Create a content-first editorial wedding album.

The desired experience should feel:

- Intimate.
- Elegant.
- Romantic.
- Premium.
- Minimal.
- Photography-led.
- Emotionally engaging.
- Intuitive.

Draw inspiration from fine-art wedding photography albums, premium guestbooks and modern mobile photo galleries.

Avoid generic social media interfaces, dashboard aesthetics, excessive borders, oversized controls and unnecessary decorations.

The contributed memories should provide the personality of the gallery.

## 4. Technical Discovery

Before implementation, inspect:

- Existing gallery routes and components.
- Existing photo retrieval and pagination.
- Existing guest attribution.
- Existing favourites behaviour and persistence.
- Existing photo filters.
- Existing guest filters.
- Existing photo detail experience.
- Existing written-wish retrieval.
- Existing voice-note retrieval and playback.
- Existing media-storage mechanisms.
- Existing visibility and access rules.
- Shared navigation introduced during the home page redesign.
- Existing loading, error and empty states.

Investigate the existing error reported in the gallery:

“Error preparing Blob/File data to be stored in object store”

Also investigate the voice recording displaying zero elapsed time and zero duration.

Do not assume these symptoms have the same root cause without evidence.

Preserve existing business rules, data contracts and security controls.

## 5. Information Architecture

Organise the gallery into:

1. Compact wedding header.
2. Sticky content-type tabs.
3. Selected content toolbar or section introduction.
4. Selected content.
5. Contextual contribution action.
6. Visibility information.
7. Existing bottom application navigation.

The gallery has three content types:

- Photos.
- Wishes.
- Voice notes.

Only the selected content type should be displayed in the main content area.

Do not retain the existing long-page composition containing all three content sections simultaneously.

Photos should be the default tab unless an existing route or deep link specifies another content type.

## 6. Wedding Header

### Content

Wedding hashtag:

Use the existing configured wedding hashtag.

Signature typography:

Use the configured couple names and existing wedding calligraphy.

Editorial heading:

Our day, together

Supporting description:

Memories through everyone's eyes.

### Visual Requirements

- Compact centred composition.
- Existing signature typography.
- Existing editorial and functional typography tokens.
- Optional restrained botanical artwork.
- Optional small ornamental divider.
- No large enclosing rectangular border.
- No oversized floral decorations.
- No unnecessary repetition of the wedding date or venue.

Target height: approximately 140–170 CSS pixels.

Allow natural expansion for narrow screens and enlarged text.

The header should scroll away naturally.

Do not make the entire header sticky.

## 7. Content-Type Tabs

Implement three content tabs:

- Photos.
- Wishes.
- Voice notes.

### Presentation

- Three evenly distributed tabs.
- Functional sans-serif typography.
- Optional small outlined icons.
- Deep sage active-state text.
- Subtle 2px active underline.
- Muted inactive-state text.
- Minimum preferred touch target of 44px.
- Consistent alignment and spacing.

Do not use three individually bordered pill buttons.

### Behaviour

- Only the selected content type is displayed.
- The active tab is visually and programmatically identifiable.
- Tabs remain accessible while scrolling.
- Sticky positioning must not obscure content.
- Selecting a tab must not reload the entire application unnecessarily.
- Retain existing supported deep-link behaviour.
- Preserve relevant tab-specific state and filters.
- Restore a sensible scroll position when switching content types.
- Preserve the photo-grid scroll position when returning from photo details.

Use appropriate accessible tab semantics and keyboard behaviour.

Do not introduce a complex routing architecture solely to support the tabs.

## 8. Photos Tab

### 8.1 Toolbar

Provide a compact toolbar containing:

- Current photo scope.
- Actual photo count, where available.
- Filter action.

Examples of photo scopes:

- All photos.
- My photos.
- Favourites.

The photo count must reflect actual application data.

Do not display invented counts or present a partially loaded page count as the total number of contributions.

If an accurate total is unavailable, omit it or label the count appropriately.

### 8.2 Filter Interaction

Consolidate existing photo-scope and guest filters into a mobile bottom sheet.

Title:

Filter photos

Photo scope options:

- All photos.
- My photos.
- Favourites.

Guest filter:

Shared by

Default guest filter:

All guests

Actions:

- Reset.
- Show photos.

Requirements:

- Reuse existing filter logic and available guest data.
- Preserve existing supported filter combinations.
- Reset must restore the existing default filter state.
- Show photos applies the selected filters.
- Dismissing without applying should not unexpectedly change active filters.
- Use existing bottom-sheet components and design tokens.
- Maintain appropriate focus management and keyboard accessibility.
- Display an understandable indicator when filters are active.
- Allow active filters to be cleared.

If consolidating filters creates unnecessary architectural risk, use an equivalent compact filter presentation.

Do not remove existing filtering functionality.

Do not introduce additional search or sorting capabilities unless already supported or explicitly approved.

### 8.3 Photo Grid

Use a consistent photo grid.

Specifications:

- Three columns at standard mobile widths.
- Approximately 4px gap between photographs.
- Square thumbnail aspect ratio.
- Approximately 4–6px corner radius.
- Object-fit cover for thumbnails.
- Minimal decorative framing.
- No unnecessary card shadows.
- No large contributor-name overlays.

Allow adaptive columns on larger screens according to the existing layout system.

Use actual shared photographs belonging to the current event.

Only show photographs eligible for shared visibility.

Preserve existing chronological or configured ordering.

Do not introduce masonry layout.

### 8.4 Favourite Controls

Preserve existing favourite functionality.

Use a discreet heart control positioned near the upper-right corner of each photograph.

Specifications:

- Approximately 16–18px heart icon.
- Approximately 26–30px visible control background.
- Minimum preferred interactive hit area of 44px.
- Visually distinguish selected and unselected states.
- Maintain sufficient icon contrast against varying photographs.

Requirements:

- Selecting the favourite control must not unintentionally open the photo viewer.
- Existing favourite persistence must remain functional.
- Provide accessible labels and selected-state semantics.
- Handle failed favourite updates according to existing application behaviour.

If the existing favourite mechanism is private to each guest, preserve that behaviour.

Do not convert favourites into public social-media likes or introduce public engagement counts.

### 8.5 Photo Attribution

Move the contributor name into the photo detail view.

Do not permanently overlay large contributor labels on every thumbnail.

Preserve access to contributor attribution.

Display actual contribution metadata only.

### 8.6 Photo Detail Viewer

Reuse and refine the existing photo viewer where available.

Preferred experience:

- Immersive full-screen or near-full-screen presentation.
- Dark neutral background.
- Full uncropped photograph displayed using contain fitting.
- Clear close action.
- Contributor name.
- Contribution date or time, where available.
- Favourite action.
- Existing supported photo actions.

Support navigation between photographs where compatible with the current implementation.

Requirements:

- Preserve original image proportions.
- Preserve the active photo filter context.
- Return to the previous grid scroll position when dismissed.
- Maintain correct browser navigation behaviour.
- Support keyboard dismissal and appropriate focus management.
- Respect mobile safe areas.
- Do not obscure the photograph with unnecessary controls.

Display download or sharing actions only if supported and permitted by existing business and visibility rules.

Do not introduce an unnecessarily large gallery or photo-viewer dependency.

If an immersive viewer requires substantial architectural changes, retain and visually refine the existing supported photo detail experience.

### 8.7 Photo Loading

- Use appropriately sized thumbnail assets where available.
- Preserve existing pagination or incremental loading.
- Lazy-load non-essential photographs.
- Avoid retrieving full-resolution photographs for every thumbnail.
- Maintain stable thumbnail dimensions while loading.
- Avoid loading the entire collection unnecessarily.
- Handle failed image requests locally without breaking the grid.

Do not introduce new pagination architecture unless required and approved.

### 8.8 Empty Photo States

When no shared photographs exist:

Title:

Every memory starts somewhere.

Description:

Be the first to share a little moment from today.

Action:

Take a photo

When filters return no photographs:

Title:

No photos found

Description:

Try changing your filters to discover more memories.

Action:

Clear filters

When no favourites exist:

Title:

Keep your favourite moments close.

Description:

Tap the heart on any photograph to find it here later.

Action:

Explore photos

Only present the relevant state.

Do not use fabricated guest photographs.

### 8.9 Contribution Action

Provide a contextual action allowing guests to contribute photographs.

Suggested label:

Add your own moment

Reuse the existing contribution flow.

Keep the action visually subordinate to gallery content.

Do not introduce a competing floating action button without a clear usability justification.

## 9. Wishes Tab

### 9.1 Section Introduction

Heading:

Words to keep

Supporting description:

A little love from our favourite people.

### 9.2 Wish Presentation

Display wishes as a vertically arranged collection of editorial guestbook cards.

Card composition:

1. Optional small quotation-mark decoration.
2. Actual wish content.
3. Contributor initials or existing avatar.
4. Contributor name.
5. Contribution date or time, where available.

Visual requirements:

- Warm linen or approved neutral background.
- Approximately 20px internal padding.
- Shared card border radius.
- Restrained champagne-coloured quotation mark.
- Comfortable reading line height.
- Consistent card spacing.
- No heavy shadows.
- No unnecessary profile-photo requirements.
- No generic social-media post styling.

Use the existing readable typography system.

Do not render long wishes in decorative calligraphy.

Allow long wishes to wrap naturally.

If truncation is necessary, provide an accessible way to read the complete message.

Preserve multiline text and meaningful formatting.

Do not introduce likes, replies or public engagement counts unless already supported.

### 9.3 Contribution Action

Label:

Leave a wish

Connect to the existing wish creation flow.

Preserve existing guest identification and submission rules.

### 9.4 Empty State

Title:

Every love story needs a few words.

Description:

Be the first to leave a heartfelt wish for the newlyweds.

Action:

Write a wish

The empty state should encourage participation.

### 9.5 Loading and Error States

Use appropriately sized skeleton cards or the existing loading mechanism.

If wishes cannot be retrieved, communicate the issue clearly and provide retry where supported.

Do not present a retrieval failure as an empty guestbook.

## 10. Voice Notes Tab

### 10.1 Section Introduction

Heading:

Voices we'll treasure

Supporting description:

Messages that bring us back to this day.

### 10.2 Audio Card

Create a simplified wedding-themed audio card.

Card composition:

1. Contributor initials or existing avatar.
2. Contributor name.
3. Contribution date or time, where available.
4. Play/pause control.
5. Seekable playback progress.
6. Actual elapsed playback time.
7. Actual audio duration.

Visual requirements:

- Soft sage or approved secondary background.
- Approximately 16px internal padding.
- Shared card border radius.
- Circular play/pause control with minimum preferred 44px touch target.
- Restrained icons.
- Clearly readable playback information.
- Consistent spacing and alignment.

Use the existing browser audio element or audio infrastructure underneath the custom interface where appropriate.

Do not introduce unnecessary audio-processing dependencies.

### 10.3 Playback Progress

Preferred enhancement:

An accurate waveform-based playback display, where actual waveform data is already available or can be retrieved efficiently.

Fallback:

A simple, elegant seekable progress bar.

Do not generate arbitrary decorative waveform bars and present them as actual audio amplitude or playback data.

The progress display must reflect actual playback position.

### 10.4 Playback Behaviour

- Do not autoplay recordings.
- Only one recording should play at a time.
- Starting a new recording pauses the previous recording.
- Play and pause controls accurately reflect playback state.
- Seeking works within the supported audio duration.
- Elapsed playback time updates correctly.
- Actual duration is displayed when available.
- Loading and buffering are communicated appropriately.
- Playback completion restores a sensible control state.
- Leaving the relevant gallery experience pauses or stops playback appropriately.
- Existing media access and visibility rules remain enforced.

Do not display misleading zero-duration values while metadata is still loading.

### 10.5 Audio Error Investigation

Investigate the existing Blob/File object-store error and the zero-duration recording shown in the supplied screenshots.

Inspect relevant media retrieval, object-store operations, browser storage, audio source preparation and playback events.

Determine the actual cause using available diagnostic evidence.

Requirements:

- Resolve any confirmed regression or underlying issue within the approved scope.
- Preserve existing audio access controls.
- Do not discard valid recordings.
- Do not simply suppress technical errors without understanding their impact.
- Do not expose raw storage or browser exception messages to guests.
- Log technical diagnostic details using existing application conventions.

If a recording cannot be played, show a contextual error.

Suggested title:

Unable to play this message

Suggested supporting text:

Please try again.

Provide retry only when a meaningful recovery action exists.

If the recording is permanently unavailable, communicate that accurately instead of repeatedly offering a non-functional retry.

An individual recording error must not break the remaining gallery content.

### 10.6 Contribution Action

Label:

Record a message

Reuse the existing voice recording flow.

### 10.7 Empty State

Title:

Let your voice become a memory.

Description:

Leave a little message for the newlyweds to listen to long after today.

Action:

Record a message

## 11. Visibility and Privacy

Preserve all existing contribution visibility and access rules.

The current gallery indicates that photos, wishes and shared voice notes are available to anyone with the album link.

Do not misrepresent this as access limited exclusively to invited guests.

Retain an appropriate visibility notice in the gallery.

Suggested copy, where consistent with existing behaviour:

Photos, wishes and shared voice notes are available to anyone with the album link.

Communicate relevant visibility before contribution submission.

Do not expose:

- Private photographs.
- Private wishes.
- Unshared voice recordings.
- Pending uploads that are not eligible for shared visibility.
- Contributions belonging to another event.
- Another guest's private album or favourite state.

Do not introduce new sharing or access-control rules without approval.

## 12. Navigation

Reuse the completed home page's shared bottom navigation.

Destinations:

- Home.
- Gallery.
- My album.

Gallery must be correctly identified as the active destination.

Preserve:

- Existing routes.
- Existing browser navigation.
- Existing deep links.
- Guest identity.
- Pending uploads.
- Existing personal contribution access.

The content tabs and bottom navigation serve different purposes and must remain visually distinguishable.

Hide or adapt bottom navigation during immersive photo viewing only where appropriate.

Account for bottom safe-area insets and mobile browser chrome.

## 13. Responsive and Accessibility Requirements

Follow DESIGN_SYSTEM.md.

Validate at:

- 320px.
- 375px.
- 390px.
- 430px.
- 768px.
- 1440px.

Requirements:

- No horizontal overflow.
- No clipped tab labels.
- No overlapping controls.
- Accessible favourite controls.
- Comfortable touch targets.
- Sufficient text and control contrast.
- Visible keyboard focus.
- Appropriate tab semantics.
- Accessible audio controls.
- Appropriate modal focus management.
- Screen-reader-compatible status feedback.
- Support for reduced motion.
- Support for browser text scaling.
- No content obscured by fixed navigation.

Use the existing desktop layout conventions rather than introducing a separate dashboard-style gallery.

## 14. Performance

The gallery may contain hundreds or thousands of guest contributions.

Requirements:

- Preserve existing pagination or incremental loading.
- Avoid unnecessary full-resolution image retrieval.
- Avoid fetching all media types unnecessarily.
- Avoid eagerly downloading every voice recording.
- Load audio data according to existing supported playback requirements.
- Prevent unrelated content failures from blocking the selected tab.
- Maintain stable thumbnail dimensions.
- Avoid introducing expensive animation or media dependencies.
- Preserve acceptable scrolling performance.

Do not claim performance improvements without relevant evidence.

## 15. Implementation Priorities

### P0 — Mandatory

- Reuse the completed home page design system.
- Compact the wedding header.
- Implement distinct content tabs.
- Simplify photo filters.
- Refine the photo grid.
- Reduce intrusive photo overlays.
- Preserve favourites and attribution.
- Introduce editorial wish cards.
- Improve voice-note presentation.
- Investigate existing audio errors.
- Provide appropriate loading, empty and error states.
- Preserve shared navigation and existing functionality.
- Preserve contribution visibility and access controls.

### P1 — Conditional Enhancements

- Filter bottom sheet.
- Immersive photo detail refinement.
- Swipe navigation.
- Exact scroll-position restoration.
- Custom audio-player controls.
- Contextual contribution actions.
- Enhanced incremental loading where supported.

Implement when compatible with the existing architecture.

### P2 — Optional Enhancements

- Accurate audio waveform presentation.
- Subtle media transitions.
- Refined skeleton animations.
- Additional restrained ornamental details.

Do not compromise release stability to implement optional enhancements.

## 16. Implementation Constraints

Implementation agents must:

- Reuse the established design system.
- Preserve existing functional capabilities.
- Follow approved component contracts.
- Preserve media access and visibility rules.
- Preserve existing favourites behaviour.
- Avoid unnecessary backend changes.
- Avoid duplicate state-management mechanisms.
- Avoid unnecessary dependencies.
- Avoid modifications to unrelated modules.
- Report architectural conflicts to the main agent.

The main agent must review the integrated rendered gallery and delegate targeted corrections before final acceptance.