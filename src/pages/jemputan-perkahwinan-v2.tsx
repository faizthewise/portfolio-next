import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({
  resolvedUrl,
}) => ({
  redirect: {
    destination: resolvedUrl.replace(
      /^\/jemputan-perkahwinan-v2/,
      "/jemputan-walimatulurus-harissa-faiz"
    ),
    permanent: true,
  },
});

export default function PreviousInvitationRoute() {
  return null;
}
