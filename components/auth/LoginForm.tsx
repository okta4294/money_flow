"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { triggerSakugaPop } from "@/lib/sakuga";
import { SakugaInput } from "@/components/ui/SakugaInput";

type Mode = "login" | "register";

export function LoginForm() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, resetPassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    setError("");
    setInfoMessage("");
    if (!email.trim()) {
      setError("Masukkan alamat email Anda terlebih dahulu untuk mereset kata sandi.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setInfoMessage("Tautan reset kata sandi telah dikirim ke email Anda.");
    } catch {
      setError("Gagal mengirim email reset kata sandi. Pastikan email sudah benar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && !name.trim()) {
      setError("Nama lengkap wajib diisi");
      return;
    }
    if (!email.trim() || !password) {
      setError("Email dan kata sandi wajib diisi");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Email atau password salah");
      } else if (msg.includes("email-already-in-use")) {
        setError("Email sudah terdaftar");
      } else if (msg.includes("weak-password")) {
        setError("Password minimal 6 karakter");
      } else {
        setError("Terjadi kesalahan, coba lagi");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error("Google Sign-In Error Details:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("auth/popup-closed-by-user")) {
        setError("Login dibatalkan karena jendela pop-up ditutup");
      } else if (msg.includes("auth/unauthorized-domain")) {
        setError("Domain ini belum terdaftar di Firebase Authorized Domains");
      } else if (msg.includes("auth/operation-not-allowed")) {
        setError("Sign-in provider Google belum diaktifkan di Firebase Console");
      } else {
        setError("Login dengan Google gagal. Pastikan konfigurasi .env.local sudah benar.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleGuest = async () => {
    setError("");
    setLoading(true);
    try {
      await signInAsGuest();
    } catch (err: unknown) {
      console.error("Guest Sign-In Error:", err);
      setError("Login sebagai tamu gagal, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surface comic-card p-6 sm:p-8 md:p-10 flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-primary-container border-2 border-outline flex items-center justify-center mb-1 shadow-[2px_2px_0_0_var(--theme-outline)] sketch-hatch">
          <span className="material-symbols-outlined text-on-primary-container text-2xl">account_balance_wallet</span>
        </div>
        <h1 className="font-display-lg text-2xl sm:text-3xl text-on-background tracking-tight font-extrabold">
          {mode === "login" ? "Masuk ke Money Flow" : "Buat Akun Baru"}
        </h1>
        <p className="font-body-md text-sm sm:text-base text-on-surface-variant">
          {mode === "login" ? "Akses dashboard finansial Anda" : "Mulai mencatat keuangan Anda"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 w-full mt-1">
        {mode === "register" && (
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-0.5" htmlFor="name">Nama Lengkap</label>
            <div className="relative group">
              <span aria-hidden="true" className="material-symbols-outlined pointer-events-none z-10 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/75 text-lg">person</span>
              <SakugaInput
                id="name"
                name="name"
                type="text"
                label="Nama Lengkap"
                autoComplete="name"
                placeholder="Nama Anda"
                value={name}
                onValueChange={setName}
                required
                className="sakuga-field--lowest sakuga-field--pl-icon"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="font-label-bold font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-0.5" htmlFor="email">Email</label>
          <div className="relative group">
            <span aria-hidden="true" className="material-symbols-outlined pointer-events-none z-10 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/75 text-lg">mail</span>
            <SakugaInput
              id="email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onValueChange={setEmail}
              required
              className="sakuga-field--lowest sakuga-field--pl-icon"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-0.5">
          <div className="flex justify-between items-center ml-0.5">
            <label className="font-label-bold font-bold text-xs uppercase tracking-wider text-on-surface-variant" htmlFor="password">Kata Sandi</label>
            {mode === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-label-bold font-bold text-xs text-secondary hover:underline underline-offset-2 transition-colors cursor-pointer"
              >
                Lupa sandi?
              </button>
            )}
          </div>
          <div className="relative group">
            <span aria-hidden="true" className="material-symbols-outlined pointer-events-none z-10 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/75 text-lg">lock</span>
            <SakugaInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              label="Kata Sandi"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onValueChange={setPassword}
              required
              className="sakuga-field--lowest sakuga-field--pl-icon sakuga-field--pr-icon"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="z-10 absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container border-2 border-outline rounded-xl px-4 py-3 font-label-bold font-bold text-xs sm:text-sm mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="bg-tertiary-container text-on-tertiary-container border-2 border-outline rounded-xl px-4 py-3 font-label-bold font-bold text-xs sm:text-sm mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {infoMessage}
          </div>
        )}

        <button
          id="submit-auth"
          type="submit"
          disabled={loading}
          onClick={(e) => triggerSakugaPop(e.currentTarget, "impact")}
          className="mt-3 w-full min-h-12 bg-primary-container text-on-primary-container border-2 border-outline font-label-bold font-extrabold text-sm uppercase tracking-wide rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-[3px_3px_0_0_var(--theme-outline)] active-press transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer sketch-hatch"
        >
          <span>{loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </form>

      <div className="flex items-center gap-4 w-full opacity-70">
        <div className="h-[2px] flex-1 bg-outline"></div>
        <span className="font-label-bold font-bold text-xs uppercase tracking-widest text-on-surface-variant">atau</span>
        <div className="h-[2px] flex-1 bg-outline"></div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full min-h-12 bg-surface border-2 border-outline text-on-background font-label-bold font-bold text-xs sm:text-sm uppercase tracking-wide rounded-xl py-3 px-4 flex items-center justify-center gap-3 hover:bg-surface-bright shadow-[2px_2px_0_0_var(--theme-outline)] active-press transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>
        <button
          type="button"
          id="guest-login-btn"
          onClick={handleGuest}
          disabled={loading}
          className="w-full min-h-12 bg-surface border-2 border-outline text-on-background font-label-bold font-bold text-xs sm:text-sm uppercase tracking-wide rounded-xl py-3 px-4 flex items-center justify-center gap-3 hover:bg-surface-bright shadow-[2px_2px_0_0_var(--theme-outline)] active-press transition-all disabled:opacity-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">person_outline</span>
          <span>Lanjutkan sebagai Tamu</span>
        </button>
      </div>

      <div className="text-center mt-1">
        <p className="font-body-md text-sm text-on-surface-variant">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                className="text-on-background font-bold underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer"
              >
                Daftar
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className="text-on-background font-bold underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer"
              >
                Masuk
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
