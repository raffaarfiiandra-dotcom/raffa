'use client';

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { transfersService } from '@/lib/db';
import { Account } from '@/lib/db/types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onSuccess, accounts }) => {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) return alert('Pilih akun pengirim dan penerima');
    if (fromAccountId === toAccountId) return alert('Akun pengirim dan penerima tidak boleh sama');
    if (!amount || Number(amount) <= 0) return alert('Jumlah transfer tidak valid');

    setLoading(true);
    try {
      await transfersService.create({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: Number(amount),
        notes,
        transfer_date: date,
      });
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Gagal melakukan transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Antar Akun">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Dari Akun</label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              required
              className="premium-select"
            >
              <option value="">Pilih Akun Sumber</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} (Saldo: Rp {a.balance.toLocaleString('id-ID')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ke Akun</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              required
              className="premium-select"
            >
              <option value="">Pilih Akun Tujuan</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nominal Transfer</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0"
            className="premium-input font-bold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="premium-input text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Catatan (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bayar patungan, dsb."
              className="premium-input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs cursor-pointer hover:bg-slate-50">Batal</button>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs cursor-pointer shadow-md">
            {loading ? 'Memproses...' : 'Transfer Sekarang'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
