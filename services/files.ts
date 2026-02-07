import { apiFetch } from './api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export type BackendFile = {
  id: number;
  originalName?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  path?: string;
  ocrText?: string;
  docType?: string;
  tags?: string[];
  summary?: string | null;
  userId?: number;
  folder?: {
    id: number;
    name: string;
    isRoot?: boolean;
    parent?: { id: number } | null;
  };
  createdAt?: string;
  updatedAt?: string;
  signedUrl?: string | null;
};

export type UploadResponse = {
  message: string;
  file: BackendFile;
  textExtracted?: boolean;
  extractedTextLength?: number;
};

export const listFiles = async (folderId?: number) => {
  const query = typeof folderId === 'number' ? `?folderId=${folderId}` : '';
  return await apiFetch<{
    files: BackendFile[];
    folders: { id: number; name: string; isRoot?: boolean; parent?: { id: number } | null }[];
    folder?: { id: number; name: string; isRoot?: boolean; parent?: { id: number } | null };
    root?: { id: number; name: string; isRoot?: boolean; parent?: { id: number } | null };
  }>(`/files/list${query}`, {
    method: 'GET',
  });
};

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL;
const getAuthToken = () => localStorage.getItem('eqorascale_token');

export const uploadSingleFile = async (
  file: File,
  relativePath?: string,
  ocrText?: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<UploadResponse> => {
  const form = new FormData();
  form.append('file', file);
  if (relativePath) {
    form.append('relativePath', relativePath);
  }
  if (ocrText) {
    form.append('ocrText', ocrText);
  }

  if (!onProgress) {
    return await apiFetch<UploadResponse>('/files/upload', {
      method: 'POST',
      body: form,
    });
  }

  const url = `${API_BASE_URL}/files/upload`;
  const token = getAuthToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.withCredentials = true;
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        onProgress(evt.loaded, evt.total);
      }
    };
    xhr.onerror = () => reject({ message: 'Network error', status: 0 });
    xhr.onload = () => {
      try {
        const data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data as UploadResponse);
        } else {
          reject({
            message: (data && (data.message || data.error)) || 'Request failed',
            status: xhr.status,
            data,
          });
        }
      } catch (err) {
        reject({ message: 'Invalid server response', status: xhr.status });
      }
    };
    xhr.send(form);
  });
};

export const deleteFile = async (fileId: number | string) => {
  return await apiFetch<void>(`/files/${fileId}`, {
    method: 'DELETE',
  });
};

export const resetFiles = async () => {
  return await apiFetch<void>('/files/reset', {
    method: 'DELETE',
  });
};

export const getUserStorage = async () => {
  return await apiFetch<{ userId: number; totalFiles: number; totalSize: number }>(
    '/users/storage',
    { method: 'GET' },
  );
};

export const getGlobalStorage = async () => {
  return await apiFetch<{
    totalUsers: number;
    totalFiles: number;
    totalSize: number;
    byUser: { userId: number; totalFiles: number; totalSize: number }[];
  }>('/admin/storage', { method: 'GET' });
};

export const updateFileMetadata = async (
  fileId: number | string,
  metadata: {
    docType?: string;
    tags?: string[];
    summary?: string;
  },
) => {
  return await apiFetch<void>(`/files/${fileId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify(metadata),
  });
};

export const getSignedFileUrl = async (
  fileId: number | string,
  expiresInSeconds = 3600,
) => {
  return await apiFetch<{ signedUrl: string; expiresIn: number }>(
    `/files/${fileId}/url?expiresIn=${expiresInSeconds}`,
    { method: 'GET' },
  );
};

const sanitizeFileName = (name: string) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

export const downloadFileById = async (fileId: number | string, fileName?: string) => {
  const { signedUrl } = await getSignedFileUrl(fileId);
  const finalName = sanitizeFileName(fileName || `file-${fileId}`);
  const link = document.createElement('a');
  link.href = signedUrl;
  link.download = finalName;
  link.rel = 'noopener';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadFolderAsZip = async (folderId: number, folderName: string) => {
  const zip = new JSZip();

  const traverse = async (currentId: number, prefix: string) => {
    const data = await listFiles(currentId);
    const files = data.files || [];
    const folders = data.folders || [];

    for (const file of files) {
      const { signedUrl } = await getSignedFileUrl(file.id);
      const resp = await fetch(signedUrl);
      if (!resp.ok) continue;
      const blob = await resp.blob();
      const name = sanitizeFileName(file.originalName || file.fileName || `file-${file.id}`);
      zip.file(`${prefix}${name}`, blob);
    }

    for (const folder of folders) {
      await traverse(folder.id, `${prefix}${sanitizeFileName(folder.name)}/`);
    }
  };

  await traverse(folderId, `${sanitizeFileName(folderName)}/`);
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${sanitizeFileName(folderName)}.zip`);
};
