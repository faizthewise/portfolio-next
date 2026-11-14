import type { GetStaticPaths, GetStaticProps } from "next";
import { MemoryExperience } from "@/components/wedding/memories/MemoryExperience";
import {
  MEMORY_PUBLIC_SLUGS,
  memorySideFromSlug,
} from "@/lib/wedding/memoryRoutes";
type Props = { side: "bride" | "groom" };
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: Object.values(MEMORY_PUBLIC_SLUGS).map((side) => ({
    params: { side },
  })),
  fallback: false,
});
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const side = memorySideFromSlug(String(params?.side ?? ""));
  if (!side) return { notFound: true };
  return { props: { side } };
};
export default function MemoriesGuest({ side }: Props) {
  return <MemoryExperience key={side} side={side} />;
}
