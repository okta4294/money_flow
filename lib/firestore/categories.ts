import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "../firebase";
import { TransactionType } from "./transactions";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isDefault: boolean;
  monthlyBudget?: number;
  isEligibleForBudget?: boolean;
  isFixedExpense?: boolean;
  isEssentialExpense?: boolean;
  createdAt: Timestamp;
}

export interface CategoryInput {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  monthlyBudget?: number | null;
  isEligibleForBudget?: boolean | null;
  isFixedExpense?: boolean | null;
  isEssentialExpense?: boolean | null;
}



const categoriesRef = (userId: string) =>
  collection(db, "users", userId, "categories");

export function subscribeToCategories(
  userId: string,
  callback: (categories: Category[]) => void
) {
  return onSnapshot(categoriesRef(userId), (snapshot) => {
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
    callback(categories);
  });
}



export async function addCategory(userId: string, data: CategoryInput) {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
  );
  const ref = await addDoc(categoriesRef(userId), {
    ...clean,
    isDefault: false,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateCategory(
  userId: string,
  id: string,
  data: Partial<CategoryInput>
) {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value === null) {
      clean[key] = deleteField();
    } else {
      clean[key] = value;
    }
  }
  const ref = doc(db, "users", userId, "categories", id);
  await updateDoc(ref, clean);
}

export async function deleteCategory(userId: string, id: string) {
  const ref = doc(db, "users", userId, "categories", id);
  await deleteDoc(ref);
}

/**
 * Cek apakah nama kategori merupakan kategori hutang / pinjaman / paylater / cicilan.
 * Mencakup variasi istilah populer seperti hutang, utang, paylater, pinjol, cicilan, angsuran, kredit, kasbon, dll.
 */
export function isDebtCategoryName(categoryName?: string | null): boolean {
  if (!categoryName) return false;
  const lower = categoryName.toLowerCase().trim();

  const debtKeywords = [
    "utang",      // mencakup hutang, utang, berutang, berhutang, terutang
    "piutang",    // hutang piutang / piutang
    "paylater",
    "pay later",
    "spaylater",
    "gopaylater",
    "gopay later",
    "pinjol",
    "pinjam",     // mencakup pinjaman, peminjaman, pinjam
    "cicil",      // mencakup cicilan, mencicil, cicil
    "angsur",     // mencakup angsuran, mengangsur
    "kredit",     // mencakup kartu kredit, kredit motor/rumah
    "credit",     // mencakup credit card, home credit
    "kasbon",
    "kredivo",
    "akulaku",
    "indodana",
    "leasing",
    "beban"
  ];

  return debtKeywords.some((keyword) => lower.includes(keyword));
}

/**
 * Otomatis membuatkan kategori pengeluaran "Hutang / Paylater" jika user memiliki hutang
 * namun belum memiliki kategori pengeluaran hutang apapun.
 */
export async function ensureDebtCategoryExists(
  userId: string,
  currentCategories: Category[]
): Promise<string | null> {
  const hasDebtCategory = currentCategories.some(
    (c) => c.type === "expense" && isDebtCategoryName(c.name)
  );

  if (hasDebtCategory) return null;

  return addCategory(userId, {
    name: "Hutang / Paylater",
    type: "expense",
    icon: "credit_card",
    color: "#EF4444",
    isFixedExpense: true,
    isEssentialExpense: false,
    monthlyBudget: null,
  });
}
