export const brideInvitationPath = "/jemputan-walimatulurus-harissa-faiz";
export const groomInvitationPath = "/jemputan-walimatulurus-faiz-harissa";

export type WeddingEventId = "faiz-harissa" | "faiz-harissa-groom";

export type WeddingInvitationDetails = {
  side: "bride" | "groom";
  theme: "garden" | "songket";
  eventId: WeddingEventId;
  bride: string;
  groom: string;
  brideFullName: string;
  groomFullName: string;
  date: Date;
  dateLabel: string;
  coverDate: string;
  heroDate: string;
  calendarDates: string;
  timeLabel: string;
  venue: string;
  dresscode: string;
  mapQuery: string;
  hosts: string;
  contacts: { name: string; phone: string }[];
};

export const brideInvitation: WeddingInvitationDetails = {
  side: "bride",
  theme: "garden",
  eventId: "faiz-harissa",
  bride: "Harissa",
  groom: "Faiz",
  brideFullName: "Harissa Amani binti Abd Razak",
  groomFullName: "Muhammad Faiz bin Hasnul",
  date: new Date("2026-11-28T11:30:00+08:00"),
  dateLabel: "Sabtu, 28 November 2026",
  coverDate: "28 . 11 . 2026",
  heroDate: "28 NOVEMBER 2026",
  calendarDates: "20261128T113000/20261128T160000",
  timeLabel: "11.30 pagi - 4.00 petang",
  venue: "LeQAMR Glasshall, Melaka",
  dresscode: "Tradisional/Formal",
  mapQuery: "LeQAMR Glasshall, Melaka",
  hosts: "Ts. Abd Razak bin Mohamad Zin & Dr Hasuarina binti Hassan",
  contacts: [
    { name: "Razak", phone: "0126365859" },
    { name: "Hasuarina", phone: "0126237859" },
    { name: "Amira", phone: "0192115859" },
    { name: "Hanani", phone: "0196345859" },
    { name: "Harris", phone: "0133635859" },
  ],
};

export const groomInvitation: WeddingInvitationDetails = {
  ...brideInvitation,
  side: "groom",
  theme: "songket",
  eventId: "faiz-harissa-groom",
  date: new Date("2026-12-27T11:30:00+08:00"),
  dateLabel: "Ahad, 27 Disember 2026",
  coverDate: "27 . 12 . 2026",
  heroDate: "27 DISEMBER 2026",
  calendarDates: "20261227T113000/20261227T160000",
  venue: "Urban Park, Alam Impian",
  mapQuery: "Urban Park, Alam Impian",
  hosts: "Hasnul bin Abu Shahir & Normah binti Samsuri",
  contacts: [
    { name: "Hasnul", phone: "0192258819" },
    { name: "Normah", phone: "0184061998" },
    { name: "Asnida", phone: "0176949104" },
    { name: "Afifah", phone: "0176536578" },
  ],
};
