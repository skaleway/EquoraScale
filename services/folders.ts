import { apiFetch } from './api';

export type BackendFolder = {
  id: number;
  name: string;
  isRoot?: boolean;
  parent?: { id: number } | null;
};

export const createFolder = async (name: string, parentId?: number) => {
  return await apiFetch<BackendFolder>('/folders', {
    method: 'POST',
    body: { name, parentId },
  });
};

export const listFolderChildren = async (parentId?: number) => {
  const query = typeof parentId === 'number' ? `?parentId=${parentId}` : '';
  return await apiFetch<BackendFolder[]>(`/folders/children${query}`, {
    method: 'GET',
  });
};

export const getFolder = async (id: number) => {
  return await apiFetch<BackendFolder>(`/folders/${id}`, { method: 'GET' });
};

export const renameFolder = async (id: number, name: string) => {
  return await apiFetch<BackendFolder>(`/folders/${id}`, {
    method: 'PATCH',
    body: { name },
  });
};

export const deleteFolder = async (id: number) => {
  return await apiFetch<void>(`/folders/${id}`, { method: 'DELETE' });
};

export const getFolderStats = async (id: number) => {
  return await apiFetch<{
    folderId: number;
    directFileCount: number;
    directSize: number;
    fileCount: number;
    totalSize: number;
  }>(`/folders/${id}/stats`, { method: 'GET' });
};
