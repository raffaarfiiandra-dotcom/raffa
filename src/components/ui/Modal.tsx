import React from 'react';
import { LucideIcon } from './LucideIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="fixed inset-0 bg-transparent" 
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg bg-white border border-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <LucideIcon name="X" size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(100vh-12rem)] no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
