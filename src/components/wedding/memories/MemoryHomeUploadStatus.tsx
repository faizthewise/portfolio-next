import {
  CircleAlert,
  CircleCheck,
  CloudOff,
  CloudUpload,
  Info,
} from "lucide-react";
import type { UploadJob, UploadKind } from "@/lib/wedding/memoriesQueue";
import { getHomeUploadCounts } from "@/lib/wedding/memoriesUploadStatus";
import styles from "./MemoryHomeUploadStatus.module.css";

type MemoryHomeUploadStatusProps = {
  jobs: UploadJob[];
  activeUploadIds: string[];
  online: boolean;
  confirmedPhotoCount: number;
  message?: string;
  onAlbum: () => void;
  onVoice: () => void;
};

const jobKinds: UploadKind[] = ["photo", "audio"];

const uploadStates = [
  { state: "active", Icon: CloudUpload, label: "uploading" },
  { state: "failed", Icon: CircleAlert, label: "couldn’t upload" },
  { state: "waiting", Icon: CloudOff, label: "waiting for a connection" },
  { state: "ready", Icon: CloudUpload, label: "ready to upload" },
] as const;

function countLabel(kind: UploadKind, count: number) {
  const label = kind === "photo" ? "photo" : "voice note";
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

export function MemoryHomeUploadStatus({
  jobs,
  activeUploadIds,
  online,
  confirmedPhotoCount,
  message,
  onAlbum,
  onVoice,
}: MemoryHomeUploadStatusProps) {
  const counts = getHomeUploadCounts(jobs, activeUploadIds, online);
  const rows = uploadStates.flatMap(({ state, Icon, label }) =>
    jobKinds.flatMap((kind) => {
      const count = counts[state][kind];
      if (!count) return [];

      return [
        {
          key: `${state}-${kind}`,
          Icon,
          tone: styles[state],
          title: `${countLabel(kind, count)} ${label}.`,
          detail:
            state === "failed" && !online ? "Reconnect to retry." : undefined,
          action: kind === "photo" ? "My album" : "Voice notes",
          onAction: kind === "photo" ? onAlbum : onVoice,
        },
      ];
    })
  );
  const success =
    confirmedPhotoCount > 0
      ? `${countLabel("photo", confirmedPhotoCount)} uploaded successfully.`
      : undefined;
  const announcement = [
    ...rows.map(({ title, detail }) =>
      [title, detail].filter(Boolean).join(" ")
    ),
    success,
    message,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={styles.announcement} role="status" aria-atomic="true">
        {announcement}
      </div>
      {announcement && (
        <ul className={styles.list} aria-label="Upload status">
          {rows.map(({ key, Icon, tone, title, detail, action, onAction }) => (
            <li className={`${styles.row} ${tone}`} key={key}>
              <Icon aria-hidden="true" size={20} />
              <div className={styles.copy}>
                <p>{title}</p>
                {detail && <p className={styles.detail}>{detail}</p>}
              </div>
              <button
                className={styles.action}
                type="button"
                onClick={onAction}
              >
                {action}
              </button>
            </li>
          ))}
          {success && (
            <li className={`${styles.row} ${styles.success}`}>
              <CircleCheck aria-hidden="true" size={20} />
              <p className={styles.copy}>{success}</p>
            </li>
          )}
          {message && (
            <li className={styles.row}>
              <Info aria-hidden="true" size={20} />
              <p className={styles.copy}>{message}</p>
            </li>
          )}
        </ul>
      )}
    </>
  );
}
