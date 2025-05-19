import { useState } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

/**
 * Header component for the application
 * 
 * Includes page title and theme toggle
 */
const Header = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Toggle dark class on document element
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Page title */}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Economic Uncertainty Analysis
          </h1>

          {/* Right: Theme toggle only */}
          <div className="flex items-center">
            {/* Theme Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              ) : (
                <MoonIcon className="h-6 w-6 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
