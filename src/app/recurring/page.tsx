'use client';

import React, { useState, useEffect } from 'react';
import { recurringTransactionsService, accountsService, categoriesService } from '@/lib/db';
import { RecurringTransaction, Account, Category } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Modal } from '@/components/ui/Modal';

export default function RecurringPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRec, setEditRec] = useState<RecurringTransaction | null>(null);

  // Form Fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState('');
  
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recList, accList, catList] = await Promise.all([
        recurringTransactionsService.list(),
        accountsService.list(),
        categoriesService.list()
      ]);
      setRecurring(recList);
      setAccounts(accList);
      setCategories(catList);
      
      if (accList.length > 0) setAccountId(accList[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (record: RecurringTransaction | null = null) => {
    if (record) {
      setEditRec(record);
      setDescription(record.description);
      setAmount(record.amount.toString());
      setType(record.type);
      setAccountId(record.account_id);
      setCategoryId(record.category_id || '');
      setFrequency(record.frequency);
      setStartDate(record.start_date);
    } else {
      setEditRec(null);
      setDescription('');
      setAmount('');
      setType('expense');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setCategoryId('');
      setFrequency('monthly');
      
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      setStartDate(nextMonth.toISOString().split('T')[0]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || Number(amount) <= 0 || !accountId || !startDate) {
      return alert('Lengkapi semua data yang diperlukan.');
    }

    setSaving(true);
    try {
      const payload = {
        description,
        amount: Number(amount),
        type,
        account_id: accountId,
        category_id: categoryId || undefined,
        frequency,
        start_date: startDate,
        next_run_date: startDate,
        is_active: true
      };

      if (editRec) {
        // Only update basic fields, don't reset next_run_date unless start_date changed
        const updatePayload: Partial<RecurringTransaction> = {
          description,
          amount: Number(amount),
          type,
          account_id: accountId,
          category_id: categoryId || undefined,
          frequency,
          is_active: editRec.is_active
        };
        if (startDate !== editRec.start_date) {
          updatePayload.start_date = startDate;
          updatePayload.next_run_date = startDate;
        }
        await recurringTransactionsService.update(editRec.id, updatePayload);
      } else {
        await recurringTransactionsService.create(payload);
      }
      
      fetchData();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan transaksi rutin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi rutin ini?')) {
      await recurringTransactionsService.delete(id);
      fetchData();
    }
  };

  const handleToggleActive = async (rec: RecurringTransaction) => {
    await recurringTransactionsService.update(rec.id, { is_active: !rec.is_active });
    fetchData();
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Transaksi Rutin</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Otomatiskan pencatatan pemasukan dan pengeluaran berulang Anda.</p>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-100 transition-colors cursor-pointer"
        >
          <LucideIcon name="RefreshCcw" size={16} />
          <span>Tambah Jadwal Rutin</span>
        </button>
      </div>

      {/* Main List view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : recurring.length === 0 ? (
          <div className="col-span-full premium-card p-12 text-center bg-white border-slate-100">
            <LucideIcon name="CalendarClock" className="mx-auto text-slate-200 mb-3" size={48} />
            <h3 className="font-bold text-slate-700 text-sm mb-1">Belum Ada Transaksi Rutin</h3>
            <p className="text-xs text-slate-400">Buat jadwal untuk tagihan bulanan atau gaji Anda agar dicatat secara otomatis.</p>
          </div>
        ) : (
          recurring.map((item) => (
            <div key={item.id} className="premium-card p-5 bg-white border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                      <LucideIcon name={item.type === 'income' ? 'TrendingUp' : 'TrendingDown'} size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 leading-snug">{item.description}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 capitalize">{item.frequency}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400">{item.account?.name || 'Unknown Account'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => handleToggleActive(item)}
                      title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${item.is_active ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`text-xl font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {item.type === 'income' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Jadwal Berikutnya:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(item.next_run_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Terakhir Dijalankan:</span>
                    <span className="font-semibold text-slate-700">
                      {item.last_run_date ? new Date(item.last_run_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenForm(item)}
                  className="px-3 py-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LucideIcon name="Edit3" size={14} />
                  Ubah
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-3 py-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LucideIcon name="Trash2" size={14} />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editRec ? 'Ubah Transaksi Rutin' : 'Tambah Jadwal Rutin Baru'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 p-1 bg-slate-50 border border-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'expense' 
                  ? 'bg-white text-rose-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'income' 
                  ? 'bg-white text-emerald-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Deskripsi Transaksi</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'income' ? 'e.g. Gaji Bulanan' : 'e.g. Tagihan Listrik'}
                required
                className="premium-input"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Jumlah (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                className="premium-input font-semibold"
              />
            </div>
          </div>

          {/* Account & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Pilih Akun Dompet</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="premium-select"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="premium-select"
              >
                <option value="">Pilih Kategori...</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency & Start Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Frekuensi Jadwal</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="premium-select"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Tanggal Mulai / Eksekusi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="premium-input text-slate-600"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
