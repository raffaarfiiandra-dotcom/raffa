'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { getSessionUser } from '@/lib/db';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const user = await getSessionUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. Header / Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between h-[73px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-100">
            W
          </div>
          <div>
            <h1 className="font-bold text-lg text-indigo-950 leading-none">WealthManager</h1>
            <p className="text-[10px] text-indigo-500 font-medium tracking-wide mt-1 uppercase">Elite Wealth Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              Ke Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                Mulai Sekarang
              </Link>
            </>
          )}
        </div>
      </nav>
 
       {/* 2. Hero Section */}
       <section className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center space-y-6 md:space-y-8">
         
         {/* Banner Badge */}
         <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-750 bg-indigo-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider leading-none shadow-xs border border-indigo-100/50">
           <LucideIcon name="Sparkles" size={12} className="text-indigo-600" />
           Aplikasi Manajemen Keuangan Premium
         </span>
 
         {/* Big Headline */}
         <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl">
           Kelola Kekayaan Anda dengan <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-850 bg-clip-text text-transparent">Presisi Finansial</span>
         </h2>
 
         {/* Sub-headline */}
         <p className="text-sm md:text-base text-slate-450 max-w-2xl leading-relaxed">
           Platform fintech modern untuk mencatat transaksi harian, memantau alokasi aset portofolio, memonitor kewajiban hutang piutang, dan mendapatkan analisis AI penghematan secara instan.
         </p>
 
         {/* Action Buttons */}
         <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4 w-full max-w-xs sm:max-w-none">
           {isLoggedIn ? (
             <Link 
               href="/dashboard" 
               className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-100 transition-all cursor-pointer flex items-center justify-center gap-2 group"
             >
               <span>Kembali ke Dashboard</span>
               <LucideIcon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
             </Link>
           ) : (
             <>
               <Link 
                 href="/register" 
                 className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-100 transition-all cursor-pointer flex items-center justify-center gap-2 group"
               >
                 <span>Daftar Akun Baru</span>
                 <LucideIcon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
               </Link>
               
               <Link 
                 href="/login" 
                 className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-2xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
               >
                 <LucideIcon name="Layout" size={16} />
                 <span>Coba Demo Dashboard</span>
               </Link>
             </>
           )}
         </div>

        {/* Graphic Mockup Area */}
        <div className="w-full max-w-4xl pt-10">
          <div className="premium-card bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
            {/* Mockup Left */}
            <div className="flex-1 space-y-4 text-left w-full">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Kekayaan Bersih</span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12.5% YoY</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800">Rp 128.500.000</h3>
              
              {/* Progress indicators mockup */}
              <div className="space-y-2.5 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Target Dana Darurat</span>
                    <span>75%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-[75%]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Target Investasi Emas</span>
                    <span>40%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-[40%]" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Divider */}
            <div className="w-[1px] h-32 bg-slate-150 hidden md:block" />

            {/* Mockup Right */}
            <div className="flex-1 w-full flex flex-col justify-around text-left space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Visualisasi Cashflow Terpadu</h4>
              {/* Bars mockup */}
              <div className="flex justify-around items-end h-28 pt-4">
                <div className="flex flex-col items-center gap-1 w-1/5">
                  <div className="w-3.5 bg-indigo-500 rounded-t-xs h-14" />
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Mei</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/5">
                  <div className="w-3.5 bg-indigo-500 rounded-t-xs h-20" />
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Jun</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/5">
                  <div className="w-3.5 bg-indigo-500 rounded-t-xs h-16" />
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Jul</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/5">
                  <div className="w-3.5 bg-indigo-600 rounded-t-xs h-24 shadow-md shadow-indigo-100" />
                  <span className="text-[8px] text-indigo-600 font-bold uppercase">Ags</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="bg-white border-t border-b border-slate-100 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800">Fitur Premium Kelas Finansial</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Keunggulan utama yang membedakan kami</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="p-6 bg-slate-50/50 border border-slate-100/80 rounded-2xl space-y-3.5 hover:shadow-xs transition-shadow">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                <LucideIcon name="Sparkles" size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Klasifikasi Transaksi AI</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tulis deskripsi pengeluaran atau pemasukan Anda secara alami, dan AI Heuristik akan otomatis mencocokkan serta menetapkan kategori transaksi yang sesuai secara instan.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-50/50 border border-slate-100/80 rounded-2xl space-y-3.5 hover:shadow-xs transition-shadow">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                <LucideIcon name="Download" size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Ekspor Multi-Format Asli</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unduh laporan data keuangan Anda kapan saja dalam format dokumen PDF resmi, spreadsheet Microsoft Excel (.xlsx), berkas CSV terstruktur, atau data mentah JSON.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-50/50 border border-slate-100/80 rounded-2xl space-y-3.5 hover:shadow-xs transition-shadow">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
                <LucideIcon name="LineChart" size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Portofolio Aset & Hutang</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pantau seluruh kepemilikan properti, investasi saham/obligasi, kas tabungan, dan kendaraan beserta tagihan hutang piutang jatuh tempo dalam satu ringkasan aset terpadu.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">W</span>
            <span className="font-bold text-white text-sm">WealthManager</span>
          </div>
          <p className="text-xs font-medium text-slate-500">
            © {new Date().getFullYear()} WealthManager. Didesain secara profesional untuk publikasi instan.
          </p>
        </div>
      </footer>

    </div>
  );
}
