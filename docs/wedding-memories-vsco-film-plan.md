# Wedding memories film looks

## Targets

The camera and owner settings offer Original, FP2, FS16, and FV5. The three
color looks use concise codes in the selector and describe the referenced stock
in the selected-look copy.

| Look | Visual target | Local rendering approach |
| --- | --- | --- |
| FP2 · Fuji Pro 160C | Rich color and crisp contrast | A restrained S-curve and stronger saturation, reduced slightly in skin-like midtones. |
| FS16 · Fuji Superia 1600 | Natural color, softer contrast, green fade | A flatter tone curve with a subtle green-cyan bias confined to darker values, tapering before highlights. |
| FV5 · Fuji Velvia 50 | Vivid color, strong contrast, warm magenta tones | A stronger S-curve and saturation, moderated in skin-like midtones, with gentle magenta shadows and warm highlights. |

Original bypasses the live shader and retains the camera's native video. New
looks use matching deterministic CPU and WebGL formulas. White fabric and shadow
detail retain headroom; no frame-varying grain is added.

## Approximation note

These looks are locally designed color treatments informed by the descriptions
in [VSCO's Fujifilm preset guide](https://www.vsco.co/features/film-filters/fujifilm-presets).
They are not claims of exact proprietary VSCO or Fujifilm matches. Paired
reference exports were not available for direct comparison.

Older photo styles (`classic-chrome`, `classic-neg`, `nostalgic-neg`, `acros`,
`warm`, and `soft`) remain supported by the still-photo renderer and Firestore
rules so saved images and queued uploads keep their original rendering. The
camera and owner selector maps those historical defaults to FP2 without
rewriting the persisted style.

## Review and validation

- Reviewed the three treatments on the existing engagement portrait, checking
  skin tones, white garments, flowers and black fabric. Refined FS16 so its
  green-cyan fade includes the lifted black toe and tapers before highlights.
- Actual windowless WebGL execution passed 96 changing-frame comparisons across
  Original and the three looks, with three source crops. Maximum RGB difference
  from the CPU renderer was 1/255; each look continued updating across eight
  distinct source frames. This verifies rendering, not phone performance.
- Native canvas comparisons preserved byte-identical output for all seven
  original/legacy looks against the previous implementation.
- All 26 memories tests, TypeScript, and the isolated production build passed.
  Rules tests accept each new ID for photo metadata and owner settings while
  rejecting unknown IDs and guest settings writes.

Deploy the updated `firestore.rules` before releasing the app so photo metadata
and owner settings can save the new IDs. Rules were tested locally; no live
Firebase deployment was performed.
