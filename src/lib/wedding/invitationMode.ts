export type InvitationMode = "family" | "friend" | "parentFriend";

export function getInvitationMode(
  value: string | string[] | undefined
): InvitationMode {
  return value === "friend" || value === "parentFriend" ? value : "family";
}

export function invitationReturnPath(mode: InvitationMode) {
  const anchor = mode === "family" ? "" : "#hadiah";
  return `/jemputan-walimatulurus-harissa-faiz?mode=${mode}&registry=1${anchor}`;
}
