
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Icons } from '../../constants';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastHandlers = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={{ toast: toastHandlers }}>
      {children}
      <div className="fixed bottom-6 right-6 z-200 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const variants = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      border: 'border-emerald-100 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-400',
      icon: <Icons.Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      border: 'border-rose-100 dark:border-rose-800',
      text: 'text-rose-800 dark:text-rose-400',
      icon: <Icons.Plus className="w-5 h-5 rotate-45 text-rose-600 dark:text-rose-400" />,
    },
    info: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      border: 'border-indigo-100 dark:border-indigo-800',
      text: 'text-indigo-800 dark:text-indigo-400',
      icon: <Icons.Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      border: 'border-amber-100 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-400',
      icon: <Icons.Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
  };

  const v = variants[toast.type];

  return (
    <div className={`pointer-events-auto flex items-center min-w-80 max-w-lg p-5 rounded-2xl border shadow-2xl animate-in slide-in-from-right-full duration-300 backdrop-blur-md ${v.bg} ${v.border}`}>
      <div className="mr-4 shrink-0">{v.icon}</div>
      <p className={`flex-1 text-base font-bold tracking-tight ${v.text}`}>{toast.message}</p>
      <button 
        onClick={onClose}
        className="ml-4 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 transition-colors"
      >
        <Icons.Plus className="w-4 h-4 rotate-45" />
      </button>
    </div>
  );
};
