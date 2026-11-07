"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const guestTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser?.isAnonymous) {
        try {
          const token = await firebaseUser.getIdToken();
          guestTokenRef.current = token;
          await setDoc(
            doc(db, "users", firebaseUser.uid),
            { lastActiveAt: Date.now() },
            { merge: true }
          );
        } catch {
          // Abaikan jika gagal menulis detak sesi awal
        }
      } else {
        guestTokenRef.current = null;
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.isAnonymous) return;

    let active = true;
    const refreshTokenAndHeartbeat = async () => {
      if (!active || !auth.currentUser?.isAnonymous) return;
      try {
        const token = await auth.currentUser.getIdToken();
        guestTokenRef.current = token;
      } catch {}
    };

    const intervalId = setInterval(refreshTokenAndHeartbeat, 10 * 60 * 1000);

    const handlePageHide = () => {
      const token = guestTokenRef.current;
      if (!token) return;
      const payload = JSON.stringify({
        idToken: token,
        unloadTime: Date.now(),
        immediate: false,
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/guest-cleanup", blob);
      } else {
        fetch("/api/guest-cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      active = false;
      clearInterval(intervalId);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [user?.uid, user?.isAnonymous]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
  };

  const signInAsGuest = async () => {
    await signInAnonymously(auth);
  };

  const signOut = async () => {
    const currentUser = auth.currentUser;
    if (currentUser?.isAnonymous) {
      try {
        const token = await currentUser.getIdToken();
        guestTokenRef.current = null;
        await fetch("/api/guest-cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token, immediate: true }),
        });
        await deleteUser(currentUser).catch(() => {});
      } catch {
        // Lanjutkan signOut jika sudah terhapus di server
      }
    }
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
