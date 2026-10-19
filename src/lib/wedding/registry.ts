export type RegistryProduct = {
  slug: string;
  reservationId: string;
  name: string;
  category: "Dapur" | "Rumah" | "Hadiah tetamu";
  shopUrl?: string;
  custom?: boolean;
  fullName?: string;
  image?: string;
  contribution?: {
    targetCents: number;
    qrImage: string;
    qrIsPlaceholder?: boolean;
  };
};

export const registryPath = "/wedding-registry";
export const invitationReturnPath =
  "/jemputan-walimatulurus-harissa-faiz?friend=1&registry=1#hadiah";

// Stable reservation IDs use the existing custom-gift namespace so the live
// ownership rules also protect new catalogue items without a rules migration.
// Keep these IDs and short names stable after reservations have been made.
// Product names are transcribed from the owner-supplied listing photos.
// Keep unknown brands/models unset rather than inferring them.
export const registryProducts: RegistryProduct[] = [
  {
    slug: "air-fryer",
    fullName: "Russell Taylors Visionary 4.5L Air Fryer (Z3C)",
    image: "/images/wedding-registry/air-fryer.JPG",
    reservationId: "air-fryer",
    name: "Air fryer",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/7VGxicDC4a",
  },
  {
    slug: "air-purifier",
    fullName: "Levoit Vital Series Smart Pet Air Purifier",
    image: "/images/wedding-registry/air-purifier.JPG",
    reservationId: "custom-9cca39db-5a8c-54f0-a995-80156d020433",
    name: "Air purifier",
    category: "Rumah",
    shopUrl: "https://s.shopee.com.my/AUuZJBCMbD",
  },
  {
    slug: "rice-cooker",
    fullName: "ELBA Mini Rice Cooker 0.8L - ERC-S0825 (WH)",
    image: "/images/wedding-registry/rice-cooker.JPG",
    reservationId: "custom-71545d65-5a8a-587a-9df1-462d0f9056ed",
    name: "Rice cooker",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/9fLiKoPuKp",
  },
  {
    slug: "knife-set",
    fullName: "Redchef Stainless Steel Cream White Knife Set",
    image: "/images/wedding-registry/knife-set.JPG",
    reservationId: "custom-98486538-4f08-5e30-8a51-86ce8453c9f1",
    name: "Knife set",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/5q8zlrFs84",
  },
  {
    slug: "chopping-board",
    fullName: "Ecowin Chopping Board",
    image: "/images/wedding-registry/chopping-board.JPG",
    reservationId: "custom-eb88988e-0259-5ebc-ab26-6ff41c953417",
    name: "Chopping board",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/6fi6lUnONO",
  },
  {
    slug: "towel",
    fullName: "GAIAS Waffle Terry Travel Towel",
    image: "/images/wedding-registry/bath-towel.JPG",
    reservationId: "custom-da43fc8b-543c-56a0-ae62-a88de243bd21",
    name: "Towel",
    category: "Rumah",
    shopUrl: "https://s.shopee.com.my/4LKBzHDDkT",
  },
  {
    slug: "toaster",
    fullName: "Russell Taylors Retro Toaster RT-10",
    image: "/images/wedding-registry/toaster.JPG",
    reservationId: "custom-95974ac9-2e70-5d76-ab88-0ba2ef82ad6a",
    name: "Toaster",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/6AlqAheqV0",
  },
  {
    slug: "wok-pan",
    fullName: "Tefal One Pick Pot Work Pan (Beige)",
    image: "/images/wedding-registry/wok-pan.JPG",
    reservationId: "custom-2959c767-495b-538e-b3b2-e25da6b0b045",
    name: "Wok pan",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/4fx2OPgP5o",
  },
  {
    slug: "cooking-utensils",
    image: "/images/wedding-registry/cooking-utensils.jpg",
    fullName: "Truecook Italian Olive woord Cooking Utensils Set",
    reservationId: "custom-8a72d738-5b91-5af3-879e-61d92d9a5760",
    name: "Cooking utensils",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/6fi6mODuqa",
  },
  {
    slug: "vacuum",
    contribution: {
      targetCents: 209900,
      qrImage: "/images/harissa-qr.jpeg",
      qrIsPlaceholder: false,
    },
    fullName: "Dyson V8 Cyclone Vacuum",
    image: "/images/wedding-registry/vacuum.JPG",
    reservationId: "custom-c7d8495b-42ea-4e04-acc6-c52ddb5c4744",
    name: "Vacuum",
    category: "Rumah",
    shopUrl: "https://my.shp.ee/3k6F9Bg8",
  },
  {
    slug: "washer",
    contribution: {
      targetCents: 170000,
      qrImage: "/images/harissa-qr.jpeg",
      qrIsPlaceholder: false,
    },
    fullName: "Electrolux 9kg Front Load Washer",
    image: "/images/wedding-registry/washer.JPG",
    reservationId: "custom-c7d8495b-42ea-4e04-d443-c52ddb5c4744",
    name: "Washer",
    category: "Rumah",
    shopUrl: "https://my.shp.ee/XYLcfgxh",
  },
  {
    slug: "dryer",
    contribution: {
      targetCents: 190000,
      qrImage: "/images/harissa-qr.jpeg",
      qrIsPlaceholder: false,
    },
    fullName: "Electrolux 8kg Heat Pump Dryer",
    image: "/images/wedding-registry/dryer.JPG",
    reservationId: "custom-c7d8495b-42ea-2e74-d443-c52ddb5c4744",
    name: "Dryer",
    category: "Rumah",
    shopUrl: "https://my.shp.ee/v8J957wb",
  },
  {
    slug: "iron",
    fullName: "Philips 1.5L Perfectcare Steam Iron",
    image: "/images/wedding-registry/steam-iron.JPG",
    reservationId: "custom-bcc93f85-09ba-49bc-8227-bc1f9cfc19c7",
    name: "Steam Iron",
    category: "Rumah",
    shopUrl: "https://my.shp.ee/QxDp8ZrA",
  },
  {
    slug: "blanket",
    fullName: "Kapas The Ultimate Waffle Blanket — Bamboo Throw",
    image: "/images/wedding-registry/blanket.JPG",
    reservationId: "custom-bcc93f85-09ba-49bc-8438-bc1f9cfc19c7",
    name: "Blanket",
    category: "Rumah",
    shopUrl: "https://my.shp.ee/ksj5ja82?fromSource=copy_link&smtt=0.0.9",
  },
  {
    slug: "bedsheet",
    fullName: "GAIAS Cotton FineCut 80 Sheet Set — King Size",
    image: "/images/wedding-registry/bed-sheet-set.JPG",
    reservationId: "custom-b7612a0e-cb4a-4d2c-b260-e79928dc7697",
    name: "Bedsheet — King size",
    category: "Rumah",
    shopUrl: "https://my.shp.ee/XRGG6bdQ",
  },
];
