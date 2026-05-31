"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

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
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <Image src="/logo.svg" alt="Money Flow Logo" width={64} height={64} className="mx-auto mb-4 drop-shadow-xl" />
        <h1 className="text-3xl font-bold text-white mb-2">Money Flow</h1>
        <p className="text-slate-400 text-sm">
          {mode === "login" ? "Selamat datang kembali!" : "Buat akun baru"}
        </p>
      </div>

      {/* Card */}
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        {/* Mode Tabs */}
        <div className="flex bg-slate-900/50 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              mode === "login"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              mode === "register"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 border border-slate-600/50 rounded-xl text-white text-sm font-medium transition-all duration-200 mb-3 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Lanjutkan dengan Google
        </button>

        {/* Guest Button */}
        <button
          type="button"
          id="guest-login-btn"
          onClick={handleGuest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent hover:bg-slate-700/50 border border-dashed border-slate-600/50 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-all duration-200 mb-4 disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Masuk sebagai Tamu
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-500 text-xs">atau</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="name"
                type="text"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            id="submit-auth"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>
      </div>
    </div>
  );
}
