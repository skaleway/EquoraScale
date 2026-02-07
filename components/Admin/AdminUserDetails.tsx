import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Mail, 
  Shield, 
  Calendar, 
  Clock, 
  Copy, 
  CheckCircle2, 
  XCircle,
  User as UserIcon,
  Pencil,
  Save,
  Loader2,
  KeyRound,
  Fingerprint,
  Ban,
  Undo2
} from 'lucide-react';
import { fetchAllUsers, AdminUser, updateUserAdmin } from '../../services/admin';
import UnauthorizedView from './UnauthorizedView';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../UI/Toast';

// --- Utilities ---
const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

const getColor = (name: string) => {
  const colors = [
    'bg-blue-500 ring-blue-500/30', 
    'bg-indigo-500 ring-indigo-500/30', 
    'bg-violet-500 ring-violet-500/30', 
    'bg-rose-500 ring-rose-500/30', 
    'bg-emerald-500 ring-emerald-500/30', 
    'bg-amber-500 ring-amber-500/30'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AdminUserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminUser> & { password?: string }>({});

  // Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAllUsers,
    enabled: user?.role === 'admin',
  });

  const selectedUser = data?.find((u) => String(u.id) === String(id));

  // Sync state
  useEffect(() => {
    if (selectedUser) {
      setFormData(selectedUser);
    }
  }, [selectedUser]);

  // Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: Partial<AdminUser> & { password?: string } }) =>
      updateUserAdmin(payload.id, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User profile updated successfully.');
      setIsEditing(false);
      setIsSaving(false);
      setFormData((prev) => ({ ...prev, password: '' }));
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update user.');
      setIsSaving(false);
    },
  });

  // Auth Checks
  if (user?.role !== 'admin') {
    return <UnauthorizedView message="Admin access is required for this section." />;
  }

  if (isError && (((error as any)?.status === 401) || ((error as any)?.status === 403))) {
    return <UnauthorizedView />;
  }

  // Handlers
  const handleCopyId = () => {
    navigator.clipboard.writeText(String(selectedUser?.id));
    toast.success('User ID copied to clipboard');
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setIsSaving(true);

    const payload: any = {
      username: formData.username?.trim(),
      email: formData.email?.trim() || null,
      role: formData.role,
      is_active: formData.is_active,
      metadata: formData.metadata ?? null,
    };

    if (formData.password && formData.password.trim().length > 0) {
      if (formData.password.trim().length < 6) {
        toast.warning('Password must be at least 6 characters.');
        setIsSaving(false);
        return;
      }
      payload.password = formData.password.trim();
    }

    updateMutation.mutate({ id: selectedUser.id, data: payload });
  };

  const handleCancel = () => {
    if (selectedUser) setFormData(selectedUser);
    setFormData((prev) => ({ ...prev, password: '' }));
    setIsEditing(false);
  };

  // --- Sub-Components for UI cleanliness ---
  const InputGroup = ({ label, icon: Icon, children }: any) => (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      {children}
    </div>
  );

  const StatusCard = ({ active, onClick, isSelected }: any) => (
    <div 
      onClick={isEditing ? onClick : undefined}
      className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
        isEditing ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : 'cursor-default opacity-80'
      } ${
        isSelected 
          ? active 
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' 
            : 'border-rose-500 bg-rose-50 dark:bg-rose-900/10'
          : 'border-slate-100 dark:border-slate-800 opacity-50 grayscale'
      }`}
    >
      <div className={`p-2 rounded-full ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {active ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
      </div>
      <div>
        <p className={`text-sm font-bold ${active ? 'text-emerald-900 dark:text-emerald-100' : 'text-rose-900 dark:text-rose-100'}`}>
          {active ? 'Active User' : 'Suspended'}
        </p>
        <p className="text-[10px] text-slate-500 leading-tight">
          {active ? 'Full system access granted' : 'Access temporarily revoked'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => navigate('/admin/users')}>Users</span>
              <span className="text-slate-300">/</span>
              <span>Profile</span>
            </div>
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {isLoading ? 'Loading...' : selectedUser?.username || 'Not Found'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedUser && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
          
          {isEditing && (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Undo2 className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
           <div className="h-75 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800" />
           <div className="lg:col-span-2 h-[300px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800" />
        </div>
      )}

      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* --- LEFT COL: Identity Card (Sticky) --- */}
          <div className="lg:col-span-1 sticky top-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="h-32 bg-slate-100 dark:bg-slate-800/50 relative">
                 <div className="absolute inset-0 bg-grid-slate-200/50 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.5),rgba(0,0,0,0))]" />
              </div>
              
              <div className="px-6 pb-6 relative">
                 {/* Avatar */}
                 <div className={`-mt-12 w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl ring-4 ring-white dark:ring-slate-900 ${getColor(selectedUser.username)}`}>
                    {getInitials(selectedUser.username)}
                 </div>

                 <div className="mt-4">
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formData.username}</h2>
                    <p className="text-sm font-medium text-slate-500">{formData.email || 'No email linked'}</p>
                 </div>

                 <div className="mt-6 flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                         formData.role === 'admin' 
                         ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' 
                         : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {formData.role}
                    </span>
                    <button 
                       onClick={handleCopyId}
                       className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      <Fingerprint className="w-3 h-3" />
                      ID: <span className="font-mono">{selectedUser.id}</span>
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-400 font-medium">Joined</span>
                       <span className="text-slate-700 dark:text-slate-300 font-bold">{formatDate(selectedUser.created_at)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-400 font-medium">Last Updated</span>
                       <span className="text-slate-700 dark:text-slate-300 font-bold">{formatDate(selectedUser.updated_at)}</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COL: Settings Form --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Account Information Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account Information</h3>
                <p className="text-sm text-slate-500 mt-1">Basic identification details for this user.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputGroup label="Username" icon={UserIcon}>
                    {isEditing ? (
                       <input 
                         className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                         value={formData.username}
                         onChange={(e) => setFormData({...formData, username: e.target.value})}
                       />
                    ) : (
                       <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-transparent text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {formData.username}
                       </div>
                    )}
                 </InputGroup>

                 <InputGroup label="Email Address" icon={Mail}>
                    {isEditing ? (
                       <input 
                         className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                         value={formData.email || ''}
                         onChange={(e) => setFormData({...formData, email: e.target.value})}
                       />
                    ) : (
                       <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-transparent text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {formData.email || <span className="text-slate-400 italic">No email provided</span>}
                       </div>
                    )}
                 </InputGroup>

                 <InputGroup label="System Role" icon={Shield}>
                    {isEditing ? (
                       <select 
                         className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                         value={formData.role}
                         onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                       >
                          <option value="user">User (Standard Access)</option>
                          <option value="admin">Admin (Full Access)</option>
                       </select>
                    ) : (
                       <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                          {formData.role}
                       </div>
                    )}
                 </InputGroup>
              </div>
            </div>

            {/* Security & Access Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
               <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Security & Access</h3>
                 <p className="text-sm text-slate-500 mt-1">Manage authentication and account status.</p>
               </div>

               <div className="space-y-6">
                  {/* Visual Status Selector */}
                  <InputGroup label="Account Status" icon={Shield}>
                     <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <StatusCard 
                           active={true} 
                           isSelected={formData.is_active !== false} 
                           onClick={() => setFormData({...formData, is_active: true})} 
                        />
                        <StatusCard 
                           active={false} 
                           isSelected={formData.is_active === false} 
                           onClick={() => setFormData({...formData, is_active: false})} 
                        />
                     </div>
                  </InputGroup>

                  {/* Password Reset (Only visible in edit) */}
                  {isEditing ? (
                     <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 space-y-3">
                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                           <KeyRound className="w-4 h-4" /> Change Password
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                           Leave blank to keep the current password. Entering a value here will immediately overwrite the user's password.
                        </p>
                        <input 
                           type="password"
                           placeholder="Enter new password..."
                           className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                           value={formData.password || ''}
                           onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 text-sm text-slate-500 italic px-1">
                        <KeyRound className="w-4 h-4 text-slate-300" /> Password is secure and hidden. Switch to edit mode to reset.
                     </div>
                  )}
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetails;