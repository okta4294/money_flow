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
    <div className="w-full backdrop-blur-[40px] bg-white/[0.03] border border-white/10 rounded-[24px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_30px_60px_rgba(0,0,0,0.6)] p-8 md:p-10 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim/20 border border-primary-fixed-dim/30 flex items-center justify-center mb-2 shadow-[inset_0_0_15px_rgba(0,220,229,0.2)]">
          <i className="fa-solid fa-wallet text-primary-fixed-dim text-2xl"></i>
        </div>
        <h1 className="font-headline-md text-headline-md text-on-background tracking-tighter">
          {mode === "login" ? "Masuk ke Money Flow" : "Buat Akun Baru"}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {mode === "login" ? "Akses dashboard finansial Anda" : "Mulai mencatat keuangan Anda"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full mt-2">
        {mode === "register" && (
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="name">Nama Lengkap</label>
            <div className="relative group">
              <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary-fixed-dim transition-colors text-[20px]"></i>
              <input
                id="name"
                type="text"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-background font-body-md text-body-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim focus:shadow-[0_0_12px_rgba(0,220,229,0.3)] transition-all bg-transparent"
              />
            </div>
          </div>
        )}

        {/* Email Input */}
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-on-surface-variant ml-1" htmlFor="email">Email</label>
          <div className="relative group">
            <i className="fa-solid fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary-fixed-dim transition-colors text-[20px]"></i>
            <input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-on-background font-body-md text-body-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim focus:shadow-[0_0_12px_rgba(0,220,229,0.3)] transition-all bg-transparent"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex justify-between items-center ml-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">Kata Sandi</label>
            {mode === "login" && (
              <a href="#" className="font-label-sm text-label-sm text-primary-fixed-dim hover:text-primary-fixed transition-colors">Lupa sandi?</a>
            )}
          </div>
          <div className="relative group">
            <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary-fixed-dim transition-colors text-[20px]"></i>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg py-3 pl-10 pr-10 text-on-background font-body-md text-body-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim focus:shadow-[0_0_12px_rgba(0,220,229,0.3)] transition-all bg-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-white transition-colors"
            >
              <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-[20px]`}></i>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3 text-error font-label-sm text-label-sm mt-2">
            {error}
          </div>
        )}

        {/* Primary Login Button */}
        <button
          id="submit-auth"
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-primary-fixed-dim/80 text-on-primary-fixed font-label-sm text-label-sm font-bold tracking-wide rounded-lg py-3.5 px-4 flex items-center justify-center gap-2 hover:bg-primary-fixed-dim hover:shadow-[0_0_20px_rgba(0,220,229,0.4)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}</span>
          <i className="fa-solid fa-arrow-right text-[18px]"></i>
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full opacity-60">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">atau</span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
      </div>

      {/* Social / Alternative Logins (Ghost Buttons) */}
      <div className="flex flex-col gap-3 w-full">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-transparent border border-white/10 text-on-background font-label-sm text-label-sm rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-white/5 hover:border-white/20 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <i className="fa-brands fa-google text-[20px]"></i>
          <span>Lanjutkan dengan Google</span>
        </button>
        <button
          type="button"
          id="guest-login-btn"
          onClick={handleGuest}
          disabled={loading}
          className="w-full bg-transparent border border-white/10 text-on-background font-label-sm text-label-sm rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-white/5 hover:border-white/20 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <i className="fa-solid fa-user-secret text-[20px]"></i>
          <span>Lanjutkan sebagai Tamu</span>
        </button>
      </div>

      {/* Footer Link */}
      <div className="text-center mt-2">
        <p className="font-body-md text-body-md text-on-surface-variant">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                className="text-primary-fixed-dim font-bold hover:text-primary-fixed hover:underline underline-offset-4 transition-colors"
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
                className="text-primary-fixed-dim font-bold hover:text-primary-fixed hover:underline underline-offset-4 transition-colors"
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
