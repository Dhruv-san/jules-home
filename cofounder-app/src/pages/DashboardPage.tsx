import React, { useState } from 'react';
import { useUserData } from '@nhost/react';
import { Link } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import SwipePage from './SwipePage';
import SavedProfilesPage from './SavedProfilesPage';
import ChatListPage from './ChatListPage';
import IndividualChatPage from './IndividualChatPage';
import FeedPage from './FeedPage';
import SettingsPage from './SettingsPage'; // Import the actual SettingsPage

// Placeholder components for views not yet implemented
const GroupsViewPlaceholder: React.FC = () => <div className="p-6"><h2 className="text-2xl font-semibold">Groups View</h2><p>Group discussions and management will be here.</p></div>;


const DashboardPage: React.FC = () => {
  const user = useUserData();
  const [activeView, setActiveView] = useState('swipe'); // Default view is 'swipe'
  const [chatTargetUserId, setChatTargetUserId] = useState<string | null>(null);
  const [chatTargetUserName, setChatTargetUserName] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-800 text-white flex flex-col justify-center items-center p-6">
        <p>Loading user data or user not authenticated...</p>
        <Link to="/login" className="text-rose-500 hover:text-rose-400 mt-4">Go to Login</Link>
      </div>
    );
  }

  const handleSelectConversation = (otherUserId: string, otherUserName: string) => {
    setChatTargetUserId(otherUserId);
    setChatTargetUserName(otherUserName);
    setActiveView('individualChat'); // Switch view to individual chat
  };

  const handleBackToChatList = () => {
    setChatTargetUserId(null);
    setChatTargetUserName(null);
    setActiveView('chat'); // Go back to the chat list view
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
        return <SettingsPage />; // Render the actual SettingsPage component
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
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <Sidebar setActiveView={handleSetActiveView} activeView={activeView} />
      <main className="flex flex-col flex-grow ml-64 overflow-y-auto">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default DashboardPage;
