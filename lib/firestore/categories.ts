import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
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
  createdAt: Timestamp;
}

export interface CategoryInput {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  monthlyBudget?: number;
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
