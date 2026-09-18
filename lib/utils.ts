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
