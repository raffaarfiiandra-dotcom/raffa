'use client';

import React, { useState, useEffect } from 'react';
import { transactionsService, categoriesService } from '@/lib/db';
import { Transaction, Category } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txList, catList] = await Promise.all([
          transactionsService.list(),
          categoriesService.list(),
        ]);
        setTransactions(txList);
        setCategories(catList);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-80 w-full bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
  const lastMonthYear = currentMonthIdx === 0 ? currentYear - 1 : currentYear;

  // Filter transactions
  const currentMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
  });

  const lastMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === lastMonthIdx && d.getFullYear() === lastMonthYear;
  });

  // Comparisons
  const cmExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const lmExpense = lastMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  
  const cmIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const lmIncome = lastMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseChange = lmExpense !== 0 ? ((cmExpense - lmExpense) / lmExpense) * 100 : 0;
  const incomeChange = lmIncome !== 0 ? ((cmIncome - lmIncome) / lmIncome) * 100 : 0;

  // Daily average expense
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const dailyAverage = cmExpense / daysInMonth;

  // Top Categories (Current Month)
  const categoryMap = new Map<string, number>();
  currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    const catId = t.category_id || 'unknown';
    categoryMap.set(catId, (categoryMap.get(catId) || 0) + Number(t.amount));
  });

  const pieData = Array.from(categoryMap.entries())
    .map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || 'Tanpa Kategori',
        value: amount,
        color: cat?.color || '#94a3b8'
      };
    })
    .sort((a, b) => b.value - a.value);

  const totalPie = pieData.reduce((sum, d) => sum + d.value, 0);

  // 6 Month Trend Data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const trendData = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(currentMonthIdx - 5 + i);
    const idx = d.getMonth();
    const year = d.getFullYear();
    
    let income = 0;
    let expense = 0;
    
    transactions.forEach(t => {
      const txDate = new Date(t.date);
      if (txDate.getMonth() === idx && txDate.getFullYear() === year) {
        if (t.type === 'income') income += Number(t.amount);
        else expense += Number(t.amount);
      }
    });

    return { name: months[idx], income, expense };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
          <p className="font-bold text-slate-800 text-xs mb-1">{payload[0].name}</p>
          <p className="text-indigo-600 font-semibold text-xs">
            Rp {Number(payload[0].value).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {((payload[0].value / totalPie) * 100).toFixed(1)}% dari total pengeluaran
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Smart Analytics</h2>
        <p className="text-xs text-slate-400 font-medium mt-1">Wawasan mendalam dari aktivitas keuangan Anda bulan ini.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Income Comp */}
        <div className="premium-card p-5 bg-white">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><LucideIcon name="TrendingUp" size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemasukan Bulan Ini</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">Rp {cmIncome.toLocaleString('id-ID')}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold">
            <span className={incomeChange >= 0 ? "text-emerald-600" : "text-rose-500"}>
              {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}%
            </span>
            <span className="text-slate-400 font-medium">vs bulan lalu</span>
          </div>
        </div>

        {/* Expense Comp */}
        <div className="premium-card p-5 bg-white">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><LucideIcon name="TrendingDown" size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengeluaran Bulan Ini</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">Rp {cmExpense.toLocaleString('id-ID')}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold">
            <span className={expenseChange <= 0 ? "text-emerald-600" : "text-rose-500"}>
              {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}%
            </span>
            <span className="text-slate-400 font-medium">vs bulan lalu</span>
          </div>
        </div>

        {/* Daily Average */}
        <div className="premium-card p-5 bg-white">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><LucideIcon name="Calendar" size={16} /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Harian</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800">Rp {dailyAverage.toLocaleString('id-ID')}</h3>
          <p className="mt-2 text-[10px] text-slate-400 font-medium">Berdasarkan {daysInMonth} hari di bulan ini</p>
        </div>

        {/* Savings Rate */}
        <div className="premium-card p-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/10 rounded-lg"><LucideIcon name="PiggyBank" size={16} /></div>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Tingkat Tabungan</span>
          </div>
          <h3 className="text-2xl font-bold">
            {cmIncome > 0 ? Math.max(((cmIncome - cmExpense) / cmIncome) * 100, 0).toFixed(1) : 0}%
          </h3>
          <p className="mt-2 text-[10px] text-indigo-200 font-medium">Rasio surplus dari pemasukan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="premium-card p-6 bg-white flex flex-col">
          <h4 className="font-bold text-slate-800 text-sm mb-6">Top Kategori Pengeluaran</h4>
          {pieData.length > 0 ? (
            <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</span>
                <span className="text-lg font-bold text-slate-800">Rp {(totalPie/1000000).toFixed(1)}M</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
              <LucideIcon name="PieChart" size={48} className="text-slate-200 mb-4" />
              <p className="text-sm font-semibold">Belum ada pengeluaran</p>
            </div>
          )}
          {/* Legend */}
          <div className="mt-6 space-y-3">
            {pieData.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span className="text-xs font-semibold text-slate-700">{d.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800">Rp {d.value.toLocaleString('id-ID')}</span>
                  <span className="text-[10px] font-bold text-slate-400 w-8 text-right">
                    {((d.value / totalPie) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart Trend */}
        <div className="premium-card p-6 bg-white flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-slate-800 text-sm">Tren 6 Bulan Terakhir</h4>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Pengeluaran
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Line type="monotone" name="Pemasukan" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Pengeluaran" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
