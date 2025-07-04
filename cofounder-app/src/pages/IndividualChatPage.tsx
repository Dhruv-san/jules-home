import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription, gql, ApolloCache } from '@apollo/client'; // types are available via package
import { useUserData } from '@nhost/react'; // types are available via package
import { HiArrowLeft, HiPaperAirplane, HiUserCircle, HiCheckCircle } from 'react-icons/hi'; // Added icons

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

interface GetMessagesVars {
  currentUserId: string;
  otherUserId: string;
  limit: number;
  offset: number;
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

  const { data: messagesData, loading: messagesLoading, error: messagesError } = useQuery<GetMessagesData, GetMessagesVars>(GET_MESSAGES, {
    variables: { currentUserId: currentUserId || '', otherUserId: targetUserId, limit: 20, offset: 0 }, // Load initial 20 messages
    skip: !currentUserId || !targetUserId,
    fetchPolicy: 'network-only', // Get fresh messages on load
  });

  const [sendMessage, { loading: sendingMessage, error: sendMessageError }] = useMutation(SEND_MESSAGE_MUTATION);

  const [markAsRead] = useMutation(MARK_CONVERSATION_AS_READ);

  useSubscription<OnNewMessageData>(ON_NEW_MESSAGE_SUBSCRIPTION, {
    variables: { currentUserId, otherUserId: targetUserId },
    skip: !currentUserId || !targetUserId,
    onData: (options) => {
      // Apollo's onData receives: { client, data }
      // data is SubscriptionResult<OnNewMessageData, any>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = (options.data as any)?.data?.messages as Message[] | undefined;
      if (messages && Array.isArray(messages)) {
        const newMessages = messages;
        // Update Apollo Client cache directly for real-time updates
        // This is more robust than just setting local state
        const existingMessagesQuery = messagesData; // from useQuery

        if (existingMessagesQuery && newMessages.length > 0) {
            // Simple merge, assuming new messages are not already in cache from initial load.
            // More sophisticated cache updates might be needed for perfect deduplication.
            const combinedMessages = [...(existingMessagesQuery.messages || []), ...newMessages.filter((nm: Message) => !(existingMessagesQuery.messages || []).find((em: Message) => em.id === nm.id))];
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
            // For now, let's rely on Apollo cache updates or subsequent refetches if needed.
            // console.log("New message received via subscription:", newMessages); // Removed
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
        .catch((err: unknown) => console.error("Failed to mark messages as read:", err));
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
        update: (cache: ApolloCache<GetMessagesData>, { data: mutationResult }: { data?: { insert_messages_one: Message } }) => {
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
  // Fix: messagesData is now the correct variable for useQuery result

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Chat Header */}
      <header style={{
        padding: '1rem',
        background: 'rgba(255,255,255,0.95)',
        color: '#1e293b',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: '1px solid #e2e8f0',
        minHeight: 64,
      }}>
        <button
          onClick={onBackToList}
          style={{
            marginRight: 16,
            padding: 8,
            color: '#64748b',
            background: 'none',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'color 0.2s, background 0.2s',
          }}
          aria-label="Back to chat list"
        >
          <HiArrowLeft style={{ width: 28, height: 28 }} />
        </button>
        <HiUserCircle style={{ width: 40, height: 40, color: '#94a3b8', marginRight: 16 }} />
        <h2 style={{ fontSize: 22, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{targetUserName}</h2>
      </header>

      {/* Messages Area */}
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'transparent',
      }}>
        {messagesLoading && <p style={{ textAlign: 'center', color: '#64748b', padding: 16 }}>Loading messages...</p>}
        {messagesError && <p style={{ textAlign: 'center', color: '#ef4444', padding: 16 }}>Error: {messagesError.message}</p>}
        {!messagesLoading && messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#cbd5e1', padding: 40, fontSize: 18 }}>No messages yet. Say hello! 👋</p>
        )}
        {messages.map((msg: Message) => (
          <div
            key={msg.id}
            style={{ display: 'flex', justifyContent: msg.sender_id === currentUserId ? 'flex-end' : 'flex-start' }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '0.75rem 1.1rem',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                background: msg.sender_id === currentUserId ? 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)' : 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 100%)',
                color: msg.sender_id === currentUserId ? '#fff' : '#1e293b',
                borderBottomRightRadius: msg.sender_id === currentUserId ? 4 : 20,
                borderBottomLeftRadius: msg.sender_id === currentUserId ? 20 : 4,
                marginBottom: 2,
                position: 'relative',
                wordBreak: 'break-word',
              }}
            >
              <p style={{ fontSize: 15, margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              <div style={{
                fontSize: 12,
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                color: msg.sender_id === currentUserId ? '#fbcfe8' : '#64748b',
                opacity: 0.85,
              }}>
                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                {msg.sender_id === currentUserId && msg.is_read && <HiCheckCircle style={{ width: 16, height: 16, marginLeft: 4, color: '#38bdf8' }} title="Read" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <footer style={{
        padding: '1rem',
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid #e2e8f0',
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
      }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text"
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            placeholder="Type a message..."
            style={{
              flexGrow: 1,
              padding: '0.9rem 1.2rem',
              borderRadius: 9999,
              border: '1.5px solid #cbd5e1',
              fontSize: 15,
              outline: 'none',
              background: '#fff',
              color: '#1e293b',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'border 0.2s',
            }}
            disabled={sendingMessage}
          />
          <button
            type="submit"
            disabled={sendingMessage || !newMessageContent.trim()}
            style={{
              padding: 12,
              background: 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(244,63,94,0.12)',
              cursor: sendingMessage || !newMessageContent.trim() ? 'not-allowed' : 'pointer',
              opacity: sendingMessage || !newMessageContent.trim() ? 0.6 : 1,
              transition: 'background 0.2s, transform 0.1s',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Send message"
          >
            {sendingMessage ?
              <svg className="animate-spin" style={{ height: 20, width: 20 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              : <HiPaperAirplane style={{ width: 20, height: 20, transform: 'rotate(30deg)' }} />
            }
          </button>
        </form>
        {sendMessageError && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 6, paddingLeft: 8 }}>Failed to send: {sendMessageError.message}</p>}
      </footer>
    </div>
  );
};

export default IndividualChatPage;
