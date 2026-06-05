'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TransactionModal } from './TransactionModal';
import { getSessionUser } from '@/lib/db';
import { Modal } from './ui/Modal';
import { LucideIcon } from './ui/LucideIcon';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Authenticate user on mount
  useEffect(() => {
    setIsMounted(true);
    
    // Register PWA service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('SW Registered', reg.scope))
          .catch((err) => console.log('SW Registration failed', err));
      };
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    const checkAuth = async () => {
      // Allow landing page, login, and register screens to bypass check
      if (pathname === '/' || pathname === '/login' || pathname === '/register') {
        setAuthLoading(false);
        return;
      }
      
      const user = await getSessionUser();
      if (!user) {
        router.push('/login');
      } else {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router]);

  const handleTransactionSuccess = () => {
    // Reload page data by triggering router refresh
    router.refresh();
    // Dispatch a custom event to tell child views to reload their states
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('transaction-updated'));
    }
  };

  if (!isMounted) return null;

  // Render auth pages and landing page without AppShell framing
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Memuat...</p>
        </div>
      </div>
    );
  }

  // Get current page friendly title for header
  const getHeaderTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/transactions')) return 'Transactions';
    if (pathname.startsWith('/debts-receivables')) return 'Debts & Receivables';
    if (pathname.startsWith('/assets')) return 'Assets';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'WealthManager';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      {/* Sidebar navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onAddTransactionClick={() => setTxModalOpen(true)}
        onSupportClick={() => setSupportOpen(true)}
      />

      {/* Viewport content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={getHeaderTitle()} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-50/30">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global transaction modal */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />

      {/* Help & Support Modal */}
      <Modal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        title="Pusat Bantuan & Dukungan"
      >
        <div className="space-y-6 text-slate-600 text-sm">
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <LucideIcon name="HelpCircle" size={26} />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Bagaimana kami bisa membantu Anda?</h4>
            <p className="text-xs text-slate-400">Tim customer support kami siap melayani pertanyaan dan kendala teknis Anda.</p>
          </div>

          <div className="space-y-4">
            {/* Email Support Card */}
            <a 
              href="mailto:support@wealthmanager.com?subject=Tanya%20Seputar%20WealthManager"
              className="p-4 bg-slate-50 hover:bg-indigo-50/20 border border-slate-200/80 hover:border-indigo-300 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group block text-left"
            >
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors shrink-0">
                <LucideIcon name="Mail" size={22} />
              </div>
              <div className="leading-tight">
                <h5 className="font-bold text-xs text-slate-800">Hubungi via Email</h5>
                <p className="text-[11px] text-slate-400 mt-1">Kirim pesan ke support@wealthmanager.com</p>
              </div>
            </a>

            {/* WhatsApp Support Card */}
            <a 
              href="https://wa.me/6281234567890?text=Halo%20WealthManager%20Support,%20saya%20butuh%20bantuan"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-50 hover:bg-emerald-50/20 border border-slate-200/80 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group block text-left"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors shrink-0">
                <LucideIcon name="MessageSquare" size={22} />
              </div>
              <div className="leading-tight">
                <h5 className="font-bold text-xs text-slate-800">Chat via WhatsApp</h5>
                <p className="text-[11px] text-slate-400 mt-1">Layanan fast response interaktif 24/7</p>
              </div>
            </a>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Jam Kerja Layanan</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Senin - Minggu: 08:00 - 22:00 WIB</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppShell;
