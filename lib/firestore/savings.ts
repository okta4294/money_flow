import {
  doc,
  setDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface MonthlySaving {
  id: string; // "YYYY-MM"
  year: number;
  month: number;
  targetAmount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const userDocRef = (userId: string) => doc(db, "users", userId);

export const getMonthKey = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, "0")}`;

/**
 * Berlangganan data seluruh tabungan bulanan pengguna secara realtime
 * Disimpan di dokumen users/{userId} agar tidak memerlukan permission rules subcollection baru
 */
export function subscribeToMonthlySavings(
  userId: string,
  callback: (savings: MonthlySaving[]) => void
) {
  const ref = userDocRef(userId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.data();
      const rawSavings = data.monthlySavings || {};
      const items: MonthlySaving[] = Object.entries(rawSavings).map(([key, val]) => {
        const parts = key.split("-");
        const y = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const targetAmount =
          typeof val === "number"
            ? val
            : typeof (val as any)?.targetAmount === "number"
            ? (val as any).targetAmount
            : 0;
        return {
          id: key,
          year: y,
          month: m,
          targetAmount,
        };
      });
      items.sort((a, b) => a.id.localeCompare(b.id));
      callback(items);
    },
    (err) => {
      console.error("Gagal berlangganan data savings:", err);
      callback([]);
    }
  );
}

/**
 * Menyimpan / memperbarui target tabungan untuk bulan tertentu langsung di dokumen user
 */
export async function setMonthlySaving(
  userId: string,
  year: number,
  month: number,
  targetAmount: number
): Promise<void> {
  const docId = getMonthKey(year, month);
  const ref = userDocRef(userId);

  await setDoc(
    ref,
    {
      monthlySavings: {
        [docId]: Math.max(0, targetAmount),
      },
    },
    { merge: true }
  );
}

export interface SavingBreakdownItem {
  id: string; // "YYYY-MM"
  year: number;
  month: number;
  monthLabel: string;
  targetAmount: number;
  runningCumulative: number;
  isCurrentMonth: boolean;
  isCustom: boolean;
}

export interface SavingsSummaryResult {
  currentTargetAmount: number;
  hasCustomTargetThisMonth: boolean;
  cumulativeSavings: number;
  previousMonthTarget: number;
  breakdown: SavingBreakdownItem[];
}

const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Mengambil target tabungan bulan ini dan total akumulasi tabungan hingga bulan ini.
 * Jika bulan ini belum pernah diinput, mengambil nilai referensi dari bulan terdekat sebelumnya.
 */
export function calculateSavingsSummary(
  allSavings: MonthlySaving[],
  year: number,
  month: number
): SavingsSummaryResult {
  const targetKey = getMonthKey(year, month);
  const sorted = [...allSavings].sort((a, b) => a.id.localeCompare(b.id));

  const foundCurrent = sorted.find((s) => s.id === targetKey);
  const pastSavings = sorted.filter((s) => s.id < targetKey);
  const prevMonthSaving = pastSavings.length > 0 ? pastSavings[pastSavings.length - 1] : null;

  const previousMonthTarget = prevMonthSaving ? prevMonthSaving.targetAmount : 0;
  const currentTargetAmount = foundCurrent
    ? foundCurrent.targetAmount
    : previousMonthTarget;
  const hasCustomTargetThisMonth = Boolean(foundCurrent);

  const pastCumulative = pastSavings.reduce((sum, s) => sum + s.targetAmount, 0);
  const cumulativeSavings = pastCumulative + currentTargetAmount;

  const breakdown: SavingBreakdownItem[] = [];
  let running = 0;

  pastSavings.forEach((s) => {
    running += s.targetAmount;
    breakdown.push({
      id: s.id,
      year: s.year,
      month: s.month,
      monthLabel: `${INDONESIAN_MONTHS[s.month - 1] || `Bulan ${s.month}`} ${s.year}`,
      targetAmount: s.targetAmount,
      runningCumulative: running,
      isCurrentMonth: false,
      isCustom: true,
    });
  });

  running += currentTargetAmount;
  breakdown.push({
    id: targetKey,
    year,
    month,
    monthLabel: `${INDONESIAN_MONTHS[month - 1] || `Bulan ${month}`} ${year}`,
    targetAmount: currentTargetAmount,
    runningCumulative: running,
    isCurrentMonth: true,
    isCustom: hasCustomTargetThisMonth,
  });

  const futureSavings = sorted.filter((s) => s.id > targetKey);
  futureSavings.forEach((s) => {
    running += s.targetAmount;
    breakdown.push({
      id: s.id,
      year: s.year,
      month: s.month,
      monthLabel: `${INDONESIAN_MONTHS[s.month - 1] || `Bulan ${s.month}`} ${s.year}`,
      targetAmount: s.targetAmount,
      runningCumulative: running,
      isCurrentMonth: false,
      isCustom: true,
    });
  });

  return {
    currentTargetAmount,
    hasCustomTargetThisMonth,
    cumulativeSavings,
    previousMonthTarget,
    breakdown,
  };
}
