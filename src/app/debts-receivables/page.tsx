'use client';

import React, { useState, useEffect } from 'react';
import { debtsService } from '@/lib/db';
import { Debt } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Modal } from '@/components/ui/Modal';

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DebtsReceivablesPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'receivable'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);

  // Form Fields
  const [contactName, setContactName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'debt' | 'receivable'>('debt');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'Lunas' | 'Belum Lunas' | 'Terlambat'>('Belum Lunas');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const list = await debtsService.list();
      setDebts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // Form Populate
  const handleOpenForm = (record: Debt | null = null) => {
    if (record) {
      setEditDebt(record);
      setContactName(record.contact_name);
      setAmount(record.amount.toString());
      setType(record.type);
      setDueDate(record.due_date || '');
      setStatus(record.status);
      setReferenceNo(record.reference_no || '');
      setNotes(record.notes || '');
    } else {
      setEditDebt(null);
      setContactName('');
      setAmount('');
      setType('debt');
      setDueDate(getLocalDateString());
      setStatus('Belum Lunas');
      setReferenceNo('');
      setNotes('');
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !amount || Number(amount) <= 0) return alert('Lengkapi data dengan nominal valid.');

    setSaving(true);
    try {
      const payload = {
        contact_name: contactName,
        amount: Number(amount),
        type,
        due_date: dueDate || undefined,
        status,
        reference_no: referenceNo || undefined,
        notes: notes || undefined,
      };

      if (editDebt) {
        await debtsService.update(editDebt.id, payload);
      } else {
        await debtsService.create(payload);
      }
      fetchDebts();
      setIsFormOpen(false);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan catatan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      try {
        await debtsService.delete(id);
        fetchDebts();
      } catch (err: any) {
        alert('Gagal menghapus catatan: ' + (err?.message || 'Terjadi kesalahan'));
      }
    }
  };

  const handleToggleSettle = async (record: Debt) => {
    const nextStatus = record.status === 'Lunas' ? 'Belum Lunas' : 'Lunas';
    try {
      await debtsService.update(record.id, { status: nextStatus });
      fetchDebts();
    } catch (err: any) {
      alert('Gagal memperbarui status catatan: ' + (err?.message || 'Terjadi kesalahan'));
    }
  };

  // Calculate stats
  const totalDebt = debts.filter(d => d.type === 'debt' && d.status !== 'Lunas').reduce((sum, d) => sum + Number(d.amount), 0);
  const totalReceivable = debts.filter(d => d.type === 'receivable' && d.status !== 'Lunas').reduce((sum, d) => sum + Number(d.amount), 0);
  const netDiff = totalReceivable - totalDebt;

  // Filter lists
  const filteredDebts = debts.filter((d) => {
    const matchesType = filterType === 'all' || d.type === filterType;
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchesSearch = d.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (d.reference_no && d.reference_no.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesStatus && matchesSearch;
  });

  const getDueDateStatus = (dueDate: string | undefined, currentStatus: string) => {
    if (currentStatus === 'Lunas') return { text: 'Lunas', color: 'text-emerald-700 bg-emerald-50' };
    if (!dueDate) return { text: currentStatus, color: 'text-indigo-700 bg-indigo-50' };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDate);
    due.setHours(0,0,0,0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 || currentStatus === 'Terlambat') {
      return { text: 'Terlambat', color: 'text-rose-700 bg-rose-50 border border-rose-200' };
    } else if (diffDays <= 3) {
      return { text: `H-${diffDays} Jatuh Tempo`, color: 'text-amber-700 bg-amber-50 border border-amber-200' };
    } else {
      return { text: 'Belum Lunas', color: 'text-indigo-700 bg-indigo-50' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hutang & Piutang</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Kelola daftar kewajiban dan tagihan Anda secara terpusat.</p>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-100 transition-colors cursor-pointer"
        >
          <LucideIcon name="Plus" size={16} />
          <span>Tambah Catatan</span>
        </button>
      </div>

      {/* 3 Metric Card Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Hutang */}
        <div className="premium-card p-6 bg-white border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
              <LucideIcon name="ArrowDown" size={24} />
            </div>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg uppercase leading-none">
              Kewajiban
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Hutang</p>
            <h3 className="text-2xl font-bold text-slate-800">
              Rp {totalDebt.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Total Piutang */}
        <div className="premium-card p-6 bg-white border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <LucideIcon name="ArrowUp" size={24} />
            </div>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg uppercase leading-none">
              Aset Berjalan
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Piutang</p>
            <h3 className="text-2xl font-bold text-slate-800">
              Rp {totalReceivable.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Selisih Bersih */}
        <div className="premium-card p-6 bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 border-indigo-200/80 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3.5 rounded-2xl flex items-center justify-center ${netDiff >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
              <LucideIcon name="Scale" size={24} />
            </div>
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border uppercase leading-none ${netDiff >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
              <LucideIcon name={netDiff >= 0 ? 'CheckCircle2' : 'AlertCircle'} size={10} />
              {netDiff >= 0 ? 'Posisi Positif' : 'Posisi Negatif'}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Selisih Bersih</p>
            <h3 className="text-2xl font-bold text-indigo-950">
              Rp {netDiff.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters & Tabs (Matching the visual mockup layout) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Tabs type */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-1.5 flex items-center justify-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === 'all' 
                ? 'bg-white text-indigo-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('debt')}
            className={`px-4 py-1.5 flex items-center justify-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === 'debt' 
                ? 'bg-white text-indigo-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Hutang Saja
          </button>
          <button
            onClick={() => setFilterType('receivable')}
            className={`px-4 py-1.5 flex items-center justify-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === 'receivable' 
                ? 'bg-white text-indigo-600 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Piutang Saja
          </button>
        </div>

        {/* Right filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Keyword Search */}
          <div className="relative flex-1 sm:w-48">
            <LucideIcon name="Search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari kontak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input !pl-11"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="premium-select"
          >
            <option value="all">Semua Status</option>
            <option value="Belum Lunas">Belum Lunas</option>
            <option value="Lunas">Lunas</option>
            <option value="Terlambat">Terlambat</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="premium-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Nama Kontak / Referensi</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Jumlah (Rp)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <LucideIcon name="Inbox" className="mx-auto text-slate-200 mb-2" size={32} />
                    <p className="text-xs text-slate-400 font-bold">Tidak ada catatan hutang piutang</p>
                  </td>
                </tr>
              ) : (
                filteredDebts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                          {item.contact_name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-slate-800 leading-snug">{item.contact_name}</h4>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5 block">{item.reference_no || 'Tanpa Referensi'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-4">
                      {item.type === 'debt' ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-bold leading-none">
                          <LucideIcon name="ArrowDown" size={12} />
                          Hutang
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold leading-none">
                          <LucideIcon name="ArrowUp" size={12} />
                          Piutang
                        </span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-4 text-xs font-semibold text-slate-500">
                      {item.due_date ? (
                        new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 text-right font-bold text-xs text-slate-800">
                      Rp {item.amount.toLocaleString('id-ID')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 text-center">
                      {(() => {
                        const s = getDueDateStatus(item.due_date, item.status);
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold leading-none ${s.color}`}>
                            {s.text}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Mark Settle Toggle */}
                        <button
                          onClick={() => handleToggleSettle(item)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center ${
                            item.status === 'Lunas' 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                              : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400'
                          }`}
                          title={item.status === 'Lunas' ? 'Tandai Belum Lunas' : 'Tandai Lunas'}
                        >
                          <LucideIcon name="Check" size={14} />
                        </button>
                        
                        {/* Edit */}
                        <button
                          onClick={() => handleOpenForm(item)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Ubah"
                        >
                          <LucideIcon name="Edit3" size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
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
      </div>

      {/* Record Creation/Modification Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editDebt ? 'Ubah Catatan' : 'Tambah Catatan Baru'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Record Type select */}
          <div className="grid grid-cols-2 p-1 bg-slate-50 border border-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('debt')}
              className={`py-2 flex items-center justify-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'debt' 
                  ? 'bg-white text-rose-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Hutang (Kewajiban)
            </button>
            <button
              type="button"
              onClick={() => setType('receivable')}
              className={`py-2 flex items-center justify-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'receivable' 
                  ? 'bg-white text-emerald-600 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Piutang (Hak Tagih)
            </button>
          </div>

          {/* Contact name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Nama Kontak</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. PT Maju Jaya"
              required
              className="premium-input"
            />
          </div>

          {/* Amount & Ref No grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">No Referensi / Invoice</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. INV-2023-089"
                className="premium-input"
              />
            </div>
          </div>

          {/* Due date & Status grid */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="premium-input text-slate-700"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="premium-select"
              >
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="Lunas">Lunas</option>
                <option value="Terlambat">Terlambat</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Catatan Tambahan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Deskripsi atau rincian pembayaran..."
              rows={3}
              className="premium-textarea"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
