
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  File,
  FileText,
  Folder,
  Globe,
  LayoutGrid,
  List,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  LockIcon
} from 'lucide-react';

export const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
};

export const DOC_TYPE_COLORS = {
  RFQ: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  PO: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  QUOTATION: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  INVOICE: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  GENERAL: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
};

// Icons
export const Icons = {
  Sun,
  Moon,
  Folder,
  File,
  FileText,
  Search,
  Plus,
  LayoutGrid,
  List,
  Upload,
  Download,
  Settings,
  Sparkles,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Globe,
  Trash: Trash2,
  Lock:LockIcon
};
