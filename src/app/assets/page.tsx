'use client';

import React, { useState, useEffect } from 'react';
import { assetsService } from '@/lib/db';
import { Asset } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Modal } from '@/components/ui/Modal';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'property' | 'investment' | 'savings' | 'vehicle' | 'others'>('property');
  const [balance, setBalance] = useState('');
  const [details, setDetails] = useState('');
  const [changePercentage, setChangePercentage] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const list = await assetsService.list();
      setAssets(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleOpenForm = (asset: Asset | null = null) => {
    if (asset) {
      setEditAsset(asset);
      setName(asset.name);
      setType(asset.type);
      setBalance(asset.balance.toString());
      setDetails(asset.details || '');
      setChangePercentage(asset.change_percentage?.toString() || '0');
    } else {
      setEditAsset(null);
      setName('');
      setType('property');
      setBalance('');
      setDetails('');
      setChangePercentage('0');
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance || Number(balance) < 0) return alert('Lengkapi data dengan jumlah valid.');

    setSaving(true);
    try {
      const payload = {
        name: name.toUpperCase(),
        type,
        balance: Number(balance),
        details: details || undefined,
        change_percentage: Number(changePercentage) || 0,
      };

      if (editAsset) {
        await assetsService.update(editAsset.id, payload);
      } else {
        await assetsService.create(payload);
      }
      fetchAssets();
      setIsFormOpen(false);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan aset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus aset ini?')) {
      await assetsService.delete(id);
      fetchAssets();
    }
  };

  // Calculations
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);

  // Asset type configurations (icon, bg color, border)
  const getAssetTypeConfig = (assetType: string) => {
    switch (assetType) {
      case 'property':
        return { icon: 'Home', color: '#6366F1', bg: 'bg-indigo-50/50', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-200' };
      case 'investment':
        return { icon: 'TrendingUp', color: '#10B981', bg: 'bg-emerald-50/50', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-200' };
      case 'savings':
        return { icon: 'PiggyBank', color: '#3B82F6', bg: 'bg-blue-50/50', text: 'text-blue-600', hoverBorder: 'hover:border-blue-200' };
      case 'vehicle':
        return { icon: 'Car', color: '#F59E0B', bg: 'bg-amber-50/50', text: 'text-amber-600', hoverBorder: 'hover:border-amber-200' };
      default:
        return { icon: 'HelpCircle', color: '#6b7280', bg: 'bg-slate-50/50', text: 'text-slate-600', hoverBorder: 'hover:border-slate-200' };
    }
  };

  // Donut chart logic
  let accumulatedPercent = 0;
  const donutData = assets.map((a) => {
    const percent = totalAssets > 0 ? (a.balance / totalAssets) * 100 : 0;
    const item = {
      ...a,
      percent,
      color: getAssetTypeConfig(a.type).color,
      startPercent: accumulatedPercent,
    };
    accumulatedPercent += percent;
    return item;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portofolio Aset</p>
          <h2 className="text-3xl font-extrabold text-slate-800">
            Rp {totalAssets.toLocaleString('id-ID')}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full leading-none">
              <LucideIcon name="TrendingUp" size={10} />
              +12.5% YoY
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Pembaruan terakhir: Hari ini, 09:41</span>
          </div>
        </div>
        
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-150 transition-colors cursor-pointer self-start sm:self-center"
        >
          <LucideIcon name="Plus" size={16} />
          <span>Tambah Aset</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: 4 Asset Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-slate-100">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : assets.length === 0 ? (
            <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-slate-100">
              <LucideIcon name="Inbox" className="mx-auto text-slate-200 mb-2" size={32} />
              <p className="text-xs text-slate-400 font-semibold">Belum ada aset</p>
            </div>
          ) : (
            assets.map((asset) => {
              const cfg = getAssetTypeConfig(asset.type);
              const isPositive = (asset.change_percentage || 0) >= 0;
              return (
                <div 
                  key={asset.id} 
                  className={`premium-card p-6 bg-white border border-slate-100 flex flex-col justify-between relative overflow-hidden transition-all ${cfg.hoverBorder}`}
                >
                  <div className="space-y-4">
                    {/* Header: Icon & change percentage */}
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 ${cfg.bg} ${cfg.text} rounded-xl`}>
                        <LucideIcon name={cfg.icon} size={20} />
                      </div>
                      
                      {/* Growth pill */}
                      {asset.change_percentage !== 0 && (
                        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isPositive 
                            ? 'text-emerald-700 bg-emerald-50' 
                            : 'text-rose-700 bg-rose-50'
                        }`}>
                          {isPositive ? '+' : ''}{asset.change_percentage}% 
                          {asset.type === 'vehicle' ? ' Depresiasi' : ''}
                        </span>
                      )}
                    </div>

                    {/* Body Info */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asset.name}</p>
                      <h3 className="text-xl font-bold text-slate-800">
                        Rp {asset.balance.toLocaleString('id-ID')}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">{asset.details || 'Tanpa deskripsi rincian'}</p>
                    </div>
                  </div>

                  {/* Actions overlay */}
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-50">
                    <button
                      onClick={() => handleOpenForm(asset)}
                      className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                      title="Ubah"
                    >
                      <LucideIcon name="Edit3" size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-1 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-lg transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <LucideIcon name="Trash2" size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Asset Distribution (Donut Chart) */}
        <div className="premium-card p-6 bg-white flex flex-col justify-between min-h-[350px]">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">Distribusi Aset</h3>
            <p className="text-[10px] text-slate-400 font-medium">Proporsi alokasi dana portofolio aset Anda.</p>
          </div>

          {/* Custom Responsive SVG Donut Chart */}
          <div className="flex flex-col items-center justify-center py-6 relative">
            {totalAssets === 0 ? (
              <div className="w-36 h-36 rounded-full border-12 border-slate-100 flex items-center justify-center">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total 0%</span>
              </div>
            ) : (
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                  {/* Base Circle */}
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" />
                  
                  {/* Segments */}
                  {donutData.map((seg, i) => {
                    const strokeDasharray = `${seg.percent} ${100 - seg.percent}`;
                    const strokeDashoffset = 100 - seg.startPercent;
                    
                    return (
                      <circle
                        key={seg.id}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="4.5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:stroke-[5.5] cursor-pointer"
                      />
                    );
                  })}
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                  <span className="text-lg font-bold text-slate-800 mt-1">100%</span>
                </div>
              </div>
            )}
          </div>

          {/* Legends list */}
          <div className="space-y-2 mt-4">
            {donutData.map((seg) => {
              const cfg = getAssetTypeConfig(seg.type);
              return (
                <div key={seg.id} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span style={{ backgroundColor: seg.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                    <span className="text-slate-500 capitalize">{seg.name.toLowerCase()}</span>
                  </div>
                  <span className="text-slate-800">{seg.percent.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Asset Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editAsset ? 'Ubah Aset' : 'Tambah Aset Baru'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Asset Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Jenis Aset</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="premium-select"
            >
              <option value="property">Properti (Property)</option>
              <option value="investment">Investasi (Investment)</option>
              <option value="savings">Kas & Tabungan (Savings/Cash)</option>
              <option value="vehicle">Kendaraan (Vehicle)</option>
              <option value="others">Aset Lainnya (Others)</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Nama Aset (e.g. EMAS, SAHAM, TABUNGAN MANDIRI)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TABUNGAN BCA"
              required
              className="premium-input uppercase"
            />
          </div>

          {/* Balance (Rp) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Nominal Saldo (Rp)</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              required
              className="premium-input font-semibold"
            />
          </div>

          {/* Growth Percentage */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Persentase Perubahan YoY (%)</label>
            <input
              type="number"
              step="0.1"
              value={changePercentage}
              onChange={(e) => setChangePercentage(e.target.value)}
              placeholder="0.0"
              className="premium-input"
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Rincian / Keterangan</label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. 3 Rekening Aktif, 1 Unit Apartemen"
              className="premium-input"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Aset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
