'use client';

import React, { useState, useEffect } from 'react';
import { transactionsService, categoriesService } from '@/lib/db';
import { Transaction, Category } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [rangeType, setRangeType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [txList, catList] = await Promise.all([
        transactionsService.list(),
        categoriesService.list()
      ]);
      setTransactions(txList);
      setCategories(catList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();

    // Listen to custom update event
    if (typeof window !== 'undefined') {
      window.addEventListener('transaction-updated', fetchReportData);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('transaction-updated', fetchReportData);
      }
    };
  }, []);

  // Pre-configured Range dates
  useEffect(() => {
    const today = new Date();
    if (rangeType === 'daily') {
      const dateStr = formatLocalDate(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (rangeType === 'weekly') {
      const currentDay = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - currentDay);
      const end = new Date(today);
      end.setDate(today.getDate() - currentDay + 6);
      
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
    } else if (rangeType === 'monthly') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
    } else if (rangeType === 'yearly') {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
    }
  }, [rangeType]);

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    const txTime = new Date(tx.date).getTime();
    const matchesStart = !startDate || txTime >= new Date(startDate).getTime();
    const matchesEnd = !endDate || txTime <= new Date(endDate).getTime();
    return matchesStart && matchesEnd;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const cashflow = totalIncome - totalExpense;

  // Group by Category
  const categorySummary: { [key: string]: { name: string; amount: number; color: string; type: string } } = {};
  filteredTransactions.forEach((tx) => {
    const catId = tx.category_id || 'other';
    const catName = tx.category?.name || 'Lainnya';
    const catColor = tx.category?.color || '#cbd5e1';
    
    if (!categorySummary[catId]) {
      categorySummary[catId] = {
        name: catName,
        amount: 0,
        color: catColor,
        type: tx.type
      };
    }
    categorySummary[catId].amount += Number(tx.amount);
  });

  const categorySummaryList = Object.values(categorySummary).sort((a, b) => b.amount - a.amount);

  // --- EXPORT ENGINES ---
  
  // 1. Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return alert('Tidak ada data untuk diekspor');
    
    const headers = ['ID', 'Keterangan', 'Kategori', 'Tanggal', 'Tipe', 'Nominal (IDR)'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.description,
      tx.category?.name || 'Lainnya',
      tx.date,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      tx.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wealthmanager_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export JSON
  const handleExportJSON = () => {
    if (filteredTransactions.length === 0) return alert('Tidak ada data untuk diekspor');
    const dataStr = JSON.stringify(filteredTransactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wealthmanager_report_${startDate}_to_${endDate}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) return alert('Tidak ada data untuk diekspor');

    // Prepare Sheets Data
    const sheetData = filteredTransactions.map((tx) => ({
      'ID Transaksi': tx.id,
      'Keterangan': tx.description,
      'Kategori': tx.category?.name || 'Lainnya',
      'Tanggal': tx.date,
      'Jenis': tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Jumlah (Rp)': tx.amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Transaksi');
    
    // Auto-fit column widths
    const maxColWidth = Object.keys(sheetData[0] || {}).map(key => ({
      wch: Math.max(key.length, ...sheetData.map(row => String((row as any)[key]).length)) + 2
    }));
    worksheet['!cols'] = maxColWidth;

    XLSX.writeFile(workbook, `wealthmanager_report_${startDate}_to_${endDate}.xlsx`);
  };

  // 4. Export PDF (Premium Layout styling)
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) return alert('Tidak ada data untuk diekspor');

    const doc = new jsPDF();
    
    // Brand Banner
    doc.setFillColor(59, 47, 201); // Indigo Primary
    doc.rect(0, 0, 210, 40, 'F');

    // Title text inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('WealthManager Report', 15, 25);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode Laporan: ${startDate} s/d ${endDate}`, 15, 32);

    // Summary Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN KEUANGAN:', 15, 52);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`, 15, 60);
    doc.text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`, 15, 66);
    doc.text(`Arus Kas Bersih: Rp ${cashflow.toLocaleString('id-ID')}`, 15, 72);

    // Table of transactions
    const headers = [['Keterangan', 'Kategori', 'Tanggal', 'Jenis', 'Nominal']];
    const data = filteredTransactions.map(tx => [
      tx.description,
      tx.category?.name || 'Lainnya',
      tx.date,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      `Rp ${tx.amount.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 82,
      theme: 'striped',
      headStyles: { fillColor: [59, 47, 201], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    doc.save(`wealthmanager_report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Ranges */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan Keuangan</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Pantau arus kas dan ekspor rincian data transaksi portofolio.</p>
        </div>

        {/* Date presets */}
        <div className="flex flex-wrap gap-2">
          {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map((preset) => (
            <button
              key={preset}
              onClick={() => setRangeType(preset as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all uppercase tracking-wide cursor-pointer ${
                rangeType === preset
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
              }`}
            >
              {preset === 'daily' ? 'Hari ini' : preset === 'weekly' ? 'Mingguan' : preset === 'monthly' ? 'Bulanan' : preset === 'yearly' ? 'Tahunan' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Date custom inputs (Shown only when custom is toggled) */}
      {rangeType === 'custom' && (
        <div className="premium-card p-4 bg-white grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mulai Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* 3 Metric Card summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-white flex items-center justify-between border-slate-200/80">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemasukan Periode Ini</span>
            <h3 className="text-xl font-bold text-emerald-600">
              Rp {totalIncome.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="p-3 bg-emerald-100/50 text-emerald-700 rounded-xl">
            <LucideIcon name="ArrowDownLeft" size={22} />
          </div>
        </div>

        <div className="premium-card p-6 bg-white flex items-center justify-between border-slate-200/80">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengeluaran Periode Ini</span>
            <h3 className="text-xl font-bold text-rose-500">
              Rp {totalExpense.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="p-3 bg-rose-100/50 text-rose-700 rounded-xl">
            <LucideIcon name="ArrowUpRight" size={22} />
          </div>
        </div>

        <div className="premium-card p-6 bg-white flex items-center justify-between border-slate-200/80">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arus Kas Bersih (Net)</span>
            <h3 className={`text-xl font-bold ${cashflow >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              Rp {cashflow.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${cashflow >= 0 ? 'bg-indigo-100/50 text-indigo-700' : 'bg-rose-100/50 text-rose-700'}`}>
            <LucideIcon name={cashflow >= 0 ? 'TrendingUp' : 'TrendingDown'} size={22} />
          </div>
        </div>
      </div>

      {/* Main Reports & Exports list Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category summaries (Left) */}
        <div className="premium-card p-6 bg-white space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Distribusi Kategori</h3>
            <p className="text-[10px] text-slate-400 font-medium">Berdasarkan data filter aktif saat ini.</p>
          </div>

          <div className="space-y-4">
            {categorySummaryList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada rincian kategori.</p>
            ) : (
              categorySummaryList.map((c, i) => {
                const total = c.type === 'income' ? totalIncome : totalExpense;
                const percent = total > 0 ? (c.amount / total) * 100 : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span style={{ backgroundColor: c.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                        <span className="font-semibold text-slate-700">{c.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{percent.toFixed(0)}%</span>
                    </div>
                    {/* Progress */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percent}%`, backgroundColor: c.color }}
                        className="h-full rounded-full"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>Rp {c.amount.toLocaleString('id-ID')}</span>
                      <span className="capitalize">{c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Exports Panel (Right) */}
        <div className="lg:col-span-2 premium-card p-6 bg-white space-y-6 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Ekspor Portofolio Laporan</h3>
            <p className="text-[10px] text-slate-400 font-medium">Unduh data laporan dalam berbagai format siap pakai.</p>
          </div>

          {/* Export action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PDF Card */}
            <div 
              onClick={handleExportPDF}
              className="p-4 bg-slate-50/50 hover:bg-indigo-50/20 border border-slate-200/80 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <LucideIcon name="FileText" size={24} />
              </div>
              <div className="leading-tight text-left">
                <h4 className="font-bold text-xs text-slate-800">Dokumen PDF</h4>
                <p className="text-[10px] text-slate-400 mt-1">Unduh dokumen cetak & summary tabel.</p>
              </div>
            </div>

            {/* Excel Card */}
            <div 
              onClick={handleExportExcel}
              className="p-4 bg-slate-50/50 hover:bg-emerald-50/20 border border-slate-200/80 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <LucideIcon name="FileSpreadsheet" size={24} />
              </div>
              <div className="leading-tight text-left">
                <h4 className="font-bold text-xs text-slate-800">Microsoft Excel (.xlsx)</h4>
                <p className="text-[10px] text-slate-400 mt-1">Spreadsheet data lengkap dengan auto column width.</p>
              </div>
            </div>

            {/* CSV Card */}
            <div 
              onClick={handleExportCSV}
              className="p-4 bg-slate-50/50 hover:bg-amber-50/20 border border-slate-200/80 hover:border-amber-300 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                <LucideIcon name="FileCode" size={24} />
              </div>
              <div className="leading-tight text-left">
                <h4 className="font-bold text-xs text-slate-800">Format CSV</h4>
                <p className="text-[10px] text-slate-400 mt-1">Berkas teks comma-separated sederhana.</p>
              </div>
            </div>

            {/* JSON Card */}
            <div 
              onClick={handleExportJSON}
              className="p-4 bg-slate-50/50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-200 transition-colors">
                <LucideIcon name="Code" size={24} />
              </div>
              <div className="leading-tight text-left">
                <h4 className="font-bold text-xs text-slate-800">Data Raw JSON</h4>
                <p className="text-[10px] text-slate-400 mt-1">Backup dump data komprehensif format JSON.</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-slate-50/40 rounded-xl border border-slate-100">
            <p className="text-[9px] text-slate-400 leading-normal text-center">
              * Pastikan Anda memilih rentang filter yang diinginkan di atas sebelum melakukan ekspor file.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
