# Money Flow — AI Agent Guide

Aplikasi pencatatan keuangan personal berbasis Next.js 16 (App Router) + Firebase (Firestore Auth). User bisa mencatat pemasukan/pengeluaran, transfer antar akun, mengelola kategori, dan melacak hutang/paylater.

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

## Struktur project

```
app/
├── layout.tsx                        # Root layout: ThemeProvider, font
├── page.tsx                          # Redirect ke /dashboard
├── globals.css                       # Global styles + Tailwind
├── login/                            # Halaman login (publik)
├── api/summary/route.ts              # Server-side API: AI Financial Roasting (Gemini)
└── (dashboard)/                      # Route group — semua dilindungi auth via layout.tsx
    ├── layout.tsx                    # Auth guard + Sidebar + mobile nav
    ├── dashboard/page.tsx            # Halaman utama: ringkasan, chart, transaksi terbaru
    ├── transactions/page.tsx         # Histori transaksi + filter bulan
    ├── categories/page.tsx           # Kelola kategori pemasukan & pengeluaran
    ├── debts/page.tsx                # Hutang/Paylater + kartu estimasi bulan depan
    └── accounts/page.tsx             # Kelola akun/dompet + saldo real-time

components/
├── ThemeProvider.tsx                 # next-themes wrapper
├── auth/LoginForm.tsx                # Form login Google
├── layout/
│   ├── Sidebar.tsx                   # Navigasi desktop
│   ├── MonthSelector.tsx             # Pilih bulan/tahun
│   └── ThemeToggle.tsx               # Toggle dark/light mode
├── dashboard/
│   ├── SummaryCards.tsx              # Kartu saldo, income, expense
│   ├── SpendingChart.tsx             # Pie/bar chart pengeluaran per kategori
│   ├── AISummaryCard.tsx             # Kartu AI roasting (memanggil /api/summary)
│   └── InitialBalanceModal.tsx       # Modal set saldo awal bulan
├── transactions/
│   ├── TransactionForm.tsx           # Modal tambah/edit transaksi (income|expense|transfer)
│   └── TransactionList.tsx           # List transaksi dikelompokkan per tanggal
├── debts/
│   ├── DebtForm.tsx                  # Modal tambah/edit hutang
│   └── DebtList.tsx                  # List hutang + progress bar
└── accounts/
    └── AccountManager.tsx            # Grid akun + form tambah/edit + saldo per akun

lib/
├── firebase.js                       # Inisialisasi Firebase app
├── auth-context.tsx                  # Context useAuth() — current user
├── utils.ts                          # Helper umum
└── firestore/
    ├── transactions.ts               # CRUD transaksi (income|expense|transfer)
    ├── categories.ts                 # CRUD kategori
    ├── debts.ts                      # CRUD hutang + payDebt()
    ├── balances.ts                   # Saldo awal bulanan (recursive fallback)
    ├── accounts.ts                   # CRUD akun/dompet
    └── ai-usage.ts                   # Rate limit tracking untuk Gemini API

hooks/
├── useTransactions.ts                # Realtime transaksi per bulan + aggregate income/expense
├── useCategories.ts                  # Realtime kategori income & expense
├── useDebts.ts                       # Realtime hutang + nextMonthDebtEstimate
└── useAccounts.ts                    # Realtime daftar akun
```

---

## Caveats

**Kategori:** User baru mulai tanpa kategori default — `seedDefaultCategories()` adalah no-op. Jangan aktifkan kembali.

**Hutang/Paylater:** Saat transaksi pengeluaran dengan kategori mengandung kata "hutang"/"paylater" disimpan, `payDebt()` dipanggil otomatis untuk mengurangi sisa hutang. Jangan duplikasi pemanggilan ini.

**Deteksi kategori hutang:** Logika ada di `TransactionForm.tsx` — fungsi `isDebtCategory()` cek substring case-insensitive. Ubah di sini jika perlu keyword baru.

**Auth:** Gunakan `useAuth()` dari `lib/auth-context.tsx`. Firebase config ada di `lib/firebase.js` dan env var di `.env.local`.

**Saat mengubah skema Firestore** (field baru di transaksi/hutang/kategori), update interface TypeScript di `lib/firestore/*.ts` dan pastikan field opsional menggunakan `?` agar kompatibel dengan data lama.

**Transfer Antar Akun:** `TransactionType` sekarang punya 3 nilai: `"income" | "expense" | "transfer"`. Transaksi transfer menyimpan `accountId` (sumber) dan `destinationAccountId` (tujuan). Transfer **tidak mempengaruhi** total income/expense bulanan di dashboard. Saat cek `type === "income"` atau `type === "expense"`, pastikan exclude transfer.

**Firestore index untuk Transfer:** Query `getAggregateFromServer` + `sum()` pada field `destinationAccountId` butuh composite index. Gunakan `getDocs` + client-side `.reduce()` untuk query pada `destinationAccountId` agar tidak perlu buat index manual. Lihat `AccountManager.tsx` sebagai contoh.

**Estimasi Hutang Bulan Depan:** `useDebts()` mengekspos `nextMonthDebtEstimate` — total `remainingAmount` dari hutang aktif yang `dueDate`-nya jatuh di bulan kalender berikutnya. Hutang tanpa `dueDate` tidak dihitung. Ditampilkan sebagai kartu di halaman `/debts`.

**AI Financial Roasting (Gemini):** Menggunakan `@google/generative-ai` dengan model utama `gemini-2.5-flash` dan fallback `gemini-2.5-pro`. Konfigurasi server-side berada di `app/api/summary/route.ts`. Pastikan *prompt* tetap menggunakan Bahasa Indonesia dengan gaya "nyelekit". Token input dihemat dengan mengelompokkan jumlah pengeluaran berdasarkan kategori. API key wajib ada di `.env.local` sebagai `GEMINI_API_KEY`.

**Light & Dark Mode:** Pergantian tema difasilitasi oleh `next-themes` pada `app/layout.tsx`. Selalu gunakan varian kelas Tailwind `dark:` (contoh: `bg-slate-50 dark:bg-slate-950`) saat menambah atau merubah komponen antarmuka, untuk memastikan kesesuaian kontras warna.
