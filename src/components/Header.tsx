'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LucideIcon } from './ui/LucideIcon';
import { notificationsService, getSessionUser } from '@/lib/db';
import { Notification, Profile } from '@/lib/db/types';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onMenuClick,
  onSearch 
}) => {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchHeaderData = async () => {
      // User Profile
      const user = await getSessionUser();
      setUserProfile(user);

      // Notifications
      const notifs = await notificationsService.list();
      setNotifications(notifs);
    };
    fetchHeaderData();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationsService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 h-[73px]">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg lg:hidden hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
        >
          <LucideIcon name="Menu" size={22} />
        </button>

        {/* Title / Breadcrumb */}
        <div className="hidden sm:block">
          <span className="font-semibold text-[17px] text-slate-800">{title}</span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <LucideIcon 
            name="Search" 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" 
            size={18}
          />
          <input
            type="text"
            placeholder="Search transactions, debts, goals..."
            value={searchVal}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 text-[14px] bg-slate-50 border border-slate-150 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-150"
          />
        </div>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors relative cursor-pointer"
          >
            <LucideIcon name="Bell" size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2">
              <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-sm">Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] text-indigo-600 font-medium">{unreadCount} belum dibaca</span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    Tidak ada notifikasi baru
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${!notif.is_read ? 'bg-indigo-50/20' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-medium text-xs text-slate-800 leading-tight">{notif.title}</h4>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {new Date(notif.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <Link 
          href="/settings"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <LucideIcon name="Settings" size={20} />
        </Link>

        {/* Vertical divider */}
        <div className="w-[1px] h-6 bg-slate-200 hidden sm:block" />

        {/* User profile info */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden shadow-sm">
            {userProfile?.full_name ? (
              userProfile.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
            ) : (
              'US'
            )}
          </div>
          <div className="hidden md:block leading-none text-left">
            <p className="font-semibold text-sm text-slate-800">
              {userProfile?.full_name || 'Elite User'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {userProfile?.email || 'user@wealthmanager.com'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
