
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { DocumentType, User } from '../../types';
import { Icons } from '../../constants';
import { useToast } from '../UI/Toast';

interface SidebarProps {
  onLogout: () => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const menuItems = [
    { id: 'ALL', path: '/app/repository/ALL', label: 'Dashboard', icon: Icons.LayoutGrid },
    { id: DocumentType.RFQ, path: `/app/repository/${DocumentType.RFQ}`, label: 'RFQ (Requests)', icon: Icons.FileText },
    { id: DocumentType.PO, path: `/app/repository/${DocumentType.PO}`, label: 'PO (Orders)', icon: Icons.File },
    { id: DocumentType.QUOTATION, path: `/app/repository/${DocumentType.QUOTATION}`, label: 'Quotations', icon: Icons.Sparkles },
    { id: DocumentType.INVOICE, path: `/app/repository/${DocumentType.INVOICE}`, label: 'Invoices', icon: Icons.List },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 transition-colors duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">
          <Icons.Sparkles className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100">Eqorascale</span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Main Menu</p>
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isActive 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}

        <div className="pt-8">
          <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Modules</p>
          <NavLink to="/app/collections" className={({ isActive }) => `w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Icons.Folder className="w-5 h-5 mr-3" /> Collections
          </NavLink>
          <NavLink to="/app/analytics" className={({ isActive }) => `w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Icons.Globe className="w-5 h-5 mr-3" /> Analytics
          </NavLink>
          <NavLink to="/app/settings" className={({ isActive }) => `w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Icons.Settings className="w-5 h-5 mr-3" /> Settings
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0 uppercase">
            {user?.username.charAt(0) || 'U'}
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.username || 'Guest'}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate uppercase">{user?.role || 'User'}</p>
          </div>
          <button 
            onClick={() => { onLogout(); toast.info('You have been logged out.'); navigate('/login'); }}
            className="ml-auto p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
          >
            <Icons.Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
