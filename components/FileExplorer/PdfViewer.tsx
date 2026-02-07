
import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../../constants';

interface PdfViewerProps {
  file: File | Blob | string; // Can be a File object, Blob, or URL
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    renderIdRef.current += 1;
    const renderId = renderIdRef.current;
    let cancelled = false;

    const renderPdf = async () => {
      if (!file || !containerRef.current) return;
      
      setLoading(true);
      setError(null);
      containerRef.current.innerHTML = ''; // Clear previous content

      try {
        // @ts-ignore
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        let loadingTask;
        if (file instanceof File || file instanceof Blob) {
          const arrayBuffer = await file.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else if (typeof file === 'string') {
          // Signed/public URL: fetch to ArrayBuffer to avoid CORS/range issues
          try {
            const resp = await fetch(file);
            if (!resp.ok) {
              throw new Error(`Failed to fetch PDF: ${resp.status}`);
            }
            const arrayBuffer = await resp.arrayBuffer();
            loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          } catch (fetchErr) {
            console.warn('PDF fetch failed, falling back to direct URL:', fetchErr);
            // Fallback: allow pdf.js to handle URL (may still fail if CORS blocked)
            loadingTask = pdfjsLib.getDocument({ url: file });
          }
        } else {
          setError("Unsupported file format provided to PDF viewer.");
          setLoading(false);
          return;
        }

        const pdf = await loadingTask.promise;
        if (cancelled || renderId !== renderIdRef.current) return;

        setNumPages(pdf.numPages);

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled || renderId !== renderIdRef.current) return;
          const page = await pdf.getPage(i);
          if (cancelled || renderId !== renderIdRef.current) return;
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className = "max-w-full h-auto shadow-lg mb-8 rounded-lg bg-white mx-auto block";
          
          if (cancelled || renderId !== renderIdRef.current) return;
          containerRef.current?.appendChild(canvas);

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
        }
        if (!cancelled && renderId === renderIdRef.current) {
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF rendering failed:", err);
        if (!cancelled && renderId === renderIdRef.current) {
          setError("Failed to render PDF document. This might be due to a corrupted file or security restrictions. Try re-uploading the document.");
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="relative w-full h-full overflow-y-auto p-4 lg:p-12 bg-slate-100 dark:bg-slate-950/50">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full mb-4"></div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Rendering high-quality document preview...</p>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Icons.File className="w-16 h-16 text-rose-200 dark:text-rose-900/30 mb-4" />
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 mb-2">Display Blocked</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{error}</p>
        </div>
      )}

      <div ref={containerRef} className="max-w-4xl mx-auto" />
    </div>
  );
};

export default PdfViewer;
