import React, { useState, useEffect } from 'react';
import { useUserData } from '@nhost/react';
import { Link } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi'; // For sidebar toggle

import Sidebar from '../components/Sidebar';
import SwipePage from './SwipePage';
import SavedProfilesPage from './SavedProfilesPage';
import ChatListPage from './ChatListPage';
import IndividualChatPage from './IndividualChatPage';
import FeedPage from './FeedPage';
import SettingsPage from './SettingsPage';

// Placeholder components for views not yet implemented
const GroupsViewPlaceholder: React.FC = () => <div className="p-6"><h2 className="text-2xl font-semibold text-slate-700 dark:text-white">Groups View</h2><p className="text-slate-600 dark:text-slate-300">Group discussions and management will be here.</p></div>;


const DashboardPage: React.FC = () => {
  const user = useUserData();
  const [activeView, setActiveView] = useState('swipe');
  const [chatTargetUserId, setChatTargetUserId] = useState<string | null>(null);
  const [chatTargetUserName, setChatTargetUserName] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar when screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // Tailwind's 'md' breakpoint
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex flex-col justify-center items-center p-6">
        <p>Loading user data or user not authenticated...</p>
        <Link to="/login" className="text-rose-600 dark:text-rose-500 hover:text-rose-500 dark:hover:text-rose-400 mt-4">Go to Login</Link>
      </div>
    );
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleSelectConversation = (otherUserId: string, otherUserName: string) => {
    setChatTargetUserId(otherUserId);
    setChatTargetUserName(otherUserName);
    setActiveView('individualChat');
    if (isMobileSidebarOpen) toggleMobileSidebar(); // Close sidebar on navigation
  };

  const handleBackToChatList = () => {
    setChatTargetUserId(null);
    setChatTargetUserName(null);
    setActiveView('chat');
  }

  const renderActiveView = () => {
    if (activeView === 'individualChat' && chatTargetUserId && chatTargetUserName) {
      return <IndividualChatPage
                targetUserId={chatTargetUserId}
                targetUserName={chatTargetUserName}
                onBackToList={handleBackToChatList}
             />;
    }

    switch (activeView) {
      case 'swipe':
        return <SwipePage />;
      case 'saved':
        return <SavedProfilesPage />;
      case 'chat':
        return <ChatListPage onSelectConversation={handleSelectConversation} />;
      case 'feed':
        return <FeedPage />;
      case 'groups':
        return <GroupsViewPlaceholder />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <SwipePage />;
    }
  };

  const handleSetActiveView = (view: string) => {
    if (view !== 'individualChat') {
        setChatTargetUserId(null);
        setChatTargetUserName(null);
    }
    setActiveView(view);
    if (isMobileSidebarOpen) toggleMobileSidebar(); // Close sidebar on navigation
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white relative">
      <Sidebar
        setActiveView={handleSetActiveView}
        activeView={activeView}
        isMobileOpen={isMobileSidebarOpen}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      {/* Overlay for mobile when sidebar is open */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Main content area */}
      {/* Adjust margin-left for desktop, full width for mobile (when sidebar is hidden) */}
      <main
        className={`
          flex flex-col flex-grow overflow-y-auto transition-all duration-300 ease-in-out
          md:ml-64
          ${isMobileSidebarOpen ? 'blur-sm md:blur-none' : ''}
        `}
      >
        {/* Mobile Header with Hamburger Menu */}
        <div className="md:hidden p-4 bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10 flex items-center border-b border-slate-200 dark:border-slate-700">
            <button onClick={toggleMobileSidebar} className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                <span className="sr-only">Open sidebar</span>
                {isMobileSidebarOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
            <h1 className="ml-3 text-xl font-semibold text-rose-600 dark:text-rose-500">CoFound</h1>
        </div>
        <div className="flex-grow"> {/* This div will take the actual page content */}
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
