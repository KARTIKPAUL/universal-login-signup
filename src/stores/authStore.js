import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { signIn, signOut, getSession } from 'next-auth/react';

/**
 * Authentication store using Zustand
 * Handles user authentication state and actions
 */
const useAuthStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        message: null,
        needsPasswordSetup: false,

        // Actions
        setLoading: (loading) => set({ isLoading: loading }),
        
        setError: (error) => set({ error }),
        
        clearError: () => set({ error: null }),
        
        setMessage: (message) => set({ message }),
        
        clearMessage: () => set({ message: null }),

        setUser: (user) => set({ 
          user,
          isAuthenticated: !!user,
          needsPasswordSetup: user?.needsPasswordSetup || false
        }),

        setNeedsPasswordSetup: (needs) => set((state) => ({
          needsPasswordSetup: needs,
          user: state.user ? { ...state.user, needsPasswordSetup: needs } : null
        })),

        // Auth Actions
        loginWithCredentials: async (credentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await signIn('credentials', {
              email: credentials.email,
              password: credentials.password,
              redirect: false,
            });

            if (result?.error) {
              set({ error: result.error, isLoading: false });
              return { success: false, error: result.error };
            }

            const session = await getSession();
            if (session?.user) {
              set({
                user: session.user,
                isAuthenticated: true,
                needsPasswordSetup: session.user.needsPasswordSetup || false,
                isLoading: false,
                error: null
              });
              return { success: true, user: session.user };
            }

            set({ error: 'Failed to get session', isLoading: false });
            return { success: false, error: 'Failed to get session' };
          } catch (error) {
            const errorMessage = error.message || 'Login failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        loginWithGoogle: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await signIn('google', { redirect: false });
            
            if (result?.error) {
              set({ error: result.error, isLoading: false });
              return { success: false, error: result.error };
            }

            // Session will be updated via refreshSession
            return { success: true };
          } catch (error) {
            const errorMessage = error.message || 'Google login failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        registerUser: async (userData) => {
          set({ isLoading: true, error: null });
          
          try {
            // Check if user exists
            const checkResponse = await fetch('/api/auth/check-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userData.email }),
            });

            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              if (checkData.exists) {
                set({ error: 'User already exists with this email', isLoading: false });
                return { success: false, error: 'User already exists with this email' };
              }
            }

            // Register user
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
              set({ error: data.error || 'Registration failed', isLoading: false });
              return { success: false, error: data.error || 'Registration failed' };
            }

            // Auto sign in after registration
            const signInResult = await signIn('credentials', {
              email: userData.email,
              password: userData.password,
              redirect: false,
            });

            if (signInResult?.error) {
              set({ 
                error: 'Registration successful, but login failed',
                message: 'Please try logging in manually',
                isLoading: false 
              });
              return { success: false, error: 'Registration successful, but login failed' };
            }

            const session = await getSession();
            if (session?.user) {
              set({
                user: session.user,
                isAuthenticated: true,
                needsPasswordSetup: session.user.needsPasswordSetup || false,
                message: 'Registration successful',
                isLoading: false,
                error: null
              });
              return { success: true, user: session.user };
            }

            return { success: true };
          } catch (error) {
            const errorMessage = error.message || 'Registration failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        setUserPassword: async (passwordData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch('/api/auth/set-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(passwordData),
            });

            const data = await response.json();

            if (!response.ok) {
              set({ error: data.error || 'Failed to set password', isLoading: false });
              return { success: false, error: data.error || 'Failed to set password' };
            }

            set((state) => ({
              needsPasswordSetup: false,
              user: state.user ? { ...state.user, needsPasswordSetup: false } : null,
              message: 'Password set successfully',
              isLoading: false,
              error: null
            }));

            return { success: true, message: 'Password set successfully' };
          } catch (error) {
            const errorMessage = error.message || 'Failed to set password';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        logout: async () => {
          set({ isLoading: true });
          
          try {
            await signOut({ redirect: false });
            
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              message: null,
              needsPasswordSetup: false
            });

            return { success: true };
          } catch (error) {
            set({ isLoading: false });
            return { success: false, error: error.message || 'Logout failed' };
          }
        },

        refreshSession: async () => {
          try {
            const session = await getSession();
            
            if (session?.user) {
              set({
                user: session.user,
                isAuthenticated: true,
                needsPasswordSetup: session.user.needsPasswordSetup || false
              });
            } else {
              set({
                user: null,
                isAuthenticated: false,
                needsPasswordSetup: false
              });
            }
          } catch (error) {
            console.error('Failed to refresh session:', error);
          }
        },

        reset: () => set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          message: null,
          needsPasswordSetup: false
        })
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          needsPasswordSetup: state.needsPasswordSetup
        })
      }
    )
  )
);

export default useAuthStore;