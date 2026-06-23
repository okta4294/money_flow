import { AccountManager } from "@/components/accounts/AccountManager";

export default function AccountsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto w-full">
      {/* Header Section */}
      <section className="space-y-2">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-on-background">Accounts</h2>
        <p className="font-body-md text-on-surface-variant">Manage your wallets and bank accounts here.</p>
      </section>

      <AccountManager />
    </div>
  );
}
