import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';
 // If using React Router for individual chat routes

// Define types for the data
interface UserProfile {
  username: string;
}

interface User {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  profile?: UserProfile | null;
}

interface Match {
  id: string; // Match ID
  user1_id: string;
  user2_id: string;
  user1: User;
  user2: User;
  // messages?: [{ content: string; created_at: string; sender_id: string }]; // For last message
}

interface GetMyConversationsData {
  matches: Match[];
}

const GET_MY_CONVERSATIONS = gql`
  query GetMyConversations($currentUserId: uuid!) {
    matches(
      where: {
        _or: [
          { user1_id: { _eq: $currentUserId } },
          { user2_id: { _eq: $currentUserId } }
        ]
      },
      order_by: { created_at: desc }
    ) {
      id
      user1_id
      user2_id
      user1 {
        id
        displayName
        avatarUrl
        profile {
          username
        }
      }
      user2 {
        id
        displayName
        avatarUrl
        profile {
          username
        }
      }
      # Example: Fetching last message (uncomment and adjust if 'messages' relationship exists on 'matches')
      # messages(limit: 1, order_by: { created_at: desc }) {
      #   content
      #   created_at
      #   sender_id
      # }
    }
  }
`;

interface ChatListPageProps {
  onSelectConversation: (otherUserId: string, otherUserName: string) => void; // Callback to open individual chat
}

const ChatListPage: React.FC<ChatListPageProps> = ({ onSelectConversation }) => {
  const user = useUserData();
  const currentUserId = user?.id;

  const { data, loading, error } = useQuery<GetMyConversationsData>(
    GET_MY_CONVERSATIONS,
    {
      variables: { currentUserId },
      skip: !currentUserId,
      fetchPolicy: 'network-only',
    }
  );

  if (loading) return <p className="text-center p-10 text-white">Loading conversations...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Error loading conversations: {error.message}. Check Hasura relationships (user1, user2 on matches; profile on users).</p>;

  const conversations = data?.matches || [];

  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-full"> {/* Ensure it fills the content area */}
      <h1 className="text-2xl font-bold text-white mb-6">My Chats</h1>
      {conversations.length === 0 ? (
        <p className="text-slate-400 text-center">No active chats. Start matching to find co-founders to talk to!</p>
      ) : (
        <div className="space-y-3">
          {conversations.map((match) => {
            // Determine the 'other' user in the match
            const otherUser = match.user1_id === currentUserId ? match.user2 : match.user1;
            const otherUserName = otherUser.profile?.username || otherUser.displayName || otherUser.id;
            // const lastMessage = match.messages && match.messages.length > 0 ? match.messages[0] : null;

            return (
              <div
                key={match.id}
                onClick={() => onSelectConversation(otherUser.id, otherUserName)}
                className="flex items-center p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-all duration-150 ease-in-out transform hover:-translate-y-0.5"
              >
                {/* Avatar - TODO: Fetch actual avatarUrl for otherUser */}
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-full mr-4 flex items-center justify-center text-xl text-slate-700 dark:text-white font-semibold">
                  {otherUserName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-slate-800 dark:text-white">{otherUserName}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 italic">Click to open chat.</p>
                </div>
                {/* Future: Unread count badge */}
                {/* Future: Timestamp of last message */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatListPage;
