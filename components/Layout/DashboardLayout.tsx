
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { User, FileRecord, DocumentType, ViewMode, FileStatus } from '../../types';
import { Icons } from '../../constants';
import { useToast } from '../UI/Toast';
import { analyzeDocument, askDocumentQuestionStream } from '../../services/ai';
import { listFiles, uploadSingleFile, deleteFile, updateFileMetadata, resetFiles, downloadFileById, downloadFolderAsZip } from '../../services/files';
import { createFolder, renameFolder, deleteFolder } from '../../services/folders';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FileDetailModal from '../FileExplorer/FileDetailModal';
import ConfirmationModal from '../UI/ConfirmationModal';
import { INITIAL_FILES } from '@/store/mockData';

interface DashboardLayoutProps {
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout, isDarkMode, toggleTheme }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileRecord[]>(() => {
    return [];
  });

  const [rawFilesMap, setRawFilesMap] = useState<Map<string, File>>(new Map());
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TABLE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState('Root');
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>(undefined);
  const [folderStack, setFolderStack] = useState<{ id: number; name: string }[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<{ id: string; name: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    loaded: number;
    total: number;
    startedAt: number;
  }>({ isUploading: false, loaded: 0, total: 0, startedAt: 0 });

  const METADATA_QUEUE_KEY = 'eqorascale_pending_metadata';
  const dedupeById = (items: FileRecord[]) => {
    const map = new Map<string, FileRecord>();
    items.forEach((item) => {
      map.set(item.id, item);
    });
    return Array.from(map.values());
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.role === 'admin';
  const location = useLocation();

  // Server is now the source of truth for files; no localStorage sync.

  const { data: serverFiles, isLoading: isFilesLoading } = useQuery({
    queryKey: ['files', currentFolderId],
    queryFn: () => listFiles(currentFolderId),
  });

  const normalizeDocType = (value?: string | null): DocumentType => {
    const v = (value || '').toUpperCase();
    if (v === DocumentType.RFQ) return DocumentType.RFQ;
    if (v === DocumentType.PO) return DocumentType.PO;
    if (v === DocumentType.INVOICE) return DocumentType.INVOICE;
    if (v === DocumentType.QUOTATION) return DocumentType.QUOTATION;
    return DocumentType.GENERAL;
  };

  useEffect(() => {
    if (!serverFiles?.files) return;
    if (serverFiles.root && folderStack.length === 0) {
      setFolderStack([{ id: serverFiles.root.id, name: serverFiles.root.name || 'Root' }]);
      setCurrentFolderId(serverFiles.root.id);
      setCurrentFolderPath(serverFiles.root.name || 'Root');
    }
    const mapped: FileRecord[] = serverFiles.files.map((f) => ({
      id: String(f.id),
      name: f.originalName || f.fileName || 'Document',
      type: f.mimeType || 'application/pdf',
      size: f.size || 0,
      path: currentFolderPath || 'Root',
      createdAt: f.createdAt || new Date().toISOString(),
      status: FileStatus.COMPLETED,
      docType: normalizeDocType(f.docType),
      tags: Array.isArray(f.tags) && f.tags.length > 0 ? f.tags : ['New'],
      summary: f.summary || undefined,
      content: f.ocrText || '',
      blobUrl: f.signedUrl || undefined,
      isClassifying: false,
    }));
    setFiles(dedupeById(mapped));
  }, [serverFiles, currentFolderPath, folderStack.length]);

  const currentFolders = serverFiles?.folders || [];

  const handleOpenFolder = (folder: { id: number; name: string }) => {
    setFolderStack((prev) => {
      const next = [...prev, { id: folder.id, name: folder.name }];
      setCurrentFolderId(folder.id);
      setCurrentFolderPath(next.map((b) => b.name).join('/'));
      return next;
    });
  };

  const handleBackFolder = () => {
    setFolderStack((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      const nextCurrent = next[next.length - 1];
      setCurrentFolderId(nextCurrent.id);
      setCurrentFolderPath(next.map((b) => b.name).join('/'));
      return next;
    });
  };

  const handleBreadcrumbClick = (index: number) => {
    setFolderStack((prev) => {
      const next = prev.slice(0, index + 1);
      const nextCurrent = next[next.length - 1];
      setCurrentFolderId(nextCurrent.id);
      setCurrentFolderPath(next.map((b) => b.name).join('/'));
      return next;
    });
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name');
    if (!name?.trim()) return;
    try {
      await createFolder(name.trim(), currentFolderId);
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Folder created.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create folder.');
    }
  };

  const handleRenameFolder = async (folderId: number, currentName: string) => {
    const name = prompt('Rename folder', currentName);
    if (!name?.trim() || name.trim() === currentName) return;
    try {
      await renameFolder(folderId, name.trim());
      if (folderStack[folderStack.length - 1]?.id === folderId) {
        const nextStack = folderStack.map((f) =>
          f.id === folderId ? { ...f, name: name.trim() } : f,
        );
        setFolderStack(nextStack);
        setCurrentFolderPath(nextStack.map((b) => b.name).join('/'));
      }
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Folder renamed.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to rename folder.');
    }
  };

  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    if (!confirm(`Delete folder "${folderName}"? This requires it to be empty.`)) return;
    try {
      await deleteFolder(folderId);
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('Folder deleted.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete folder.');
    }
  };

  const enqueueMetadataUpdate = (payload: {
    fileId: string;
    docType: DocumentType;
    tags: string[];
    summary?: string;
  }) => {
    try {
      const raw = localStorage.getItem(METADATA_QUEUE_KEY);
      const existing = raw ? (JSON.parse(raw) as any[]) : [];
      const next = existing.filter((item) => item.fileId !== payload.fileId);
      next.push(payload);
      localStorage.setItem(METADATA_QUEUE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('Failed to persist metadata queue', err);
    }
  };

  const flushMetadataQueue = async () => {
    try {
      const raw = localStorage.getItem(METADATA_QUEUE_KEY);
      const queued = raw ? (JSON.parse(raw) as any[]) : [];
      if (!queued.length) return;

      const remaining: any[] = [];
      for (const item of queued) {
        try {
          await updateFileMetadata(item.fileId, {
            docType: item.docType,
            tags: item.tags,
            summary: item.summary,
          });
        } catch (err) {
          remaining.push(item);
        }
      }
      localStorage.setItem(METADATA_QUEUE_KEY, JSON.stringify(remaining));
    } catch (err) {
      console.warn('Failed to flush metadata queue', err);
    }
  };

  useEffect(() => {
    if (serverFiles?.files?.length) {
      flushMetadataQueue();
    }
  }, [serverFiles]);

  const extractText = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    try {
      if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return fullText.trim() || "No readable text in PDF.";
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore
        const mammoth = window['mammoth'];
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value || "No readable text in Word document.";
      }
    } catch (e) {
      console.error("Extraction failed:", e);
    }
    return "Unsupported or error extracting content.";
  };

  const triggerAnalysis = async (fileId: string, name: string, content: string) => {
    try {
      const result = await analyzeDocument(name, content);
      const docType = normalizeDocType(result?.documentType as string);
      const tags = [...new Set([...(result?.suggestedTags || [])])];
      const summary = result?.summary;

      setFiles(prev => prev.map(f => f.id === fileId ? {
        ...f,
        docType,
        tags: [...new Set([...f.tags, ...tags])],
        summary,
        isClassifying: false
      } : f));

      try {
        await updateFileMetadata(fileId, {
          docType,
          tags,
          summary,
        });
      } catch (err) {
        enqueueMetadataUpdate({ fileId, docType, tags, summary });
      }
    } catch (err) {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isClassifying: false } : f));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = event.target.files;
    if (!rawFiles) return;
    const newRecords: FileRecord[] = [];
    const newRawMap = new Map(rawFilesMap);
    const filesArray = Array.from(rawFiles) as File[];
    if (!filesArray.length) return;

    const allowedFiles = filesArray.filter(
      (file) => file.type === 'application/pdf' || file.type.startsWith('image/'),
    );
    const skippedCount = filesArray.length - allowedFiles.length;
    if (skippedCount > 0) {
      toast.warning(`Skipped ${skippedCount} unsupported file(s). Only PDF and images are allowed.`);
    }
    if (!allowedFiles.length) {
      event.target.value = '';
      return;
    }

    const totalBytes = allowedFiles.reduce((sum, file) => sum + file.size, 0);
    const basePath = folderStack.slice(1).map((b) => b.name).join('/');
    let uploadedSoFar = 0;
    setUploadProgress({
      isUploading: true,
      loaded: 0,
      total: totalBytes,
      startedAt: Date.now(),
    });

    try {
      for (const file of allowedFiles) {
        const relativePathRaw = (file as any).webkitRelativePath as string | undefined;
        const clientOcrText = await extractText(file);
        const relativePath =
          relativePathRaw && basePath
            ? `${basePath}/${relativePathRaw}`
            : relativePathRaw || (basePath ? `${basePath}/${file.name}` : undefined);
        const upload = await uploadSingleFile(
          file,
          relativePath,
          clientOcrText,
          (loaded, total) => {
            const currentTotal = uploadedSoFar + loaded;
            setUploadProgress((prev) => ({
              ...prev,
              isUploading: true,
              loaded: currentTotal,
              total: totalBytes,
            }));
          },
        );

        uploadedSoFar += file.size;
        setUploadProgress((prev) => ({
          ...prev,
          isUploading: true,
          loaded: uploadedSoFar,
          total: totalBytes,
        }));

        const fileId = String(upload.file.id);
        const content = upload.file.ocrText || clientOcrText || '';
        const blobUrl = URL.createObjectURL(file);
        newRawMap.set(fileId, file);

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            localStorage.setItem(`eqorascale_blob_${fileId}`, e.target.result.split(',')[1]);
          }
        };
        reader.readAsDataURL(file);

        const normalizedPath =
          relativePath && relativePath.includes('/')
            ? `Root/${relativePath.split('/').slice(0, -1).join('/')}`
            : currentFolderPath;

        const record: FileRecord = {
          id: fileId,
          name: upload.file.originalName || file.name,
          type: upload.file.mimeType || file.type,
          size: upload.file.size || file.size,
          path: normalizedPath,
          createdAt: upload.file.createdAt || new Date().toISOString(),
          status: FileStatus.COMPLETED,
          docType: normalizeDocType(upload.file.docType),
          tags: ['New'],
          content,
          blobUrl: upload.file.signedUrl || blobUrl,
          isClassifying: true,
        };

        newRecords.push(record);
        setRawFilesMap(newRawMap);
        setFiles((prev) => dedupeById([...prev, record]));
        triggerAnalysis(record.id, record.name, content || '');
      }

      toast.success(`Uploaded ${allowedFiles.length} file(s) successfully.`);
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      await queryClient.invalidateQueries({ queryKey: ['user-storage'] });
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed.');
    } finally {
      setUploadProgress((prev) => ({ ...prev, isUploading: false }));
      event.target.value = '';
    }

    // Legacy local-only upload (kept for future use)
    // FIX: Cast Array.from(rawFiles) to File[] to resolve 'unknown' type issues and access File properties
    for (const file of Array.from(rawFiles) as File[]) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.doc') && !fileName.endsWith('.docx')) continue;

      const fileId = Math.random().toString(36).substr(2, 9);
      const content = await extractText(file);
      const blobUrl = URL.createObjectURL(file);
      newRawMap.set(fileId, file);

      // Store file blob as base64 for persistence across reloads
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          localStorage.setItem(`eqorascale_blob_${fileId}`, e.target.result.split(',')[1]);
        }
      };
      reader.readAsDataURL(file);

      const relativePath = (file as any).webkitRelativePath as string | undefined;
      const normalizedPath = relativePath
        ? `Root/${relativePath.split('/').slice(0, -1).join('/')}`
        : currentFolderPath;

      const record: FileRecord = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        path: normalizedPath,
        createdAt: new Date().toISOString(),
        status: FileStatus.COMPLETED,
        docType: DocumentType.GENERAL,
        tags: ['New'],
        content,
        blobUrl,
        isClassifying: true
      };
      newRecords.push(record);
    }

    if (newRecords.length > 0) {
      setRawFilesMap(newRawMap);
      setFiles(prev => [...prev, ...newRecords]);
      newRecords.forEach((record) => {
        triggerAnalysis(record.id, record.name, record.content || '');
      });
      toast.success(`Indexed ${newRecords.length} documents.`);
    }
    event.target.value = '';
  };

  const handleManualAnalyze = async (file: FileRecord) => {
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isClassifying: true } : f));
    await triggerAnalysis(file.id, file.name, file.content || '');
    toast.info(`Analyzing ${file.name}...`);
  };

  const handleDeleteFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    setDeleteTarget({ id: fileId, name: file?.name || 'this file' });
  };

  const handleDownloadFile = async (fileId: string, fileName?: string) => {
    const file = files.find((f) => f.id === fileId);
    try {
      await downloadFileById(fileId, fileName || file?.name);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download file.');
    }
  };

  const requestDownloadFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    setDownloadTarget({ id: fileId, name: file?.name || 'this file' });
  };

  const confirmDownloadFile = async () => {
    if (!downloadTarget) return;
    await handleDownloadFile(downloadTarget.id, downloadTarget.name);
    setDownloadTarget(null);
  };

  const handleDownloadFolder = async (folderId: number, folderName: string) => {
    try {
      toast.info(`Preparing ${folderName}.zip...`);
      await downloadFolderAsZip(folderId, folderName);
      toast.success('Folder download ready.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download folder.');
    }
  };

  const confirmDeleteFile = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFile(deleteTarget.id);
      setFiles(prev => prev.filter(f => f.id !== deleteTarget.id));
      await queryClient.invalidateQueries({ queryKey: ['user-storage'] });
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success("Document removed.");
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete document.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleReset = async () => {
    if (files.length === 0 && (currentFolders?.length ?? 0) === 0) {
      toast.info('Repository is already empty.');
      setIsResetModalOpen(false);
      return;
    }
    try {
      await resetFiles();
      // Clean up blob URLs and storage
      files.forEach(file => {
        localStorage.removeItem(`eqorascale_blob_${file.id}`);
      });
      setFiles([]);
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      await queryClient.invalidateQueries({ queryKey: ['user-storage'] });
      toast.warning("Repository wiped.");
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset repository.');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Sidebar user={user} onLogout={onLogout} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center space-x-4 flex-1 max-w-2xl">
            {!isAdmin && (
              <div className="relative w-full">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search repository..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs transition-all dark:text-slate-100 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            {isAdmin && (
              <h1 className="text-lg font-bold tracking-tight">
                Admin {user?.username}
              </h1>
            )}
          </div>
          
          <div className="flex items-center space-x-4 ml-4">
            <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
              {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
            </button>
            {!isAdmin && (
              <>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  <button onClick={() => setViewMode(ViewMode.TABLE)} className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.TABLE ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}><Icons.List className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setViewMode(ViewMode.EXPLORER)} className={`p-1.5 rounded-md transition-all ${viewMode === ViewMode.EXPLORER ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}><Icons.LayoutGrid className="w-3.5 h-3.5" /></button>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-l-xl hover:bg-indigo-700 cursor-pointer shadow-sm">
                    <Icons.File className="w-3 h-3 mr-2" />
                    Files
                    <input ref={fileInputRef} type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <label className="flex items-center px-4 py-2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-r-xl hover:bg-indigo-600 cursor-pointer border-l border-indigo-400 shadow-sm">
                    <Icons.Folder className="w-3 h-3 mr-2" />
                    Folder
                    {/* @ts-ignore */}
                    <input type="file" webkitdirectory="" directory="" multiple accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet context={{ 
            files,
            setFiles,
            viewMode,
            searchQuery,
            setSelectedFile,
            currentFolderPath,
            setCurrentFolderPath,
            currentFolderId,
            folders: currentFolders,
            folderStack,
            onOpenFolder: handleOpenFolder,
            onBackFolder: handleBackFolder,
            onBreadcrumbClick: handleBreadcrumbClick,
            onCreateFolder: handleCreateFolder,
            onRenameFolder: handleRenameFolder,
            onDeleteFolder: handleDeleteFolder,
            onDeleteFile: handleDeleteFile,
            onDownloadFile: requestDownloadFile,
            onDownloadFolder: handleDownloadFolder,
            onAnalyzeFile: handleManualAnalyze,
            onUploadTrigger: () => fileInputRef.current?.click(),
            onReset: () => setIsResetModalOpen(true),
            hasFiles: files.length > 0 || (currentFolders?.length ?? 0) > 0,
            isFilesLoading
          }} />
        </div>
      </main>

      {selectedFile && (
        <FileDetailModal 
          file={selectedFile}
          rawFile={rawFilesMap.get(selectedFile.id)}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
          onAnalyze={handleManualAnalyze}
          onAskStream={(q, onDelta) => askDocumentQuestionStream(selectedFile.name, selectedFile.content || '', q, onDelta)}
          onDownload={(id, name) => handleDownloadFile(id, name)}
          isProcessing={selectedFile.isClassifying || false}
        />
      )}

      <ConfirmationModal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleReset}
        title="Wipe Local Repository?"
        message="Type RESET to permanently delete all documents in your repository."
        confirmText="Wipe Everything"
        variant="danger"
        requireText="RESET"
        inputLabel="Confirm reset"
        inputPlaceholder="Type RESET"
      />

      <ConfirmationModal 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteFile}
        title="Delete Document?"
        message={`Type DELETE to permanently remove ${deleteTarget?.name || 'this document'}.`}
        confirmText="Delete"
        variant="danger"
        requireText="DELETE"
        inputLabel="Confirm deletion"
        inputPlaceholder="Type DELETE"
      />

      <ConfirmationModal 
        isOpen={!!downloadTarget}
        onClose={() => setDownloadTarget(null)}
        onConfirm={confirmDownloadFile}
        title="Download Document?"
        message={`Download ${downloadTarget?.name || 'this document'} now?`}
        confirmText="Download"
        variant="info"
      />

      {uploadProgress.isUploading && (
        <div className="fixed bottom-6 right-6 z-200 pointer-events-none">
          <div className="pointer-events-auto flex items-center min-w-80 max-w-lg p-5 rounded-2xl border shadow-2xl animate-in slide-in-from-right-full duration-300 backdrop-blur-md bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800">
            <div className="mr-4 shrink-0">
              <Icons.FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Uploading file…</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {(uploadProgress.loaded / 1024 / 1024).toFixed(2)} MB / {(uploadProgress.total / 1024 / 1024).toFixed(2)} MB
                <span className="ml-2 text-slate-400">
                  {uploadProgress.startedAt
                    ? `${(
                        (uploadProgress.loaded /
                          Math.max(1, Date.now() - uploadProgress.startedAt)) *
                        1000 /
                        1024 /
                        1024
                      ).toFixed(2)} MB/s`
                    : '0 MB/s'}
                </span>
              </p>
              <div className="mt-3 h-2 w-full bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{
                    width: `${uploadProgress.total > 0 ? (uploadProgress.loaded / uploadProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="ml-4 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
              {uploadProgress.total > 0
                ? Math.round((uploadProgress.loaded / uploadProgress.total) * 100)
                : 0}
              %
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
