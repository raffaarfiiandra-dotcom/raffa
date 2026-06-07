'use client';

import React, { useState, useEffect } from 'react';
import { accountsService } from '@/lib/db';
import { Account } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Modal } from '@/components/ui/Modal';
import { TransferModal } from '@/components/TransferModal';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Add Account Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('bank');
  const [icon, setIcon] = useState('Building');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const list = await accountsService.list();
      setAccounts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('Nama akun harus diisi');
    
    setIsSubmitting(true);
    try {
      await accountsService.create({ name, type, icon });
      setIsAddModalOpen(false);
      setName('');
      fetchAccounts();
    } catch (e) {
      console.error(e);
      alert('Gagal menambahkan akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus akun ini?')) {
      await accountsService.delete(id);
      fetchAccounts();
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>;
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daftar Akun & Dompet</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Kelola rekening bank, e-wallet, dan uang tunai Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <LucideIcon name="ArrowRightLeft" size={16} />
            Transfer
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-colors cursor-pointer"
          >
            <LucideIcon name="Plus" size={16} />
            Tambah Akun
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Total Balance Card */}
        <div className="premium-card p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0 shadow-indigo-100 flex flex-col justify-center relative overflow-hidden">
          <div className="z-10">
            <span className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mb-2 block">Total Semua Akun</span>
            <h3 className="text-2xl font-bold break-words">
              Rp {totalBalance.toLocaleString('id-ID')}
            </h3>
          </div>
          <LucideIcon name="Wallet" size={64} className="absolute -right-4 -bottom-4 text-white/10" />
        </div>

        {accounts.map(acc => (
          <div key={acc.id} className="premium-card p-6 bg-white flex flex-col justify-between group">
            <div className="flex flex-wrap items-start justify-between mb-4 gap-2">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <LucideIcon name={acc.icon} size={24} />
              </div>
              <button 
                onClick={() => handleDelete(acc.id)}
                className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <LucideIcon name="Trash2" size={14} />
              </button>
            </div>
            <div className="min-w-0 mt-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{acc.type}</span>
              <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{acc.name}</h4>
              <p className="text-lg font-bold text-slate-800 truncate" title={`Rp ${acc.balance.toLocaleString('id-ID')}`}>
                Rp {acc.balance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Akun Baru">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nama Akun / Bank</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="BCA, Dana, OVO, dll."
              required
              className="premium-input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipe</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as any)}
                className="premium-select"
              >
                <option value="cash">Tunai / Cash</option>
                <option value="bank">Bank</option>
                <option value="e-wallet">E-Wallet</option>
                <option value="investment">Investasi</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ikon</label>
              <select 
                value={icon} 
                onChange={(e) => setIcon(e.target.value)}
                className="premium-select"
              >
                <option value="Building">Building (Bank)</option>
                <option value="Wallet">Wallet (E-Wallet)</option>
                <option value="Banknote">Banknote (Cash)</option>
                <option value="CreditCard">Credit Card</option>
                <option value="Smartphone">Smartphone</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs cursor-pointer hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs cursor-pointer shadow-md">Simpan</button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <TransferModal 
          isOpen={isTransferModalOpen} 
          onClose={() => setIsTransferModalOpen(false)} 
          onSuccess={fetchAccounts} 
          accounts={accounts}
        />
      )}
    </div>
  );
}
