import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component that provides consistent structure across all pages
 * 
 * Contains the main content area with appropriate spacing and styling
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-4">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
