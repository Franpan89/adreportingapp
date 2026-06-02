'use client';
import { useState } from 'react';
import { BarChart3, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

    // ── Real Supabase auth ──────────────────────────────────────────
    if (IS_PLACEHOLDER_SUPABASE) {
      setError('El servicio de autenticación no está configurado.');
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
      setError('Servicio de autenticación no disponible.');
      setLoading(false);
    }
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
            Client Reporting
          </h1>
          <p className="text-white/40 text-sm mt-1">Reporte multicanal por cliente — Web My Money</p>
        </div>

        {/* Card */}
        <div className="bg-[#1F2937] rounded-2xl p-6 border border-white/10 shadow-[6px_10px_0px_rgba(0,0,0,0.3)]">
          <h2 className="text-white font-semibold text-lg mb-5">Inicia sesión en tu cuenta</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@agencia.com"
                className="w-full bg-[#374151] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#00BD7D] focus:ring-2 focus:ring-[#00BD7D]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Contraseña</label>
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
              Ingresar
            </Button>
          </form>

          <p className="text-center text-xs text-white/30 mt-4">
            ¿No tienes cuenta? Contacta al administrador de tu agencia.
          </p>
        </div>
      </div>
    </div>
  );
}
