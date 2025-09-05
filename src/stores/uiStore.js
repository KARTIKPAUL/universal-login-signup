import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * UI store using Zustand
 * Handles UI state like toasts, modals, theme, etc.
 */
const useUIStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    sidebarOpen: false,
    theme: 'light',
    notifications: [],
    modals: {
      profileEdit: false,
      confirmDelete: false,
      settings: false,
    },
    toasts: [],
    globalLoading: false,

    // Actions
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    
    setTheme: (theme) => set({ theme }),
    
    toggleTheme: () => set((state) => ({ 
      theme: state.theme === 'light' ? 'dark' : 'light' 
    })),

    addNotification: (notification) => set((state) => ({
      notifications: [...state.notifications, {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...notification
      }]
    })),

    removeNotification: (id) => set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),

    clearNotifications: () => set({ notifications: [] }),

    openModal: (modalName) => set((state) => ({
      modals: { ...state.modals, [modalName]: true }
    })),

    closeModal: (modalName) => set((state) => ({
      modals: { ...state.modals, [modalName]: false }
    })),

    closeAllModals: () => set((state) => ({
      modals: Object.keys(state.modals).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {})
    })),

    addToast: (toast) => set((state) => ({
      toasts: [...state.toasts, {
        id: Date.now(),
        type: 'info',
        duration: 5000,
        ...toast
      }]
    })),

    removeToast: (id) => set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    })),

    setGlobalLoading: (loading) => set({ globalLoading: loading })
  }))
);

export default useUIStore;