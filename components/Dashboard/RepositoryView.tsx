import React, { useMemo, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { 
  Filter, 
  X, 
  Calendar, 
  Tag, 
  Database, 
  Search, 
  RotateCcw,
  Trash2
} from 'lucide-react';
import { DocumentType, FileRecord, ViewMode } from '../../types';
import TableView from '../FileExplorer/TableView';
import FileExplorer from '../FileExplorer/FileExplorer';

const RepositoryView: React.FC = () => {
  const { tab } = useParams<{ tab: string }>();
  const activeTab = tab || 'ALL';
  
  const { 
    files: rawFiles, 
    viewMode, 
    searchQuery, 
    setSelectedFile, 
    currentFolderPath, 
    setCurrentFolderPath,
    onDeleteFile,
    onDownloadFile,
    onDownloadFolder,
    onAnalyzeFile,
    onUploadTrigger,
    onReset,
    hasFiles,
    isFilesLoading,
    folders,
    folderStack,
    onOpenFolder,
    onBackFolder,
    onBreadcrumbClick,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder
  } = useOutletContext<any>();

  const files = (rawFiles as FileRecord[]) || [];

  // --- Local Filter State ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sizeMin, setSizeMin] = useState(''); // in MB
  const [sizeMax, setSizeMax] = useState(''); // in MB

  // --- Helpers ---
  const clearAllFilters = () => {
    setTagFilter('');
    setDateFrom('');
    setDateTo('');
    setSizeMin('');
    setSizeMax('');
  };

  const hasActiveFilters = tagFilter || dateFrom || dateTo || sizeMin || sizeMax;

  // --- Filtering Logic ---
  const filteredFiles = useMemo(() => {
    // 1. Deduplicate files based on ID
    const deduped = Array.from(
      new Map(files.map((f: FileRecord) => [f.id, f])).values(),
    );

    // 2. Prepare filter values
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    if (fromDate) fromDate.setHours(0, 0, 0, 0); // Start of day

    const toDate = dateTo ? new Date(dateTo) : null;
    if (toDate) toDate.setHours(23, 59, 59, 999); // End of day

    const minBytes = sizeMin ? Number(sizeMin) * 1024 * 1024 : null;
    const maxBytes = sizeMax ? Number(sizeMax) * 1024 * 1024 : null;
    const tagQuery = tagFilter.trim().toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    // 3. Apply Filters
    return deduped.filter((f: FileRecord) => {
      // Tab Context (DocType)
      if (activeTab !== 'ALL' && f.docType !== activeTab) return false;

      // Global Search (Name or Tags)
      if (searchQuery) {
        const matchesName = f.name.toLowerCase().includes(searchLower);
        const matchesTags = f.tags.some(t => t.toLowerCase().includes(searchLower));
        if (!matchesName && !matchesTags) return false;
      }

      // Advanced Filters
      if (fromDate && new Date(f.createdAt) < fromDate) return false;
      if (toDate && new Date(f.createdAt) > toDate) return false;
      if (minBytes !== null && f.size < minBytes) return false;
      if (maxBytes !== null && f.size > maxBytes) return false;
      if (tagQuery && !f.tags.some(t => t.toLowerCase().includes(tagQuery))) return false;

      return true;
    });
  }, [files, activeTab, searchQuery, tagFilter, dateFrom, dateTo, sizeMin, sizeMax]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {activeTab === 'ALL' ? 'Repository Overview' : `${activeTab} Management`}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
              {filteredFiles.length} Files Found
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
            Manage and index enterprise documents
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              isFilterOpen || hasActiveFilters
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            )}
          </button>

          <button 
            onClick={onReset}
            disabled={!hasFiles}
            title="Reset Database"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* --- Filter Panel --- */}
      {isFilterOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Tag Filter */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Tag className="w-3 h-3" /> Tag Name
              </label>
              <input
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="e.g. invoice"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Calendar className="w-3 h-3" /> From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-600 dark:text-slate-300"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Calendar className="w-3 h-3" /> To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-600 dark:text-slate-300"
              />
            </div>

            {/* Min Size */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Database className="w-3 h-3" /> Min Size (MB)
              </label>
              <input
                type="number"
                min="0"
                value={sizeMin}
                onChange={(e) => setSizeMin(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Max Size */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Database className="w-3 h-3" /> Max Size (MB)
              </label>
              <input
                type="number"
                min="0"
                value={sizeMax}
                onChange={(e) => setSizeMax(e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          
          {/* Filter Footer */}
          <div className="flex justify-end mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={clearAllFilters}
              className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* --- Active Filter Chips --- */}
      {hasActiveFilters && !isFilterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          {tagFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Tag: {tagFilter}
              <button onClick={() => setTagFilter('')} className="ml-1 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(dateFrom || dateTo) && (
             <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Date: {dateFrom || 'Start'} - {dateTo || 'End'}
              <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="ml-1 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(sizeMin || sizeMax) && (
             <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Size: {sizeMin || '0'}MB - {sizeMax || '∞'}MB
              <button onClick={() => { setSizeMin(''); setSizeMax(''); }} className="ml-1 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearAllFilters} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 ml-2">Clear All</button>
        </div>
      )}

      {/* --- Content View --- */}
      <div className="transition-all duration-300 min-h-125">
        {viewMode === ViewMode.TABLE ? (
          <TableView 
            files={filteredFiles} 
            onAnalyze={onAnalyzeFile} 
            onDelete={onDeleteFile}
            onDownload={onDownloadFile}
            setSelectedFile={setSelectedFile}
            onUploadTrigger={onUploadTrigger}
            isLoading={isFilesLoading}
            // Passing props even if not strictly used by TableView depending on implementation,
            // but keeping interface consistent with FileExplorer for easy switching
            folders={folders} 
            folderStack={folderStack}
            onOpenFolder={onOpenFolder}
            onBackFolder={onBackFolder}
            onBreadcrumbClick={onBreadcrumbClick}
            onDownloadFolder={onDownloadFolder}
          />
        ) : (
          <FileExplorer 
            files={filteredFiles} 
            currentPath={currentFolderPath}
            setCurrentPath={setCurrentFolderPath}
            setSelectedFile={setSelectedFile}
            onDeleteFile={onDeleteFile}
            onDownloadFile={onDownloadFile}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onUploadTrigger={onUploadTrigger}
            onCreateFolder={onCreateFolder}
            onOpenFolder={onOpenFolder}
            onBackFolder={onBackFolder}
            onBreadcrumbClick={onBreadcrumbClick}
            folderStack={folderStack}
            folders={folders}
            isLoading={isFilesLoading}
            activeDocType={activeTab} // Renamed for clarity inside component if needed
            onDownloadFolder={onDownloadFolder}
          />
        )}
      </div>
    </div>
  );
};

export default RepositoryView;