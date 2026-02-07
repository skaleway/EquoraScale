import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Filter, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  MoreVertical, 
  Mail, 
  Lock, 
  Key,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { createUser, deleteUser, fetchAllUsers, AdminUser } from '../../services/admin';
import { AuthContext } from '../../contexts/AuthContext';
import ConfirmationModal from '../UI/ConfirmationModal';
import UnauthorizedView from './UnauthorizedView';
import { useToast } from '../UI/Toast';

// --- Utility: Avatar Generator ---
const getInitials = (name: string) => {
  return name.slice(0, 2).toUpperCase();
};

const getColor = (name: string) => {
  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const InputField: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}> = ({ icon: Icon, error, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
      <Icon className="w-4 h-4" />
    </div>
    <input
      {...props}
      className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 ${error ? 'border-rose-400 focus:border-rose-400' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'}`}
    />
    {error && <p className="text-[11px] text-rose-500 mt-2 font-semibold">{error}</p>}
  </div>
);

const AdminUsers: React.FC = () => {
  const { user } = React.useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAllUsers,
    enabled: user?.role === 'admin',
  });

  // --- Auth Checks ---
  if (user?.role !== 'admin') {
    return <UnauthorizedView message="Admin access is required for this section." />;
  }

  if (isError && (((error as any)?.status === 401) || ((error as any)?.status === 403))) {
    return <UnauthorizedView />;
  }

  // --- Filtering Logic ---
  const filteredUsers = useMemo(() => {
    const list = data || [];
    return list.filter((u) => {
      const matchesQuery =
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [data, query, roleFilter]);

  // --- Handlers ---
  const handleCreate = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await createUser(payload);
      toast.success('User created successfully.');
      setIsCreateOpen(false);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteUser(pendingDelete.id);
      toast.success('User deleted.');
      setPendingDelete(null);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage system access, roles, and permissions.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>Add User</span>
        </button>
      </div>

      {/* Controls Toolbar */}
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
        
        <div className="relative w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <select
            className="block w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Standard Users</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
             <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
        </div>
      </div>

      {/* Main List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-100">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-8 sm:col-span-5">User</div>
          <div className="col-span-4 sm:col-span-3 hidden sm:block">Role</div>
          <div className="col-span-3 hidden sm:block">Status</div>
          <div className="col-span-4 sm:col-span-1 text-right">Actions</div>
        </div>

        {/* Content */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            // Skeleton Loader
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
                <div className="col-span-8 sm:col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="col-span-3 hidden sm:block pt-2">
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 dark:text-slate-100 font-medium text-lg">No users found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                We couldn't find any users matching your current filters.
              </p>
              {query && (
                <button 
                  onClick={() => { setQuery(''); setRoleFilter('all'); }}
                  className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            // User List
            filteredUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => navigate(`/admin/users/${u.id}`)}
                className="group grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                {/* User Info */}
                <div className="col-span-8 sm:col-span-5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${getColor(u.username)}`}>
                    {getInitials(u.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">
                      {u.username}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="col-span-4 sm:col-span-3 hidden sm:flex items-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    u.role === 'admin' 
                      ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    <span className="capitalize">{u.role}</span>
                  </span>
                </div>

                {/* Status (Fake 'Active' for UI completeness) */}
                <div className="col-span-3 hidden sm:flex items-center">
                  <div className={`flex items-center gap-2 text-xs font-medium ${u.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {u.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-4 sm:col-span-1 flex justify-end">
                  <button
                    disabled={String(u.id) === String(user?.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(u);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isCreateOpen && (
        <CreateUserModal
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />
      )}

      <ConfirmationModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Revoke Access?"
        message={`Are you sure you want to delete ${pendingDelete?.username}? This action cannot be undone.`}
        confirmText="Yes, Delete User"
        variant="danger"
      />
    </div>
  );
};

// --- Sub-components ---

const CreateUserModal: React.FC<{
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
  isSubmitting: boolean;
}> = ({ onClose, onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    secretKey: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.username.trim()) {
      nextErrors.username = 'Username is required.';
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Email must be a valid address.';
    }
    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else {
      if (form.password.length < 6) {
        nextErrors.password = 'Password must be at least 6 characters long.';
      } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&._-])[A-Za-z\d@$!%*#?&._-]+$/.test(form.password)) {
        nextErrors.password = 'Password must contain at least one letter, one number, and one special character.';
      }
    }
    if (!form.secretKey.trim()) {
      nextErrors.secretKey = 'Admin secret key is required.';
    }
    setFieldErrors(nextErrors);
    setFormError(Object.keys(nextErrors).length ? 'Please fix the highlighted fields.' : '');
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add New User</h3>
              <p className="text-sm text-slate-500 mt-1">Fill in the details to create a new account.</p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
              <UserIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <InputField 
            icon={UserIcon}
            placeholder="Username" 
            value={form.username} 
            onChange={(e: any) => setForm({ ...form, username: e.target.value })} 
            error={fieldErrors.username}
          />
          <InputField 
            icon={Mail}
            placeholder="Email address" 
            type="email"
            value={form.email} 
            onChange={(e: any) => setForm({ ...form, email: e.target.value })} 
            error={fieldErrors.email}
          />
          <InputField 
            icon={Lock}
            placeholder="Set Password" 
            type="password"
            value={form.password} 
            onChange={(e: any) => setForm({ ...form, password: e.target.value })} 
            error={fieldErrors.password}
          />
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Shield className="w-4 h-4" />
            </div>
            <select
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              value={form.role}
              onChange={(e: any) => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">User Role</option>
              <option value="admin">Admin Role</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
               <ChevronRight className="w-3 h-3 rotate-90" />
            </div>
          </div>

          <InputField 
            icon={Key}
            placeholder="Admin Secret Key" 
            type="password"
            value={form.secretKey} 
            onChange={(e: any) => setForm({ ...form, secretKey: e.target.value })} 
            error={fieldErrors.secretKey}
          />
        </div>
        {formError && (
          <p className="px-6 pb-2 text-[11px] text-rose-500 font-semibold">{formError}</p>
        )}

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!validate()) return;
              onSubmit(form);
            }}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
