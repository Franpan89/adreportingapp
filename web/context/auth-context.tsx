"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, USE_MOCK } from "@/lib/firebase";
import { isWmmEmail } from "@/lib/auth";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  email: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  email: null,
  loading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    email: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    if (USE_MOCK) {
      // In mock mode, skip Firebase Auth — treat as authenticated
      setState({
        firebaseUser: null,
        email: "mock@webmymoney.com",
        loading: false,
        isAuthenticated: true,
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email && isWmmEmail(user.email)) {
        setState({
          firebaseUser: user,
          email: user.email,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          firebaseUser: null,
          email: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
