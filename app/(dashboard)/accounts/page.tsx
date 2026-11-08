import { AccountManager } from "@/components/accounts/AccountManager";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AccountsPage() {
  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Dompet & Rekening"
        subtitle="Kelola uang Anda yang sedikit itu."
        className="mb-0"
      />

      <AccountManager />
    </div>
  );
}
