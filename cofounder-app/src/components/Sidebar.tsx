import React from 'react';
import { useNhostClient, useUserData } from '@nhost/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineViewGrid, // For Swipe (alternative: HiOutlineSwitchHorizontal)
  HiOutlineBookmark, // For Saved Profiles
  HiOutlineChatAlt2, // For Chat
  HiOutlineNewspaper, // For Feed
  HiOutlineUserGroup, // For Groups
  HiOutlineCog,       // For Settings
  HiOutlineLogout,    // For Logout
  HiUserCircle        // For User Avatar Placeholder
} from 'react-icons/hi';

interface SidebarProps {
  setActiveView: (view: string) => void;
  activeView: string;
  isMobileOpen?: boolean; // To control visibility on mobile
  toggleMobileSidebar?: () => void; // To close when an item is clicked on mobile
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveView, activeView, isMobileOpen, toggleMobileSidebar }) => {
  const nhost = useNhostClient();
  const userData = useUserData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await nhost.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Swipe', viewId: 'swipe', icon: <HiOutlineViewGrid className="w-5 h-5 mr-3" /> },
    { name: 'Saved Profiles', viewId: 'saved', icon: <HiOutlineBookmark className="w-5 h-5 mr-3" /> },
    { name: 'Chat', viewId: 'chat', icon: <HiOutlineChatAlt2 className="w-5 h-5 mr-3" /> },
    { name: 'Feed', viewId: 'feed', icon: <HiOutlineNewspaper className="w-5 h-5 mr-3" /> },
    { name: 'Groups', viewId: 'groups', icon: <HiOutlineUserGroup className="w-5 h-5 mr-3" /> },
  ];

  const baseItemClass = "flex items-center px-4 py-2.5 text-sm font-medium text-slate-300 dark:text-slate-200 hover:bg-slate-700 dark:hover:bg-slate-700 hover:text-white dark:hover:text-white rounded-lg transition-colors duration-150 cursor-pointer";
  const activeItemClass = "bg-rose-600 dark:bg-rose-600 text-white";

  const handleItemClick = (viewId: string) => {
    setActiveView(viewId);
    if (isMobileOpen && toggleMobileSidebar) {
      toggleMobileSidebar(); // Close sidebar on mobile after item click
    }
  };

  return (
    // Base classes for desktop, transform classes for mobile show/hide
    <div
      className={`
        w-64 h-screen bg-slate-800 dark:bg-slate-900 text-white flex flex-col
        fixed top-0 left-0 shadow-xl border-r border-slate-700 dark:border-slate-700
        z-30 transition-transform duration-300 ease-in-out
        md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header / User Info */}
      <div className="p-5 border-b border-slate-700 dark:border-slate-700">
        <Link to="/dashboard" className="flex items-center space-x-2 group" onClick={isMobileOpen ? toggleMobileSidebar : undefined}>
          {/* Replace with a proper logo if available */}
          <div className="w-8 h-8 bg-rose-600 dark:bg-rose-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:opacity-90 transition-opacity">
            CF
          </div>
          <h1 className="text-2xl font-bold text-white group-hover:opacity-90 transition-opacity">CoFound</h1>
        </Link>
        {userData && (
          <div className="mt-5 text-center">
            {userData.avatarUrl ? (
              <img src={userData.avatarUrl} alt="User Avatar" className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-slate-600 object-cover"/>
            ) : (
              <HiUserCircle className="w-16 h-16 text-slate-500 dark:text-slate-600 mx-auto mb-2" />
            )}
            <p className="text-sm font-medium truncate text-slate-200 dark:text-slate-100">{userData.displayName || userData.email}</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <div
            key={item.viewId}
            onClick={() => setActiveView(item.viewId)}
            className={`${baseItemClass} ${activeView === item.viewId ? activeItemClass : ''}`}
            title={item.name} // Tooltip for icon-only state if sidebar collapses
          >
            {item.icon}
            <span>{item.name}</span>
          </div>
        ))}
      </nav>

      {/* Footer / Settings & Logout */}
      <div className="p-4 border-t border-slate-700 dark:border-slate-700 space-y-1.5">
        <div
          onClick={() => setActiveView('settings')}
          className={`${baseItemClass} ${activeView === 'settings' ? activeItemClass : ''}`}
          title="Settings"
        >
          <HiOutlineCog className="w-5 h-5 mr-3" />
          <span>Settings</span>
        </div>
        <button
          onClick={handleLogout}
          className={`${baseItemClass} w-full`}
          title="Logout"
        >
          <HiOutlineLogout className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
