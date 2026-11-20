import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export type BudgetSource = "eligible_only" | "all_income";
export type BudgetCalculationMode = "adaptive" | "strict_rollover";

export interface UserSettings {
  budgetSource?: BudgetSource;
  budgetCalculationMode?: BudgetCalculationMode;
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
) {
  const ref = doc(db, "users", userId);
  await setDoc(ref, settings, { merge: true });
}
