'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TransactionModal } from './TransactionModal';
import { getSessionUser } from '@/lib/db';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
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
      // Allow login and register screens to bypass check
      if (pathname === '/login' || pathname === '/register') {
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

  // Render auth pages without AppShell framing
  if (pathname === '/login' || pathname === '/register') {
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
    </div>
  );
};

export default AppShell;
