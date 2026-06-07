'use client';

import React, { useState, useEffect } from 'react';
import { 
  accountsService, 
  assetsService, 
  debtsService, 
  netWorthService 
} from '@/lib/db';
import { Account, Asset, Debt, NetWorthHistory } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';

export default function NetWorthPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [history, setHistory] = useState<NetWorthHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Record today's snapshot first
        await netWorthService.recordSnapshot();

        const [accList, assetList, debtList, histList] = await Promise.all([
          accountsService.list(),
          assetsService.list(),
          debtsService.list(),
          netWorthService.getHistory()
        ]);

        setAccounts(accList);
        setAssets(assetList);
        setDebts(debtList);
        setHistory(histList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-40 w-full bg-slate-200 rounded-2xl"></div>
        <div className="h-80 w-full bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  // Calculate current components
  const totalAccounts = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalReceivables = debts.filter(d => d.type === 'receivable' && d.status !== 'Lunas').reduce((sum, d) => sum + Number(d.amount), 0);
  const totalDebts = debts.filter(d => d.type === 'debt' && d.status !== 'Lunas').reduce((sum, d) => sum + Number(d.amount), 0);

  const currentNetWorth = totalAccounts + totalAssets + totalReceivables - totalDebts;

  // Formatting data for chart
  const chartData = history.map(h => ({
    dateStr: new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    netWorth: Number(h.net_worth),
    rawDate: h.date
  }));

  // Calculate change
  let changeAmount = 0;
  let changePercent = 0;
  if (history.length > 1) {
    // Compare last with second to last
    const current = history[history.length - 1].net_worth;
    const previous = history[history.length - 2].net_worth;
    changeAmount = current - previous;
    changePercent = previous !== 0 ? (changeAmount / previous) * 100 : 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Net Worth Tracker</h2>
        <p className="text-xs text-slate-400 font-medium mt-1">Lacak perkembangan kekayaan bersih Anda dari waktu ke waktu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Net Worth Card */}
        <div className="md:col-span-2 premium-card p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden">
          <div className="z-10 relative">
            <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block mb-2">Kekayaan Bersih Saat Ini</span>
            <h3 className="text-4xl font-black tracking-tight truncate" title={`Rp ${currentNetWorth.toLocaleString('id-ID')}`}>
              Rp {currentNetWorth.toLocaleString('id-ID')}
            </h3>
            
            {history.length > 1 && (
              <div className="flex items-center gap-2 mt-4">
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                  changeAmount >= 0 ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'
                }`}>
                  <LucideIcon name={changeAmount >= 0 ? 'TrendingUp' : 'TrendingDown'} size={12} />
                  {changeAmount >= 0 ? '+' : ''}Rp {Math.abs(changeAmount).toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-indigo-200 font-medium">sejak pencatatan sebelumnya</span>
              </div>
            )}
          </div>
          <LucideIcon name="TrendingUp" size={120} className="absolute -right-10 -bottom-10 text-white/10" />
        </div>

        {/* Formula breakdown */}
        <div className="premium-card p-6 bg-white space-y-4">
          <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Rincian Perhitungan</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-2"><LucideIcon name="Wallet" size={14} className="text-indigo-500"/> Saldo Akun</span>
              <span className="font-bold text-slate-800">Rp {totalAccounts.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-2"><LucideIcon name="Building2" size={14} className="text-emerald-500"/> Total Aset</span>
              <span className="font-bold text-slate-800">Rp {totalAssets.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-2"><LucideIcon name="ArrowDownRight" size={14} className="text-blue-500"/> Piutang</span>
              <span className="font-bold text-slate-800">Rp {totalReceivables.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
              <span className="text-slate-500 flex items-center gap-2"><LucideIcon name="ArrowUpRight" size={14} className="text-rose-500"/> Hutang</span>
              <span className="font-bold text-rose-500">- Rp {totalDebts.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="premium-card p-6 bg-white">
        <h4 className="font-bold text-slate-800 text-sm mb-6">Grafik Pertumbuhan Kekayaan Bersih</h4>
        <div className="h-[300px] w-full">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="dateStr" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Kekayaan Bersih']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="#4F46E5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorNetWorth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <LucideIcon name="TrendingUp" size={48} className="text-slate-200 mb-4" />
              <p className="text-sm font-semibold">Data Belum Cukup</p>
              <p className="text-[10px]">Grafik akan muncul setelah ada minimal 2 hari pencatatan data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
