import { brideInvitationPath, groomInvitationPath } from "./invitations";

export type InvitationMode =
  | "family"
  | "friend"
  | "parentFriend"
  | "sekeluarga";

export function getInvitationMode(
  value: string | string[] | undefined
): InvitationMode {
  return value === "friend" ||
    value === "parentFriend" ||
    value === "sekeluarga"
    ? value
    : "family";
}

export function invitationReturnPath(
  mode: InvitationMode,
  invitation?: string | string[]
) {
  const anchor = mode === "family" || mode === "sekeluarga" ? "" : "#hadiah";
  const path =
    invitation === "groom" ? groomInvitationPath : brideInvitationPath;
  return `${path}?mode=${mode}&registry=1${anchor}`;
}
