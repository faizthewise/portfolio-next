export type RegistryLocale = "ms" | "en";

export const registryCopy = {
  ms: {
    pageTitle: "Hadiah buat Harissa & Faiz",
    meta: "Senarai hadiah perkahwinan Harissa dan Faiz. Pilih hadiah atau maklumkan hadiah lain yang ingin diberikan. Beli di mana-mana kedai pilihan anda.",
    back: "Kembali ke undangan",
    eyebrow: "Dari hati, buat yang dirai",
    heading: "Tanda Kasih",
    intro:
      "Kehadiran dan doa restu anda sudah cukup bermakna. Senarai hadiah ini disediakan untuk membantu tetamu mengelakkan pembelian hadiah yang sama. Jika ingin menitipkan hadiah, semak senarai dan tandakan pilihan anda sebelum membeli.",
    guidance:
      "Pautan Shopee hanyalah rujukan produk. Anda bebas membeli di mana-mana kedai pilihan anda.",
    addOther: "Saya ingin beri hadiah lain",
    customTitle: "Hadiah di luar senarai",
    customIntro:
      "Maklumkan hadiah yang anda ingin berikan. Ia akan dipaparkan kepada tetamu lain sebagai sudah dipilih.",
    giftName: "Nama hadiah",
    giftPlaceholder: "Contoh: Lampu meja",
    saving: "Sedang menyimpan…",
    addReserve: "Tambah dan tandakan pilihan saya",
    cancel: "Batal",
    checking: "Sedang menyemak status hadiah…",
    search: "Cari hadiah",
    filter: "Tapis hadiah",
    all: "Semua",
    available: "Masih tersedia",
    myFilter: "Pilihan saya",
    viewHint: "Pilih hadiah untuk melihat butiran",
    offlineReference: "Anda masih boleh melihat produk di Shopee.",
    mine: "Pilihan anda",
    otherReserved: "Sudah dipilih tetamu lain",
    unknown: "Status belum disemak",
    emptyMine: "Anda belum memilih hadiah.",
    emptySearch: "Tiada hadiah yang sepadan.",
    viewAll: "Lihat semua hadiah",
    reservationNote:
      "Tandakan hadiah sebagai pilihan anda sebelum membeli supaya tetamu lain tidak memilih hadiah yang sama. Pilihan boleh dibatalkan melalui pelayar yang sama.",
    footer: "Terima kasih atas ingatan anda.",
    qrHeading: "Seikhlas Hati",
    qrIntro:
      "Jika ingin menitipkan hadiah dalam bentuk wang, anda boleh menggunakan kod QR di bawah. Setiap ingatan dan doa amat dihargai.",
    qrAlt: "Kod QR Harissa untuk hadiah wang",
    qrCaption: "Imbas kod QR melalui aplikasi perbankan pilihan anda.",
    qrDownload: "Simpan kod QR",
    close: "Tutup butiran hadiah",
    customDescription:
      "Hadiah ini ditambah oleh tetamu dan telah ditandakan sebagai pilihan mereka.",
    productDescription:
      "Pautan Shopee hanyalah rujukan produk dan saiz. Anda bebas membeli di mana-mana kedai pilihan anda.",
    cancelReservation: "Batalkan pilihan saya",
    reserve: "Saya ingin hadiahkan ini",
    shopee: "Rujukan di Shopee",
    detailNote:
      "Menandakan pilihan hanya memaklumkan tetamu lain. Anda boleh membeli hadiah ini di mana-mana kedai.",
    cancelled: "Pilihan hadiah telah dibatalkan.",
    reservedNotice:
      "Hadiah ini kini ditandakan sebagai pilihan anda. Terima kasih!",
    giftSaveError: "Hadiah belum disimpan. Sila cuba lagi.",
    reservationSaveError: "Pilihan belum disimpan. Sila cuba lagi.",
    connectionError:
      "Status hadiah belum dapat disemak. Muat semula halaman untuk mencuba lagi.",
    reservationChanged:
      "Pilihan hadiah telah berubah. Sila semak senarai terkini.",
    invalidName: "Nama hadiah tidak sah.",
    guestImage: "Hadiah pilihan tetamu",
    shopeeImage: "Gambar di Shopee",
    view: "Lihat",
    categories: {
      Dapur: "Dapur",
      Rumah: "Rumah",
      "Hadiah tetamu": "Hadiah tetamu",
    },
    count: (count: number) => `${count} pilihan hadiah`,
    customAdded: (name: string) =>
      `${name} telah ditambah dan ditandakan sebagai pilihan anda. Tetamu lain boleh melihatnya dalam senarai.`,
  },
  en: {
    pageTitle: "Gifts for Harissa & Faiz",
    meta: "Harissa and Faiz’s wedding gift registry. Choose a gift or let others know what you plan to give. Shop wherever you prefer.",
    back: "Back to the invitation",
    eyebrow: "For our life together",
    heading: "Gifts from the heart",
    intro:
      "Your presence and warm wishes mean the world to us. This list brings together things we’d love for our home and helps guests avoid buying duplicate gifts. If you’d like to give a gift, please reserve it here before purchasing.",
    guidance:
      "Shopee links are provided as product references only. Please feel free to buy from any shop you prefer.",
    addOther: "I’d like to give something else",
    customTitle: "A gift of your own choosing",
    customIntro:
      "Tell us what you plan to give. It will appear in the registry as reserved so other guests know.",
    giftName: "Gift name",
    giftPlaceholder: "For example: A table lamp",
    saving: "Saving…",
    addReserve: "Add and reserve my gift",
    cancel: "Cancel",
    checking: "Checking gift availability…",
    search: "Search gifts",
    filter: "Filter gifts",
    all: "All",
    available: "Available",
    myFilter: "My gifts",
    viewHint: "Select a gift to see the details",
    offlineReference: "You can still view the product references on Shopee.",
    mine: "Reserved by you",
    otherReserved: "Reserved by another guest",
    unknown: "Availability not yet checked",
    emptyMine: "You haven’t reserved a gift yet.",
    emptySearch: "No matching gifts found.",
    viewAll: "View all gifts",
    reservationNote:
      "Please reserve your gift before buying it so other guests can avoid choosing the same item. You can cancel your reservation using the same browser.",
    footer: "Thank you for thinking of us.",
    qrHeading: "From the Heart",
    qrIntro:
      "If you’d like to give a monetary gift, you’re welcome to use the QR code below. Every kind thought and warm wish is deeply appreciated.",
    qrAlt: "Harissa’s QR code for monetary gifts",
    qrCaption: "Scan the QR code with your preferred banking app.",
    qrDownload: "Save QR code",
    close: "Close gift details",
    customDescription:
      "This gift was added by a guest and is already reserved by them.",
    productDescription:
      "Use the Shopee link as a reference for the product and size. You’re welcome to buy it from any shop you prefer.",
    cancelReservation: "Cancel my reservation",
    reserve: "I’d like to give this",
    shopee: "View reference on Shopee",
    detailNote:
      "Reserving a gift only lets other guests know your plans. It does not make a purchase; you can shop anywhere.",
    cancelled: "Your gift reservation has been cancelled.",
    reservedNotice: "This gift is now reserved by you. Thank you!",
    giftSaveError: "Your gift couldn’t be saved. Please try again.",
    reservationSaveError:
      "Your reservation couldn’t be saved. Please try again.",
    connectionError:
      "Gift availability couldn’t be checked. Please refresh the page to try again.",
    reservationChanged:
      "This gift’s reservation has changed. Please check the latest list.",
    invalidName: "Please enter a gift name of 1–100 characters.",
    guestImage: "A guest’s chosen gift",
    shopeeImage: "Photo on Shopee",
    view: "View",
    categories: {
      Dapur: "Kitchen",
      Rumah: "Home",
      "Hadiah tetamu": "Guest gift",
    },
    count: (count: number) => `${count} ${count === 1 ? "gift" : "gifts"}`,
    customAdded: (name: string) =>
      `${name} has been added and reserved by you. Other guests can now see it in the registry.`,
  },
};

export function registryErrorMessage(
  cause: unknown,
  locale: RegistryLocale,
  fallback: string
) {
  if (!(cause instanceof Error)) return fallback;
  if (cause.message === registryCopy.ms.reservationChanged)
    return registryCopy[locale].reservationChanged;
  if (cause.message === registryCopy.ms.invalidName)
    return registryCopy[locale].invalidName;
  return locale === "ms" && !cause.message.includes("Firebase")
    ? cause.message
    : fallback;
}
