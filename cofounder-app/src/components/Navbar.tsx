import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthenticationStatus, useNhostClient } from '@nhost/react';

const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuthenticationStatus();
  const nhost = useNhostClient();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await nhost.auth.signOut();
    navigate('/'); // Redirect to home after logout
  };

  const baseLinkClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
  const activeLinkClass = "bg-rose-500 text-white dark:bg-rose-600";
  const inactiveLinkClass = "text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700";

  // Specific class for buttons to make them look like links or stand out as needed
  const navButtonClass = `${baseLinkClass} ${inactiveLinkClass}`;

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 text-2xl font-bold text-rose-600 dark:text-rose-500 hover:opacity-80 transition-opacity">
              CoFound
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
            >
              Home
            </NavLink>
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 transition-colors"
                >
                  Sign Up
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                  Dashboard
                </NavLink>
                {/* Removed direct profile setup link, user goes via Dashboard -> Settings */}
                <button onClick={handleLogout} className={navButtonClass}>
                  Logout
                </button>
              </>
            )}
          </div>
          {/* Mobile Menu Button (functionality to be added if expanding for mobile fully) */}
          <div className="md:hidden flex items-center">
            {isAuthenticated && (
                 <button onClick={handleLogout} className={`${navButtonClass} mr-2`}>Logout</button>
            )}
            <button className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none">
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m4 6h-16" />
              </svg>
            </button>
            {/* Mobile menu dropdown would go here, revealed by state */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
