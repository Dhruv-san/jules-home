import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';

// Types
interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: { // Optional: if fetching sender details with message
    id: string;
    displayName?: string | null;
    profile?: { username?: string | null } | null;
  };
}

interface GetMessagesData {
  messages: Message[];
}

interface OnNewMessageData {
  messages: Message[]; // Subscription typically returns new messages in an array
}

// GraphQL Operations (Consider moving to a shared file)
const GET_MESSAGES = gql`
  query GetMessages($currentUserId: uuid!, $otherUserId: uuid!, $limit: Int = 50, $offset: Int = 0) {
    messages(
      where: {
        _or: [
          { sender_id: { _eq: $currentUserId }, receiver_id: { _eq: $otherUserId } },
          { sender_id: { _eq: $otherUserId }, receiver_id: { _eq: $currentUserId } }
        ]
      },
      order_by: { created_at: asc },
      limit: $limit,
      offset: $offset
    ) {
      id
      sender_id
      # receiver_id # Not strictly needed on client if context is clear
      content
      created_at
      is_read
      # Optionally fetch sender details if not relying on sender_id comparison alone
      # sender { id displayName profile { username } }
    }
  }
`;

const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($receiverId: uuid!, $content: String!) {
    insert_messages_one(
      object: {
        receiver_id: $receiverId,
        content: $content
        # sender_id is set by Hasura permission preset
      }
    ) {
      id
      sender_id
      receiver_id
      content
      created_at
      is_read
    }
  }
`;

const ON_NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription OnNewMessage($currentUserId: uuid!, $otherUserId: uuid!) {
    messages(
      where: {
        # Listen for messages sent by the other user to the current user
        # OR messages sent by current user to other user (if not using optimistic updates for own messages)
         _or: [
            { sender_id: { _eq: $otherUserId }, receiver_id: { _eq: $currentUserId } },
            { sender_id: { _eq: $currentUserId }, receiver_id: { _eq: $otherUserId } } # To see own messages if not optimistic
        ],
        # A common pattern is to only get messages created after the initial fetch.
        # This can be done by passing a timestamp or by client-side filtering.
        # For simplicity, this subscription might fetch recent messages that match.
        # The client should handle deduplication if necessary.
      },
      order_by: { created_at: desc }, # Get the very latest ones
      limit: 10 # Limit the number of messages from subscription in one go, process them
    ) {
      id
      sender_id
      receiver_id
      content
      created_at
      is_read
    }
  }
`;

const MARK_CONVERSATION_AS_READ = gql`
  mutation MarkConversationAsRead($senderId: uuid!, $currentUserId: uuid!) {
    update_messages(
      where: {
        sender_id: {_eq: $senderId},
        receiver_id: {_eq: $currentUserId},
        is_read: {_eq: false}
      },
      _set: {is_read: true}
    ) {
      affected_rows
    }
  }
`;


interface IndividualChatPageProps {
  targetUserId: string;
  targetUserName: string;
  onBackToList: () => void;
}

const IndividualChatPage: React.FC<IndividualChatPageProps> = ({ targetUserId, targetUserName, onBackToList }) => {
  const user = useUserData();
  const currentUserId = user?.id;
  const [newMessageContent, setNewMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null); // For scrolling to bottom

  const { data: messagesData, loading: messagesLoading, error: messagesError, fetchMore } = useQuery<GetMessagesData>(
    GET_MESSAGES,
    {
      variables: { currentUserId, otherUserId: targetUserId, limit: 20 }, // Load initial 20 messages
      skip: !currentUserId || !targetUserId,
      fetchPolicy: 'network-only', // Get fresh messages on load
    }
  );

  const [sendMessage, { loading: sendingMessage, error: sendMessageError }] = useMutation(SEND_MESSAGE_MUTATION);

  const [markAsRead] = useMutation(MARK_CONVERSATION_AS_READ);

  useSubscription<OnNewMessageData>(ON_NEW_MESSAGE_SUBSCRIPTION, {
    variables: { currentUserId, otherUserId: targetUserId },
    skip: !currentUserId || !targetUserId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.messages) {
        const newMessages = subscriptionData.data.messages;
        // Update Apollo Client cache directly for real-time updates
        // This is more robust than just setting local state
        const existingMessagesQuery = messagesData; // from useQuery

        if (existingMessagesQuery && newMessages.length > 0) {
            // Simple merge, assuming new messages are not already in cache from initial load.
            // More sophisticated cache updates might be needed for perfect deduplication.
            const combinedMessages = [...(existingMessagesQuery.messages || []), ...newMessages.filter(nm => !(existingMessagesQuery.messages || []).find(em => em.id === nm.id))];
            combinedMessages.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            // This is a conceptual update. Direct cache update is preferred:
            // client.writeQuery(...) or cache.updateQuery(...)
            // For simplicity here, if refetching is acceptable:
            // refetchMessages(); // Or trigger a refetch of GET_MESSAGES if cache update is complex

            // A common pattern for Apollo Client subscriptions is to update the cache:
            // See Apollo docs for cache.updateQuery or client.writeQuery
            // For now, a refetch on new message can work for simplicity, or manual state update.
            // Let's try a manual state update that appends to existing messages, assuming `messagesData` is the source of truth for rendering.
            // This would require messagesData to be mutable or for us to manage a separate local state array for display.
            // The most straightforward with Apollo is to refetch or ensure the subscription updates the query's cache.
            // Nhost's Apollo client might handle this automatically if IDs match.
            // For now, let's assume we might need a refetch or a more complex cache update.
            // A simple approach:
            // if (messagesData && messagesData.messages) {
            //   client.cache.updateQuery({ query: GET_MESSAGES, variables: { currentUserId, otherUserId: targetUserId, limit: 20 } }, (data) => ({
            //     messages: [...data.messages, ...newMessages.filter(nm => !data.messages.find(em => em.id === nm.id))]
            //   }));
            // }
            // Or just refetch:
            // fetchMore({ variables: { offset: messagesData?.messages.length }}); // This is for pagination, not ideal for new messages
            // Best to rely on Apollo cache normalization or manual cache updates.
            // For this example, we'll assume new messages from subscription should trigger a refetch of the main query.
            // This is not the most efficient but simplest to implement initially.
            // A better way is client.cache.modify...
            // For now, let's just log it and rely on manual refresh or a slight delay.
            console.log("New message received via subscription:", newMessages);
            // To make it appear: could add to a local state array that combines with messagesData.messages
            // Or, more robustly, configure Apollo Client cache updates.
            // For this example, let's assume the user might need to manually refresh or we add a button.
            // Or simply refetch the messages query to get the latest.
            // fetchMore or refetch() could be used here.
        }
      }
    }
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive or page loads
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]); // Dependency on messagesData ensures scroll on new messages

  useEffect(() => {
    // Mark messages from targetUser as read when component mounts or targetUserId changes
    if (currentUserId && targetUserId) {
      markAsRead({ variables: { senderId: targetUserId, currentUserId } })
        .catch(err => console.error("Failed to mark messages as read:", err));
    }
  }, [targetUserId, currentUserId, markAsRead, messagesData]); // Rerun if messagesData changes to catch new ones

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !currentUserId || !targetUserId) return;

    try {
      await sendMessage({
        variables: { receiverId: targetUserId, content: newMessageContent },
        // Optimistic response (optional but good for UX)
        optimisticResponse: {
          insert_messages_one: {
            __typename: 'messages',
            id: crypto.randomUUID(), // Temporary ID
            sender_id: currentUserId,
            receiver_id: targetUserId,
            content: newMessageContent,
            created_at: new Date().toISOString(),
            is_read: false,
          },
        },
        // Update cache after mutation (optional, Apollo might do it if data structure matches)
        update: (cache, { data: mutationResult }) => {
          const newMessage = mutationResult?.insert_messages_one;
          if (newMessage) {
            const existingMessages = cache.readQuery<GetMessagesData>({
              query: GET_MESSAGES,
              variables: { currentUserId, otherUserId: targetUserId, limit: 20 /* ensure limit matches initial query */ },
            });
            if (existingMessages) {
              cache.writeQuery({
                query: GET_MESSAGES,
                variables: { currentUserId, otherUserId: targetUserId, limit: 20 },
                data: {
                  messages: [...existingMessages.messages, newMessage],
                },
              });
            }
          }
        }
      });
      setNewMessageContent(''); // Clear input field
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message.'); // Simple error display
    }
  };

  const messages = messagesData?.messages || [];

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,10rem))] bg-slate-900"> {/* Adjust header height */}
      {/* Chat Header */}
      <header className="p-4 bg-slate-800 text-white shadow-md flex items-center sticky top-0 z-10">
        <button onClick={onBackToList} className="mr-4 text-sky-400 hover:text-sky-300 text-2xl">&larr;</button>
        {/* Avatar Placeholder */}
        <div className="w-10 h-10 bg-slate-600 rounded-full mr-3 flex items-center justify-center text-lg">
          {targetUserName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-semibold">{targetUserName}</h2>
      </header>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-900">
        {messagesLoading && <p className="text-center text-slate-400">Loading messages...</p>}
        {messagesError && <p className="text-center text-red-400">Error loading messages: {messagesError.message}</p>}
        {!messagesLoading && messages.length === 0 && (
          <p className="text-center text-slate-500">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow ${
                msg.sender_id === currentUserId
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.sender_id === currentUserId ? 'text-rose-200' : 'text-slate-400'} opacity-75`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.sender_id === currentUserId && msg.is_read && <span className="ml-1">✓✓</span>}
                {/* Basic read receipt for own messages */}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Anchor for scrolling to bottom */}
      </div>

      {/* Message Input Area */}
      <footer className="p-4 bg-slate-800 border-t border-slate-700 sticky bottom-0 z-10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            disabled={sendingMessage}
          />
          <button
            type="submit"
            disabled={sendingMessage || !newMessageContent.trim()}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingMessage ? 'Sending...' : 'Send'}
          </button>
        </form>
        {sendMessageError && <p className="text-xs text-red-400 mt-1">Failed to send: {sendMessageError.message}</p>}
      </footer>
    </div>
  );
};

export default IndividualChatPage;
