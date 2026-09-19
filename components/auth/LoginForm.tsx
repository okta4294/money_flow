"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

type Mode = "login" | "register";

export function LoginForm() {
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
    <div className="w-full bg-surface border-4 border-outline rounded-3xl p-8 md:p-10 shadow-[6px_6px_0_0_var(--theme-outline)] flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-primary-container border-2 border-outline flex items-center justify-center mb-2 shadow-[2px_2px_0_0_var(--theme-outline)]">
          <i className="fa-solid fa-wallet text-on-primary-container text-2xl"></i>
        </div>
        <h1 className="font-headline-md text-2xl text-on-background tracking-tighter uppercase font-bold" style={{ WebkitTextStroke: '0.5px var(--theme-outline)' }}>
          {mode === "login" ? "Masuk ke Money Flow" : "Buat Akun Baru"}
        </h1>
        <p className="font-body-md text-sm text-on-surface-variant">
          {mode === "login" ? "Akses dashboard finansial Anda" : "Mulai mencatat keuangan Anda"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full mt-2">
        {mode === "register" && (
          <div className="flex flex-col gap-1">
            <label className="font-label-bold text-xs uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="name">Nama Lengkap</label>
            <div className="relative group">
              <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg"></i>
              <input
                id="name"
                type="text"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border-2 border-outline rounded-xl py-3 pl-10 pr-4 text-on-background font-body-md text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:shadow-[2px_2px_0_0_var(--theme-outline)] transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="font-label-bold text-xs uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="email">Email</label>
          <div className="relative group">
            <i className="fa-solid fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg"></i>
            <input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-container-lowest border-2 border-outline rounded-xl py-3 pl-10 pr-4 text-on-background font-body-md text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:shadow-[2px_2px_0_0_var(--theme-outline)] transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <div className="flex justify-between items-center ml-1">
            <label className="font-label-bold text-xs uppercase tracking-widest text-on-surface-variant" htmlFor="password">Kata Sandi</label>
            {mode === "login" && (
              <a href="#" className="font-label-bold text-xs text-primary-fixed-dim hover:text-primary-fixed transition-colors">Lupa sandi?</a>
            )}
          </div>
          <div className="relative group">
            <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg"></i>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-container-lowest border-2 border-outline rounded-xl py-3 pl-10 pr-10 text-on-background font-body-md text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:shadow-[2px_2px_0_0_var(--theme-outline)] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface transition-colors p-1"
            >
              <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-base`}></i>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container border-2 border-outline rounded-xl px-4 py-3 font-label-bold text-xs mt-2 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            {error}
          </div>
        )}

        <button
          id="submit-auth"
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-primary-container text-on-primary-container border-2 border-outline font-label-bold text-xs uppercase tracking-wider rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-[2px_2px_0_0_var(--theme-outline)] hover:shadow-[4px_4px_0_0_var(--theme-outline)] active-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}</span>
          <i className="fa-solid fa-arrow-right text-sm"></i>
        </button>
      </form>

      <div className="flex items-center gap-4 w-full opacity-60">
        <div className="h-[2px] flex-1 bg-outline"></div>
        <span className="font-label-bold text-xs uppercase tracking-widest text-on-surface-variant">atau</span>
        <div className="h-[2px] flex-1 bg-outline"></div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-surface border-2 border-outline text-on-background font-label-bold text-xs uppercase tracking-wider rounded-xl py-3 px-4 flex items-center justify-center gap-3 hover:bg-surface-bright shadow-[2px_2px_0_0_var(--theme-outline)] active-press transition-all disabled:opacity-50"
        >
          <i className="fa-brands fa-google text-lg"></i>
          <span>Lanjutkan dengan Google</span>
        </button>
        <button
          type="button"
          id="guest-login-btn"
          onClick={handleGuest}
          disabled={loading}
          className="w-full bg-surface border-2 border-outline text-on-background font-label-bold text-xs uppercase tracking-wider rounded-xl py-3 px-4 flex items-center justify-center gap-3 hover:bg-surface-bright shadow-[2px_2px_0_0_var(--theme-outline)] active-press transition-all disabled:opacity-50"
        >
          <i className="fa-solid fa-user-secret text-lg"></i>
          <span>Lanjutkan sebagai Tamu</span>
        </button>
      </div>

      <div className="text-center mt-2">
        <p className="font-body-md text-sm text-on-surface-variant">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                className="text-on-background font-bold underline underline-offset-4 hover:opacity-80 transition-opacity"
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
                className="text-on-background font-bold underline underline-offset-4 hover:opacity-80 transition-opacity"
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
