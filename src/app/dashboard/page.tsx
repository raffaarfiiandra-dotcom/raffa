'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  transactionsService, 
  categoriesService, 
  assetsService, 
  debtsService, 
  goalsService 
} from '@/lib/db';
import { Transaction, Category, Asset, Debt, Goal } from '@/lib/db/types';
import { generateInsights, FinancialInsight } from '@/lib/ai-engine';
import { LucideIcon } from '@/components/ui/LucideIcon';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [txList, catList, assetList, debtList, goalList] = await Promise.all([
        transactionsService.list(),
        categoriesService.list(),
        assetsService.list(),
        debtsService.list(),
        goalsService.list(),
      ]);

      setTransactions(txList);
      setCategories(catList);
      setAssets(assetList);
      setDebts(debtList);
      setGoals(goalList);

      const generatedInsights = generateInsights(txList, catList, assetList);
      setInsights(generatedInsights);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to custom update event
    if (typeof window !== 'undefined') {
      window.addEventListener('transaction-updated', fetchData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('transaction-updated', fetchData);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalDebt = debts.filter(d => d.type === 'debt' && d.status !== 'Lunas').reduce((sum, d) => sum + Number(d.amount), 0);
  const totalReceivable = debts.filter(d => d.type === 'receivable' && d.status !== 'Lunas').reduce((sum, d) => sum + Number(d.amount), 0);

  // Net Balance = Assets + Receivables - Debts + (Income - Expense)
  // Let's make Net Balance sum up these variables
  const netBalance = totalAssets + totalReceivable - totalDebt + (totalIncome - totalExpense);

  const recentTransactions = transactions.slice(0, 5);

  // Group monthly cashflow for charts (Last 6 months)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentMonthIdx = new Date().getMonth();
  const last6Months = Array.from({length: 6}, (_, i) => {
    const idx = (currentMonthIdx - 5 + i + 12) % 12;
    return { name: months[idx], income: 0, expense: 0, index: idx };
  });

  // Populate actual data in chart groups
  transactions.forEach(t => {
    const txDate = new Date(t.date);
    const txMonth = txDate.getMonth();
    const chartMonth = last6Months.find(m => m.index === txMonth);
    if (chartMonth) {
      if (t.type === 'income') {
        chartMonth.income += Number(t.amount);
      } else {
        chartMonth.expense += Number(t.amount);
      }
    }
  });

  // Calculate highest monthly value to scale SVG chart heights
  const maxVal = Math.max(...last6Months.map(m => Math.max(m.income, m.expense)), 100000);

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Portofolio</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Ringkasan kondisi keuangan dan aktivitas terkini Anda.</p>
        </div>
      </div>

      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Balance */}
        <div className="premium-card p-6 flex items-center justify-between relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0 shadow-indigo-150">
          <div className="space-y-2 z-10">
            <span className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest">Total Saldo (Kekayaan Bersih)</span>
            <h3 className="text-2xl font-bold">
              Rp {netBalance.toLocaleString('id-ID')}
            </h3>
            <p className="text-[10px] text-indigo-200 font-medium">Aset & Piutang dikurangi Hutang</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl z-10">
            <LucideIcon name="Wallet" size={26} className="text-white" />
          </div>
          {/* Decorative shapes */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full -mr-5 -mb-5" />
          <div className="absolute left-1/2 top-0 w-16 h-16 bg-white/5 rounded-full -mt-5" />
        </div>

        {/* Income Card */}
        <div className="premium-card p-6 flex items-center justify-between bg-white border-slate-100">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Pemasukan</span>
            <h3 className="text-2xl font-bold text-slate-800">
              Rp {totalIncome.toLocaleString('id-ID')}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full leading-none">
              <LucideIcon name="TrendingUp" size={10} />
              Pemasukan Bulan Ini
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <LucideIcon name="ArrowDownLeft" size={26} />
          </div>
        </div>

        {/* Expense Card */}
        <div className="premium-card p-6 flex items-center justify-between bg-white border-slate-100">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Pengeluaran</span>
            <h3 className="text-2xl font-bold text-slate-800">
              Rp {totalExpense.toLocaleString('id-ID')}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full leading-none">
              <LucideIcon name="TrendingDown" size={10} />
              Pengeluaran Terkumpul
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <LucideIcon name="ArrowUpRight" size={26} />
          </div>
        </div>
      </div>

      {/* Main Charts & Sidebars Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow Graph */}
        <div className="lg:col-span-2 premium-card p-6 bg-white flex flex-col justify-between min-h-[360px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cashflow (6 Bulan Terakhir)</h3>
              <p className="text-[10px] text-slate-400 font-medium">Visualisasi perbandingan pemasukan vs pengeluaran.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                <span className="text-slate-500">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-400 rounded-full" />
                <span className="text-slate-500">Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* Responsive Custom SVG Bar/Area Chart */}
          <div className="relative flex-1 w-full min-h-[200px] flex items-end">
            <div className="absolute inset-y-0 left-0 w-full flex flex-col justify-between pointer-events-none opacity-40 text-[9px] font-semibold text-slate-400">
              <div>Rp {(maxVal).toLocaleString('id-ID')}</div>
              <div className="border-t border-dashed border-slate-200 w-full my-1"></div>
              <div>Rp {(maxVal / 2).toLocaleString('id-ID')}</div>
              <div className="border-t border-dashed border-slate-200 w-full my-1"></div>
              <div>0</div>
            </div>

            <div className="relative z-10 w-full h-[180px] flex justify-around items-end pt-4 px-8">
              {last6Months.map((m, idx) => {
                const incHeight = (m.income / maxVal) * 130;
                const expHeight = (m.expense / maxVal) * 130;
                
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group w-1/6">
                    {/* Bars Container */}
                    <div className="flex items-end gap-1.5 h-[140px] justify-center w-full">
                      {/* Income Bar */}
                      <div 
                        style={{ height: `${Math.max(incHeight, 4)}px` }}
                        className="w-4 bg-indigo-500 hover:bg-indigo-600 rounded-t-xs transition-all duration-300 relative group-hover:scale-y-105"
                      >
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold py-1 px-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xs mb-1 pointer-events-none whitespace-nowrap z-20">
                          Rp {m.income.toLocaleString('id-ID')}
                        </span>
                      </div>
                      
                      {/* Expense Bar */}
                      <div 
                        style={{ height: `${Math.max(expHeight, 4)}px` }}
                        className="w-4 bg-rose-400 hover:bg-rose-505 rounded-t-xs transition-all duration-300 relative group-hover:scale-y-105"
                      >
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold py-1 px-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xs mb-1 pointer-events-none whitespace-nowrap z-20">
                          Rp {m.expense.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    {/* Label */}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="premium-card p-6 bg-white flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <LucideIcon name="Sparkles" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">AI Financial Insights</h3>
              <p className="text-[9px] text-slate-400 font-medium">Rekomendasi finansial cerdas berdasarkan data Anda.</p>
            </div>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto no-scrollbar">
            {insights.map((ins, i) => (
              <div 
                key={i} 
                className={`p-3.5 rounded-xl border space-y-1 ${
                  ins.type === 'warning' 
                    ? 'bg-rose-50/40 border-rose-100/50' 
                    : ins.type === 'success' 
                    ? 'bg-emerald-50/40 border-emerald-100/50' 
                    : 'bg-indigo-50/40 border-indigo-100/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LucideIcon 
                    name={ins.type === 'warning' ? 'AlertTriangle' : ins.type === 'success' ? 'CheckCircle' : 'Info'} 
                    className={ins.type === 'warning' ? 'text-rose-500' : ins.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'} 
                    size={14} 
                  />
                  <h4 className={`text-xs font-bold ${
                    ins.type === 'warning' ? 'text-rose-800' : ins.type === 'success' ? 'text-emerald-800' : 'text-indigo-800'
                  }`}>
                    {ins.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                  {ins.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions & Bottom Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions */}
        <div className="lg:col-span-2 premium-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Aktivitas Transaksi Terbaru</h3>
              <p className="text-[10px] text-slate-400 font-medium">Transaksi terupdate yang baru dicatat.</p>
            </div>
            <Link 
              href="/transactions" 
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <LucideIcon name="ChevronRight" size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <LucideIcon name="Inbox" className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-xs text-slate-400 font-medium">Belum ada transaksi</p>
                <p className="text-[10px] text-slate-400 mt-1">Gunakan tombol 'Add Transaction' di samping untuk menambahkan.</p>
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: `${tx.category?.color || '#cbd5e1'}20`, color: tx.category?.color || '#64748b' }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    >
                      <LucideIcon name={tx.category?.icon || 'HelpCircle'} size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800 leading-snug">{tx.description || tx.category?.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[9px] font-bold text-slate-400 tracking-wide uppercase">{tx.category?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-xs ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Savings Goals Card */}
        <div className="premium-card p-6 bg-white flex flex-col justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Target Keuangan</h3>
                <p className="text-[9px] text-slate-400 font-medium">Target tabungan dan kemajuan pencapaian.</p>
              </div>
              <Link href="/settings" className="text-[10px] font-bold text-indigo-600 hover:underline">
                Kelola Target
              </Link>
            </div>

            <div className="space-y-4 overflow-y-auto no-scrollbar max-h-56">
              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <LucideIcon name="Target" className="mx-auto text-slate-200 mb-2" size={32} />
                  <p className="text-xs text-slate-400 font-medium">Belum ada target dibuat</p>
                  <p className="text-[9px] text-slate-400 mt-1">Buat target impian Anda di menu Settings.</p>
                </div>
              ) : (
                goals.map((goal) => {
                  const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{goal.title}</span>
                        <span className="font-bold text-indigo-600">{percent.toFixed(0)}%</span>
                      </div>
                      {/* Bar progress */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${percent}%` }}
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span>Rp {goal.current_amount.toLocaleString('id-ID')}</span>
                        <span>Target: Rp {goal.target_amount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
