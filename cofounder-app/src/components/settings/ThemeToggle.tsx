import React from 'react';
import { useTheme } from '../../context/ThemeContext'; // Adjust path if context is elsewhere

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 flex items-center"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          {/* Moon Icon (Placeholder or use an actual SVG/Icon component) */}
          <span className="mr-2 text-lg">🌙</span> Switch to Dark Mode
        </>
      ) : (
        <>
          {/* Sun Icon (Placeholder or use an actual SVG/Icon component) */}
          <span className="mr-2 text-lg">☀️</span> Switch to Light Mode
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
