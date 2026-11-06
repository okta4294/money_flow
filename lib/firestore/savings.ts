import {
  doc,
  setDoc,
  getDoc,
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

export interface SavingsWithdrawal {
  id: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  note?: string;
  createdAt: string;
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
  callback: (savings: MonthlySaving[], withdrawals: SavingsWithdrawal[]) => void
) {
  const ref = userDocRef(userId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([], []);
        return;
      }
      const data = snapshot.data();
      const rawSavings = data.monthlySavings || {};
      const rawWithdrawals = (data.savingsWithdrawals || []) as SavingsWithdrawal[];
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

      const withdrawals = [...rawWithdrawals].sort((a, b) => {
        const dateCompare = (b.date || "").localeCompare(a.date || "");
        if (dateCompare !== 0) return dateCompare;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });

      callback(items, withdrawals);
    },
    (err) => {
      console.error("Gagal berlangganan data savings:", err);
      callback([], []);
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

/**
 * Mencatat penarikan dari dana tabungan pengguna
 */
export async function addSavingsWithdrawal(
  userId: string,
  withdrawal: { amount: number; date?: string; note?: string }
): Promise<string> {
  const ref = userDocRef(userId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const existing: SavingsWithdrawal[] = data.savingsWithdrawals || [];

  const id = `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowStr = new Date().toISOString();
  const newRecord: SavingsWithdrawal = {
    id,
    amount: Math.max(0, withdrawal.amount),
    date: withdrawal.date || nowStr.split("T")[0],
    ...(withdrawal.note?.trim() ? { note: withdrawal.note.trim() } : {}),
    createdAt: nowStr,
  };

  await setDoc(
    ref,
    {
      savingsWithdrawals: [newRecord, ...existing],
    },
    { merge: true }
  );
  return id;
}

/**
 * Menghapus catatan penarikan tabungan
 */
export async function deleteSavingsWithdrawal(
  userId: string,
  withdrawalId: string
): Promise<void> {
  const ref = userDocRef(userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const existing: SavingsWithdrawal[] = snap.data().savingsWithdrawals || [];
  const updated = existing.filter((w) => w.id !== withdrawalId);
  await setDoc(
    ref,
    {
      savingsWithdrawals: updated,
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
  cumulativeSavings: number; // Saldo bersih tabungan (gross - total penarikan)
  grossSavings: number; // Total akumulasi target kotor
  totalWithdrawn: number; // Total nominal yang sudah ditarik
  previousMonthTarget: number;
  breakdown: SavingBreakdownItem[];
  withdrawals: SavingsWithdrawal[];
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
  month: number,
  withdrawals: SavingsWithdrawal[] = []
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
  const grossSavings = pastCumulative + currentTargetAmount;

  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  const cumulativeSavings = Math.max(0, grossSavings - totalWithdrawn);

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
      monthLabel: `${INDONESIAN_MONTHS[s.month - 1] || `Bulan ${s.month}`} ${year}`,
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
    grossSavings,
    totalWithdrawn,
    previousMonthTarget,
    breakdown,
    withdrawals,
  };
}
