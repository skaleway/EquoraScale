import { User } from '../types';
import { apiFetch, setAuthToken } from './api';

type LoginResponse = {
  message: string;
  access_token: string;
  user: User;
};

export type UserProfile = User;

const mapUser = (u: any): User => ({
  id: String(u.id ?? u.sub ?? ''),
  username: u.username,
  role: (u.role || 'user') as User['role'],
  email: u.email ?? null,
  is_active: typeof u.is_active === 'boolean' ? u.is_active : undefined,
  metadata: u.metadata ?? null,
  created_at: u.created_at,
  updated_at: u.updated_at,
});

export const loginUser = async (usernameOrEmail: string, password: string) => {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usernameOrEmail, password }),
  });

  if (data?.access_token) {
    setAuthToken(data.access_token);
  }

  return mapUser(data.user);
};

export const getProfile = async () => {
  const data = await apiFetch<any>('/users/profile', {
    method: 'GET',
  });
  return mapUser(data);
};

export const getProfileDetails = async (): Promise<UserProfile> => {
  const data = await apiFetch<any>('/users/profile', {
    method: 'GET',
  });
  return mapUser(data);
};

export const logoutUser = () => {
  setAuthToken(null);
};
