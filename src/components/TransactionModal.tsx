'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { categoriesService, transactionsService } from '@/lib/db';
import { Category, Transaction } from '@/lib/db/types';
import { autoCategorize } from '@/lib/ai-engine';
import { LucideIcon } from './ui/LucideIcon';

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editTransaction = null
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [isCategoryManuallySelected, setIsCategoryManuallySelected] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const list = await categoriesService.list();
      setCategories(list);
    };
    fetchCategories();
  }, [isOpen]);

  useEffect(() => {
    if (editTransaction) {
      setAmount(editTransaction.amount.toString());
      setDescription(editTransaction.description);
      setType(editTransaction.type);
      setCategoryId(editTransaction.category_id || '');
      setDate(editTransaction.date);
      setReceiptBase64(editTransaction.receipt_url || '');
      setIsCategoryManuallySelected(true);
    } else {
      setAmount('');
      setDescription('');
      setType('expense');
      setCategoryId('');
      setDate(getLocalDateString());
      setReceiptBase64('');
      setIsCategoryManuallySelected(false);
    }
  }, [editTransaction, isOpen]);

  // Reset category if it doesn't match selected type (income vs expense)
  useEffect(() => {
    if (categories.length > 0 && categoryId) {
      const selectedCat = categories.find(c => c.id === categoryId);
      if (selectedCat && selectedCat.type !== type) {
        setCategoryId('');
        setIsCategoryManuallySelected(false);
      }
    }
  }, [type, categories, categoryId]);

  // AI Auto-categorization when description changes (only if category hasn't been manually chosen)
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);

    if (!isCategoryManuallySelected && val.trim().length > 2 && categories.length > 0) {
      setAiSuggesting(true);
      // Run AI categorization matching
      const suggestedId = autoCategorize(val, categories);
      if (suggestedId) {
        setCategoryId(suggestedId);
      }
      setTimeout(() => setAiSuggesting(false), 300);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert('Jumlah nominal harus valid.');
    if (!categoryId) return alert('Silakan pilih kategori.');

    setLoading(true);
    try {
      const payload = {
        amount: Number(amount),
        description,
        type,
        category_id: categoryId,
        date,
        receipt_url: receiptBase64 || undefined
      };

      if (editTransaction) {
        await transactionsService.update(editTransaction.id, payload);
      } else {
        await transactionsService.create(payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editTransaction ? 'Ubah Transaksi' : 'Tambah Transaksi'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-50 border border-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              type === 'expense' 
                ? 'bg-white text-rose-600 shadow-sm border border-rose-50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              type === 'income' 
                ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pemasukan
          </button>
        </div>

        {/* Nominal Amount */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nominal (Rp)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold text-slate-800"
          />
        </div>

        {/* Description / AI trigger */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Keterangan / Nama Transaksi</label>
            {aiSuggesting && (
              <span className="flex items-center gap-1 text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full leading-none">
                <LucideIcon name="Sparkles" size={10} className="animate-pulse" />
                AI Mengkategorikan...
              </span>
            )}
          </div>
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="e.g. Beli kopi susu warung"
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 text-sm"
          />
        </div>

        {/* Category & Date in grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setIsCategoryManuallySelected(!!e.target.value);
              }}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 text-sm cursor-pointer"
            >
              <option value="">Pilih Kategori</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 text-sm"
            />
          </div>
        </div>

        {/* Upload Receipt */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Upload Bukti Transaksi</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              id="file-upload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label 
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer transition-colors"
            >
              <LucideIcon name="Upload" size={14} />
              <span>{receiptBase64 ? 'Ganti File' : 'Pilih Gambar'}</span>
            </label>
            {receiptBase64 && (
              <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                <LucideIcon name="CheckCircle" size={14} className="text-emerald-500" />
                Selesai Diunggah
              </span>
            )}
          </div>
          {receiptBase64 && (
            <div className="mt-3 relative w-full h-32 rounded-xl border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
              <img 
                src={receiptBase64} 
                alt="Receipt Proof" 
                className="max-h-full max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setReceiptBase64('')}
                className="absolute top-2 right-2 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <LucideIcon name="Trash2" size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-150 transition-colors cursor-pointer flex items-center gap-2"
          >
            {loading ? 'Menyimpan...' : editTransaction ? 'Ubah' : 'Simpan Transaksi'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
export default TransactionModal;
