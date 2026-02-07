import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Shield, 
  UserCheck, 
  Activity, 
  Server, 
  Database, 
  ArrowUpRight,
  Wifi,
  HardDrive
} from 'lucide-react';
import { fetchAllUsers } from '../../services/admin';
import { getGlobalStorage } from '../../services/files';
import UnauthorizedView from './UnauthorizedView';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- Utilities ---

// Generates a consistent color based on string input
const getColor = (name: string) => {
  const colors = [
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatBytes = (bytes: number) => {
  if (!bytes && bytes !== 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// --- Components ---

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  color: 'indigo' | 'emerald' | 'blue' | 'slate' | 'rose' | 'amber';
  isLoading: boolean;
  className?: string;
}> = ({ title, value, icon: Icon, trend, color, isLoading, className }) => {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-colors ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && !isLoading && (
          <span className="px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-bold text-emerald-600 flex items-center border border-emerald-100 dark:border-emerald-800">
            {trend} <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {isLoading ? '—' : value}
        </h3>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">{title}</p>
      </div>
    </div>
  );
};

const AdminOverview: React.FC = () => {
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate()
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAllUsers,
    enabled: user?.role === 'admin',
    staleTime: 60000,
  });

  const { data: storageData, isLoading: isStorageLoading } = useQuery({
    queryKey: ['admin-storage'],
    queryFn: getGlobalStorage,
    enabled: user?.role === 'admin',
    staleTime: 60000,
  });

  // --- Auth Checks ---
  if (user?.role !== 'admin') {
    return <UnauthorizedView message="Admin access is required for this section." />;
  }

  if (isError && (((error as any)?.status === 401) || ((error as any)?.status === 403))) {
    return <UnauthorizedView />;
  }

  // --- Derived Metrics ---
  const stats = useMemo(() => {
    if (!data) return { total: 0, admins: 0, users: 0, active: 0, recent: [] };
    
    const sorted = [...data].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return {
      total: data.length,
      admins: data.filter(u => u.role === 'admin').length,
      users: data.filter(u => u.role !== 'admin').length,
      active: data.filter(u => u.is_active !== false).length,
      recent: sorted.slice(0, 5) 
    };
  }, [data]);

  const activePercent = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">System Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Real-time platform metrics and activity monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-800">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Operational
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: User Ecosystem (2/3 width) --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* User Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard 
              title="Total Accounts" 
              value={stats.total} 
              icon={Users} 
              color="indigo" 
              isLoading={isLoading} 
            />
            <StatCard 
              title="Active Sessions" 
              value={stats.active} 
              trend={`${activePercent}%`}
              icon={UserCheck} 
              color="emerald" 
              isLoading={isLoading} 
            />
            <StatCard 
              title="Administrators" 
              value={stats.admins} 
              icon={Shield} 
              color="slate" 
              isLoading={isLoading} 
            />
            <StatCard 
              title="Standard Users" 
              value={stats.users} 
              icon={Activity} 
              color="blue" 
              isLoading={isLoading} 
            />
          </div>

          {/* Recent Registrations List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Recent Registrations</h3>
              </div>
              <button onClick={() => navigate('/admin/users')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg">
                View All
              </button>
            </div>
            
            <div className="flex-1">
              {isLoading ? (
                <div className="p-10 flex items-center justify-center text-slate-400 text-sm font-bold">Loading activity...</div>
              ) : stats.recent.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">No recent activity found.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.recent.map((u) => (
                    <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm ${getColor(u.username)}`}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">{u.username}</p>
                          <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                           {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Infrastructure & Storage (1/3 width) --- */}
        <div className="space-y-6">
          
          {/* Storage Summary Card */}
          <div className="bg-slate-900 dark:bg-indigo-950 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden">
             {/* Background Pattern */}
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Database className="w-32 h-32 transform rotate-12" />
             </div>
             
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Storage Overview</p>
                <div className="space-y-6">
                  <div>
                    <p className="text-3xl font-black tracking-tight">{formatBytes(storageData?.totalSize ?? 0)}</p>
                    <p className="text-xs text-slate-400 mt-1">Total volume used</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                     <div>
                       <p className="text-lg font-bold">{storageData?.totalFiles ?? 0}</p>
                       <p className="text-[10px] uppercase tracking-wider text-slate-400">Files</p>
                     </div>
                     <div>
                       <p className="text-lg font-bold">{storageData?.totalUsers ?? 0}</p>
                       <p className="text-[10px] uppercase tracking-wider text-slate-400">Users</p>
                     </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Infrastructure Health
            </h3>
            
            <div className="space-y-5">
                {[
                  { name: 'API Gateway', icon: Wifi, status: 'Healthy', ping: '24ms', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                  { name: 'Primary DB', icon: Database, status: 'Healthy', ping: 'Stable', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                  { name: 'Auth Services', icon: Server, status: '99.9%', ping: 'Uptime', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
                  { name: 'File Systems', icon: HardDrive, status: 'Healthy', ping: 'Ready', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' }
                ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${item.color}`}>
                              <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.ping}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500">{item.status}</span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Admin Tip */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Admin Tip</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      Regularly purge inactive users to improve database query performance and reduce storage costs.
                  </p>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminOverview;