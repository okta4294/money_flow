# Money Flow — AI Agent Guide

Aplikasi pencatatan keuangan personal berbasis Next.js 16 (App Router) + Firebase (Firestore Auth). User bisa mencatat pemasukan/pengeluaran, mengelola kategori, dan melacak hutang/paylater.

---

## ⚠️ IMPORTANT — Baca Ini Dulu

- **Next.js versi ini berbeda dari training data.** WAJIB baca `node_modules/next/dist/docs/` sebelum menulis kode apapun. Patuhi deprecation notice.
- **Firestore menolak nilai `undefined`.** Gunakan conditional spread `...(val ? { key: val } : {})` — jangan kirim `field: undefined` ke Firestore.
- **`position: fixed` di mobile browser rusak jika parent punya `backdrop-filter` atau `transform`.** Elemen fixed harus jadi sibling langsung di luar wrapper yang bisa scroll.
- Semua page ada di `app/(dashboard)/` dan otomatis terlindungi auth via `layout.tsx` — jangan tambah guard auth manual di halaman.

---

## Key Commands

```bash
npm run dev      # Dev server (port 3000)
npm run build    # Production build + type check
npx tsc --noEmit # Type check saja tanpa build
```

---

## Struktur Singkat

```
app/(dashboard)/     → Halaman utama (dashboard, transactions, categories, debts)
components/          → UI per fitur: dashboard/, transactions/, categories/, debts/, layout/
lib/firestore/       → CRUD Firestore: transactions.ts, categories.ts, debts.ts, balances.ts
hooks/               → useTransactions, useCategories, useDebts (semua realtime via onSnapshot)
```

---

## Caveats

**Kategori:** User baru mulai tanpa kategori default — `seedDefaultCategories()` adalah no-op. Jangan aktifkan kembali.

**Hutang/Paylater:** Saat transaksi pengeluaran dengan kategori mengandung kata "hutang"/"paylater" disimpan, `payDebt()` dipanggil otomatis untuk mengurangi sisa hutang. Jangan duplikasi pemanggilan ini.

**Deteksi kategori hutang:** Logika ada di `TransactionForm.tsx` — fungsi `isDebtCategory()` cek substring case-insensitive. Ubah di sini jika perlu keyword baru.

**Auth:** Gunakan `useAuth()` dari `lib/auth-context.tsx`. Firebase config ada di `lib/firebase.js` dan env var di `.env.local`.

**Saat mengubah skema Firestore** (field baru di transaksi/hutang/kategori), update interface TypeScript di `lib/firestore/*.ts` dan pastikan field opsional menggunakan `?` agar kompatibel dengan data lama.
