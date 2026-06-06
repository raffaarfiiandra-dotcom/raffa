'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LucideIcon } from './ui/LucideIcon';
import { authService } from '@/lib/db';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onAddTransactionClick?: () => void;
  onSupportClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose,
  onAddTransactionClick,
  onSupportClick
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authService.logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Accounts & Wallet', href: '/accounts', icon: 'Wallet' },
    { name: 'Transactions', href: '/transactions', icon: 'ArrowLeftRight' },
    { name: 'Analytics', href: '/analytics', icon: 'PieChart' },
    { name: 'Debts & Receivables', href: '/debts-receivables', icon: 'Coins' },
    { name: 'Assets', href: '/assets', icon: 'Building2' },
    { name: 'Net Worth', href: '/net-worth', icon: 'TrendingUp' },
    { name: 'Reports', href: '/reports', icon: 'BarChart3' },
    { name: 'Recurring', href: '/recurring', icon: 'RefreshCcw' },
    { name: 'Settings', href: '/settings', icon: 'Settings' },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-slate-100 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo area */}
        <div className="p-6 border-b border-slate-50">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={handleNavClick}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-200">
              W
            </div>
            <div>
              <h1 className="font-bold text-lg text-indigo-950 leading-none">WealthManager</h1>
              <p className="text-[10px] text-indigo-500 font-medium tracking-wide mt-1 uppercase">Elite Wealth Management</p>
            </div>
          </Link>
        </div>

        {/* Action button */}
        <div className="px-6 py-4">
          <button 
            onClick={() => {
              if (onAddTransactionClick) onAddTransactionClick();
              if (onClose) onClose();
            }}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all duration-150 cursor-pointer"
          >
            <LucideIcon name="Plus" size={20} />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={`
                  flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[14px] transition-all duration-150
                  ${isActive 
                    ? 'bg-indigo-50/80 text-indigo-600 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
                `}
              >
                <LucideIcon 
                  name={item.icon} 
                  className={isActive ? 'text-indigo-600' : 'text-slate-400'} 
                  size={20}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer menu */}
        <div className="p-4 border-t border-slate-50 space-y-1">
          <button
            onClick={() => {
              if (onSupportClick) onSupportClick();
              if (onClose) onClose();
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[14px] text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-150 text-left cursor-pointer"
          >
            <LucideIcon name="HelpCircle" className="text-slate-400" size={20} />
            <span>Support</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-[14px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150 text-left cursor-pointer"
          >
            <LucideIcon name="LogOut" className="text-rose-500" size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
