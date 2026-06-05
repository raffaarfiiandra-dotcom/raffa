export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense' | 'asset';
  color: string;
  icon: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id?: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  receipt_url?: string;
  created_at?: string;
  // Join category name for display convenience
  category?: Category;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: 'property' | 'investment' | 'savings' | 'vehicle' | 'others';
  balance: number;
  details?: string;
  change_percentage?: number;
  created_at?: string;
}

export interface Debt {
  id: string;
  user_id: string;
  contact_name: string;
  amount: number;
  type: 'debt' | 'receivable';
  due_date?: string; // YYYY-MM-DD
  status: 'Lunas' | 'Belum Lunas' | 'Terlambat';
  notes?: string;
  reference_no?: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string; // YYYY-MM-DD
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Settings {
  user_id: string;
  currency: string;
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
}
