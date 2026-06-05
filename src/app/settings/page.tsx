'use client';

import React, { useState, useEffect } from 'react';
import { 
  categoriesService, 
  goalsService, 
  settingsService, 
  getSessionUser,
  authService,
  profileService
} from '@/lib/db';
import { Category, Goal, Settings, Profile } from '@/lib/db/types';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { Modal } from '@/components/ui/Modal';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'preferences' | 'categories' | 'goals'>('preferences');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullNameInput, setFullNameInput] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Categories form states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catColor, setCatColor] = useState('#4F46E5');
  const [catIcon, setCatIcon] = useState('HelpCircle');
  const [savingCat, setSavingCat] = useState(false);

  // Goals form states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  // Preferences save state
  const [savingPref, setSavingPref] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userProf, userSet, catList, goalList] = await Promise.all([
        getSessionUser(),
        settingsService.get(),
        categoriesService.list(),
        goalsService.list()
      ]);
      setProfile(userProf);
      setFullNameInput(userProf?.full_name || '');
      setSettings(userSet);
      setCategories(catList);
      setGoals(goalList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- SAVE PREFERENCES ---
  const handleSavePref = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingPref(true);
    try {
      await Promise.all([
        settingsService.update(settings),
        profileService.updateName(fullNameInput)
      ]);
      alert('Pengaturan berhasil disimpan!');
      // Force reload page to sync header username
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSavingPref(false);
    }
  };

  // --- CATEGORIES CRUD ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return alert('Nama kategori harus diisi');
    setSavingCat(true);
    try {
      await categoriesService.create({
        name: catName,
        type: catType as any,
        color: catColor,
        icon: catIcon
      });
      const list = await categoriesService.list();
      setCategories(list);
      setIsCatModalOpen(false);
      setCatName('');
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan kategori');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      await categoriesService.delete(id);
      const list = await categoriesService.list();
      setCategories(list);
    }
  };

  // --- GOALS CRUD ---
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalTarget || Number(goalTarget) <= 0) {
      return alert('Lengkapi data target dengan benar');
    }
    setSavingGoal(true);
    try {
      await goalsService.create({
        title: goalTitle,
        target_amount: Number(goalTarget),
        current_amount: Number(goalCurrent) || 0,
        deadline: goalDeadline || undefined
      });
      const list = await goalsService.list();
      setGoals(list);
      setIsGoalModalOpen(false);
      setGoalTitle('');
      setGoalTarget('');
      setGoalCurrent('');
      setGoalDeadline('');
    } catch (e) {
      console.error(e);
      alert('Gagal membuat target keuangan');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus target keuangan ini?')) {
      await goalsService.delete(id);
      const list = await goalsService.list();
      setGoals(list);
    }
  };

  const availableIcons = ['Briefcase', 'TrendingUp', 'DollarSign', 'Utensils', 'Car', 'ShoppingBag', 'Film', 'HeartPulse', 'CreditCard', 'Home', 'GraduationCap', 'Gift', 'Smartphone', 'Gamepad2'];
  const availableColors = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#6366F1', '#6B7280', '#06B6D4', '#F43F5E', '#10B981'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
        <p className="text-xs text-slate-400 font-medium mt-1">Konfigurasi profil, kelola kategori kustom, dan buat rencana target keuangan.</p>
      </div>

      {/* Settings Grid Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation panel */}
        <div className="premium-card p-4 bg-white flex flex-col gap-1.5 h-fit lg:col-span-1 border-slate-100">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-indigo-50/80 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <LucideIcon name="User" size={16} />
            <span>Profil & Preferensi</span>
          </button>
          
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-indigo-50/80 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <LucideIcon name="Grid" size={16} />
            <span>Kategori Transaksi</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-indigo-50/80 text-indigo-600'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <LucideIcon name="Target" size={16} />
            <span>Target Tabungan</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 premium-card p-6 md:p-8 bg-white border-slate-100">
          
          {/* TAB 1: PREFERENCES */}
          {activeTab === 'preferences' && settings && (
            <form onSubmit={handleSavePref} className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Informasi Profil</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="premium-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Alamat Email</label>
                    <input
                      type="email"
                      disabled
                      value={profile?.email || 'user@wealthmanager.com'}
                      className="premium-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2 mt-2">Preferensi Aplikasi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Mata Uang Acuan</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="premium-select"
                    >
                      <option value="IDR">Rupiah (IDR)</option>
                      <option value="USD">Dolar AS (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Notifikasi Pengingat</label>
                    <div className="flex items-center mt-2.5">
                      <input
                        type="checkbox"
                        id="notif-check"
                        checked={settings.notifications_enabled}
                        onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                        className="w-4.5 h-4.5 text-indigo-600 bg-slate-100 border-slate-300 rounded-md focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="notif-check" className="ml-2 text-xs font-semibold text-slate-600 cursor-pointer">
                        Aktifkan pengingat jatuh tempo
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={savingPref}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {savingPref ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Kelola Kategori Kustom</h3>
                <button
                  onClick={() => setIsCatModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LucideIcon name="Plus" size={14} />
                  <span>Kategori Baru</span>
                </button>
              </div>

              {/* Grid List Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div 
                    key={c.id}
                    className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-xs transition-all bg-slate-50/20"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        style={{ backgroundColor: `${c.color}18`, color: c.color }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <LucideIcon name={c.icon} size={18} />
                      </div>
                      <div className="leading-tight">
                        <h4 className="font-bold text-xs text-slate-800">{c.name}</h4>
                        <span className="text-[9px] font-bold text-slate-400 capitalize">{c.type === 'income' ? 'Pemasukan' : c.type === 'expense' ? 'Pengeluaran' : 'Aset'}</span>
                      </div>
                    </div>
                    {/* Delete action (Only allow deleting user created ones, mock user IDs) */}
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <LucideIcon name="Trash2" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SAVINGS GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Rencana Target Keuangan</h3>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LucideIcon name="Plus" size={14} />
                  <span>Target Baru</span>
                </button>
              </div>

              {/* Goals list */}
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center py-12">
                    <LucideIcon name="Target" className="mx-auto text-slate-200 mb-2" size={36} />
                    <p className="text-xs text-slate-450 font-semibold">Belum membuat target keuangan</p>
                  </div>
                ) : (
                  goals.map((goal) => {
                    const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                    return (
                      <div 
                        key={goal.id}
                        className="p-5 border border-slate-200/60 rounded-2xl space-y-3 hover:shadow-xs transition-shadow relative"
                      >
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="absolute top-4 right-4 p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Hapus"
                        >
                          <LucideIcon name="Trash2" size={14} />
                        </button>

                        <div className="space-y-1.5 pr-8">
                          <h4 className="font-bold text-xs text-slate-800 leading-snug">{goal.title}</h4>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-500">Tercapai: Rp {goal.current_amount.toLocaleString('id-ID')} / Target: Rp {goal.target_amount.toLocaleString('id-ID')}</span>
                            <span className="font-bold text-indigo-600">{percent.toFixed(0)}%</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${percent}%` }}
                            className="h-full bg-indigo-600 rounded-full transition-all"
                          />
                        </div>

                        {goal.deadline && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Batas Waktu: {new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Category Modal Form */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Buat Kategori Kustom Baru"
      >
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Tipe Kategori</label>
            <div className="grid grid-cols-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setCatType('expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  catType === 'expense' 
                    ? 'bg-white text-rose-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setCatType('income')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  catType === 'income' 
                    ? 'bg-white text-emerald-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Nama Kategori</label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Belajar Mandiri"
              required
              className="premium-input"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Warna Penanda</label>
            <div className="flex flex-wrap gap-2.5">
              {availableColors.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setCatColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                    catColor === color ? 'scale-120 ring-2 ring-slate-400 ring-offset-2' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Pilih Ikon</label>
            <div className="grid grid-cols-7 gap-2">
              {availableIcons.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => setCatIcon(icon)}
                  className={`p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                    catIcon === icon ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : ''
                  }`}
                >
                  <LucideIcon name={icon} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingCat}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {savingCat ? 'Menyimpan...' : 'Simpan Kategori'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Goal Modal Form */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Buat Target Rencana Tabungan Baru"
      >
        <form onSubmit={handleAddGoal} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Judul Target / Rencana</label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. Beli Rumah Impian"
              required
              className="premium-input"
            />
          </div>

          {/* Target amount & Current amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Jumlah Target (Rp)</label>
              <input
                type="number"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="0"
                required
                className="premium-input font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Saldo Awal (Rp)</label>
              <input
                type="number"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                placeholder="0"
                className="premium-input font-semibold"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">Batas Waktu (Deadline)</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="premium-input text-slate-600"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingGoal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {savingGoal ? 'Membuat...' : 'Buat Target'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
