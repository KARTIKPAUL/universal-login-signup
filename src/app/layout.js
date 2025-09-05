import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../components/providers/AuthProvider';
import { ToastContainer } from '../components/ui/ToastContainer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Universal Auth System',
  description: 'A comprehensive authentication solution with Zustand',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}