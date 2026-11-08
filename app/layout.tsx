import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Anton } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Money Flow - Catatan Keuangan Pribadi",
  description: "Aplikasi pencatatan keuangan pribadi. Catat pemasukan, pengeluaran, dan kelola keuangan Anda dengan mudah.",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { DataProvider } from "@/lib/data-context";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${anton.variable}`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" nonce={nonce} />
      </head>
      <body className="min-h-screen bg-background text-on-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} nonce={nonce}>
          <AuthProvider>
            <DataProvider>{children}</DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
