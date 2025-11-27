'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';
import { initializeData } from '@/lib/initialData';

interface AuthContextType {
  user: User | null;
  login: (employeeNo: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const storage = new StorageService();

  useEffect(() => {
    // Initialize data on first load
    initializeData();
    
    // Check for existing session
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

const login = async (employeeNo: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  try {
    setIsLoading(true);
    const users = storage.getUsers();
    const foundUser = users.find(u => u.employeeNo === employeeNo && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      storage.setCurrentUser(foundUser);
      return { success: true, user: foundUser }; // Return user data
    } else {
      return { success: false, message: 'Invalid employee number or password' };
    }
  } catch (error) {
    return { success: false, message: 'Login failed. Please try again.' };
  } finally {
    setIsLoading(false);
  }
};

  const logout = () => {
    setUser(null);
    storage.setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}