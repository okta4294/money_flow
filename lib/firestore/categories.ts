import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  writeBatch,
  getDocs,
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
  createdAt: Timestamp;
}

export interface CategoryInput {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt">[] = [
  // Income
  { name: "Gaji", type: "income", color: "#10b981", icon: "money-bag", isDefault: true },
  { name: "Freelance", type: "income", color: "#3b82f6", icon: "laptop", isDefault: true },
  { name: "Investasi", type: "income", color: "#8b5cf6", icon: "chart-up", isDefault: true },
  { name: "Bonus", type: "income", color: "#f59e0b", icon: "gift", isDefault: true },
  { name: "Lainnya", type: "income", color: "#6b7280", icon: "more-horizontal", isDefault: true },
  // Expense
  { name: "Makanan", type: "expense", color: "#ef4444", icon: "food", isDefault: true },
  { name: "Transportasi", type: "expense", color: "#f97316", icon: "car", isDefault: true },
  { name: "Belanja", type: "expense", color: "#ec4899", icon: "shopping-bag", isDefault: true },
  { name: "Tagihan", type: "expense", color: "#6366f1", icon: "bill", isDefault: true },
  { name: "Kesehatan", type: "expense", color: "#14b8a6", icon: "heart", isDefault: true },
  { name: "Hiburan", type: "expense", color: "#f59e0b", icon: "game", isDefault: true },
  { name: "Pendidikan", type: "expense", color: "#0ea5e9", icon: "book", isDefault: true },
  { name: "Lainnya", type: "expense", color: "#6b7280", icon: "more-horizontal", isDefault: true },
];

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

export async function seedDefaultCategories(userId: string) {
  const existing = await getDocs(categoriesRef(userId));
  if (!existing.empty) return;

  const batch = writeBatch(db);
  DEFAULT_CATEGORIES.forEach((cat) => {
    const ref = doc(categoriesRef(userId));
    batch.set(ref, { ...cat, createdAt: Timestamp.now() });
  });
  await batch.commit();
}

export async function addCategory(userId: string, data: CategoryInput) {
  const ref = await addDoc(categoriesRef(userId), {
    ...data,
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
  const ref = doc(db, "users", userId, "categories", id);
  await updateDoc(ref, data);
}

export async function deleteCategory(userId: string, id: string) {
  const ref = doc(db, "users", userId, "categories", id);
  await deleteDoc(ref);
}
