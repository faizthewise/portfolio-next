export type RegistryProduct = {
  slug: string;
  reservationId: string;
  name: string;
  category: "Dapur" | "Rumah";
  shopUrl: string;
  fullName?: string;
  image?: string;
};

export const registryPath = "/wedding-registry";
export const invitationReturnPath =
  "/jemputan-walimatulurus-harissa-faiz?friend=1&registry=1#hadiah";

// Stable reservation IDs use the existing custom-gift namespace so the live
// ownership rules also protect new catalogue items without a rules migration.
// Keep these IDs and short names stable after reservations have been made.
// Full titles and images must come from the exact linked listing; do not infer brands.
export const registryProducts: RegistryProduct[] = [
  {
    slug: "air-fryer",
    reservationId: "air-fryer",
    name: "Air fryer",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/7VGxicDC4a",
  },
  {
    slug: "air-purifier",
    reservationId: "custom-9cca39db-5a8c-54f0-a995-80156d020433",
    name: "Air purifier",
    category: "Rumah",
    shopUrl: "https://s.shopee.com.my/AUuZJBCMbD",
  },
  {
    slug: "rice-cooker",
    reservationId: "custom-71545d65-5a8a-587a-9df1-462d0f9056ed",
    name: "Rice cooker",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/9fLiKoPuKp",
  },
  {
    slug: "knife-set",
    reservationId: "custom-98486538-4f08-5e30-8a51-86ce8453c9f1",
    name: "Knife set",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/5q8zlrFs84",
  },
  {
    slug: "chopping-board",
    reservationId: "custom-eb88988e-0259-5ebc-ab26-6ff41c953417",
    name: "Chopping board",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/6fi6lUnONO",
  },
  {
    slug: "towel",
    reservationId: "custom-da43fc8b-543c-56a0-ae62-a88de243bd21",
    name: "Towel",
    category: "Rumah",
    shopUrl: "https://s.shopee.com.my/4LKBzHDDkT",
  },
  {
    slug: "toaster",
    reservationId: "custom-95974ac9-2e70-5d76-ab88-0ba2ef82ad6a",
    name: "Toaster",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/6AlqAheqV0",
  },
  {
    slug: "wok-pan",
    reservationId: "custom-2959c767-495b-538e-b3b2-e25da6b0b045",
    name: "Wok pan",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/4fx2OPgP5o",
  },
  {
    slug: "cooking-utensils",
    reservationId: "custom-8a72d738-5b91-5af3-879e-61d92d9a5760",
    name: "Cooking utensils",
    category: "Dapur",
    shopUrl: "https://s.shopee.com.my/6fi6mODuqa",
  },
];
