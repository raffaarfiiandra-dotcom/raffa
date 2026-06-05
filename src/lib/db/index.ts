import { supabase, isSupabaseConfigured } from '../supabase';
import { 
  Profile, Category, Transaction, Asset, Debt, Goal, Notification, Settings 
} from './types';

// Default mock user for offline / local-first usage
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_USER_EMAIL = 'user@wealthmanager.com';

const defaultCategories: Category[] = [
  // Income
  { id: 'inc-1', name: 'Gaji', type: 'income', color: '#10B981', icon: 'Briefcase' },
  { id: 'inc-2', name: 'Investasi', type: 'income', color: '#3B82F6', icon: 'TrendingUp' },
  { id: 'inc-3', name: 'Lainnya', type: 'income', color: '#6B7280', icon: 'DollarSign' },
  // Expense
  { id: 'exp-1', name: 'Makanan & Minuman', type: 'expense', color: '#EF4444', icon: 'Utensils' },
  { id: 'exp-2', name: 'Transportasi', type: 'expense', color: '#F59E0B', icon: 'Car' },
  { id: 'exp-3', name: 'Belanja', type: 'expense', color: '#EC4899', icon: 'ShoppingBag' },
  { id: 'exp-4', name: 'Hiburan', type: 'expense', color: '#8B5CF6', icon: 'Film' },
  { id: 'exp-5', name: 'Kesehatan', type: 'expense', color: '#14B8A6', icon: 'HeartPulse' },
  { id: 'exp-6', name: 'Tagihan & Utilitas', type: 'expense', color: '#6366F1', icon: 'CreditCard' },
  { id: 'exp-7', name: 'Lainnya', type: 'expense', color: '#6B7280', icon: 'DollarSign' },
];

const defaultAssets: Asset[] = [
  { id: 'ast-1', user_id: DEFAULT_USER_ID, name: 'PROPERTI', type: 'property', balance: 0, details: '2 Unit Residensial, 1 Komersial', change_percentage: 5.2 },
  { id: 'ast-2', user_id: DEFAULT_USER_ID, name: 'INVESTASI', type: 'investment', balance: 0, details: 'Saham, Reksa Dana, Obligasi', change_percentage: 18.4 },
  { id: 'ast-3', user_id: DEFAULT_USER_ID, name: 'KAS & TABUNGAN', type: 'savings', balance: 0, details: '3 Rekening Aktif', change_percentage: 0.0 }, // Likuid
  { id: 'ast-4', user_id: DEFAULT_USER_ID, name: 'KENDARAAN', type: 'vehicle', balance: 0, details: '1 Mobil Pribadi', change_percentage: -2.1 }, // Depresiasi
];

const defaultDebts: Debt[] = [
  { id: 'deb-1', user_id: DEFAULT_USER_ID, contact_name: 'PT Maju Jaya', amount: 0, type: 'debt', due_date: '2023-10-15', status: 'Terlambat', reference_no: 'INV-2023-089' },
  { id: 'deb-2', user_id: DEFAULT_USER_ID, contact_name: 'CV Sumber Abadi', amount: 0, type: 'receivable', due_date: '2023-10-28', status: 'Belum Lunas', reference_no: 'PO-10293' },
  { id: 'deb-3', user_id: DEFAULT_USER_ID, contact_name: 'Bpk. Hendra Wijaya', amount: 0, type: 'receivable', due_date: '2023-10-10', status: 'Lunas', reference_no: 'Personal Loan' },
  { id: 'deb-4', user_id: DEFAULT_USER_ID, contact_name: 'Toko Nusantara', amount: 0, type: 'debt', due_date: '2023-11-05', status: 'Belum Lunas', reference_no: 'Supply Q3' },
];

const defaultSettings: Settings = {
  user_id: DEFAULT_USER_ID,
  currency: 'IDR',
  theme: 'light',
  notifications_enabled: true,
};

// Helper for local storage
const getLocalData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const data = localStorage.getItem(`wm_${key}`);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`wm_${key}`, JSON.stringify(value));
};

export const getSessionUser = async (): Promise<Profile | null> => {
  if (isSupabaseConfigured() && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata.full_name || 'User',
        avatar_url: user.user_metadata.avatar_url,
      };
    }
    return null;
  }
  
  // Local mode
  const localSession = getLocalData<Profile | null>('session', null);
  return localSession;
};

// --- AUTHENTICATION ---
export const authService = {
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { success: !error, error: error?.message };
    }
    // Mock login
    const users = getLocalData<any[]>('users', []);
    const user = users.find(u => u.email === email && u.password === password);
    if (user || (email === DEFAULT_USER_EMAIL && password === 'password')) {
      const profile: Profile = {
        id: user?.id || DEFAULT_USER_ID,
        email: email,
        full_name: user?.full_name || 'Elite User',
      };
      setLocalData('session', profile);
      return { success: true };
    }
    return { success: false, error: 'Email atau Kata Sandi salah' };
  },

  async register(email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      return { success: !error, error: error?.message };
    }
    // Mock register
    const users = getLocalData<any[]>('users', []);
    if (users.some(u => u.email === email) || email === DEFAULT_USER_EMAIL) {
      return { success: false, error: 'Email sudah terdaftar' };
    }
    const newId = crypto.randomUUID();
    const newUser = { id: newId, email, password, full_name: fullName };
    users.push(newUser);
    setLocalData('users', users);
    
    // Automatically log in
    const profile: Profile = { id: newId, email, full_name: fullName };
    setLocalData('session', profile);
    return { success: true };
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wm_session');
      }
    }
  }
};

// --- CATEGORIES ---
export const categoriesService = {
  async list(): Promise<Category[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data) return data as Category[];
    }
    return getLocalData<Category[]>('categories', defaultCategories);
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...category, user_id: userId }])
        .select()
        .single();
      if (!error && data) return data as Category;
    }
    const categories = getLocalData<Category[]>('categories', defaultCategories);
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      user_id: userId,
    };
    categories.push(newCategory);
    setLocalData('categories', categories);
    return newCategory;
  },

  async update(id: string, category: Partial<Category>): Promise<Category | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Category;
    }
    const categories = getLocalData<Category[]>('categories', defaultCategories);
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    const updated = { ...categories[index], ...category };
    categories[index] = updated;
    setLocalData('categories', categories);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      return !error;
    }
    const categories = getLocalData<Category[]>('categories', defaultCategories);
    const filtered = categories.filter(c => c.id !== id);
    setLocalData('categories', filtered);
    return true;
  }
};

// --- TRANSACTIONS ---
export const transactionsService = {
  async list(): Promise<Transaction[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false });
      if (!error && data) return data as Transaction[];
    }
    const txs = getLocalData<Transaction[]>('transactions', []);
    const cats = await categoriesService.list();
    return txs.map(t => ({
      ...t,
      category: cats.find(c => c.id === t.category_id),
    })).sort((a, b) => b.date.localeCompare(a.date));
  },

  async create(tx: Omit<Transaction, 'id' | 'user_id'>): Promise<Transaction> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...tx, user_id: userId }])
        .select()
        .single();
      if (!error && data) return data as Transaction;
    }
    const txs = getLocalData<Transaction[]>('transactions', []);
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      user_id: userId,
    };
    txs.push(newTx);
    setLocalData('transactions', txs);
    return newTx;
  },

  async update(id: string, tx: Partial<Transaction>): Promise<Transaction | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .update(tx)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Transaction;
    }
    const txs = getLocalData<Transaction[]>('transactions', []);
    const index = txs.findIndex(t => t.id === id);
    if (index === -1) return null;
    const updated = { ...txs[index], ...tx };
    txs[index] = updated;
    setLocalData('transactions', txs);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      return !error;
    }
    const txs = getLocalData<Transaction[]>('transactions', []);
    const filtered = txs.filter(t => t.id !== id);
    setLocalData('transactions', filtered);
    return true;
  }
};

// --- ASSETS ---
export const assetsService = {
  async list(): Promise<Asset[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('assets').select('*');
      if (!error && data) return data as Asset[];
    }
    return getLocalData<Asset[]>('assets', defaultAssets);
  },

  async create(asset: Omit<Asset, 'id' | 'user_id'>): Promise<Asset> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .insert([{ ...asset, user_id: userId }])
        .select()
        .single();
      if (!error && data) return data as Asset;
    }
    const assets = getLocalData<Asset[]>('assets', defaultAssets);
    const newAsset: Asset = {
      ...asset,
      id: crypto.randomUUID(),
      user_id: userId,
    };
    assets.push(newAsset);
    setLocalData('assets', assets);
    return newAsset;
  },

  async update(id: string, asset: Partial<Asset>): Promise<Asset | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .update(asset)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Asset;
    }
    const assets = getLocalData<Asset[]>('assets', defaultAssets);
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return null;
    const updated = { ...assets[index], ...asset };
    assets[index] = updated;
    setLocalData('assets', assets);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      return !error;
    }
    const assets = getLocalData<Asset[]>('assets', defaultAssets);
    const filtered = assets.filter(a => a.id !== id);
    setLocalData('assets', filtered);
    return true;
  }
};

// --- DEBTS & RECEIVABLES ---
export const debtsService = {
  async list(): Promise<Debt[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as Debt[];
    }
    return getLocalData<Debt[]>('debts', defaultDebts);
  },

  async create(debt: Omit<Debt, 'id' | 'user_id'>): Promise<Debt> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('debts')
        .insert([{ ...debt, user_id: userId }])
        .select()
        .single();
      if (!error && data) return data as Debt;
    }
    const debts = getLocalData<Debt[]>('debts', defaultDebts);
    const newDebt: Debt = {
      ...debt,
      id: crypto.randomUUID(),
      user_id: userId,
    };
    debts.unshift(newDebt);
    setLocalData('debts', debts);
    return newDebt;
  },

  async update(id: string, debt: Partial<Debt>): Promise<Debt | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('debts')
        .update(debt)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Debt;
    }
    const debts = getLocalData<Debt[]>('debts', defaultDebts);
    const index = debts.findIndex(d => d.id === id);
    if (index === -1) return null;
    const updated = { ...debts[index], ...debt };
    debts[index] = updated;
    setLocalData('debts', debts);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      return !error;
    }
    const debts = getLocalData<Debt[]>('debts', defaultDebts);
    const filtered = debts.filter(d => d.id !== id);
    setLocalData('debts', filtered);
    return true;
  }
};

// --- GOALS ---
export const goalsService = {
  async list(): Promise<Goal[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('goals').select('*');
      if (!error && data) return data as Goal[];
    }
    return getLocalData<Goal[]>('goals', []);
  },

  async create(goal: Omit<Goal, 'id' | 'user_id'>): Promise<Goal> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .insert([{ ...goal, user_id: userId }])
        .select()
        .single();
      if (!error && data) return data as Goal;
    }
    const goals = getLocalData<Goal[]>('goals', []);
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      user_id: userId,
    };
    goals.push(newGoal);
    setLocalData('goals', goals);
    return newGoal;
  },

  async update(id: string, goal: Partial<Goal>): Promise<Goal | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update(goal)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Goal;
    }
    const goals = getLocalData<Goal[]>('goals', []);
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return null;
    const updated = { ...goals[index], ...goal };
    goals[index] = updated;
    setLocalData('goals', goals);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      return !error;
    }
    const goals = getLocalData<Goal[]>('goals', []);
    const filtered = goals.filter(g => g.id !== id);
    setLocalData('goals', filtered);
    return true;
  }
};

// --- NOTIFICATIONS ---
export const notificationsService = {
  async list(): Promise<Notification[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as Notification[];
    }
    return getLocalData<Notification[]>('notifications', []);
  },

  async create(notif: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
    const newNotif: Notification = {
      ...notif,
      id: crypto.randomUUID(),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .insert([newNotif])
        .select()
        .single();
      if (!error && data) return data as Notification;
    }
    const notifs = getLocalData<Notification[]>('notifications', []);
    notifs.unshift(newNotif);
    setLocalData('notifications', notifs);
    return newNotif;
  },

  async markRead(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      return !error;
    }
    const notifs = getLocalData<Notification[]>('notifications', []);
    const index = notifs.findIndex(n => n.id === id);
    if (index !== -1) {
      notifs[index].is_read = true;
      setLocalData('notifications', notifs);
    }
    return true;
  }
};

// --- SETTINGS ---
export const settingsService = {
  async get(): Promise<Settings> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (!error && data) return data as Settings;
    }
    return getLocalData<Settings>('settings', { ...defaultSettings, user_id: userId });
  },

  async update(settings: Partial<Settings>): Promise<Settings | null> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ ...settings, user_id: userId, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (!error && data) return data as Settings;
    }
    const current = getLocalData<Settings>('settings', { ...defaultSettings, user_id: userId });
    const updated = { ...current, ...settings };
    setLocalData('settings', updated);
    return updated;
  }
};

// --- PROFILE ---
export const profileService = {
  async updateName(fullName: string): Promise<Profile | null> {
    const user = await getSessionUser();
    if (!user) return null;
    
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      if (!error && data) return data as Profile;
    }
    
    const updated = { ...user, full_name: fullName };
    setLocalData('session', updated);
    return updated;
  }
};

