import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Mendapatkan format tanggal hari ini (YYYY-MM-DD) berdasarkan waktu lokal
 */
function getTodayDateString(): string {
  const today = new Date();
  // Gunakan local timezone agar sesuai dengan zona waktu pengguna
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export async function checkAiLimit(uid: string): Promise<boolean> {
  // Cek Penggunaan Reguler (1x sehari)
  const dateStr = getTodayDateString();
  const docRef = doc(db, `users/${uid}/ai-usage/${dateStr}`);
  
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    // Jika dokumen sudah ada, artinya jatah hari ini sudah terpakai
    return false;
  }

  // Jika dokumen belum ada, berarti masih punya jatah
  return true;
}

/**
 * Menandai bahwa pengguna telah berhasil menggunakan AI hari ini.
 */
export async function markAiUsage(uid: string): Promise<void> {
  const dateStr = getTodayDateString();
  const docRef = doc(db, `users/${uid}/ai-usage/${dateStr}`);
  
  // Mencatat waktu penggunaan ke Firestore
  await setDoc(docRef, { usedAt: new Date().toISOString() });
}
