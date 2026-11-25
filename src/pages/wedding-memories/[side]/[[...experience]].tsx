import type { GetStaticPaths, GetStaticProps } from "next";
import { MemoryExperience } from "@/components/wedding/memories/MemoryExperience";
import {
  MEMORY_PUBLIC_SLUGS,
  memorySideFromSlug,
  type MemorySide,
} from "@/lib/wedding/memoryRoutes";

type GuestPage = "guest" | "gallery" | "my-album";
type Props = { side: MemorySide; page: GuestPage };

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: Object.values(MEMORY_PUBLIC_SLUGS).flatMap((side) =>
    [[], ["gallery"], ["my-album"]].map((experience) => ({
      params: { side, experience },
    }))
  ),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const side = memorySideFromSlug(String(params?.side ?? ""));
  const experience = params?.experience ?? [];
  if (!side || !Array.isArray(experience) || experience.length > 1)
    return { notFound: true };
  const page = experience[0] ?? "guest";
  if (page !== "guest" && page !== "gallery" && page !== "my-album")
    return { notFound: true };
  return { props: { side, page } };
};

export default function MemoriesGuestPage({ side, page }: Props) {
  return <MemoryExperience key={side} side={side} page={page} />;
}
