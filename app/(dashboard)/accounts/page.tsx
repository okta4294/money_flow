import { AccountManager } from "@/components/accounts/AccountManager";

export default function AccountsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      <header className="mb-2">
        <h2 className="font-headline-lg text-2xl sm:text-3xl text-on-surface tracking-normal uppercase">
          DOMPET & REKENING
        </h2>
        <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1">
          Kelola rekening bank, dompet digital, dan kas tunai Anda yang sedikit itu.
        </p>
      </header>

      <AccountManager />
    </div>
  );
}
