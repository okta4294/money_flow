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
  remainingBudget?: number;
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

export type BudgetSource = "eligible_only" | "all_income";
export type BudgetCalculationMode = "adaptive" | "strict_rollover";

export interface BudgetRecommendationResult {
  budgetCycle: BudgetCycle;
  budgetSource: BudgetSource;
  budgetCalculationMode: BudgetCalculationMode;
  paidDebtInCycle: number;
  pastDailyExpensesInCycle: number;
  pastEssentialExpensesInCycle: number;
  pastDiscretionaryExpensesInCycle: number;
  todayDailyExpensesInCycle?: number;
  todayEssentialExpensesInCycle?: number;
  todayDiscretionaryExpensesInCycle?: number;
  remainingFundsForDaily: number;
  currentBalance?: number;
  unpaidFixedObligation: number;
  availableBalanceForDaily?: number;
  targetAccountNames?: string[];
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

  monthlySavingTarget?: number;
  cumulativeSavings?: number;
  hasCustomTargetThisMonth?: boolean;

  savingsRecommendation?: SavingsRecommendation;

  warnings: BudgetWarning[];
}

export interface SavingsRecommendation {
  monthlyRecommended: number;
  weeklyRecommended: number;
  hasFixedIncome: boolean;
  fixedIncomeAmount: number;
  obligationsAmount: number;
  reason: string;
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

export function isFixedExpenseCategory(category: Category | undefined): boolean {
  if (!category || category.type !== "expense") return false;
  if (typeof category.isFixedExpense === "boolean") {
    return category.isFixedExpense;
  }
  return isFixedExpenseName(category.name);
}

export function isEssentialExpenseName(name: string | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  return (
    lower.includes("makan") ||
    lower.includes("minum") ||
    lower.includes("pangan") ||
    lower.includes("food") ||
    lower.includes("sembako") ||
    lower.includes("groceries") ||
    lower.includes("belanja") ||
    lower.includes("dapur") ||
    lower.includes("pasar") ||
    lower.includes("sayur") ||
    lower.includes("supermarket") ||
    lower.includes("bensin") ||
    lower.includes("bbm") ||
    lower.includes("transport") ||
    lower.includes("obat") ||
    lower.includes("kesehatan")
  );
}

export function isEssentialExpenseCategory(category: Category | undefined): boolean {
  if (!category || category.type !== "expense") return false;
  if (category.isFixedExpense === true) return false;
  if (typeof category.isEssentialExpense === "boolean") {
    return category.isEssentialExpense;
  }
  if (isFixedExpenseCategory(category)) {
    return false;
  }
  return isEssentialExpenseName(category.name);
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
    .filter(
      (t) =>
        t.type === "income" &&
        eligibleCategoryIds.has(t.categoryId) &&
        t.date
    )
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

function getRemainingMonths(dueDateStr: string, currentYear: number, currentMonth: number): number {
  const parts = dueDateStr.split("-");
  if (parts.length < 2) return 0;
  const dueYear = parseInt(parts[0], 10);
  const dueMonth = parseInt(parts[1], 10);
  if (isNaN(dueYear) || isNaN(dueMonth)) return 0;

  return (dueYear - currentYear) * 12 + (dueMonth - currentMonth);
}

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
  budgetSource?: BudgetSource;
  budgetCalculationMode?: BudgetCalculationMode;
  currentBalance?: number;
  targetAccountNames?: string[];
  monthlySavingTarget?: number;
  cumulativeSavings?: number;
  hasCustomTargetThisMonth?: boolean;
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
    budgetSource = "all_income",
    budgetCalculationMode = "adaptive",
    currentBalance,
    targetAccountNames,
    monthlySavingTarget = 0,
    cumulativeSavings,
    hasCustomTargetThisMonth = false,
  } = params;

  const savingTarget = Math.max(0, monthlySavingTarget);
  const cumulativeSavingsLocked = Math.max(0, cumulativeSavings ?? savingTarget);

  const isAllIncome = budgetSource === "all_income";
  const isStrictRollover = budgetCalculationMode === "strict_rollover";
  const warnings: BudgetWarning[] = [];

  const eligibleCategories = isAllIncome
    ? categories.filter((c) => c.type === "income")
    : categories.filter(isEligibleIncomeCategory);
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
    .filter((t) => t.type === "income" && (isAllIncome || eligibleCategoryIds.has(t.categoryId)))
    .reduce((sum, t) => sum + t.amount, 0);

  // Cari total pemasukan utama dari riwayat bulan sebelumnya
  let recentHistoricalIncome = 0;
  let recentHistoricalMonth = "";

  if (historicalIncomes.length > 0) {
    const incomeByMonth = new Map<string, number>();
    historicalIncomes.forEach((t) => {
      if (t.type === "income" && (isAllIncome || eligibleCategoryIds.has(t.categoryId)) && t.date) {
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

  if (!isAllIncome && eligibleCategories.length === 0) {
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
      title: isAllIncome ? "Proyeksi Seluruh Pemasukan" : "Proyeksi Pemasukan Rutin",
      description: `Akumulasi berjalan (${formatRupiah(currentEligibleIncome)}) masih di bawah acuan. Menggunakan proyeksi ${formatRupiah(eligibleIncome)} agar kuota belanja tetap stabil.`,
      severity: "info",
    });
  } else if (eligibleIncome === 0) {
    warnings.push({
      id: "zero-eligible-income",
      title: isAllIncome ? "Belum Ada Pemasukan" : "Belum Ada Pemasukan Utama",
      description: isAllIncome
        ? "Belum ada catatan pemasukan sama sekali di siklus ini maupun riwayat sebelumnya."
        : "Belum ada catatan pemasukan rutin (Gaji, Uang Saku, atau Uang Bulanan) di siklus ini maupun riwayat sebelumnya.",
      severity: "info",
    });
  }

  // Hitung pembayaran hutang yang sudah terjadi di dalam siklus ini (cash-out)
  let paidDebtInCycle = 0;
  cycleTransactions.forEach((t) => {
    if (t.type === "expense" && (t.debtId || isDebtCategoryName(t.category))) {
      paidDebtInCycle +=
        t.debtId && typeof t.debtPaymentAmount === "number"
          ? t.debtPaymentAmount
          : t.amount;
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
      title: "Hutang Tanpa Tenor",
      description: `${hasNoDueDateCount} hutang belum memiliki tanggal jatuh tempo sehingga belum dihitung cicilannya.`,
      severity: "info",
    });
  }

  if (paidDebtInCycle > 0) {
    warnings.push({
      id: "debt-paid-in-cycle",
      title: "Cicilan Telah Terbayar",
      description: `Pembayaran cicilan ${formatRupiah(paidDebtInCycle)} telah terealisasi di siklus ini dan memotong beban berjalan.`,
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

  const expenseCategories = categories.filter(
    (c) => c.type === "expense" && !isDebtCategoryName(c.name)
  );

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
      title: "Rekomendasi Berbasis Tren",
      description: `Target pengeluaran dihitung dari tren ${sortedHistoricalMonths.length} bulan terakhir dengan bobot bulan terdekat.`,
      severity: "info",
    });
  }

  // Tentukan bobot untuk tiap bulan lampau (recency weighting: 4 untuk bulan terdekat, 3 untuk kedua, 2 untuk ketiga, 1 untuk keempat dst)
  const monthWeights = new Map<string, number>();
  let totalMonthWeights = 0;
  sortedHistoricalMonths.forEach((mKey, idx) => {
    const weight = idx === 0 ? 4 : idx === 1 ? 3 : idx === 2 ? 2 : 1;
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

  const allocateVariableByRatio = (
    items: CategoryBudgetAllocation[],
    poolAmount: number
  ): CategoryBudgetAllocation[] => {
    const cleanPool = Math.max(0, Math.round(poolAmount));
    if (cleanPool === 0) {
      return items.map((a) => (a.isFixed ? a : { ...a, recommendedBudget: 0 }));
    }

    if (isColdStart || rawVariableTotal === 0) {
      if (essentialCats.length > 0 && discretionaryCats.length > 0) {
        const targetEssential = Math.round(cleanPool * 0.75);
        const targetDiscretionary = cleanPool - targetEssential;
        const essentialPerCat = Math.floor(targetEssential / essentialCats.length);
        const essentialRem = targetEssential - essentialPerCat * essentialCats.length;
        const discretionaryPerCat = Math.floor(targetDiscretionary / discretionaryCats.length);
        const discretionaryRem = targetDiscretionary - discretionaryPerCat * discretionaryCats.length;

        let eIdx = 0;
        let dIdx = 0;
        return items.map((a) => {
          if (a.isFixed) return a;
          if (a.isEssential) {
            const extra = eIdx === 0 ? essentialRem : 0;
            eIdx += 1;
            return { ...a, recommendedBudget: essentialPerCat + extra };
          }
          const extra = dIdx === 0 ? discretionaryRem : 0;
          dIdx += 1;
          return { ...a, recommendedBudget: discretionaryPerCat + extra };
        });
      }
      if (essentialCats.length > 0) {
        const perCat = Math.floor(cleanPool / essentialCats.length);
        const rem = cleanPool - perCat * essentialCats.length;
        let eIdx = 0;
        return items.map((a) => {
          if (a.isFixed) return a;
          if (a.isEssential) {
            const extra = eIdx === 0 ? rem : 0;
            eIdx += 1;
            return { ...a, recommendedBudget: perCat + extra };
          }
          return { ...a, recommendedBudget: 0 };
        });
      }
      if (discretionaryCats.length > 0) {
        const perCat = Math.floor(cleanPool / discretionaryCats.length);
        const rem = cleanPool - perCat * discretionaryCats.length;
        let dIdx = 0;
        return items.map((a) => {
          if (a.isFixed) return a;
          const extra = dIdx === 0 ? rem : 0;
          dIdx += 1;
          return { ...a, recommendedBudget: perCat + extra };
        });
      }
      return items;
    }

    let allocatedSum = 0;
    let maxWeightIdx = -1;
    let maxHistoricalAvg = -1;

    const next = items.map((a, idx) => {
      if (a.isFixed) return a;
      const share = a.historicalAvg / rawVariableTotal;
      const rec = Math.round(cleanPool * share);
      allocatedSum += rec;
      if (a.historicalAvg > maxHistoricalAvg) {
        maxHistoricalAvg = a.historicalAvg;
        maxWeightIdx = idx;
      }
      return { ...a, recommendedBudget: rec };
    });

    const diff = cleanPool - allocatedSum;
    if (diff !== 0 && maxWeightIdx >= 0) {
      next[maxWeightIdx] = {
        ...next[maxWeightIdx],
        recommendedBudget: Math.max(0, next[maxWeightIdx].recommendedBudget + diff),
      };
    }

    return next;
  };

  const incomeAfterDebtAndSavings = Math.max(0, incomeAfterDebt - savingTarget);

  if (incomeAfterDebtAndSavings === 0) {
    categoryAllocations = rawAllocations.map((a) => ({
      ...a,
      recommendedBudget: 0,
    }));
    finalFixedTotal = 0;
    finalEssentialTotal = 0;
    finalDiscretionaryTotal = 0;
    finalVariableTotal = 0;
  } else if (incomeAfterDebtAndSavings <= rawFixedTotal) {
    isScaledDown = true;
    const fixedScale = incomeAfterDebtAndSavings / (rawFixedTotal || 1);
    categoryAllocations = rawAllocations.map((a) => {
      if (a.isFixed) {
        return {
          ...a,
          recommendedBudget: Math.round(a.historicalAvg * fixedScale),
        };
      }
      return { ...a, recommendedBudget: 0 };
    });
    finalFixedTotal = incomeAfterDebtAndSavings;
    finalEssentialTotal = 0;
    finalDiscretionaryTotal = 0;
    finalVariableTotal = 0;

    warnings.push({
      id: "budget-deficit-fixed",
      title: "Pengetatan Ekstrem Beban Hutang & Tabungan",
      description:
        "Sisa pemasukan setelah dipotong cicilan hutang dan target tabungan tidak cukup menutup biaya tetap bulanan. Seluruh pos variabel dinolkan.",
      severity: "critical",
    });
  } else {
    // Sisa dana yang tersedia untuk Kebutuhan Pokok & Sekunder/Variabel sesuai rasio historis
    finalFixedTotal = rawFixedTotal;
    const availableForVariable = incomeAfterDebtAndSavings - rawFixedTotal;

    categoryAllocations = allocateVariableByRatio(rawAllocations, availableForVariable);
    if (rawVariableTotal > 0 && availableForVariable < rawVariableTotal) {
      isScaledDown = true;
    }

    finalEssentialTotal = categoryAllocations
      .filter((a) => !a.isFixed && a.isEssential)
      .reduce((sum, a) => sum + a.recommendedBudget, 0);
    finalDiscretionaryTotal = categoryAllocations
      .filter((a) => !a.isFixed && !a.isEssential)
      .reduce((sum, a) => sum + a.recommendedBudget, 0);
    finalVariableTotal = finalEssentialTotal + finalDiscretionaryTotal;
  }

  const totalFundsForDaily = Math.max(0, incomeAfterDebtAndSavings - finalFixedTotal);

  // Hitung pengeluaran harian siklus yang sudah terjadi sebelum hari ini
  // serta pengeluaran harian yang sudah terjadi hari ini (mengecualikan cicilan hutang dan tagihan tetap)
  let pastDailyExpensesInCycle = 0;
  let pastEssentialExpensesInCycle = 0;
  let pastDiscretionaryExpensesInCycle = 0;

  let todayDailyExpensesInCycle = 0;
  let todayEssentialExpensesInCycle = 0;
  let todayDiscretionaryExpensesInCycle = 0;

  let cycleWalletVariableSpent = 0;
  let todayWalletVariableSpent = 0;
  const todaySpentByCat = new Map<string, number>();
  const hasAccounts = Boolean(targetAccountNames && targetAccountNames.length > 0);

  if (cycle.isCurrentCycle) {
    const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
    cycleTransactions.forEach((t) => {
      if (t.type !== "expense") return;
      if (!t.date) return;

      const cat = t.categoryId ? categoryMap.get(t.categoryId) : undefined;

      // Kecualikan hutang / cicilan
      const isDebt = Boolean(
        t.debtId ||
        (cat ? isDebtCategoryName(cat.name) : ((t.category && isDebtCategoryName(t.category)) || (t.note && isDebtCategoryName(t.note))))
      );
      if (isDebt) return;

      // Kecualikan tagihan tetap bulanan
      // Prioritaskan konfigurasi kategori (isFixedExpense). Hanya gunakan deteksi nama teks jika kategori tidak ditemukan.
      const isFixed = cat
        ? isFixedExpenseCategory(cat)
        : Boolean((t.category && isFixedExpenseName(t.category)) || (t.note && isFixedExpenseName(t.note)));
      if (isFixed) return;

      const isEssential = cat
        ? isEssentialExpenseCategory(cat)
        : Boolean(t.category && isEssentialExpenseName(t.category));

      const affectsWallet = !hasAccounts || Boolean(t.accountId);
      if (affectsWallet) {
        cycleWalletVariableSpent += t.amount;
      }

      if (t.date < todayDateStr) {
        if (isEssential) {
          pastEssentialExpensesInCycle += t.amount;
        } else {
          pastDiscretionaryExpensesInCycle += t.amount;
        }
        pastDailyExpensesInCycle += t.amount;
      } else if (t.date === todayDateStr) {
        if (isEssential) {
          todayEssentialExpensesInCycle += t.amount;
        } else {
          todayDiscretionaryExpensesInCycle += t.amount;
        }
        todayDailyExpensesInCycle += t.amount;
        if (affectsWallet) {
          todayWalletVariableSpent += t.amount;
        }
        if (t.categoryId) {
          todaySpentByCat.set(t.categoryId, (todaySpentByCat.get(t.categoryId) || 0) + t.amount);
        }
      }
    });
  }

  // Sisa dana bebas yang benar-benar masih tersedia untuk hari ini dan sisa hari ke depan
  // Dilengkapi cross-quota deficit offset: overspending pada sekunder memotong dana pokok riil, dan sebaliknya
  let remainingEssentialFunds = finalEssentialTotal;
  let remainingDiscretionaryFunds = finalDiscretionaryTotal;

  // Mode Saldo Riil: anggaran & dana harian dihitung langsung dari Saldo Bersih memakai rasio bulan-bulan sebelumnya.
  const useBalance = cycle.isCurrentCycle && typeof currentBalance === "number";
  let unpaidFixedObligation = 0;
  let availableBalanceForDaily: number | undefined = undefined;

  if (useBalance) {
    unpaidFixedObligation = rawAllocations
      .filter((a) => a.isFixed)
      .reduce((sum, a) => sum + Math.max(0, a.historicalAvg - a.currentMonthSpent), 0);

    availableBalanceForDaily =
      (currentBalance as number) - unpaidDebtObligation - unpaidFixedObligation - cumulativeSavingsLocked;

    // Saldo bersih di awal hari ini (sebelum pengeluaran harian hari ini terjadi)
    // dan saldo bersih saat ini (livePool = Total Saldo Bersih di Dasbor).
    const startOfDayAvailableBalance = availableBalanceForDaily + todayWalletVariableSpent;
    const pool = Math.max(0, startOfDayAvailableBalance);
    const livePool = Math.max(0, availableBalanceForDaily);

    // Kapasitas uang bersih siklus penuh sebelum terpakai belanja variabel siklus ini,
    // sehingga target jatah siklus (recommendedBudget) stabil dan proporsional terhadap rasio historis.
    const cycleCleanPool = Math.max(livePool, availableBalanceForDaily + cycleWalletVariableSpent);

    if (rawVariableTotal > 0 && cycleCleanPool < rawVariableTotal) {
      isScaledDown = true;
    }

    const cycleAllocated = allocateVariableByRatio(rawAllocations, cycleCleanPool);

    // Hitung sisa anggaran per kategori (remainingBudget) agar jumlahnya selaras 100% dengan Saldo Bersih saat ini (livePool).
    const naturalRems = cycleAllocated.map((a) =>
      a.isFixed ? 0 : Math.max(0, a.recommendedBudget - a.currentMonthSpent)
    );
    const totalNaturalRem = naturalRems.reduce((sum, v) => sum + v, 0);

    if (livePool === 0) {
      categoryAllocations = cycleAllocated.map((a) => ({
        ...a,
        remainingBudget: a.isFixed
          ? Math.max(0, a.recommendedBudget - a.currentMonthSpent)
          : 0,
      }));
    } else if (totalNaturalRem > 0) {
      let remSum = 0;
      let maxRemIdx = -1;
      let maxNatVal = -1;

      const withRem = cycleAllocated.map((a, idx) => {
        if (a.isFixed) {
          return {
            ...a,
            remainingBudget: Math.max(0, a.recommendedBudget - a.currentMonthSpent),
          };
        }
        const nat = naturalRems[idx];
        const scaledRem =
          totalNaturalRem === livePool
            ? nat
            : Math.round(livePool * (nat / totalNaturalRem));
        remSum += scaledRem;
        if (nat > maxNatVal) {
          maxNatVal = nat;
          maxRemIdx = idx;
        }
        return {
          ...a,
          remainingBudget: scaledRem,
        };
      });

      const remDiff = livePool - remSum;
      if (remDiff !== 0 && maxRemIdx >= 0) {
        withRem[maxRemIdx] = {
          ...withRem[maxRemIdx],
          remainingBudget: Math.max(0, (withRem[maxRemIdx].remainingBudget || 0) + remDiff),
        };
      }
      categoryAllocations = withRem;
    } else {
      const fallbackLive = allocateVariableByRatio(rawAllocations, livePool);
      categoryAllocations = cycleAllocated.map((a, idx) => ({
        ...a,
        remainingBudget: a.isFixed
          ? Math.max(0, a.recommendedBudget - a.currentMonthSpent)
          : fallbackLive[idx].recommendedBudget,
      }));
    }

    // Kuota harian awal hari ini (pool) dibagi mengikuti sisa jatah sebelum pengeluaran hari ini sesuai rasio.
    let essentialStartNat = 0;
    let discretionaryStartNat = 0;
    categoryAllocations.forEach((a) => {
      if (a.isFixed) return;
      const spentToday = todaySpentByCat.get(a.categoryId) || 0;
      const spentBeforeToday = Math.max(0, a.currentMonthSpent - spentToday);
      const startNat = Math.max(0, a.recommendedBudget - spentBeforeToday);
      if (a.isEssential) {
        essentialStartNat += startNat;
      } else {
        discretionaryStartNat += startNat;
      }
    });
    const totalStartNat = essentialStartNat + discretionaryStartNat;

    if (pool === 0) {
      remainingEssentialFunds = 0;
      remainingDiscretionaryFunds = 0;
    } else if (totalStartNat > 0) {
      remainingEssentialFunds = Math.round(pool * (essentialStartNat / totalStartNat));
      remainingDiscretionaryFunds = pool - remainingEssentialFunds;
    } else {
      const startFallback = allocateVariableByRatio(rawAllocations, pool);
      remainingEssentialFunds = startFallback
        .filter((a) => !a.isFixed && a.isEssential)
        .reduce((sum, a) => sum + a.recommendedBudget, 0);
      remainingDiscretionaryFunds = pool - remainingEssentialFunds;
    }

    finalEssentialTotal = categoryAllocations
      .filter((a) => !a.isFixed && a.isEssential)
      .reduce((sum, a) => sum + a.recommendedBudget, 0);
    finalDiscretionaryTotal = categoryAllocations
      .filter((a) => !a.isFixed && !a.isEssential)
      .reduce((sum, a) => sum + a.recommendedBudget, 0);
    finalVariableTotal = finalEssentialTotal + finalDiscretionaryTotal;

    const accountLabel =
      targetAccountNames && targetAccountNames.length > 0
        ? ` (${targetAccountNames.join(", ")})`
        : " (Total Seluruh Akun)";

    if (cumulativeSavingsLocked > 0) {
      warnings.push({
        id: "savings-locked",
        title: "Target Tabungan Terkunci",
        description: `Dana tabungan sebesar ${formatRupiah(cumulativeSavingsLocked)} telah disisihkan dari saldo belanja agar aman hingga akhir bulan.`,
        severity: "info",
      });
    }

    const savingsNotice = cumulativeSavingsLocked > 0 ? `, tabungan terkunci ${formatRupiah(cumulativeSavingsLocked)}` : "";
    warnings.push({
      id: "balance-driven",
      title: "Dihitung dari Saldo Riil",
      description: `Saldo ${formatRupiah(currentBalance as number)}${accountLabel} dikurangi kewajiban${savingsNotice} menghasilkan sisa dana harian ${formatRupiah(pool)} untuk ${Math.max(1, cycle.remainingDays)} hari.`,
      severity: "info",
    });

    if (availableBalanceForDaily < 0) {
      warnings.push({
        id: "balance-insufficient",
        title: "Saldo Kurang untuk Menutup Kewajiban & Tabungan",
        description: `Saldo riil kurang ${formatRupiah(-availableBalanceForDaily)} untuk menutup hutang, tagihan tetap, dan target tabungan yang dikunci.`,
        severity: "critical",
      });
    }
  } else if (cycle.isCurrentCycle) {
    const rawRemainingEssential = finalEssentialTotal - pastEssentialExpensesInCycle;
    const rawRemainingDiscretionary = finalDiscretionaryTotal - pastDiscretionaryExpensesInCycle;

    if (rawRemainingDiscretionary < 0) {
      const deficit = -rawRemainingDiscretionary;
      remainingDiscretionaryFunds = 0;
      remainingEssentialFunds = Math.max(0, rawRemainingEssential - deficit);
    } else if (rawRemainingEssential < 0) {
      const deficit = -rawRemainingEssential;
      remainingEssentialFunds = 0;
      remainingDiscretionaryFunds = Math.max(0, rawRemainingDiscretionary - deficit);
    } else {
      remainingEssentialFunds = Math.max(0, rawRemainingEssential);
      remainingDiscretionaryFunds = Math.max(0, rawRemainingDiscretionary);
    }
  }

  const remainingFundsForDaily = remainingEssentialFunds + remainingDiscretionaryFunds;

  const remainingDays = Math.max(1, cycle.remainingDays);
  const daysInCycle = cycle.daysInCycle;

  // Kuota harian berjalan berdasarkan mode kalkulasi yang dipilih pengguna
  let dailyEssentialBudget = 0;
  let dailyDiscretionaryBudget = 0;

  if (!cycle.isCurrentCycle) {
    dailyEssentialBudget = Math.floor(finalEssentialTotal / daysInCycle);
    dailyDiscretionaryBudget = Math.floor(finalDiscretionaryTotal / daysInCycle);
  } else if (isStrictRollover) {
    // Mode Disiplin Ketat (Strict Daily Rollover / Carry-Forward 1:1)
    // Hak belanja dasar per hari
    const baseDailyEssential = Math.floor(finalEssentialTotal / daysInCycle);
    const baseDailyDiscretionary = Math.floor(finalDiscretionaryTotal / daysInCycle);

    // Hari ke-N dalam siklus (1-indexed sampai hari ini)
    const daysPassed = Math.max(0, diffDays(cycle.startDate, todayDateStr));
    const cumulativeDays = Math.min(daysInCycle, daysPassed + 1);

    // Akumulasi hak kuota sampai hari ini dikurangi pengeluaran sebelum hari ini
    const cumulativeEssentialAllowance = cumulativeDays * baseDailyEssential;
    const cumulativeDiscretionaryAllowance = cumulativeDays * baseDailyDiscretionary;

    const rawTodayEssential = cumulativeEssentialAllowance - pastEssentialExpensesInCycle;
    const rawTodayDiscretionary = cumulativeDiscretionaryAllowance - pastDiscretionaryExpensesInCycle;

    let todayEssential = 0;
    let todayDiscretionary = 0;

    if (rawTodayDiscretionary < 0) {
      const deficit = -rawTodayDiscretionary;
      todayDiscretionary = 0;
      todayEssential = Math.max(0, rawTodayEssential - deficit);
    } else if (rawTodayEssential < 0) {
      const deficit = -rawTodayEssential;
      todayEssential = 0;
      todayDiscretionary = Math.max(0, rawTodayDiscretionary - deficit);
    } else {
      todayEssential = Math.max(0, rawTodayEssential);
      todayDiscretionary = Math.max(0, rawTodayDiscretionary);
    }

    // Dibatasi oleh sisa dana bebas yang benar-benar tersisa di siklus
    dailyEssentialBudget = Math.min(todayEssential, remainingEssentialFunds);
    dailyDiscretionaryBudget = Math.min(todayDiscretionary, remainingDiscretionaryFunds);
  } else {
    // Mode Adaptif (Default Safe-to-Spend): Sisa dana dibagi sisa hari
    dailyEssentialBudget = Math.floor(remainingEssentialFunds / remainingDays);
    dailyDiscretionaryBudget = Math.floor(remainingDiscretionaryFunds / remainingDays);
  }

  const dailyBudget = dailyEssentialBudget + dailyDiscretionaryBudget;

  if (cycle.isCurrentCycle && !useBalance && totalFundsForDaily > 0 && remainingFundsForDaily === 0) {
    warnings.push({
      id: "daily-funds-exhausted",
      title: "Alokasi Harian Siklus Ini Telah Habis",
      description: `Pengeluaran harian yang telah terjadi (${formatRupiah(pastDailyExpensesInCycle)}) telah menyerap seluruh dana harian bebas (${formatRupiah(totalFundsForDaily)}).`,
      severity: "critical",
    });
  } else if (cycle.isCurrentCycle && dailyBudget === 0) {
    if (!warnings.some((w) => w.id === "debt-deficit" || w.id === "budget-deficit-fixed")) {
      warnings.push({
        id: "daily-budget-zero",
        title: "Batas Belanja Harian Rp 0",
        description: "Tidak ada alokasi belanja harian bebas yang tersedia untuk sisa siklus ini. Setiap pengeluaran harian akan menyebabkan defisit anggaran.",
        severity: "critical",
      });
    }
  } else if (cycle.isCurrentCycle && dailyDiscretionaryBudget === 0 && dailyEssentialBudget > 0) {
    if (!warnings.some((w) => w.id === "budget-scaled-emergency" || w.id === "budget-deficit-fixed")) {
      warnings.push({
        id: "daily-discretionary-zero",
        title: "Kuota Sekunder Rp 0 / Hari",
        description: `Alokasi untuk kebutuhan sekunder (jajan, hiburan, gaya hidup) adalah Rp 0/hari. Seluruh kuota harian (${formatRupiah(dailyEssentialBudget)}/hari) dikhususkan penuh untuk kebutuhan pokok (makan & bbm).`,
        severity: "warning",
      });
    }
  } else if (cycle.isCurrentCycle && dailyEssentialBudget === 0 && dailyDiscretionaryBudget > 0) {
    warnings.push({
      id: "daily-essential-zero",
      title: "Batas Pokok Harian Rp 0",
      description: "Alokasi kebutuhan pokok harian telah habis terserap pengeluaran sebelumnya.",
      severity: "warning",
    });
  }

  // Peringatan jika terdapat kategori pengeluaran dengan rekomendasi anggaran bulanan Rp 0
  const zeroBudgetCats = categoryAllocations.filter((a) => a.recommendedBudget === 0);
  if (zeroBudgetCats.length > 0 && !warnings.some((w) => w.id === "budget-deficit-fixed" || w.id === "debt-deficit")) {
    const catNames = zeroBudgetCats.map((c) => c.categoryName).slice(0, 3).join(", ") + (zeroBudgetCats.length > 3 ? `, dan ${zeroBudgetCats.length - 3} lainnya` : "");
    warnings.push({
      id: "zero-budget-categories",
      title: `${zeroBudgetCats.length} Kategori Tanpa Alokasi`,
      description: `Pos seperti ${catNames} sementara dialokasikan Rp 0 agar kebutuhan pokok terlindungi.`,
      severity: "warning",
    });
  }

  return {
    budgetCycle: cycle,
    paidDebtInCycle,
    pastDailyExpensesInCycle,
    pastEssentialExpensesInCycle,
    pastDiscretionaryExpensesInCycle,
    todayDailyExpensesInCycle,
    todayEssentialExpensesInCycle,
    todayDiscretionaryExpensesInCycle,
    remainingFundsForDaily,
    currentBalance: useBalance ? currentBalance : undefined,
    targetAccountNames,
    unpaidFixedObligation,
    availableBalanceForDaily,
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
    monthlySavingTarget: savingTarget,
    cumulativeSavings: cumulativeSavingsLocked,
    hasCustomTargetThisMonth,
    savingsRecommendation: (() => {
      const disposableForSaving = Math.max(
        0,
        eligibleIncome - (totalDebtObligation + rawFixedTotal + rawEssentialVariableTotal)
      );
      const monthlyRecommended = Math.round(disposableForSaving * 0.2);
      return {
        monthlyRecommended,
        weeklyRecommended: Math.round(monthlyRecommended / 4.33),
        hasFixedIncome: eligibleIncome > 0,
        fixedIncomeAmount: eligibleIncome,
        obligationsAmount: totalDebtObligation + rawFixedTotal + rawEssentialVariableTotal,
        reason:
          eligibleIncome <= 0
            ? "Belum ada pemasukan tetap (gaji) yang terdeteksi bulan ini. Tandai kategori pemasukan di menu Kategori agar rekomendasi otomatis aktif."
            : disposableForSaving <= 0
            ? "Penghasilan tetap telah habis untuk cicilan hutang, tagihan tetap, dan kebutuhan pokok. Tidak disarankan menabung bulan ini agar kebutuhan utama tercukupi."
            : "20% dari sisa penghasilan tetap setelah dikurangi cicilan hutang, tagihan tetap bulanan, dan kebutuhan pokok.",
      };
    })(),
    budgetSource,
    budgetCalculationMode,
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

    const cat = t.categoryId ? categoryMap.get(t.categoryId) : undefined;

    // Kecualikan hutang / cicilan
    const isDebt = Boolean(
      t.debtId ||
      (cat ? isDebtCategoryName(cat.name) : ((t.category && isDebtCategoryName(t.category)) || (t.note && isDebtCategoryName(t.note))))
    );
    if (isDebt) {
      excludedCount += 1;
      return;
    }

    // Kecualikan tagihan tetap bulanan
    // Prioritaskan konfigurasi kategori (isFixedExpense). Hanya gunakan deteksi nama teks jika kategori tidak ditemukan.
    const isFixed = cat
      ? isFixedExpenseCategory(cat)
      : Boolean((t.category && isFixedExpenseName(t.category)) || (t.note && isFixedExpenseName(t.note)));
    if (isFixed) {
      excludedCount += 1;
      return;
    }

    const isEssential = cat
      ? isEssentialExpenseCategory(cat)
      : Boolean(t.category && isEssentialExpenseName(t.category));
    if (isEssential) {
      essentialDailySpending += t.amount;
    } else {
      discretionaryDailySpending += t.amount;
    }

    eligibleDailySpending += t.amount;
  });

  const isOverBudget =
    dailyBudget > 0 ? eligibleDailySpending > dailyBudget : eligibleDailySpending > 0;
  const isOverEssentialBudget =
    dailyEssentialBudget > 0
      ? essentialDailySpending > dailyEssentialBudget
      : essentialDailySpending > 0;
  const isOverDiscretionaryBudget =
    dailyDiscretionaryBudget > 0
      ? discretionaryDailySpending > dailyDiscretionaryBudget
      : discretionaryDailySpending > 0;
  const overAmount = isOverBudget ? Math.max(0, eligibleDailySpending - dailyBudget) : 0;

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
