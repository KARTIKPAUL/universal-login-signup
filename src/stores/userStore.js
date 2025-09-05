import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

/**
 * User store using Zustand
 * Handles user profile and preferences
 */
const useUserStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        profile: null,
        preferences: {
          notifications: true,
          newsletter: false,
          darkMode: false,
        },
        activity: [],
        isLoading: false,
        error: null,
        message: null,

        // Actions
        setLoading: (loading) => set({ isLoading: loading }),
        
        setError: (error) => set({ error }),
        
        clearError: () => set({ error: null }),
        
        setMessage: (message) => set({ message }),
        
        clearMessage: () => set({ message: null }),

        fetchUserProfile: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch('/api/user/profile');
            
            if (!response.ok) {
              throw new Error('Failed to fetch profile');
            }
            
            const data = await response.json();
            set({ profile: data, isLoading: false, error: null });
            return { success: true, data };
          } catch (error) {
            const errorMessage = error.message || 'Failed to fetch profile';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        updateUserProfile: async (profileData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch('/api/user/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(profileData),
            });

            if (!response.ok) {
              throw new Error('Failed to update profile');
            }

            const data = await response.json();
            set((state) => ({
              profile: { ...state.profile, ...data },
              message: 'Profile updated successfully',
              isLoading: false,
              error: null
            }));
            
            return { success: true, data };
          } catch (error) {
            const errorMessage = error.message || 'Failed to update profile';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        changeUserPassword: async (passwordData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch('/api/user/change-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(passwordData),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Failed to change password');
            }

            const data = await response.json();
            set({
              message: data.message || 'Password changed successfully',
              isLoading: false,
              error: null
            });
            
            return { success: true, message: data.message };
          } catch (error) {
            const errorMessage = error.message || 'Failed to change password';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        deleteUserAccount: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch('/api/user/delete-account', {
              method: 'DELETE',
            });

            if (!response.ok) {
              throw new Error('Failed to delete account');
            }

            set({
              profile: null,
              preferences: {
                notifications: true,
                newsletter: false,
                darkMode: false,
              },
              activity: [],
              isLoading: false,
              error: null,
              message: null
            });
            
            return { success: true };
          } catch (error) {
            const errorMessage = error.message || 'Failed to delete account';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        updatePreferences: (newPreferences) => set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        })),

        addActivity: (activity) => set((state) => {
          const newActivity = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...activity
          };
          
          const updatedActivity = [newActivity, ...state.activity];
          
          // Keep only last 50 activities
          return {
            activity: updatedActivity.length > 50 
              ? updatedActivity.slice(0, 50) 
              : updatedActivity
          };
        }),

        clearActivity: () => set({ activity: [] }),

        reset: () => set({
          profile: null,
          preferences: {
            notifications: true,
            newsletter: false,
            darkMode: false,
          },
          activity: [],
          isLoading: false,
          error: null,
          message: null
        })
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({
          profile: state.profile,
          preferences: state.preferences,
          activity: state.activity
        })
      }
    )
  )
);

export default useUserStore;