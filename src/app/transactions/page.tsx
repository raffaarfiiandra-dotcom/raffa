'use client';

import React, { useState, useEffect } from 'react';
import { transactionsService, categoriesService } from '@/lib/db';
import { Transaction, Category } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { TransactionModal } from '@/components/TransactionModal';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Edit State
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showProofImg, setShowProofImg] = useState<string | null>(null);

  const fetchTransactions = async () => {
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
    fetchTransactions();

    // Listen to custom update event
    if (typeof window !== 'undefined') {
      window.addEventListener('transaction-updated', fetchTransactions);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('transaction-updated', fetchTransactions);
      }
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      const ok = await transactionsService.delete(id);
      if (ok) {
        fetchTransactions();
        // Dispatch update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('transaction-updated'));
        }
      } else {
        alert('Gagal menghapus transaksi.');
      }
    }
  };

  const handleEditClick = (tx: Transaction) => {
    setEditTx(tx);
    setIsModalOpen(true);
  };

  // Reset filtering inputs
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredTransactions = transactions.filter((tx) => {
    // 1. Search Query Match
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category?.name.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Type Match
    const matchesType = selectedType === 'all' || tx.type === selectedType;

    // 3. Category Match
    const matchesCategory = selectedCategory === 'all' || tx.category_id === selectedCategory;

    // 4. Date range Match
    const txTime = new Date(tx.date).getTime();
    const matchesStart = !startDate || txTime >= new Date(startDate).getTime();
    const matchesEnd = !endDate || txTime <= new Date(endDate).getTime();

    return matchesSearch && matchesType && matchesCategory && matchesStart && matchesEnd;
  });

  // Pagination Logic
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">Riwayat Transaksi</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Kelola pencatatan pemasukan dan pengeluaran secara fleksibel.</p>
        </div>
        <button
          onClick={() => {
            setEditTx(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-150 transition-colors cursor-pointer"
        >
          <LucideIcon name="Plus" size={16} />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="premium-card p-5 bg-white space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          {/* Keyword Search */}
          <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cari Transaksi</span>
            <div className="relative">
              <LucideIcon name="Search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="premium-input !pl-11"
              />
            </div>
          </div>

          {/* Type Select */}
          <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe</span>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="premium-select"
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan Saja</option>
              <option value="expense">Pengeluaran Saja</option>
            </select>
          </div>

          {/* Category Select */}
          <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="premium-select"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.type === 'income' ? 'Masuk' : 'Keluar'})</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mulai Tanggal</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="premium-input text-slate-600 w-full"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5 w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sampai Tanggal</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="premium-input text-slate-600 w-full"
            />
          </div>
        </div>

        {/* Clear filter button */}
        {(searchQuery || selectedType !== 'all' || selectedCategory !== 'all' || startDate || endDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-650 flex items-center gap-1.5 cursor-pointer"
            >
              <LucideIcon name="RefreshCw" size={12} />
              <span>Bersihkan Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table view */}
      <div className="premium-card bg-white overflow-hidden flex flex-col justify-between min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Nama Transaksi / Keterangan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4 text-center">Bukti</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <LucideIcon name="Inbox" className="mx-auto text-slate-300 mb-3" size={36} />
                    <p className="text-xs text-slate-400 font-bold">Tidak ada transaksi ditemukan</p>
                    <p className="text-[10px] text-slate-400 mt-1">Coba sesuaikan filter atau tambahkan transaksi baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Desc */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-800">{tx.description}</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5 sm:hidden">{tx.category?.name}</span>
                      </div>
                    </td>
                    
                    {/* Category */}
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span 
                        style={{ backgroundColor: `${tx.category?.color || '#cbd5e1'}15`, color: tx.category?.color || '#64748b' }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide leading-none"
                      >
                        <span style={{ backgroundColor: tx.category?.color }} className="w-1.5 h-1.5 rounded-full" />
                        {tx.category?.name || 'Lainnya'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Receipt proof thumbnail */}
                    <td className="py-4 px-4 text-center">
                      {tx.receipt_url ? (
                        <button 
                          onClick={() => setShowProofImg(tx.receipt_url || null)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Lihat Bukti"
                        >
                          <LucideIcon name="Image" size={16} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300">-</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 text-right">
                      <span className={`font-bold text-xs ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(tx)}
                          className="p-1 bg-slate-55 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Ubah"
                        >
                          <LucideIcon name="Edit3" size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 bg-slate-55 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Hapus"
                        >
                          <LucideIcon name="Trash2" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} catatan
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <LucideIcon name="ChevronLeft" size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-7 h-7 font-bold text-xs rounded-lg transition-all cursor-pointer ${
                    currentPage === p 
                      ? 'bg-indigo-600 text-white' 
                      : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <LucideIcon name="ChevronRight" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTx(null);
        }}
        onSuccess={fetchTransactions}
        editTransaction={editTx}
      />

      {/* Proof Viewer Lightbox Modal */}
      {showProofImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setShowProofImg(null)} />
          <div className="relative max-w-2xl max-h-[85vh] bg-white border border-slate-100 rounded-2xl overflow-hidden p-3 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowProofImg(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-colors cursor-pointer z-10"
            >
              <LucideIcon name="X" size={16} />
            </button>
            <img 
              src={showProofImg} 
              alt="Bukti Transaksi" 
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3">Bukti Pembayaran / Resi Transaksi</span>
          </div>
        </div>
      )}
    </div>
  );
}
