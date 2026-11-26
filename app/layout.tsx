import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

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
import { SakugaToastHost } from "@/components/layout/SakugaToastHost";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="id"
      className={`${bricolageGrotesque.variable} ${bricolageGrotesque.className}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" nonce={nonce} />
      </head>
      <body className="min-h-screen bg-background text-on-background antialiased sketch-paper-bg">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} nonce={nonce}>
          <AuthProvider>
            <DataProvider>
              {children}
              <SakugaToastHost nonce={nonce} />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
        <script src="/sakuga-vfx/button.js" defer nonce={nonce} />
        <script src="/sakuga-vfx/toast.js" defer nonce={nonce} />
        <script src="/sakuga-vfx/input.js" defer nonce={nonce} />
        <script src="/sakuga-vfx/toggle.js" defer nonce={nonce} />
      </body>
    </html>
  );
}
