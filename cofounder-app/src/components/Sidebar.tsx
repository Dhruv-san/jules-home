import React from 'react';
import { useNhostClient, useUserData } from '@nhost/react';
import { useNavigate, Link } from 'react-router-dom'; // Link for settings if it's a separate route

// Define types for props if we pass setActiveView from DashboardPage
interface SidebarProps {
  setActiveView: (view: string) => void;
  activeView: string;
}

// Placeholder icons - replace with actual icons later
const IconPlaceholder = ({ name }: { name: string }) => <span className="mr-3 text-xl">{name.substring(0,1)}</span>;


const Sidebar: React.FC<SidebarProps> = ({ setActiveView, activeView }) => {
  const nhost = useNhostClient();
  const userData = useUserData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await nhost.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { name: 'Swipe', viewId: 'swipe', icon: 'S' },
    { name: 'Saved Profiles', viewId: 'saved', icon: 'P' },
    { name: 'Chat', viewId: 'chat', icon: 'C' },
    { name: 'Feed', viewId: 'feed', icon: 'F' },
    { name: 'Groups', viewId: 'groups', icon: 'G' },
  ];

  const baseItemClass = "flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors duration-150 cursor-pointer";
  const activeItemClass = "bg-rose-600 text-white";

  return (
    <div className="w-64 h-screen bg-slate-800 text-white flex flex-col fixed top-0 left-0 shadow-lg">
      {/* Header / User Info */}
      <div className="p-5 border-b border-slate-700">
        <Link to="/dashboard"> {/* Or make this non-clickable if it's just a brand */}
          <h1 className="text-2xl font-bold text-white">CoFound</h1>
        </Link>
        {userData && (
          <div className="mt-4">
            {/* Placeholder for avatar */}
            <div className="w-12 h-12 bg-slate-600 rounded-full mb-2 flex items-center justify-center text-xl">
              {userData.displayName ? userData.displayName.charAt(0).toUpperCase() : userData.email?.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium truncate">{userData.displayName || userData.email}</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <div
            key={item.viewId}
            onClick={() => setActiveView(item.viewId)}
            className={`${baseItemClass} ${activeView === item.viewId ? activeItemClass : ''}`}
          >
            <IconPlaceholder name={item.icon} />
            <span>{item.name}</span>
          </div>
        ))}
      </nav>

      {/* Footer / Settings & Logout */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        <div
          onClick={() => setActiveView('settings')}
          className={`${baseItemClass} ${activeView === 'settings' ? activeItemClass : ''}`}
        >
          <IconPlaceholder name="S" /> {/* Placeholder for Settings icon */}
          <span>Settings</span>
        </div>
        <button
          onClick={handleLogout}
          className={`${baseItemClass} w-full`}
        >
          <IconPlaceholder name="L" /> {/* Placeholder for Logout icon */}
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
