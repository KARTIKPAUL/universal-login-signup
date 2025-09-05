'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import useAuthStore from '../../stores/authStore';

export function AuthProvider({ children }) {
  const refreshSession = useAuthStore((state) => state.refreshSession);

  useEffect(() => {
    // Initial session refresh
    refreshSession();

    // Set up interval to refresh session every 5 minutes
    const interval = setInterval(() => {
      refreshSession();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshSession]);

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}