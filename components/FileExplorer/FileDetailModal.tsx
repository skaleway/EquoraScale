
import React, { useState, useEffect, useRef } from 'react';
import { FileRecord, FileStatus, DocumentType } from '../../types';
import { Icons, STATUS_COLORS, DOC_TYPE_COLORS } from '../../constants';
import PdfViewer from './PdfViewer';
import { getSignedFileUrl } from '../../services/files';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FileDetailModalProps {
  file: FileRecord;
  rawFile?: File; 
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (file: FileRecord) => Promise<void>;
  onAskStream: (question: string, onDelta: (chunk: string) => void) => Promise<void>;
  onDownload: (fileId: string, fileName: string) => void;
  isProcessing: boolean;
}

const FileDetailModal: React.FC<FileDetailModalProps> = ({
  file,
  rawFile,
  isOpen,
  onClose,
  onAnalyze,
  onAskStream,
  onDownload,
  isProcessing
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [viewerUrl, setViewerUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (!isOpen) return;
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf || rawFile) {
      setViewerUrl(undefined);
      return;
    }

    const currentUrl = file.blobUrl;
    setViewerUrl(currentUrl);

    if (!currentUrl) {
      (async () => {
        try {
          const data = await getSignedFileUrl(file.id);
          setViewerUrl(data.signedUrl);
        } catch (err) {
          console.warn('Failed to fetch signed URL', err);
        }
      })();
    }
  }, [file, isOpen, rawFile]);

  if (!isOpen) return null;

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    setIsChatLoading(true);

    try {
      setChatHistory(prev => [...prev, { role: 'ai', text: '' }]);
      await onAskStream(userMsg, (chunk) => {
        setChatHistory(prev => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === 'ai') {
            next[lastIdx] = { ...next[lastIdx], text: next[lastIdx].text + chunk };
          }
          return next;
        });
      });
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "I encountered a technical interruption. Please verify your connection and try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderFormattedText = (text: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-black text-slate-900 dark:text-white">{children}</strong>
        ),
        ul: ({ children }) => <ul className="ml-5 mb-2 list-disc pl-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="ml-5 mb-2 list-decimal pl-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-left border-collapse text-[13px]">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {children}
          </tbody>
        ),
        tr: ({ children }) => <tr className="align-top">{children}</tr>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800">
            {children}
          </td>
        ),
        code: ({ children }) => (
          <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[12px]">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-slate-200 dark:border-slate-700 pl-4 italic text-slate-600 dark:text-slate-300">
            {children}
          </blockquote>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );

  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const docClassification = file.isClassifying ? 'Classifying...' : file.docType;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 lg:p-8">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-slate-900 w-full h-full max-w-400 flex flex-col rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <header className="h-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center space-x-4 overflow-hidden">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
              <Icons.FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate tracking-tight">{file.name}</h2>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${file.isClassifying ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40' : DOC_TYPE_COLORS[file.docType]}`}>
                  {docClassification}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">•</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onAnalyze(file)}
              disabled={isProcessing || file.isClassifying}
              className="flex items-center px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-2xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 transition-all disabled:opacity-50"
            >
              <Icons.Sparkles className={`w-4 h-4 mr-2 ${(isProcessing || file.isClassifying) ? 'animate-pulse' : ''}`} />
              {(isProcessing || file.isClassifying) ? 'Syncing...' : 'Deep Analysis'}
            </button>
            <button 
              onClick={() => onDownload(file.id, file.name)}
              className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Download"
            >
              <Icons.Download className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-500 transition-all"
            >
              <Icons.Plus className="w-6 h-6 rotate-45" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0">
          
          {/* Left: Document Viewer */}
          <div className="flex-3 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col min-w-0">
            <div className="flex-1 relative overflow-hidden">
              {isPdf && rawFile ? (
                <PdfViewer file={rawFile} />
              ) : isPdf && viewerUrl ? (
                <PdfViewer file={viewerUrl} />
              ) : file.content ? (
                <div className="h-full overflow-y-auto p-12 bg-white dark:bg-slate-900">
                  <div className="max-w-4xl mx-auto bg-slate-50 dark:bg-slate-800/50 p-10 rounded-4xl border border-slate-100 dark:border-slate-700 font-mono text-sm leading-relaxed whitespace-pre-wrap dark:text-slate-300">
                    <div className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Content Extract</span>
                      <Icons.FileText className="w-4 h-4 text-slate-300" />
                    </div>
                    {file.blobUrl}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                  <Icons.File className="w-20 h-20 text-slate-200 dark:text-slate-800 mb-6" />
                  <p className="text-lg font-bold text-slate-600 dark:text-slate-400 transition-colors">Preview Unavailable</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: AI Intelligence Panel */}
          <div className="flex-2 flex flex-col min-w-0 bg-white dark:bg-slate-900">
            
            {/* AI Chat History */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              <div className="space-y-4 mb-4">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">System Intelligence</h3>
                
                {file.isClassifying ? (
                  <div className="p-10 rounded-[3xl] bg-slate-500 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center space-x-4 animate-pulse">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Processing Content</p>
                      <p className="text-xs text-slate-400">Extracting supply chain entities...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {file.summary && (
                      <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                      <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">AI Summary</p>
                        <p className="text-[15px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic">"{file.summary}"</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {file.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {chatHistory.length === 0 && !file.isClassifying && (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-6">
                    <Icons.Sparkles className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black mb-2 dark:text-white">Supply Chain Analyst</h4>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-70">
                    I can help extract items, verify quantities, or summarize terms from this document.
                  </p>
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-6 py-4 rounded-[28px] text-[15px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none font-medium' 
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                  }`}>
                    {msg.role === 'user' ? msg.text : renderFormattedText(msg.text)}
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 rounded-tl-none animate-pulse">
                    <div className="flex space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
              <form onSubmit={handleChatSubmit} className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <input 
                  type="text" 
                  disabled={file.isClassifying}
                  placeholder={file.isClassifying ? "AI is indexing..." : "Query document details..."} 
                  className="flex-1 bg-transparent border-none px-4 py-3 text-sm outline-none text-slate-900 dark:text-slate-100 font-medium"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!chatMessage.trim() || isChatLoading || file.isClassifying}
                  className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 shadow-md"
                >
                  <Icons.ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetailModal;
