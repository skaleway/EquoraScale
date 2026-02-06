
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../constants';
import { useToast } from '../UI/Toast';


interface AuthFormProps {
  onLogin: (usernameOrEmail: string, password: string) => Promise<void>;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Invalid credentials. Please enter your enterprise details.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onLogin(username, password);
      toast.success(`Welcome back ${username}. Login successful.`);
      navigate('/app');
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please verify your credentials.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 transition-colors">
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 p-20 relative overflow-hidden bg-slate-950">
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 -right-20 w-150 h-150 bg-indigo-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 -left-20 w-100 h-100 bg-purple-600/5 rounded-full blur-[100px]"></div>
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="mb-10">
            <h1 className="text-5xl font-black text-white tracking-tighter leading-[1.1]">
              <span className="bg-indigo-600 px-4 py-1.5 rounded-xl mr-3 shadow-lg shadow-indigo-600/20">Eqorascale</span>
              <span className="text-slate-200">, Intelligent document indexing for procurement</span>
            </h1>
          </div>
          <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
            Migrate folder trees, index every file, and generate quotes & invoices using AI. Secure, enterprise-focused.
          </p>
        </div>
        <div className="absolute bottom-10 left-10 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <Icons.Sparkles className="text-white w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-slate-950 border-l border-slate-900/50 shadow-2xl z-20">
        <div className="w-full max-w-sm space-y-10">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white tracking-tight">
              Log <span className="text-indigo-400">In</span> to Eqorascale
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username or Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Icons.Globe className="w-4.5 h-4.5" />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-12 pr-5 py-4 bg-slate-900/50 border border-indigo-500/30 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-white outline-none"
                  placeholder="username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Icons.Lock className="w-4.5 h-4.5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-12 pr-12 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-white outline-none"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className="text-[13px] font-bold text-indigo-400 hover:text-indigo-300">Forgot password?</button>
              </div>
            </div>
            {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 bg-linear-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:scale-[1.01] transition-all flex items-center justify-center group disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Login'}{' '}
              <Icons.ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1" />
            </button>
          </form>
          <div className="mt-12 text-center text-slate-500 text-sm font-medium">If you need an account, contact your system admin.</div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
