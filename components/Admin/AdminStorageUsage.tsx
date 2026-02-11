import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search } from 'lucide-react';
import { fetchAllUsers } from '../../services/admin';
import { getGlobalStorage } from '../../services/files';
import UnauthorizedView from './UnauthorizedView';
import { AuthContext } from '../../contexts/AuthContext';

const formatBytes = (bytes: number) => {
  if (!bytes && bytes !== 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const AdminStorageUsage: React.FC = () => {
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data: users, isLoading: usersLoading, isError: usersError, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAllUsers,
    enabled: user?.role === 'admin',
  });

  const { data: storageData, isLoading: storageLoading } = useQuery({
    queryKey: ['admin-storage'],
    queryFn: getGlobalStorage,
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return <UnauthorizedView message="Admin access is required for this section." />;
  }

  if (usersError && (((error as any)?.status === 401) || ((error as any)?.status === 403))) {
    return <UnauthorizedView />;
  }

  const rows = useMemo(() => {
    const byUser = storageData?.byUser || [];
    const userMap = new Map((users || []).map((u) => [u.id, u]));
    const mapped = byUser.map((row: any) => {
      const userInfo = userMap.get(row.userId);
      return {
        userId: row.userId,
        username: userInfo?.username || `User ${row.userId}`,
        email: userInfo?.email || '—',
        totalFiles: row.totalFiles || 0,
        totalSize: row.totalSize || 0,
        lastIndexedAt: row.lastIndexedAt || row.last_file_at || null,
      };
    });

    return mapped
      .filter((u) =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => {
        const aTime = a.lastIndexedAt ? new Date(a.lastIndexedAt).getTime() : 0;
        const bTime = b.lastIndexedAt ? new Date(b.lastIndexedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [storageData, users, query]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/admin/overview')}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-0.5">
            <span className="cursor-pointer hover:text-indigo-600" onClick={() => navigate('/admin/overview')}>Overview</span>
            <span>/</span>
            <span>Storage</span>
          </div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
            Storage Usage
          </h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-100">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-6 sm:col-span-5">User</div>
          <div className="col-span-3 sm:col-span-2">Files</div>
          <div className="col-span-3 sm:col-span-2">Storage</div>
          <div className="col-span-3 hidden sm:block">Last Indexed</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(usersLoading || storageLoading) ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
                <div className="col-span-6 sm:col-span-5">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="col-span-3 hidden sm:block">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 dark:text-slate-100 font-medium text-lg">No storage usage</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                No users have indexed files yet.
              </p>
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.userId} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="col-span-6 sm:col-span-5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.username}</p>
                  <p className="text-xs text-slate-500">{row.email}</p>
                </div>
                <div className="col-span-3 sm:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {row.totalFiles}
                </div>
                <div className="col-span-3 sm:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {formatBytes(row.totalSize)}
                </div>
                <div className="col-span-3 hidden sm:block text-xs text-slate-500">
                  {row.lastIndexedAt ? new Date(row.lastIndexedAt).toLocaleString() : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStorageUsage;
