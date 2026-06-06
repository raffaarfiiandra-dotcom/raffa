const fs = require('fs');
let code = fs.readFileSync('src/lib/db/index.ts', 'utf8');

const idx = code.indexOf('export const netWorthService = {');
if (idx !== -1) {
  code = code.substring(0, idx);
}

const appendCode = `export const netWorthService = {
  async getHistory(): Promise<NetWorthHistory[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('net_worth_history').select('*').order('date', { ascending: true });
      if (!error && data) return data as NetWorthHistory[];
    }
    return getLocalData<NetWorthHistory[]>('net_worth_history', []);
  },

  async recordSnapshot(): Promise<void> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;
    
    // Calculate current net worth
    const accounts = await accountsService.list();
    const assets = await assetsService.list();
    const debts = await debtsService.list();

    const totalAccounts = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
    
    const totalReceivables = debts.filter(d => d.type === 'receivable' && d.status !== 'Lunas').reduce((sum, d) => sum + Number(d.amount), 0);
    const totalDebts = debts.filter(d => d.type === 'debt' && d.status !== 'Lunas').reduce((sum, d) => sum + Number(d.amount), 0);

    const netWorth = totalAccounts + totalAssets + totalReceivables - totalDebts;
    const today = new Date().toISOString().split('T')[0];

    if (isSupabaseConfigured() && supabase) {
      const { data: existing } = await supabase
        .from('net_worth_history')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
        
      if (existing) {
        await supabase.from('net_worth_history').update({ net_worth: netWorth }).eq('id', existing.id);
      } else {
        await supabase.from('net_worth_history').insert([{ user_id: userId, date: today, net_worth: netWorth }]);
      }
    } else {
      const history = getLocalData<NetWorthHistory[]>('net_worth_history', []);
      const index = history.findIndex(h => h.date === today);
      if (index !== -1) {
        history[index].net_worth = netWorth;
      } else {
        history.push({
          id: crypto.randomUUID(),
          user_id: userId,
          date: today,
          net_worth: netWorth
        });
      }
      setLocalData('net_worth_history', history);
    }
  }
};

// --- RECURRING TRANSACTIONS ---
export const recurringTransactionsService = {
  async list(): Promise<RecurringTransaction[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, account:accounts(*), category:categories(*)')
        .order('created_at', { ascending: false });
      if (!error && data) return data as RecurringTransaction[];
    }
    return getLocalData<RecurringTransaction[]>('recurring_transactions', []);
  },

  async create(rec: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'account' | 'category'>): Promise<RecurringTransaction | null> {
    const user = await getSessionUser();
    const userId = user?.id || DEFAULT_USER_ID;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([{ ...rec, user_id: userId }])
        .select()
        .single();
      if (!error && data) return data as RecurringTransaction;
    }
    
    const all = getLocalData<RecurringTransaction[]>('recurring_transactions', []);
    const newRec: RecurringTransaction = {
      ...rec,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString()
    };
    all.unshift(newRec);
    setLocalData('recurring_transactions', all);
    return newRec;
  },

  async update(id: string, updates: Partial<RecurringTransaction>): Promise<RecurringTransaction | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as RecurringTransaction;
    }
    const all = getLocalData<RecurringTransaction[]>('recurring_transactions', []);
    const idx = all.findIndex(r => r.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      setLocalData('recurring_transactions', all);
      return all[idx];
    }
    return null;
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      return !error;
    }
    const all = getLocalData<RecurringTransaction[]>('recurring_transactions', []);
    setLocalData('recurring_transactions', all.filter(r => r.id !== id));
    return true;
  }
};

export const processRecurringTransactions = async (): Promise<void> => {
  try {
    const recs = await recurringTransactionsService.list();
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    for (const rec of recs) {
      if (!rec.is_active || rec.next_run_date > todayStr) continue;

      let currentDateStr = rec.next_run_date;
      let lastRunStr = rec.last_run_date;

      while (currentDateStr <= todayStr) {
        await transactionsService.create({
          account_id: rec.account_id,
          category_id: rec.category_id,
          amount: rec.amount,
          type: rec.type,
          date: currentDateStr,
          description: '[Auto] ' + rec.description,
        });

        lastRunStr = currentDateStr;

        const d = new Date(currentDateStr);
        if (rec.frequency === 'daily') d.setDate(d.getDate() + 1);
        else if (rec.frequency === 'weekly') d.setDate(d.getDate() + 7);
        else if (rec.frequency === 'monthly') d.setMonth(d.getMonth() + 1);
        else if (rec.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);

        currentDateStr = d.toISOString().split('T')[0];
      }

      await recurringTransactionsService.update(rec.id, {
        next_run_date: currentDateStr,
        last_run_date: lastRunStr
      });
    }
  } catch (e) {
    console.error('Failed to process recurring transactions', e);
  }
};
`;

fs.writeFileSync('src/lib/db/index.ts', code + appendCode, 'utf8');
console.log('Fixed index.ts successfully');
