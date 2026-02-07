import React from 'react';
import { User } from '../types';

export type AuthContextValue = {
  user: User | null;
  login: (usernameOrEmail: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
};

export const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  login: async () => {
    throw new Error('AuthContext.login not initialized');
  },
  logout: () => {},
  loading: false,
});
