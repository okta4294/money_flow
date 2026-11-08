/**
 * Helper utilitas umum untuk formatting mata uang dan tanggal
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatRupiahInput(value: string): string {
  const num = value.replace(/\D/g, "");
  return num ? parseInt(num, 10).toLocaleString("id-ID") : "";
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", options || {
    day: "numeric",
    month: "short",
  });
}

const FA_TO_MATERIAL: Record<string, string> = {
  "fa-utensils": "restaurant",
  "fa-bowl-rice": "restaurant",
  "fa-burger": "fastfood",
  "fa-pizza-slice": "local_pizza",
  "fa-basket-shopping": "shopping_basket",
  "fa-cart-shopping": "shopping_cart",
  "fa-house": "home",
  "fa-car": "directions_car",
  "fa-gas-pump": "local_gas_station",
  "fa-motorcycle": "two_wheeler",
  "fa-bolt": "bolt",
  "fa-gamepad": "sports_esports",
  "fa-heart": "favorite",
  "fa-graduation-cap": "school",
  "fa-plane": "flight_takeoff",
  "fa-wallet": "account_balance_wallet",
  "fa-money-bill": "payments",
  "fa-money-bill-wave": "payments",
  "fa-piggy-bank": "savings",
  "fa-chart-line": "trending_up",
  "fa-briefcase": "work",
  "fa-gift": "card_giftcard",
  "fa-hospital": "local_hospital",
  "fa-shirt": "checkroom",
  "fa-music": "music_note",
  "fa-mobile-screen": "smartphone",
  "fa-dumbbell": "fitness_center",
  "fa-coffee": "local_cafe",
  "fa-mug-hot": "local_cafe",
  "fa-beer-mug-empty": "local_bar",
  "fa-film": "movie",
  "fa-tag": "sell",
  "fa-receipt": "receipt",
  "fa-credit-card": "credit_card",
  "fa-coins": "monetization_on",
  "fa-circle-dollar-to-slot": "savings",
  "fa-bus": "directions_bus",
  "fa-train": "train",
  "fa-wifi": "wifi",
  "fa-paw": "pets",
  "fa-book": "menu_book",
  "fa-pills": "medication",
  "fa-wrench": "build",
  "fa-camera": "photo_camera",
  "fa-phone": "phone",
  "fa-tv": "tv",
  "fa-trash": "delete",
  "fa-user": "person",
  "fa-envelope": "mail",
  "fa-lock": "lock",
  "fa-eye": "visibility",
  "fa-eye-slash": "visibility_off",
  "fa-triangle-exclamation": "warning",
  "fa-circle-check": "check_circle",
  "fa-xmark": "close",
};

/**
 * Normalisasi icon kategori legacy (FontAwesome fa-) ke Material Symbols Outlined.
 */
export function normalizeCategoryIcon(icon?: string | null, fallback = "category"): string {
  if (!icon) return fallback;
  if (!icon.includes("fa-")) return icon;

  const matches = icon.match(/fa-[a-z0-9-]+/g);
  if (matches) {
    for (const m of matches) {
      if (m === "fa-solid" || m === "fa-regular" || m === "fa-brands") continue;
      if (FA_TO_MATERIAL[m]) return FA_TO_MATERIAL[m];
    }
  }
  return fallback;
}

/**
 * Mendapatkan icon Material Symbols untuk transaksi berdasarkan kategori, tipe, atau kata kunci nama/catatan.
 */
export function getTransactionIcon(params: {
  type?: string;
  categoryIcon?: string | null;
  categoryName?: string | null;
  note?: string | null;
  debtId?: string | null;
}): string {
  const { type, categoryIcon, categoryName, note, debtId } = params;
  if (type === "transfer") return "swap_horiz";

  if (categoryIcon) {
    const normalized = normalizeCategoryIcon(categoryIcon, "");
    if (normalized) return normalized;
  }

  // Fallback cerdas berdasarkan nama kategori atau catatan transaksi
  const label = `${categoryName || ""} ${note || ""}`.toLowerCase();
  if (label.includes("makan") || label.includes("minum") || label.includes("kuliner") || label.includes("mie") || label.includes("kopi") || label.includes("resto")) return "restaurant";
  if (label.includes("bensin") || label.includes("bbm") || label.includes("transport") || label.includes("parkir") || label.includes("ojol") || label.includes("kendaraan") || label.includes("motor") || label.includes("mobil")) return "directions_car";
  if (label.includes("belanja") || label.includes("supermarket") || label.includes("pasar") || label.includes("sembako") || label.includes("dapur")) return "shopping_basket";
  if (label.includes("tagihan") || label.includes("listrik") || label.includes("pln") || label.includes("pulsa") || label.includes("wifi") || label.includes("internet")) return "bolt";
  if (label.includes("kos") || label.includes("sewa") || label.includes("rumah") || label.includes("kontrakan")) return "home";
  if (label.includes("bonus") || label.includes("gaji") || label.includes("affiliate") || label.includes("salary") || label.includes("pendapatan") || label.includes("cuan")) return "payments";
  if (label.includes("tabungan") || label.includes("nabung") || label.includes("invest")) return "savings";
  if (label.includes("hiburan") || label.includes("game") || label.includes("hobi") || label.includes("nonton")) return "sports_esports";
  if (label.includes("kesehatan") || label.includes("obat") || label.includes("dokter") || label.includes("apotek") || label.includes("rs")) return "local_hospital";

  if (type === "income") return "payments";
  if (debtId) return "credit_card";
  return "receipt_long";
}
