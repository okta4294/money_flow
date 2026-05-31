import { AccountManager } from "@/components/accounts/AccountManager";

export default function AccountsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Akun / Rekening</h1>
          <p className="text-slate-400 text-sm">
            Kelola sumber dana yang Anda gunakan untuk transaksi
          </p>
        </div>
      </div>

      <AccountManager />
    </div>
  );
}
