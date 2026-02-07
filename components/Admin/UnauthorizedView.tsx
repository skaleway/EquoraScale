import React from 'react';

const UnauthorizedView: React.FC<{ message?: string }> = ({ message }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <p className="text-xs font-black uppercase tracking-widest text-rose-500 mb-3">Unauthorized</p>
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3">Access Restricted</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {message || 'You do not have permission to view this page.'}
      </p>
    </div>
  </div>
);

export default UnauthorizedView;
