import WeddingInvitation from "@/components/wedding/WeddingInvitation";
import { groomInvitation } from "@/lib/wedding/invitations";

export default function JemputanWalimatulurusFaizHarissa() {
  return <WeddingInvitation wedding={groomInvitation} />;
}
