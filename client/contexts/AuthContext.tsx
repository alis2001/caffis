"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Types
interface User {
  onboardingCompleted?: boolean;
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  profilePic?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
class TokenManager {
  private static readonly TOKEN_KEY = 'caffis_auth_token';
  private static readonly TOKEN_EXPIRY_KEY = 'caffis_token_expiry';

  static setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      // Also set the old key for backward compatibility
      localStorage.setItem('token', token);
      
      // Decode JWT to get expiry (basic implementation)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  static getToken(): string | null {
    try {
      let token = localStorage.getItem(this.TOKEN_KEY);
      
      // Fallback to old token key for backward compatibility
      if (!token) {
        token = localStorage.getItem('token');
        if (token) {
          // Migrate to new key
          this.setToken(token);
          localStorage.removeItem('token');
        }
      }
      
      const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      if (!token || !expiry) return null;
      
      // Check if token is expired
      if (Date.now() > parseInt(expiry)) {
        this.clearToken();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  static clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('token'); // Also clear old key
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  static isTokenExpired(): boolean {
    try {
      const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiry) return true;
      return Date.now() > parseInt(expiry);
    } catch (error) {
      return true;
    }
  }
}

// API service
class AuthAPI {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  static async fetchUser(token: string): Promise<User> {
    const response = await fetch(`${this.BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    return data.user; // The API returns { success: true, user: {...} }
  }

  static async verifyToken(token: string): Promise<boolean> {
    try {
      await this.fetchUser(token);
      return true;
    } catch {
      return false;
    }
  }
}

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize authentication state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = TokenManager.getToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token is still valid with server
      const isValid = await AuthAPI.verifyToken(token);
      
      if (isValid) {
        const userData = await AuthAPI.fetchUser(token);
        setUser(userData);
      } else {
        // Token invalid, clear it
        TokenManager.clearToken();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      TokenManager.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    try {
      setIsLoading(true);
      
      // Save token
      TokenManager.setToken(token);
      
      // Fetch user data
      const userData = await AuthAPI.fetchUser(token);
      setUser(userData);
      
    } catch (error) {
      console.error('Login error:', error);
      TokenManager.clearToken();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Clear token
      TokenManager.clearToken();
      
      // Clear user state
      setUser(null);
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const token = TokenManager.getToken();
      if (!token) {
        logout();
        return;
      }

      const userData = await AuthAPI.fetchUser(token);
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      logout();
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(current => current ? { ...current, ...userData } : null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShouldRedirect(true);
    }
  }, [isAuthenticated, isLoading]);

  return { shouldRedirect, isLoading };
}

// Hook for guest-only routes (login/register pages)
export function useGuestOnly() {
  const { isAuthenticated, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setShouldRedirect(true);
    }
  }, [isAuthenticated, isLoading]);

  return { shouldRedirect, isLoading };
}