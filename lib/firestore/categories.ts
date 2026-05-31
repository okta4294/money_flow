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
  createdAt: Timestamp;
}

export interface CategoryInput {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
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

// seedDefaultCategories dipertahankan tapi tidak melakukan apa-apa
// (DEFAULT_CATEGORIES kosong — user membangun kategori sendiri)
export async function seedDefaultCategories(_userId: string) {
  // No-op: categories are now user-defined from the start
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
