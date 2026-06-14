import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Money Flow — Pencatatan Keuangan",
  description: "Aplikasi pencatatan keuangan pribadi. Catat pemasukan, pengeluaran, dan kelola keuangan Anda dengan mudah.",
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`} suppressHydrationWarning>

      <body className="h-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0B1326] dark:text-[#dbe2fd] antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Script src="https://kit.fontawesome.com/9d2a010394.js" crossOrigin="anonymous" strategy="afterInteractive" />
      </body>
    </html>
  );
}
