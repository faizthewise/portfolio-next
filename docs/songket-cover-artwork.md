# Songket runtime assets

The groom invitation at `/jemputan-walimatulurus-faiz-harissa` uses the assets below. Superseded artwork, review captures, and execution plans have been removed.

| Purpose | Current files in `public/images/` |
| --- | --- |
| Closed cover | `songket-closed-composite-v4.webp` |
| Inner insert | `songket-cover-insert-v2.svg` |
| Opening gates | `songket-gate-left-v1.webp`, `songket-gate-right-v1.webp` |
| Wax seal | `wax-seal-fh-burgundy-v2.webp` |
| Inner-card embroidery | `songket-interior-corner-v2.webp`, `songket-interior-corner-bottom-v2.webp` |
| Continuous paper silhouette | `songket-card-edge-top-v3.svg`, `songket-card-edge-bottom-v3.svg` |
| Paper and page edges | `songket-paper-grain.svg`, `songket-page-edge-v1.svg` |
| Woven field | `songket-weave-muted.svg` |
| Quotation edging | `songket-quotation-thread-edge-v1.svg` |
| Closing flourish | `songket-closing-flourish-v1.webp` |
| Closing surface | `songket-closing-weave-v1.svg`, `songket-closing-relief-v1.svg` |

The embroidery and seal were prepared using image generation/editing. Paper silhouettes, the insert, and surface textures are code-native SVGs. The cover composite combines the same registered gates, insert, and contact-shadow construction used by the live opening. Its CSS reference and preload must stay in sync with the live layers when artwork changes.

`SongketArtwork.tsx` renders the ornaments and image fallbacks. `SongketThreadwork.tsx` and `songketMotion.ts` provide scoped stitch highlights and the wishes motif reveal. `WeddingSongket.module.css` owns the paper, masks, surfaces, and responsive layout. Decorative masks leave text and controls unclipped, and one grain field spans the inner card.

The original synthesized opening sound is `public/audio/songket-classical-opening.wav`. Its reproducible, standard-library-only source is [generate-songket-opening.py](../scripts/generate-songket-opening.py). Audio sequencing remains in `mohorOpening.ts` and `WeddingMusicProvider.tsx`.
