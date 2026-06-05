import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Mendapatkan format tanggal hari ini (YYYY-MM-DD) berdasarkan waktu lokal
 */
function getTodayDateString(): string {
  const today = new Date();
  // Gunakan local timezone agar sesuai dengan zona waktu pengguna
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

/**
 * Mengecek apakah user memiliki hak akses Super Akun
 */
export function isSuperUser(email: string | null | undefined): boolean {
  if (!email) return false;
  const superEmail = process.env.NEXT_PUBLIC_SUPER_USER_EMAIL;
  return !!superEmail && email.toLowerCase() === superEmail.toLowerCase();
}

/**
 * Mengecek apakah pengguna diperbolehkan memakai AI hari ini.
 * Super Akun selalu mengembalikan true.
 * Akun biasa akan dicek apakah sudah ada catatan hari ini di Firestore.
 */
export async function checkAiLimit(uid: string, email: string | null | undefined): Promise<boolean> {
  // 1. Cek Super Akun
  if (isSuperUser(email)) {
    return true;
  }

  // 2. Cek Penggunaan Reguler (1x sehari)
  const dateStr = getTodayDateString();
  const docRef = doc(db, `users/${uid}/ai_usage/${dateStr}`);
  
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
 * Jika Super Akun, fungsi ini boleh diabaikan agar tidak menuh-menuhin database.
 */
export async function markAiUsage(uid: string, email: string | null | undefined): Promise<void> {
  if (isSuperUser(email)) {
    return; // Tidak perlu mencatat usage untuk Super Akun
  }

  const dateStr = getTodayDateString();
  const docRef = doc(db, `users/${uid}/ai_usage/${dateStr}`);
  
  // Mencatat waktu penggunaan ke Firestore
  await setDoc(docRef, { usedAt: new Date().toISOString() });
}
