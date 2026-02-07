
import React, { useState } from 'react';
import { Icons } from '../../constants';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireText?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  variant = 'danger',
  requireText,
  inputLabel = 'Type to confirm',
  inputPlaceholder = ''
}) => {
  if (!isOpen) return null;
  const [typedValue, setTypedValue] = useState('');
  const isMatch = !requireText || typedValue === requireText;

  const colors = {
    danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-rose-900/20',
    warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200 dark:shadow-amber-900/20',
    info: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-indigo-900/20'
  };

  const iconColors = {
    danger: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-4xl w-full max-w-md p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${iconColors[variant]}`}>
          <Icons.Settings className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
          {message}
        </p>
        {requireText && (
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              {inputLabel}
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={inputPlaceholder || requireText}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}
        <div className="flex space-x-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={() => { if (isMatch) { onConfirm(); onClose(); } }}
            disabled={!isMatch}
            className={`flex-1 py-3.5 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colors[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
