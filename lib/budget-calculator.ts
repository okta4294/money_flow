import { Transaction } from "./firestore/transactions";
import { Category, isDebtCategoryName } from "./firestore/categories";
import { Debt } from "./firestore/debts";
import { formatRupiah } from "./utils";

export interface DebtObligation {
  debtId: string;
  debtName: string;
  remainingAmount: number;
  dueDate?: string;
  monthlyObligation: number;
  remainingMonths: number;
  isOverdue: boolean;
  isUrgent: boolean;
  isUpcoming?: boolean;
  hasNoDueDate: boolean;
}

export interface CategoryBudgetAllocation {
  categoryId: string;
  categoryName: string;
  isFixed: boolean;
  isEssential?: boolean;
  historicalAvg: number;
  weightPercent?: number;
  recommendedBudget: number;
  currentMonthSpent: number;
}

export type BudgetWarningSeverity = "info" | "warning" | "critical";

export interface BudgetWarning {
  id: string;
  title: string;
  description: string;
  severity: BudgetWarningSeverity;
}

export interface BudgetCycle {
  isPaydayCycle: boolean;
  startDate: string;
  endDate: string;
  label: string;
  paydayDate?: string;
  daysInCycle: number;
  remainingDays: number;
  isCurrentCycle: boolean;
}

export interface BudgetRecommendationResult {
  budgetCycle: BudgetCycle;
  paidDebtInCycle: number;
  pastDailyExpensesInCycle: number;
  pastEssentialExpensesInCycle: number;
  pastDiscretionaryExpensesInCycle: number;
  remainingFundsForDaily: number;
  remainingEssentialFunds: number;
  remainingDiscretionaryFunds: number;
  eligibleIncome: number;
  isIncomeEstimated: boolean;
  estimatedIncomeMonth?: string;
  eligibleCategoryNames: string[];
  debtObligations: DebtObligation[];
  totalDebtObligation: number;
  incomeAfterDebt: number;
  isDebtDeficit: boolean;

  categoryAllocations: CategoryBudgetAllocation[];
  totalFixedBudget: number;
  totalEssentialBudget: number;
  totalDiscretionaryBudget: number;
  totalVariableBudget: number;
  isColdStart: boolean;
  isScaledDown: boolean;

  fundsForDaily: number;
  remainingDays: number;
  totalDaysInMonth: number;
  dailyEssentialBudget: number;
  dailyDiscretionaryBudget: number;
  dailyBudget: number;

  warnings: BudgetWarning[];
}

export interface DailyLimitCheckResult {
  eligibleDailySpending: number;
  essentialDailySpending: number;
  discretionaryDailySpending: number;
  dailyBudget: number;
  dailyEssentialBudget: number;
  dailyDiscretionaryBudget: number;
  isOverBudget: boolean;
  isOverEssentialBudget: boolean;
  isOverDiscretionaryBudget: boolean;
  overAmount: number;
  excludedCount: number;
}

/**
 * Filter kategori pemasukan rutin yang berhak menjadi dasar perhitungan budget.
 * Memprioritaskan flag isEligibleForBudget. Jika belum diset, menggunakan kata kunci standar.
 */
export function isEligibleIncomeCategory(category: Category | undefined): boolean {
  if (!category || category.type !== "income") return false;
  if (typeof category.isEligibleForBudget === "boolean") {
    return category.isEligibleForBudget;
  }
  const name = category.name.toLowerCase().trim();
  return (
    name.includes("gaji") ||
    name.includes("uang saku") ||
    name.includes("uang bulanan") ||
    name.includes("salary") ||
    name.includes("allowance")
  );
}

/**
 * Cek apakah string merujuk pada pengeluaran tetap bulanan / tagihan rutin.
 */
export function isFixedExpenseName(name: string | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  return (
    lower.includes("kos") ||
    lower.includes("kost") ||
    lower.includes("indekos") ||
    lower.includes("tagihan") ||
    lower.includes("tagian") ||
    lower.includes("bill") ||
    lower.includes("billing") ||
    lower.includes("listrik") ||
    lower.includes("pln") ||
    lower.includes("token") ||
    lower.includes("pdam") ||
    lower.includes("air") ||
    lower.includes("wifi") ||
    lower.includes("internet") ||
    lower.includes("indihome") ||
    lower.includes("biznet") ||
    lower.includes("myrepublic") ||
    lower.includes("first media") ||
    lower.includes("orbit") ||
    lower.includes("laundry") ||
    lower.includes("cucian") ||
    lower.includes("belanja bulanan") ||
    lower.includes("kebutuhan bulanan") ||
    lower.includes("sewa") ||
    lower.includes("kontrakan") ||
    lower.includes("pulsa") ||
    lower.includes("paket data") ||
    lower.includes("kuota") ||
    lower.includes("iuran") ||
    lower.includes("ipl") ||
    lower.includes("retribusi") ||
    lower.includes("sampah") ||
    lower.includes("keamanan") ||
    lower.includes("bpjs") ||
    lower.includes("asuransi") ||
    lower.includes("insurance") ||
    lower.includes("langganan") ||
    lower.includes("subscription") ||
    lower.includes("netflix") ||
    lower.includes("spotify")
  );
}

/**
 * Cek apakah kategori pengeluaran merupakan pengeluaran tetap bulanan.
 * Memprioritaskan flag isFixedExpense. Jika belum diset, menggunakan kata kunci standar.
 */
export function isFixedExpenseCategory(category: Category | undefined): boolean {
  if (!category || category.type !== "expense") return false;
  if (typeof category.isFixedExpense === "boolean") {
    return category.isFixedExpense;
  }
  return isFixedExpenseName(category.name);
}

/**
 * Cek apakah kategori pengeluaran merupakan kebutuhan pokok hidup harian (makan, pangan, sembako, bensin, kesehatan, belanja dapur/pasar).
 * Kategori ini diprioritaskan agar tidak terpotong drastis saat terjadi pengetatan budget akibat beban hutang.
 * Memprioritaskan flag isEssentialExpense jika diset manual oleh user.
 */
export function isEssentialExpenseCategory(category: Category | undefined): boolean {
  if (!category || category.type !== "expense") return false;
  if (category.isFixedExpense === true) return false;
  if (typeof category.isEssentialExpense === "boolean") {
    return category.isEssentialExpense;
  }
  if (isFixedExpenseCategory(category)) {
    return false;
  }
  const name = category.name.toLowerCase().trim();
  return (
    name.includes("makan") ||
    name.includes("minum") ||
    name.includes("pangan") ||
    name.includes("food") ||
    name.includes("sembako") ||
    name.includes("groceries") ||
    name.includes("belanja") ||
    name.includes("dapur") ||
    name.includes("pasar") ||
    name.includes("sayur") ||
    name.includes("supermarket") ||
    name.includes("bensin") ||
    name.includes("bbm") ||
    name.includes("transport") ||
    name.includes("obat") ||
    name.includes("kesehatan")
  );
}

export { isDebtCategoryName };

function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  const parts = dateStr.split("-");
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m, day: d };
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function diffDays(d1Str: string, d2Str: string): number {
  const t1 = new Date(`${d1Str}T00:00:00Z`).getTime();
  const t2 = new Date(`${d2Str}T00:00:00Z`).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

function getEstimatedNextCycleEnd(startDateStr: string): string {
  const p = parseDateParts(startDateStr);
  if (!p) return startDateStr;
  let nextYear = p.year;
  let nextMonth = p.month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const maxDaysNextMonth = getDaysInMonth(nextYear, nextMonth);
  const targetDay = Math.min(p.day, maxDaysNextMonth);
  const nextPaydayStr = formatDateStr(nextYear, nextMonth, targetDay);
  return addDays(nextPaydayStr, -1);
}

/**
 * Deteksi otomatis siklus anggaran berbasis tanggal gajian (Payday Cycle).
 * Mengidentifikasi tanggal transaksi pemasukan utama secara adaptif jika tanggal bergeser karena libur.
 */
export function detectBudgetCycle(params: {
  year: number;
  month: number;
  todayDateStr: string;
  allTransactions: Transaction[];
  categories: Category[];
}): BudgetCycle {
  const { year, month, todayDateStr, allTransactions, categories } = params;

  const eligibleCategories = categories.filter(isEligibleIncomeCategory);
  const eligibleCategoryIds = new Set(eligibleCategories.map((c) => c.id));

  const eligibleIncomes = allTransactions
    .filter((t) => t.type === "income" && eligibleCategoryIds.has(t.categoryId) && t.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysInCurrentMonth = getDaysInMonth(year, month);
  const defaultStartDate = formatDateStr(year, month, 1);
  const defaultEndDate = formatDateStr(year, month, daysInCurrentMonth);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  if (eligibleIncomes.length === 0) {
    const isCurrent =
      todayDateStr >= defaultStartDate && todayDateStr <= defaultEndDate;
    let remainingDays = daysInCurrentMonth;
    if (isCurrent) {
      remainingDays = Math.max(1, diffDays(todayDateStr, defaultEndDate) + 1);
    } else if (todayDateStr > defaultEndDate) {
      remainingDays = 1;
    }

    return {
      isPaydayCycle: false,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      label: `${monthNames[month - 1]} ${year}`,
      daysInCycle: daysInCurrentMonth,
      remainingDays,
      isCurrentCycle: isCurrent,
    };
  }

  const targetMonthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const incomesInTargetMonth = eligibleIncomes.filter((t) =>
    t.date.startsWith(targetMonthPrefix)
  );

  let anchorIncome: Transaction | undefined;
  if (incomesInTargetMonth.length > 0) {
    anchorIncome = [...incomesInTargetMonth].sort((a, b) => b.amount - a.amount)[0];
  } else {
    const incomesBefore = eligibleIncomes.filter((t) => t.date < targetMonthPrefix);
    if (incomesBefore.length > 0) {
      anchorIncome = incomesBefore[incomesBefore.length - 1];
    } else {
      anchorIncome = eligibleIncomes[0];
    }
  }

  const cycleStartDate = anchorIncome.date;
  const pStart = parseDateParts(cycleStartDate)!;

  const nextIncomes = eligibleIncomes.filter((t) => t.date > cycleStartDate);
  let cycleEndDate = "";
  if (nextIncomes.length > 0) {
    cycleEndDate = addDays(nextIncomes[0].date, -1);
  } else {
    cycleEndDate = getEstimatedNextCycleEnd(cycleStartDate);
  }

  if (cycleEndDate < cycleStartDate) {
    cycleEndDate = cycleStartDate;
  }

  const totalDays = Math.max(1, diffDays(cycleStartDate, cycleEndDate) + 1);
  const isCurrent = todayDateStr >= cycleStartDate && todayDateStr <= cycleEndDate;

  let remainingDays = totalDays;
  if (isCurrent) {
    remainingDays = Math.max(1, diffDays(todayDateStr, cycleEndDate) + 1);
  } else if (todayDateStr > cycleEndDate) {
    remainingDays = 1;
  }

  const startDay = pStart.day;
  const pEnd = parseDateParts(cycleEndDate)!;
  const shortMonthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const label = `${startDay} ${shortMonthNames[pStart.month - 1]} – ${pEnd.day} ${shortMonthNames[pEnd.month - 1]} ${pEnd.year}`;

  return {
    isPaydayCycle: true,
    startDate: cycleStartDate,
    endDate: cycleEndDate,
    label,
    paydayDate: cycleStartDate,
    daysInCycle: totalDays,
    remainingDays,
    isCurrentCycle: isCurrent,
  };
}

/**
 * Hitung selisih bulan kalender antara tanggal jatuh tempo dengan bulan yang sedang dilihat.
 */
function getRemainingMonths(dueDateStr: string, currentYear: number, currentMonth: number): number {
  const parts = dueDateStr.split("-");
  if (parts.length < 2) return 0;
  const dueYear = parseInt(parts[0], 10);
  const dueMonth = parseInt(parts[1], 10);
  if (isNaN(dueYear) || isNaN(dueMonth)) return 0;

  return (dueYear - currentYear) * 12 + (dueMonth - currentMonth);
}

/**
 * Engine utama kalkulasi rekomendasi budget bulanan dan harian.
 */
export function calculateBudgetRecommendation(params: {
  year: number;
  month: number;
  todayDateStr: string;
  currentTransactions: Transaction[];
  historicalExpenses: Transaction[];
  historicalIncomes?: Transaction[];
  categories: Category[];
  activeDebts: Debt[];
  allTransactions?: Transaction[];
  budgetCycle?: BudgetCycle;
}): BudgetRecommendationResult {
  const {
    year,
    month,
    todayDateStr,
    currentTransactions,
    historicalExpenses,
    historicalIncomes = [],
    categories,
    activeDebts,
    allTransactions = [],
  } = params;

  const warnings: BudgetWarning[] = [];

  const eligibleCategories = categories.filter(isEligibleIncomeCategory);
  const eligibleCategoryIds = new Set(eligibleCategories.map((c) => c.id));
  const eligibleCategoryNames = eligibleCategories.map((c) => c.name);

  // Pool seluruh transaksi yang tersedia untuk mendeteksi siklus dan rentang tanggal
  const mergedTransactions =
    allTransactions.length > 0
      ? allTransactions
      : [...historicalIncomes, ...historicalExpenses, ...currentTransactions];

  const cycle =
    params.budgetCycle ||
    detectBudgetCycle({
      year,
      month,
      todayDateStr,
      allTransactions: mergedTransactions,
      categories,
    });

  // Filter transaksi yang termasuk di dalam rentang siklus yang aktif
  const cycleTransactions = cycle.isPaydayCycle
    ? mergedTransactions.filter(
        (t) => t.date && t.date >= cycle.startDate && t.date <= cycle.endDate
      )
    : currentTransactions;

  const currentEligibleIncome = cycleTransactions
    .filter((t) => t.type === "income" && eligibleCategoryIds.has(t.categoryId))
    .reduce((sum, t) => sum + t.amount, 0);

  // Cari total pemasukan utama dari riwayat bulan sebelumnya
  let recentHistoricalIncome = 0;
  let recentHistoricalMonth = "";

  if (historicalIncomes.length > 0) {
    const incomeByMonth = new Map<string, number>();
    historicalIncomes.forEach((t) => {
      if (t.type === "income" && eligibleCategoryIds.has(t.categoryId) && t.date) {
        const monthKey = t.date.substring(0, 7);
        const prevTotal = incomeByMonth.get(monthKey) || 0;
        incomeByMonth.set(monthKey, prevTotal + t.amount);
      }
    });

    const sortedMonths = Array.from(incomeByMonth.keys()).sort().reverse();
    for (const mKey of sortedMonths) {
      const historicalAmount = incomeByMonth.get(mKey) || 0;
      if (historicalAmount > 0) {
        recentHistoricalIncome = historicalAmount;
        recentHistoricalMonth = mKey;
        break;
      }
    }
  }

  let eligibleIncome = currentEligibleIncome;
  let isIncomeEstimated = false;
  let estimatedIncomeMonth: string | undefined = undefined;

  if (recentHistoricalIncome > 0 && currentEligibleIncome < recentHistoricalIncome) {
    eligibleIncome = recentHistoricalIncome;
    isIncomeEstimated = true;
    estimatedIncomeMonth = recentHistoricalMonth;
  }

  if (eligibleCategories.length === 0) {
    warnings.push({
      id: "no-eligible-categories",
      title: "Kategori Pemasukan Belum Ditandai",
      description:
        "Tandai kategori pemasukan rutin (Gaji, Uang Saku, atau Uang Bulanan) di menu Categories sebagai Dasar Budget.",
      severity: "warning",
    });
  } else if (isIncomeEstimated) {
    warnings.push({
      id: "estimated-income",
      title: "Menggunakan Proyeksi Pemasukan Rutin",
      description: `Akumulasi siklus ini (${formatRupiah(currentEligibleIncome)}) masih di bawah acuan ${estimatedIncomeMonth} (${formatRupiah(eligibleIncome)}). Sistem menggunakan proyeksi ${formatRupiah(eligibleIncome)} agar batas harian tetap stabil.`,
      severity: "info",
    });
  } else if (eligibleIncome === 0) {
    warnings.push({
      id: "zero-eligible-income",
      title: "Belum Ada Pemasukan Utama",
      description:
        "Belum ada catatan pemasukan rutin (Gaji, Uang Saku, atau Uang Bulanan) di siklus ini maupun riwayat sebelumnya.",
      severity: "info",
    });
  }

  // Hitung pembayaran hutang yang sudah terjadi di dalam siklus ini (cash-out)
  let paidDebtInCycle = 0;
  cycleTransactions.forEach((t) => {
    if (t.type === "expense" && (t.debtId || isDebtCategoryName(t.category))) {
      paidDebtInCycle += t.amount;
    }
  });

  let hasOverdueDebt = false;
  let hasNoDueDateCount = 0;

  const debtObligations: DebtObligation[] = activeDebts.map((debt) => {
    if (!debt.dueDate) {
      hasNoDueDateCount += 1;
      return {
        debtId: debt.id,
        debtName: debt.name,
        remainingAmount: debt.remainingAmount,
        monthlyObligation: 0,
        remainingMonths: 0,
        isOverdue: false,
        isUrgent: false,
        hasNoDueDate: true,
      };
    }

    let monthlyObligation = 0;
    let isOverdue = false;
    let isUrgent = false;
    let isUpcoming = false;

    if (cycle.isPaydayCycle) {
      if (debt.dueDate < cycle.startDate) {
        isOverdue = true;
        isUrgent = true;
        hasOverdueDebt = true;
        monthlyObligation = debt.remainingAmount;
      } else if (debt.dueDate >= cycle.startDate && debt.dueDate <= cycle.endDate) {
        isUrgent = true;
        monthlyObligation = debt.remainingAmount;
      } else {
        isUpcoming = true;
        monthlyObligation = 0;
      }
    } else {
      const remainingMonths = getRemainingMonths(debt.dueDate, year, month);
      if (remainingMonths < 0) {
        isOverdue = true;
        isUrgent = true;
        hasOverdueDebt = true;
        monthlyObligation = debt.remainingAmount;
      } else if (remainingMonths === 0) {
        isUrgent = true;
        monthlyObligation = debt.remainingAmount;
      } else {
        isUpcoming = true;
        monthlyObligation = 0;
      }
    }

    return {
      debtId: debt.id,
      debtName: debt.name,
      remainingAmount: debt.remainingAmount,
      dueDate: debt.dueDate,
      monthlyObligation,
      remainingMonths: getRemainingMonths(debt.dueDate, year, month),
      isOverdue,
      isUrgent,
      isUpcoming,
      hasNoDueDate: false,
    };
  });

  if (hasOverdueDebt) {
    warnings.push({
      id: "debt-overdue",
      title: "Hutang Melewati Jatuh Tempo",
      description:
        "Terdapat hutang jatuh tempo yang belum lunas. Sisa nominal dimasukkan penuh ke kewajiban siklus ini.",
      severity: "critical",
    });
  }

  if (hasNoDueDateCount > 0) {
    warnings.push({
      id: "debt-no-duedate",
      title: "Hutang Tanpa Tanggal Tenor",
      description: `${hasNoDueDateCount} hutang belum memiliki tanggal jatuh tempo sehingga belum dihitung cicilan bulanannya.`,
      severity: "info",
    });
  }

  if (paidDebtInCycle > 0) {
    warnings.push({
      id: "debt-paid-in-cycle",
      title: "Cicilan Telah Terbayar di Siklus Ini",
      description: `Pembayaran cicilan sebesar ${formatRupiah(paidDebtInCycle)} telah terealisasi di dalam siklus ini dan langsung memotong dana bebas.`,
      severity: "info",
    });
  }

  const unpaidDebtObligation = debtObligations.reduce(
    (sum, d) => sum + d.monthlyObligation,
    0
  );
  const totalDebtObligation = unpaidDebtObligation + paidDebtInCycle;

  const isDebtDeficit = totalDebtObligation >= eligibleIncome && eligibleIncome > 0;
  const incomeAfterDebt = Math.max(0, eligibleIncome - totalDebtObligation);

  if (isDebtDeficit) {
    warnings.push({
      id: "debt-deficit",
      title: "Kewajiban Hutang Melebihi Pemasukan",
      description:
        "Kewajiban cicilan bulan ini menyerap seluruh pemasukan utama. Fokuskan dana untuk melunasi kewajiban.",
      severity: "critical",
    });
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const historicalMonthSet = new Set<string>();
  historicalExpenses.forEach((t) => {
    if (t.date && t.date.length >= 7) {
      historicalMonthSet.add(t.date.substring(0, 7));
    }
  });
  const historicalMonthsCount = Math.max(1, historicalMonthSet.size);
  const isColdStart = historicalExpenses.length === 0;

  if (isColdStart && eligibleIncome > 0) {
    warnings.push({
      id: "cold-start",
      title: "Belum Ada Riwayat Transaksi Lampau",
      description:
        "Rekomendasi harian dihitung langsung dari sisa pemasukan karena data pengeluaran bulan lalu belum tersedia.",
      severity: "info",
    });
  }

  // Urutkan bulan-bulan historis dari yang paling baru ke yang lebih lama
  const sortedHistoricalMonths = Array.from(historicalMonthSet).sort().reverse();

  if (sortedHistoricalMonths.length > 1) {
    warnings.push({
      id: "weighted-history",
      title: "Rekomendasi Berbasis Pembobotan Tren",
      description: `Rata-rata pengeluaran dihitung dengan pembobotan tren ${sortedHistoricalMonths.length} bulan terakhir, memprioritaskan bulan terdekat agar target anggaran proporsional.`,
      severity: "info",
    });
  }

  // Tentukan bobot untuk tiap bulan lampau (recency weighting: 3 untuk bulan terdekat, 2 untuk kedua, 1 untuk ketiga dst)
  const monthWeights = new Map<string, number>();
  let totalMonthWeights = 0;
  sortedHistoricalMonths.forEach((mKey, idx) => {
    const weight = idx === 0 ? 3 : idx === 1 ? 2 : 1;
    monthWeights.set(mKey, weight);
    totalMonthWeights += weight;
  });
  if (totalMonthWeights === 0) totalMonthWeights = 1;

  // Kelompokkan pengeluaran per kategori per bulan
  const categoryMonthSpent = new Map<string, Map<string, number>>();
  historicalExpenses.forEach((t) => {
    if (t.type === "expense" && t.categoryId && t.date && t.date.length >= 7) {
      const mKey = t.date.substring(0, 7);
      if (!categoryMonthSpent.has(t.categoryId)) {
        categoryMonthSpent.set(t.categoryId, new Map());
      }
      const catMap = categoryMonthSpent.get(t.categoryId)!;
      catMap.set(mKey, (catMap.get(mKey) || 0) + t.amount);
    }
  });

  const currentCategorySpent = new Map<string, number>();
  cycleTransactions.forEach((t) => {
    if (t.type === "expense" && t.categoryId) {
      const current = currentCategorySpent.get(t.categoryId) || 0;
      currentCategorySpent.set(t.categoryId, current + t.amount);
    }
  });

  let rawFixedTotal = 0;
  let rawVariableTotal = 0;
  let rawEssentialVariableTotal = 0;
  let rawDiscretionaryVariableTotal = 0;

  // Hitung rata-rata berbobot awal per kategori
  const initialCategoryAvgs = expenseCategories.map((cat) => {
    const catMap = categoryMonthSpent.get(cat.id);
    let weightedSpentSum = 0;
    if (catMap) {
      sortedHistoricalMonths.forEach((mKey) => {
        const spent = catMap.get(mKey) || 0;
        const weight = monthWeights.get(mKey) || 1;
        weightedSpentSum += spent * weight;
      });
    }
    const historicalAvg = Math.round(weightedSpentSum / totalMonthWeights);
    const isFixed = isFixedExpenseCategory(cat);
    const isEssential = !isFixed && isEssentialExpenseCategory(cat);

    if (isFixed) {
      rawFixedTotal += historicalAvg;
    } else {
      rawVariableTotal += historicalAvg;
      if (isEssential) {
        rawEssentialVariableTotal += historicalAvg;
      } else {
        rawDiscretionaryVariableTotal += historicalAvg;
      }
    }

    return {
      cat,
      isFixed,
      isEssential,
      historicalAvg,
    };
  });

  const totalVariableForWeight = rawVariableTotal || 1;

  const rawAllocations = initialCategoryAvgs.map(({ cat, isFixed, isEssential, historicalAvg }) => {
    const weightPercent = !isFixed
      ? Math.round((historicalAvg / totalVariableForWeight) * 100)
      : undefined;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      isFixed,
      isEssential,
      historicalAvg,
      weightPercent,
      recommendedBudget: historicalAvg,
      currentMonthSpent: currentCategorySpent.get(cat.id) || 0,
    };
  });

  let isScaledDown = false;
  let finalFixedTotal = rawFixedTotal;
  let finalEssentialTotal = rawEssentialVariableTotal;
  let finalDiscretionaryTotal = rawDiscretionaryVariableTotal;
  let finalVariableTotal = rawVariableTotal;

  let categoryAllocations: CategoryBudgetAllocation[] = [];

  const essentialCats = rawAllocations.filter((a) => !a.isFixed && a.isEssential);
  const discretionaryCats = rawAllocations.filter((a) => !a.isFixed && !a.isEssential);

  if (incomeAfterDebt === 0) {
    categoryAllocations = rawAllocations.map((a) => ({
      ...a,
      recommendedBudget: 0,
    }));
    finalFixedTotal = 0;
    finalEssentialTotal = 0;
    finalDiscretionaryTotal = 0;
    finalVariableTotal = 0;
  } else if (incomeAfterDebt <= rawFixedTotal) {
    isScaledDown = true;
    const fixedScale = incomeAfterDebt / (rawFixedTotal || 1);
    categoryAllocations = rawAllocations.map((a) => {
      if (a.isFixed) {
        return {
          ...a,
          recommendedBudget: Math.round(a.historicalAvg * fixedScale),
        };
      }
      return { ...a, recommendedBudget: 0 };
    });
    finalFixedTotal = incomeAfterDebt;
    finalEssentialTotal = 0;
    finalDiscretionaryTotal = 0;
    finalVariableTotal = 0;

    warnings.push({
      id: "budget-deficit-fixed",
      title: "Pengetatan Ekstrem Beban Hutang",
      description:
        "Sisa pemasukan setelah dipotong cicilan hutang tidak cukup menutup biaya tetap bulanan. Seluruh pos variabel dinolkan.",
      severity: "critical",
    });
  } else {
    // Sisa dana yang tersedia untuk Kebutuhan Pokok & Sekunder/Variabel
    finalFixedTotal = rawFixedTotal;
    const availableForVariable = incomeAfterDebt - rawFixedTotal;

    // Subcase 1: Cold start (belum ada riwayat pengeluaran pokok maupun sekunder)
    if (isColdStart || (rawEssentialVariableTotal === 0 && rawDiscretionaryVariableTotal === 0)) {
      if (essentialCats.length > 0 && discretionaryCats.length > 0) {
        // Fallback acuan: 75% kebutuhan pokok, 25% kebutuhan sekunder
        const targetEssential = Math.round(availableForVariable * 0.75);
        const targetDiscretionary = availableForVariable - targetEssential;

        const essentialPerCat = Math.floor(targetEssential / essentialCats.length);
        const discretionaryPerCat = Math.floor(targetDiscretionary / discretionaryCats.length);

        categoryAllocations = rawAllocations.map((a) => {
          if (a.isFixed) return a;
          if (a.isEssential) {
            return { ...a, recommendedBudget: essentialPerCat };
          }
          return { ...a, recommendedBudget: discretionaryPerCat };
        });

        finalEssentialTotal = targetEssential;
        finalDiscretionaryTotal = targetDiscretionary;
      } else if (essentialCats.length > 0) {
        const essentialPerCat = Math.floor(availableForVariable / essentialCats.length);
        categoryAllocations = rawAllocations.map((a) => {
          if (a.isFixed) return a;
          if (a.isEssential) return { ...a, recommendedBudget: essentialPerCat };
          return { ...a, recommendedBudget: 0 };
        });
        finalEssentialTotal = availableForVariable;
        finalDiscretionaryTotal = 0;
      } else if (discretionaryCats.length > 0) {
        const discretionaryPerCat = Math.floor(availableForVariable / discretionaryCats.length);
        categoryAllocations = rawAllocations.map((a) => {
          if (a.isFixed) return a;
          return { ...a, recommendedBudget: discretionaryPerCat };
        });
        finalEssentialTotal = 0;
        finalDiscretionaryTotal = availableForVariable;
      } else {
        categoryAllocations = rawAllocations;
        finalEssentialTotal = 0;
        finalDiscretionaryTotal = 0;
      }
      finalVariableTotal = finalEssentialTotal + finalDiscretionaryTotal;
    } else if (availableForVariable >= rawEssentialVariableTotal) {
      // Subcase 2: Kebutuhan Pokok Terpenuhi 100%!
      // Sisa dana (availableForVariable - rawEssentialVariableTotal) dialokasikan untuk kebutuhan sekunder.
      const remainingForDiscretionary = availableForVariable - rawEssentialVariableTotal;

      if (rawDiscretionaryVariableTotal > 0) {
        const discretionaryScale = remainingForDiscretionary / rawDiscretionaryVariableTotal;
        categoryAllocations = rawAllocations.map((a) => {
          if (a.isFixed) return a;
          if (a.isEssential) {
            return { ...a, recommendedBudget: a.historicalAvg };
          }
          return {
            ...a,
            recommendedBudget: Math.round(a.historicalAvg * discretionaryScale),
          };
        });

        if (discretionaryScale < 1) {
          isScaledDown = true;
          warnings.push({
            id: "budget-scaled-essential-safe",
            title: "Prioritas Kebutuhan Pokok Terlindungi",
            description:
              "Cicilan hutang menyerap sebagian pemasukan. Pos kebutuhan pokok makan dan transportasi dilindungi penuh (100%), sisa dana dialokasikan untuk pos sekunder/variabel.",
            severity: "info",
          });
        }
      } else if (discretionaryCats.length > 0) {
        // Jika histori sekunder 0 tapi kategori sekunder terdaftar, bagi rata
        const perCat = Math.floor(remainingForDiscretionary / discretionaryCats.length);
        categoryAllocations = rawAllocations.map((a) => {
          if (a.isFixed) return a;
          if (a.isEssential) return { ...a, recommendedBudget: a.historicalAvg };
          return { ...a, recommendedBudget: perCat };
        });
      } else {
        categoryAllocations = rawAllocations.map((a) => {
          if (a.isFixed) return a;
          if (a.isEssential) return { ...a, recommendedBudget: a.historicalAvg };
          return { ...a, recommendedBudget: 0 };
        });
      }

      finalEssentialTotal = rawEssentialVariableTotal;
      finalDiscretionaryTotal = discretionaryCats.length > 0 ? remainingForDiscretionary : 0;
      finalVariableTotal = finalEssentialTotal + finalDiscretionaryTotal;
    } else {
      // Subcase 3: Kondisi darurat - dana bahkan tidak cukup menutup kebutuhan pokok historis.
      isScaledDown = true;
      const essentialScale = availableForVariable / (rawEssentialVariableTotal || 1);

      categoryAllocations = rawAllocations.map((a) => {
        if (a.isFixed) return a;
        if (a.isEssential) {
          return {
            ...a,
            recommendedBudget: Math.round(a.historicalAvg * essentialScale),
          };
        }
        return { ...a, recommendedBudget: 0 };
      });

      finalEssentialTotal = availableForVariable;
      finalDiscretionaryTotal = 0;
      finalVariableTotal = availableForVariable;

      warnings.push({
        id: "budget-scaled-emergency",
        title: "Fokus Anggaran Pokok (Darurat)",
        description:
          "Dana tersisa sangat ketat akibat cicilan hutang. Seluruh pos sekunder dan hiburan dinolkan agar dana difokuskan untuk makan.",
        severity: "warning",
      });
    }
  }

  const totalFundsForDaily = Math.max(0, incomeAfterDebt - finalFixedTotal);

  // Hitung pengeluaran harian siklus yang sudah terjadi sebelum hari ini
  // (mengecualikan cicilan hutang dan tagihan tetap bulanan)
  let pastDailyExpensesInCycle = 0;
  let pastEssentialExpensesInCycle = 0;
  let pastDiscretionaryExpensesInCycle = 0;

  if (cycle.isCurrentCycle) {
    const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
    cycleTransactions.forEach((t) => {
      if (t.type !== "expense") return;
      if (!t.date || t.date >= todayDateStr) return; // Hanya transaksi sebelum hari ini

      // Kecualikan hutang / cicilan
      if (
        t.debtId ||
        (t.category && isDebtCategoryName(t.category)) ||
        (t.note && isDebtCategoryName(t.note))
      ) {
        return;
      }

      // Kecualikan tagihan tetap bulanan
      const cat = categoryMap.get(t.categoryId);
      if (isFixedExpenseCategory(cat)) return;
      if (t.category && isFixedExpenseName(t.category)) return;
      if (t.note && isFixedExpenseName(t.note)) return;

      const isEssential = isEssentialExpenseCategory(cat);
      if (isEssential) {
        pastEssentialExpensesInCycle += t.amount;
      } else {
        pastDiscretionaryExpensesInCycle += t.amount;
      }
      pastDailyExpensesInCycle += t.amount;
    });
  }

  // Sisa dana bebas yang benar-benar masih tersedia untuk hari ini dan sisa hari ke depan
  const remainingEssentialFunds = cycle.isCurrentCycle
    ? Math.max(0, finalEssentialTotal - pastEssentialExpensesInCycle)
    : finalEssentialTotal;

  const remainingDiscretionaryFunds = cycle.isCurrentCycle
    ? Math.max(0, finalDiscretionaryTotal - pastDiscretionaryExpensesInCycle)
    : finalDiscretionaryTotal;

  const remainingFundsForDaily = remainingEssentialFunds + remainingDiscretionaryFunds;

  const remainingDays = Math.max(1, cycle.remainingDays);
  const daysInCycle = cycle.daysInCycle;

  // Kuota harian adaptif berjalan: sisa dana riil dibagi sisa hari
  const dailyEssentialBudget = cycle.isCurrentCycle
    ? Math.floor(remainingEssentialFunds / remainingDays)
    : Math.floor(finalEssentialTotal / daysInCycle);

  const dailyDiscretionaryBudget = cycle.isCurrentCycle
    ? Math.floor(remainingDiscretionaryFunds / remainingDays)
    : Math.floor(finalDiscretionaryTotal / daysInCycle);

  const dailyBudget = dailyEssentialBudget + dailyDiscretionaryBudget;

  if (cycle.isCurrentCycle && totalFundsForDaily > 0 && remainingFundsForDaily === 0) {
    warnings.push({
      id: "daily-funds-exhausted",
      title: "Alokasi Harian Siklus Ini Telah Habis",
      description: `Pengeluaran harian yang telah terjadi (${formatRupiah(pastDailyExpensesInCycle)}) telah menyerap seluruh dana harian bebas (${formatRupiah(totalFundsForDaily)}).`,
      severity: "critical",
    });
  }

  return {
    budgetCycle: cycle,
    paidDebtInCycle,
    pastDailyExpensesInCycle,
    pastEssentialExpensesInCycle,
    pastDiscretionaryExpensesInCycle,
    remainingFundsForDaily,
    remainingEssentialFunds,
    remainingDiscretionaryFunds,
    eligibleIncome,
    isIncomeEstimated,
    estimatedIncomeMonth,
    eligibleCategoryNames,
    debtObligations,
    totalDebtObligation,
    incomeAfterDebt,
    isDebtDeficit,
    categoryAllocations,
    totalFixedBudget: finalFixedTotal,
    totalEssentialBudget: finalEssentialTotal,
    totalDiscretionaryBudget: finalDiscretionaryTotal,
    totalVariableBudget: finalVariableTotal,
    isColdStart,
    isScaledDown,
    fundsForDaily: remainingFundsForDaily,
    remainingDays,
    totalDaysInMonth: daysInCycle,
    dailyEssentialBudget,
    dailyDiscretionaryBudget,
    dailyBudget,
    warnings,
  };
}

/**
 * Evaluasi pengeluaran hari ini terhadap batas rekomendasi harian.
 * Mengecualikan pembayaran hutang dan tagihan tetap bulanan.
 */
export function evaluateDailySpendingLimit(params: {
  todayTransactions: Transaction[];
  categories: Category[];
  dailyBudget: number;
  dailyEssentialBudget?: number;
  dailyDiscretionaryBudget?: number;
}): DailyLimitCheckResult {
  const {
    todayTransactions,
    categories,
    dailyBudget,
    dailyEssentialBudget = 0,
    dailyDiscretionaryBudget = 0,
  } = params;

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  let eligibleDailySpending = 0;
  let essentialDailySpending = 0;
  let discretionaryDailySpending = 0;
  let excludedCount = 0;

  todayTransactions.forEach((t) => {
    if (t.type !== "expense") return;

    // 1. Pengecualian pembayaran hutang / cicilan / paylater
    if (
      t.debtId ||
      (t.category && isDebtCategoryName(t.category)) ||
      (t.note && isDebtCategoryName(t.note))
    ) {
      excludedCount += 1;
      return;
    }

    // 2. Pengecualian biaya tetap bulanan via kategori terdaftar
    const cat = categoryMap.get(t.categoryId);
    if (isFixedExpenseCategory(cat)) {
      excludedCount += 1;
      return;
    }

    // 3. Pengecualian via teks nama kategori transaksi (misal: "Tagihan", "Kos", "Listrik")
    if (t.category && isFixedExpenseName(t.category)) {
      excludedCount += 1;
      return;
    }

    // 4. Pengecualian via catatan transaksi jika pengguna menuliskan tagihan/kos/listrik
    if (t.note && isFixedExpenseName(t.note)) {
      excludedCount += 1;
      return;
    }

    const isEssential = isEssentialExpenseCategory(cat);
    if (isEssential) {
      essentialDailySpending += t.amount;
    } else {
      discretionaryDailySpending += t.amount;
    }

    eligibleDailySpending += t.amount;
  });

  const isOverBudget = dailyBudget > 0 && eligibleDailySpending > dailyBudget;
  const isOverEssentialBudget =
    dailyEssentialBudget > 0 && essentialDailySpending > dailyEssentialBudget;
  const isOverDiscretionaryBudget =
    dailyDiscretionaryBudget > 0 && discretionaryDailySpending > dailyDiscretionaryBudget;
  const overAmount = isOverBudget ? eligibleDailySpending - dailyBudget : 0;

  return {
    eligibleDailySpending,
    essentialDailySpending,
    discretionaryDailySpending,
    dailyBudget,
    dailyEssentialBudget,
    dailyDiscretionaryBudget,
    isOverBudget,
    isOverEssentialBudget,
    isOverDiscretionaryBudget,
    overAmount,
    excludedCount,
  };
}
