'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, getSessionUser } from '@/lib/db';
import { LucideIcon } from '@/components/ui/LucideIcon';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    const checkLogged = async () => {
      const user = await getSessionUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkLogged();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await authService.login(email, password);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Terjadi kesalahan');
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const res = await authService.loginWithGoogle();
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Google login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-indigo-50/50 via-slate-50 to-indigo-100/40 p-4">
      {/* Brand Title */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-indigo-700 tracking-tight">WealthManager</h1>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-8 md:p-10 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-800">Masuk ke Akun Anda</h2>
          <p className="text-xs text-slate-400 font-medium">Kelola portofolio Anda dengan presisi.</p>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 border border-rose-100">
            <LucideIcon name="AlertCircle" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Google sign in button */}
        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          {/* Custom Google logo using standard SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.18 4.114-3.418 0-6.192-2.775-6.192-6.19s2.774-6.19 6.192-6.19c1.54 0 2.946.565 4.032 1.5l3.1-3.1C19.146 1.954 15.894 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c5.8 0 10.87-4.12 10.87-11 0-.765-.08-1.5-.24-2.17l-9.63.255z" />
          </svg>
          <span>Masuk dengan Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">atau lanjutkan dengan email</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Credential login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email</label>
            <div className="relative">
              <LucideIcon name="Mail" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kata Sandi</label>
              <Link href="#" className="text-[11px] font-semibold text-indigo-600 hover:underline">Lupa Kata Sandi?</Link>
            </div>
            <div className="relative">
              <LucideIcon name="Lock" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-colors cursor-pointer"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          Belum memiliki akun?{' '}
          <Link href="/register" className="font-bold text-indigo-600 hover:underline">
            Daftar Akun Baru
          </Link>
        </p>
      </div>
    </div>
  );
}
