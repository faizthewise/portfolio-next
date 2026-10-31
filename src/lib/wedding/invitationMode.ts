export type InvitationMode = "family" | "friend" | "parentFriend" | "sekeluarga";

export function getInvitationMode(
  value: string | string[] | undefined
): InvitationMode {
  return value === "friend" || value === "parentFriend" || value === "sekeluarga"
    ? value
    : "family";
}

export function invitationReturnPath(mode: InvitationMode) {
  const anchor = mode === "family" || mode === "sekeluarga" ? "" : "#hadiah";
  return `/jemputan-walimatulurus-harissa-faiz?mode=${mode}&registry=1${anchor}`;
}
