import React from 'react';
import { FileRecord } from '../../types'; // Removed unused imports for cleaner code
import { Icons, STATUS_COLORS, DOC_TYPE_COLORS } from '../../constants';

interface TableViewProps {
  files: FileRecord[];
  onAnalyze: (file: FileRecord) => void;
  onDelete: (fileId: string) => void;
  onDownload: (fileId: string) => void;
  setSelectedFile: (file: FileRecord) => void;
  isLoading?: boolean; // New prop
  onUploadTrigger: () => void;
  folders: { id: number; name: string; isRoot?: boolean }[];
  folderStack: { id: number; name: string }[];
  onOpenFolder: (folder: { id: number; name: string }) => void;
  onBackFolder: () => void;
  onBreadcrumbClick: (index: number) => void;
  onDownloadFolder: (folderId: number, folderName: string) => void;
}

const TableView: React.FC<TableViewProps> = ({ 
  files, 
  onAnalyze, 
  onDelete, 
  onDownload,
  setSelectedFile, 
  isLoading = false,
  onUploadTrigger,
  folders,
  folderStack,
  onOpenFolder,
  onBackFolder,
  onBreadcrumbClick,
  onDownloadFolder
}) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- Skeleton Row Component ---
  const TableSkeletonRow = () => (
    <tr className="animate-pulse border-b border-slate-50 dark:border-slate-800/50">
      {/* Identifier Column Skeleton */}
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 mr-4 shrink-0"></div>
          <div className="space-y-2 w-full max-w-[200px]">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2"></div>
          </div>
        </div>
      </td>
      {/* AI Intelligence Column Skeleton */}
      <td className="px-6 py-4">
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      </td>
      {/* Workflow Column Skeleton */}
      <td className="px-6 py-4">
        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      </td>
      {/* Timestamp Column Skeleton */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800/60 rounded w-12"></div>
        </div>
      </td>
      {/* Actions Column Skeleton */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end space-x-2">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        {folderStack.length > 1 && (
          <button
            onClick={onBackFolder}
            disabled={isLoading}
            className="flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            <Icons.Plus className="w-3.5 h-3.5 rotate-45 mr-1.5" />
            Back
          </button>
        )}
        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] overflow-x-auto no-scrollbar">
          {folderStack.map((part, i) => (
            <React.Fragment key={part.id}>
              <button
                onClick={() => !isLoading && onBreadcrumbClick(i)}
                disabled={isLoading}
                className={`transition-colors whitespace-nowrap ${
                  i === folderStack.length - 1
                    ? 'text-slate-800 dark:text-slate-100'
                    : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600'
                }`}
              >
                {part.name}
              </button>
              {i < folderStack.length - 1 && <Icons.ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Document Identifier</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">AI Intelligence</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Workflow</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              // --- Loading State ---
              Array.from({ length: 5 }).map((_, idx) => (
                <TableSkeletonRow key={idx} />
              ))
            ) : files.length === 0 && folders.length === 0 ? (
              // --- Empty State ---
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <Icons.File className="w-12 h-12 mb-4 text-slate-200 dark:text-slate-800" />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 dark:text-slate-500">Database Empty</p>
                    <button
                      onClick={onUploadTrigger}
                      className="mt-6 inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                    >
                      <Icons.Plus className="w-4 h-4 mr-2" />
                      Add Document
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              // --- Data State ---
              <>
                {folders.map((folder) => (
                  <tr
                    key={`folder-${folder.id}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 group cursor-pointer transition-colors"
                    onClick={() => onOpenFolder({ id: folder.id, name: folder.name })}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 mr-4 transition-all shadow-sm shrink-0">
                          <Icons.Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[240px] leading-tight">{folder.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest mt-0.5">Folder</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Folder
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700">
                        —
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">—</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadFolder(folder.id, folder.name);
                        }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
                {files.map((file) => (
                <tr 
                  key={file.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 group cursor-pointer transition-colors"
                  onClick={() => setSelectedFile(file)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`p-2.5 rounded-xl mr-4 transition-all shadow-sm group-hover:rotate-3 shrink-0 ${DOC_TYPE_COLORS[file.docType]}`}>
                        <Icons.FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[240px] leading-tight">{file.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest mt-0.5">{file.path}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {file.isClassifying ? (
                      <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full w-fit animate-pulse">
                        <div className="w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Processing</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${DOC_TYPE_COLORS[file.docType]}`}>
                          {file.docType}
                        </span>
                        {file.summary && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="AI Indexed"></div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${STATUS_COLORS[file.status]}`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold tracking-tight">{new Date(file.createdAt).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">{formatSize(file.size)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onAnalyze(file); }}
                        disabled={file.isClassifying}
                        className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all rounded-lg shadow-sm disabled:opacity-50"
                        title="Re-Analyze"
                      >
                        <Icons.Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDownload(file.id); }}
                        className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all rounded-lg shadow-sm"
                        title="Download"
                      >
                        <Icons.Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                        className="p-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 transition-all rounded-lg shadow-sm"
                        title="Delete Document"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
