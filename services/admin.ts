import { apiFetch } from './api';

export type AdminUser = {
  id: number;
  username: string;
  email?: string | null;
  role: 'admin' | 'user';
  is_active?: boolean;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
};

export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  return await apiFetch<AdminUser[]>('/users/all', { method: 'GET' });
};

export const createUser = async (payload: {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  secretKey: string;
}) => {
  return await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
};

export const deleteUser = async (id: number) => {
  return await apiFetch(`/users/${id}`, { method: 'DELETE' });
};

export const updateUserAdmin = async (
  id: number,
  payload: {
    username?: string;
    email?: string | null;
    role?: 'admin' | 'user';
    is_active?: boolean;
    metadata?: Record<string, any> | null;
    password?: string;
  },
) => {
  return await apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};
