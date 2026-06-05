import { Transaction, Category, Asset } from './db/types';

// Simple heuristic keyword mapping for auto-categorization
const KEYWORD_MAP: { [key: string]: string[] } = {
  // Food
  'exp-1': ['makan', 'minum', 'kopi', 'warung', 'restoran', 'cafe', 'go-food', 'gofood', 'grabfood', 'starbucks', 'indomaret', 'alfamart', 'kuliner', 'dinner', 'lunch', 'breakfast'],
  // Transport
  'exp-2': ['gojek', 'grab', 'uber', 'ojek', 'bensin', 'pertamina', 'tol', 'parkir', 'service', 'mobil', 'motor', 'kereta', 'krl', 'bus', 'tiket', 'flight', 'penerbangan'],
  // Shopping
  'exp-3': ['belanja', 'baju', 'kaos', 'sepatu', 'celana', 'mall', 'shopee', 'tokopedia', 'lazada', 'bukalapak', 'tokopedia', 'jersey', 'jam tangan', 'tas', 'dompet'],
  // Entertainment
  'exp-4': ['nonton', 'bioskop', 'netflix', 'spotify', 'youtube premium', 'game', 'steam', 'topup', 'karaoke', 'liburan', 'rekreasi', 'hotel', 'staycation'],
  // Health
  'exp-5': ['obat', 'dokter', 'rumah sakit', 'apotek', 'klinik', 'vitamin', 'masker', 'bpjs', 'asuransi', 'sakit', 'dental', 'gigi'],
  // Utilities
  'exp-6': ['listrik', 'pln', 'air', 'pdam', 'internet', 'wifi', 'indihome', 'pulsa', 'kuota', 'telkomsel', 'xl', 'indosat', 'bpjs', 'kontrakan', 'kosan', 'kost', 'sewa'],
  // Income - Salary
  'inc-1': ['gaji', 'salary', 'payroll', 'upah', 'saham', 'dividen', 'fee', 'bonus', 'tunjangan'],
  // Income - Investment
  'inc-2': ['reksadana', 'reksa dana', 'saham', 'crypto', 'kripto', 'dividen', 'bunga', 'rebound', 'profit', 'cuan', 'emas'],
};

export const autoCategorize = (description: string, categories: Category[]): string => {
  const descLower = description.toLowerCase();
  
  // Search for matching category ID from keyword maps
  for (const [catId, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (descLower.includes(keyword)) {
        // Find if this category exists in user categories
        // If system category IDs match exp-1, etc.
        const found = categories.find(c => c.id === catId || c.name.toLowerCase() === getCategoryNameById(catId).toLowerCase());
        if (found) return found.id;
      }
    }
  }

  // Fallback to "Lainnya" based on transaction type if we knew it, or default to general categories
  const defaultExpense = categories.find(c => c.type === 'expense' && c.name.toLowerCase().includes('lain'));
  return defaultExpense?.id || categories[0]?.id || '';
};

const getCategoryNameById = (id: string): string => {
  switch (id) {
    case 'inc-1': return 'Gaji';
    case 'inc-2': return 'Investasi';
    case 'inc-3': return 'Lainnya';
    case 'exp-1': return 'Makanan & Minuman';
    case 'exp-2': return 'Transportasi';
    case 'exp-3': return 'Belanja';
    case 'exp-4': return 'Hiburan';
    case 'exp-5': return 'Kesehatan';
    case 'exp-6': return 'Tagihan & Utilitas';
    default: return 'Lainnya';
  }
};

export interface FinancialInsight {
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
}

export const generateInsights = (
  transactions: Transaction[],
  categories: Category[],
  assets: Asset[]
): FinancialInsight[] => {
  const insights: FinancialInsight[] = [];
  
  if (transactions.length === 0) {
    insights.push({
      type: 'info',
      title: 'Selamat Datang di WealthManager',
      message: 'Mulai catat transaksi harian Anda untuk melihat analisis AI dan rekomendasi penghematan di sini.'
    });
    return insights;
  }

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory: { [key: string]: number } = {};

  transactions.forEach(tx => {
    const amount = Number(tx.amount);
    if (tx.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      const catName = tx.category?.name || 'Lainnya';
      expenseByCategory[catName] = (expenseByCategory[catName] || 0) + amount;
    }
  });

  const cashflowRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 1;

  // 1. Cashflow insights
  if (totalExpense > totalIncome && totalIncome > 0) {
    insights.push({
      type: 'warning',
      title: 'Defisit Anggaran Terdeteksi',
      message: `Pengeluaran Anda (Rp ${totalExpense.toLocaleString('id-ID')}) melebihi pemasukan (Rp ${totalIncome.toLocaleString('id-ID')}). Disarankan untuk meninjau kembali pengeluaran non-esensial.`
    });
  } else if (cashflowRatio > 0.8 && totalIncome > 0) {
    insights.push({
      type: 'warning',
      title: 'Rasio Pengeluaran Tinggi',
      message: `Anda membelanjakan ${(cashflowRatio * 100).toFixed(0)}% dari pemasukan. Coba alokasikan minimal 20% untuk tabungan dan investasi.`
    });
  } else if (totalIncome > 0) {
    insights.push({
      type: 'success',
      title: 'Arus Kas Sehat',
      message: `Hebat! Pengeluaran Anda hanya ${(cashflowRatio * 100).toFixed(0)}% dari pemasukan. Anda memiliki surplus Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')} bulan ini.`
    });
  }

  // 2. Category insights
  let highestExpenseCategory = '';
  let highestExpenseAmount = 0;
  for (const [cat, amt] of Object.entries(expenseByCategory)) {
    if (amt > highestExpenseAmount) {
      highestExpenseAmount = amt;
      highestExpenseCategory = cat;
    }
  }

  if (highestExpenseAmount > 0 && totalExpense > 0) {
    const percent = ((highestExpenseAmount / totalExpense) * 100).toFixed(0);
    insights.push({
      type: 'info',
      title: `Pengeluaran Terbesar: ${highestExpenseCategory}`,
      message: `Kategori ${highestExpenseCategory} menghabiskan Rp ${highestExpenseAmount.toLocaleString('id-ID')} (${percent}% dari seluruh pengeluaran).`
    });
  }

  // 3. Asset recommendations
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance), 0);
  const investmentAsset = assets.find(a => a.type === 'investment');
  const investmentBalance = investmentAsset ? Number(investmentAsset.balance) : 0;
  
  if (totalAssets > 0 && investmentBalance === 0) {
    insights.push({
      type: 'info',
      title: 'Rekomendasi Investasi',
      message: 'Seluruh aset Anda berada di tabungan atau kas fisik. Pertimbangkan memindahkan sebagian dana ke instrumen investasi (Saham, Reksa Dana, Obligasi) untuk melawan inflasi.'
    });
  } else if (totalAssets > 0 && (investmentBalance / totalAssets) < 0.1) {
    insights.push({
      type: 'info',
      title: 'Diversifikasi Aset',
      message: 'Porsi portofolio investasi Anda masih di bawah 10%. Diversifikasi portofolio Anda secara berkala untuk meningkatkan imbal hasil jangka panjang.'
    });
  }

  return insights;
};
