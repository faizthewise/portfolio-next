export type MemorySide = "bride" | "groom";

export const MEMORY_PUBLIC_ALBUMS: Record<
  MemorySide,
  { slug: string; coupleNames: string; dateLabel: string }
> = {
  bride: {
    slug: "harissa-faiz",
    coupleNames: "Harissa & Faiz",
    dateLabel: "28 November 2026",
  },
  groom: {
    slug: "faiz-harossa",
    coupleNames: "Faiz & Harissa",
    dateLabel: "27 December 2026",
  },
};

export const MEMORY_PUBLIC_SLUGS = Object.fromEntries(
  Object.entries(MEMORY_PUBLIC_ALBUMS).map(([side, album]) => [side, album.slug])
) as Record<MemorySide, string>;

export function memoryPublicSlug(side: MemorySide) {
  return MEMORY_PUBLIC_ALBUMS[side].slug;
}

export function memorySideFromSlug(slug: string): MemorySide | undefined {
  return (Object.entries(MEMORY_PUBLIC_ALBUMS) as [
    MemorySide,
    (typeof MEMORY_PUBLIC_ALBUMS)[MemorySide],
  ][]).find(
    ([, album]) => album.slug === slug
  )?.[0];
}

export function memoryPath(side: MemorySide, page = "") {
  return `/wedding-memories/${memoryPublicSlug(side)}${page ? `/${page}` : ""}`;
}

export function memoryCanonicalUrl(side: MemorySide, page = "") {
  return `https://faizhasnul.com${memoryPath(side, page)}`;
}
