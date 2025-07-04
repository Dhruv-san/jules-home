import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 text-white font-medium rounded-lg shadow-md transition-all duration-150 ease-in-out flex items-center focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-800 dark:focus:ring-offset-slate-900"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <MdDarkMode className="w-5 h-5 mr-2" /> Switch to Dark Mode
        </>
      ) : (
        <>
          <MdLightMode className="w-5 h-5 mr-2" /> Switch to Light Mode
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
