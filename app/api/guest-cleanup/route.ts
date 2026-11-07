import { NextResponse } from "next/server";

export const maxDuration = 60;

const SUBCOLLECTIONS = [
  "transactions",
  "categories",
  "debts",
  "accounts",
  "balances",
  "monthly_savings",
];

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ success: false, error: "Payload kosong." }, { status: 400 });
    }

    let body: { idToken?: string; unloadTime?: number; immediate?: boolean } = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Format JSON tidak valid." }, { status: 400 });
    }

    const { idToken, unloadTime = 0, immediate = false } = body;
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ success: false, error: "Token diperlukan." }, { status: 401 });
    }

    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!firebaseApiKey || !projectId) {
      return NextResponse.json({ success: false, error: "Konfigurasi server belum lengkap." }, { status: 500 });
    }

    // 1. Verifikasi token & pastikan akun benar-benar Tamu (Anonymous)
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json({ success: false, error: "Token tidak valid." }, { status: 401 });
    }

    const verifyData = await verifyRes.json();
    const authUser = verifyData.users?.[0];
    if (!authUser) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan." }, { status: 404 });
    }

    const isAnonymous =
      !authUser.email || !authUser.providerUserInfo || authUser.providerUserInfo.length === 0;

    if (!isAnonymous) {
      return NextResponse.json(
        { success: false, error: "Pembersihan otomatis hanya berlaku untuk akun tamu." },
        { status: 403 }
      );
    }

    const userId = authUser.localId;
    const baseDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`;
    const authHeaders = {
      Authorization: `Bearer ${idToken}`,
    };

    // 2. Jika dipicu oleh penutupan tab/aplikasi (bukan tombol Keluar langsung),
    // beri jeda 4 detik untuk membedakan antara Refresh halaman (F5) vs Tutup Aplikasi
    if (!immediate) {
      await new Promise((resolve) => setTimeout(resolve, 4000));

      try {
        const userDocRes = await fetch(baseDocUrl, {
          method: "GET",
          headers: authHeaders,
        });
        if (userDocRes.ok) {
          const userDoc = await userDocRes.json();
          const lastActiveRaw =
            userDoc.fields?.lastActiveAt?.integerValue ??
            userDoc.fields?.lastActiveAt?.doubleValue ??
            0;
          const lastActiveAt = Number(lastActiveRaw) || 0;

          if (unloadTime > 0 && lastActiveAt > unloadTime) {
            return NextResponse.json({
              success: true,
              skipped: true,
              reason: "Sesi tamu masih aktif (halaman dimuat ulang).",
            });
          }
        }
      } catch {
        // Lanjutkan penghapusan jika gagal membaca status
      }
    }

    // 3. Hapus seluruh dokumen pada subkoleksi milik akun tamu
    await Promise.all(
      SUBCOLLECTIONS.map(async (sub) => {
        try {
          const listRes = await fetch(`${baseDocUrl}/${sub}?pageSize=300`, {
            method: "GET",
            headers: authHeaders,
          });
          if (!listRes.ok) return;
          const listData = await listRes.json();
          const docs: Array<{ name: string }> = listData.documents || [];

          await Promise.all(
            docs.map((d) =>
              fetch(`https://firestore.googleapis.com/v1/${d.name}`, {
                method: "DELETE",
                headers: authHeaders,
              }).catch(() => {})
            )
          );
        } catch {
          // Abaikan error per subkoleksi agar proses tetap lanjut
        }
      })
    );

    // 4. Hapus dokumen induk users/{userId}
    await fetch(baseDocUrl, {
      method: "DELETE",
      headers: authHeaders,
    }).catch(() => {});

    // 5. Hapus akun tamu dari Firebase Authentication agar tidak menumpuk
    await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    ).catch(() => {});

    return NextResponse.json({ success: true, cleaned: true });
  } catch (error) {
    console.error("Guest cleanup error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membersihkan data tamu." },
      { status: 500 }
    );
  }
}

