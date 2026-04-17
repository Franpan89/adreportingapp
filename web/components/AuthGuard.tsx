"use client";

import { useAuth } from "@/context/auth-context";
import { signIn } from "@/lib/auth";

/**
 * Wraps protected content. Shows sign-in button if not authenticated.
 * Uses the WMM SSO pattern (Google OAuth + @webmymoney.com restriction).
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-xl font-bold">Sign in required</h1>
        <p className="text-muted-foreground text-sm">Only @webmymoney.com accounts can access this app.</p>
        <button
          onClick={() => signIn()}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
