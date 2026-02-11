import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProfileDetails, UserProfile } from '../../services/auth';
import { AuthContext } from '../../contexts/AuthContext';
import ConfirmationModal from '../UI/ConfirmationModal';
import { useToast } from '../UI/Toast';
import {
  User,
  Mail,
  Shield,
  Activity,
  Calendar,
  Clock,
  Fingerprint,
  Terminal,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Helper for generating initials
const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

const SettingsPage: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfileDetails,
    staleTime: 1000 * 60 * 5,
  });
  const navigate = useNavigate();
  const { logout } = React.useContext(AuthContext);
  const { toast } = useToast();
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false);


  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-4 font-sans selection:bg-indigo-500/20">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
              Manage your personal details and security preferences.
            </p>
          </div>

          <div className="px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Operational
            </span>
          </div>
        </div>

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* 1. Hero Profile Card (Spans 8 columns) */}
            <div className="md:col-span-8 relative group overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              {/* Decorative Gradient Background */}
              <div className="absolute top-0 left-0 w-full h-32 bg-blue-500 opacity-90" />

              <div className="relative pt-20 px-8 pb-8">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-2xl font-black shadow-xl ring-4 ring-white dark:ring-slate-900">
                    {getInitials(data.username)}
                  </div>

                  {/* Name & Badge */}
                  <div className="flex-1 mb-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {data.username}
                      </h2>
                      {data.is_active ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/50 text-emerald-600 dark:text-emerald-100 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/50 text-rose-600 dark:text-rose-100 text-[10px] font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-500/20">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">{data.email || 'No email linked'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoItem
                    icon={Fingerprint}
                    label="User ID"
                    value={data.id}
                    copyable
                  />
                  <InfoItem
                    icon={Shield}
                    label="Role Access"
                    value={data.role}
                    highlight
                  />
                  <button
                    onClick={() => setIsLogoutOpen(true)}
                    className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Status & Security Card (Spans 4 columns) */}
            <div className="md:col-span-4 space-y-6">
              <div className="h-full rounded-4xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      Account Status
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-500">Profile Status</span>
                      {data.is_active ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                      <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium leading-relaxed">
                        Your session is secured via JWT. Role-based access control is currently enforced.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* 3. Timeline Stats (Spans 4 columns) */}
            <div className="md:col-span-4 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Timeline</h3>
              <div className="space-y-6">
                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800">
                  <div className="absolute -left-1.25 top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Joined</p>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(data.created_at)}
                  </div>
                </div>
                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800">
                  <div className="absolute -left-1.25 top-1 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900" />
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Last Update</p>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {formatDate(data.updated_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Metadata Terminal (Spans 8 columns) */}
            <div className="md:col-span-8 rounded-2xl bg-slate-900 dark:bg-black border border-slate-800 dark:border-slate-800  overflow-hidden shadow-lg">
              <div className="bg-slate-800/50 dark:bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-700/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="ml-2 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> user_metadata.json
                </span>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="font-mono text-xs md:text-sm text-emerald-400/90 leading-relaxed">
                  {data.metadata ? JSON.stringify(data.metadata, null, 2) : '// No additional metadata found'}
                </pre>
              </div>
            </div>

          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={() => {
          logout();
          toast.info('You have been logged out.');
          navigate('/login');
        }}
        title="Log Out?"
        message="You will be signed out of Eqorascale and returned to the login screen."
        confirmText="Log out"
        variant="danger"
      />
    </div>
  );
};

// --- Sub Components ---

const InfoItem = ({
  icon: Icon,
  label,
  value,
  highlight = false,
  copyable = false
}: {
  icon: any,
  label: string,
  value?: string | number,
  highlight?: boolean,
  copyable?: boolean
}) => (
  <div className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
    <div className={`p-2 rounded-lg ${highlight ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold truncate ${highlight ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
        {value || '—'}
      </p>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-4">
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-80 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-8 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-6">
          <div className="flex items-end gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-3 flex-1">
              <div className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-72 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>

        <div className="md:col-span-4 rounded-4xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="h-5 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-14 rounded-xl bg-white dark:bg-slate-800/70" />
          <div className="h-20 rounded-xl bg-indigo-100/40 dark:bg-indigo-900/20" />
        </div>

        <div className="md:col-span-4 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-5">
          <div className="h-4 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
          <div className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/70" />
        </div>

        <div className="md:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-3">
          <div className="h-4 w-36 rounded bg-slate-700/80" />
          <div className="h-4 w-full rounded bg-slate-700/80" />
          <div className="h-4 w-5/6 rounded bg-slate-700/80" />
          <div className="h-4 w-2/3 rounded bg-slate-700/80" />
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error }: { error: any }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
    <div className="max-w-md w-full p-8 rounded-4xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/50 shadow-xl text-center">
      <div className="w-16 h-16 mx-auto bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
        <User className="w-8 h-8 text-rose-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to Load</h2>
      <p className="text-sm text-slate-500 mb-6">
        {String((error as any)?.message || 'An unexpected error occurred while fetching your profile.')}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-opacity"
      >
        Retry
      </button>
    </div>
  </div>
);

export default SettingsPage;
