import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserStorage } from '../../services/files';
import { Icons } from '../../constants';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes && bytes !== 0) return '0 Bytes';
  if (!Number.isFinite(bytes)) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const AnalyticsView: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-storage'],
    queryFn: getUserStorage,
    staleTime: 1000 * 60 * 5,
  });

  const safeTotalFiles = Number(data?.totalFiles);
  const safeTotalSize = Number(data?.totalSize);
  const totalFiles = Number.isFinite(safeTotalFiles) ? safeTotalFiles : 0;
  const totalSize = Number.isFinite(safeTotalSize) ? safeTotalSize : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Storage insights and repository activity.
        </p>
      </div>

      {isError && (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
          {(error as any)?.message || 'Failed to load analytics.'}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Icons.FileText className="w-5 h-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Files</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isLoading ? '—' : totalFiles}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Icons.File className="w-5 h-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Storage Used</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isLoading ? '—' : formatBytes(totalSize)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
