import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export type BudgetSource = "eligible_only" | "all_income";
export type BudgetCalculationMode = "adaptive" | "strict_rollover";

export interface UserSettings {
  budgetSource?: BudgetSource;
  budgetCalculationMode?: BudgetCalculationMode;
}

export function subscribeToUserSettings(
  userId: string,
  callback: (settings: UserSettings) => void
) {
  const ref = doc(db, "users", userId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          budgetSource: data.budgetSource || "eligible_only",
          budgetCalculationMode: data.budgetCalculationMode || "adaptive",
        });
      } else {
        callback({ budgetSource: "eligible_only", budgetCalculationMode: "adaptive" });
      }
    },
    (error) => {
      console.error("Gagal berlangganan user settings:", error);
      callback({ budgetSource: "eligible_only" });
    }
  );
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
) {
  const ref = doc(db, "users", userId);
  await setDoc(ref, settings, { merge: true });
}
