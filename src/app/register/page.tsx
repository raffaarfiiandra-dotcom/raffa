'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, getSessionUser } from '@/lib/db';
import { LucideIcon } from '@/components/ui/LucideIcon';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await authService.register(email, password, fullName);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Terjadi kesalahan saat pendaftaran');
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
          <h2 className="text-xl font-bold text-slate-800">Daftar Akun Baru</h2>
          <p className="text-xs text-slate-400 font-medium">Buat akun untuk mengelola portofolio keuangan Anda.</p>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 border border-rose-100">
            <LucideIcon name="AlertCircle" size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <LucideIcon name="User" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Anda"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 text-sm"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kata Sandi</label>
            <div className="relative">
              <LucideIcon name="Lock" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Buat Kata Sandi"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-colors cursor-pointer"
          >
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
