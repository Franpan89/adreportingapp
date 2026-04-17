'use client';
import { useState } from 'react';
import { BarChart3, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/* -------------------------------------------------------
   Demo accounts — work without a real Supabase project
------------------------------------------------------- */
const DEMO_ACCOUNTS: Record<string, { password: string; dest: string; role: string }> = {
  'admin@demo.com':  { password: 'demo1234', dest: '/admin/dashboard', role: 'Admin'  },
  'client@demo.com': { password: 'demo1234', dest: '/dashboard',       role: 'Client' },
};

const IS_PLACEHOLDER_SUPABASE =
  typeof window === 'undefined'
    ? true
    : (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes('placeholder');

export default function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ── Demo mode shortcut ──────────────────────────────────────────
    const demo = DEMO_ACCOUNTS[email.toLowerCase().trim()];
    if (demo && password === demo.password) {
      // Store a lightweight session cookie so the proxy knows who we are
      document.cookie = `demo_role=${email.includes('admin') ? 'admin' : 'client'}; path=/; max-age=86400`;
      window.location.href = demo.dest;
      return;
    }

    // ── Real Supabase auth ──────────────────────────────────────────
    if (IS_PLACEHOLDER_SUPABASE) {
      setError('Demo mode: use admin@demo.com / demo1234 or client@demo.com / demo1234');
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Authentication service unavailable. Use demo credentials below.');
      setLoading(false);
    }
  }

  function fillDemo(type: 'admin' | 'client') {
    setEmail(type === 'admin' ? 'admin@demo.com' : 'client@demo.com');
    setPassword('demo1234');
    setError('');
  }

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
      {/* Background depth layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#00BD7D]/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#1877F2]/5" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#00BD7D] flex items-center justify-center mx-auto mb-4 shadow-[4px_6px_0px_rgba(0,0,0,0.3)]">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}>
            AdPulse
          </h1>
          <p className="text-white/40 text-sm mt-1">Agency Reporting Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#1F2937] rounded-2xl p-6 border border-white/10 shadow-[6px_10px_0px_rgba(0,0,0,0.3)]">
          <h2 className="text-white font-semibold text-lg mb-5">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@agency.com"
                className="w-full bg-[#374151] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#00BD7D] focus:ring-2 focus:ring-[#00BD7D]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#374151] border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#00BD7D] focus:ring-2 focus:ring-[#00BD7D]/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg text-xs text-[#DC2626]">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-xs text-white/30 mt-4">
            Don&apos;t have an account? Contact your agency admin.
          </p>
        </div>

        {/* Demo quick-access */}
        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 text-white/60 mb-3">
            <Zap className="w-3.5 h-3.5 text-[#00BD7D]" />
            <span className="text-xs font-semibold">Demo accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex flex-col items-start px-3 py-2.5 bg-[#111827] rounded-lg border border-white/10 hover:border-[#00BD7D]/40 hover:bg-[#00BD7D]/5 transition-colors text-left"
            >
              <span className="text-xs font-semibold text-white/80">Agency Admin</span>
              <span className="text-[10px] text-white/30 mt-0.5">admin@demo.com</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('client')}
              className="flex flex-col items-start px-3 py-2.5 bg-[#111827] rounded-lg border border-white/10 hover:border-[#1877F2]/40 hover:bg-[#1877F2]/5 transition-colors text-left"
            >
              <span className="text-xs font-semibold text-white/80">Client View</span>
              <span className="text-[10px] text-white/30 mt-0.5">client@demo.com</span>
            </button>
          </div>
          <p className="text-[10px] text-white/20 text-center mt-2">Password: demo1234 · Click to autofill</p>
        </div>
      </div>
    </div>
  );
}
