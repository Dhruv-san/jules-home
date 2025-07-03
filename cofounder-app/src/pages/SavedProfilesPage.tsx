import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';
import { Link } from 'react-router-dom'; // For linking to chat or full profile later

// Types (can be shared from SwipePage or a common types file)
interface ProfileMin { // Minimal profile info for list display
  user_id: string;
  username: string;
  full_name?: string;
  primary_role_seeking?: string;
  bio?: string;
}

interface SavedProfileEntry {
  id: string; // ID of the saved_profiles entry itself, for easy deletion
  saved_profile_user_id: string;
  profileDetails?: ProfileMin; // Using 'profileDetails' as the relationship name
}

const GET_SAVED_PROFILES_QUERY = gql`
  query GetSavedProfiles($currentUserId: uuid!) {
    saved_profiles(
      where: { saving_user_id: { _eq: $currentUserId } },
      order_by: { created_at: desc }
    ) {
      id # ID of the saved_profiles entry
      saved_profile_user_id
      profileDetails { # This MUST match the relationship name in Hasura
        user_id
        username
        full_name
        primary_role_seeking
        bio # Add more fields if you want to show them here
      }
    }
  }
`;

// UNSAVE_PROFILE_MUTATION (can be reused from SwipePage or defined here if not shared)
// Ensure $currentUserId is passed if using the version that checks it in where clause,
// or just use the ID of the saved_profiles entry for deletion.
const UNSAVE_PROFILE_BY_ENTRY_ID_MUTATION = gql`
  mutation UnsaveProfileByEntryId($savedEntryId: uuid!) {
    delete_saved_profiles_by_pk(id: $savedEntryId) {
      id # Returns id of deleted row
    }
  }
`;


const SavedProfilesPage: React.FC = () => {
  const user = useUserData();
  const currentUserId = user?.id;

  const { data, loading, error, refetch } = useQuery<{ saved_profiles: SavedProfileEntry[] }>(
    GET_SAVED_PROFILES_QUERY,
    {
      variables: { currentUserId },
      skip: !currentUserId,
      fetchPolicy: 'network-only', // Ensure fresh data
    }
  );

  const [unsaveProfile] = useMutation(UNSAVE_PROFILE_BY_ENTRY_ID_MUTATION);

  const handleUnsave = async (savedEntryId: string) => {
    try {
      await unsaveProfile({
        variables: { savedEntryId },
        // Optionally, update cache or refetch list
        update: (cache) => {
            // Optimistically remove from cache if possible
            // Or simply refetch after mutation
            cache.evict({ id: cache.identify({ __typename: 'saved_profiles', id: savedEntryId }) });
            cache.gc();
        }
      });
      refetch(); // Refetch the list after unsaving
    } catch (err) {
      console.error('Error unsaving profile:', err);
      alert('Failed to unsave profile.');
    }
  };

  if (loading) return <p className="text-center p-10">Loading saved profiles...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Error loading saved profiles: {error.message}. Check Hasura relationship name for 'profileDetails'.</p>;

  const savedProfiles = data?.saved_profiles || [];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-white mb-8">My Saved Profiles</h1>
      {savedProfiles.length === 0 ? (
        <p className="text-slate-400 text-center">You haven't saved any profiles yet. Start swiping to find potential co-founders!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProfiles.map((saved) => (
            saved.profileDetails ? ( // Check if profileDetails exists
              <div key={saved.id} className="bg-slate-800 rounded-lg shadow-lg p-6 hover:shadow-rose-500/30 transition-shadow">
                <div className="flex items-center mb-4">
                  {/* Avatar Placeholder */}
                  <div className="w-16 h-16 bg-slate-700 rounded-full mr-4 flex items-center justify-center text-2xl text-white">
                    {saved.profileDetails.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{saved.profileDetails.username}</h2>
                    {saved.profileDetails.full_name && <p className="text-sm text-slate-400">{saved.profileDetails.full_name}</p>}
                  </div>
                </div>
                {saved.profileDetails.primary_role_seeking && (
                  <p className="text-sm text-slate-300 mb-1">
                    <strong>Seeking:</strong> {saved.profileDetails.primary_role_seeking}
                  </p>
                )}
                {saved.profileDetails.bio && (
                    <p className="text-sm text-slate-400 italic truncate mb-3">"{saved.profileDetails.bio}"</p>
                )}
                <div className="mt-4 flex justify-between items-center">
                  <Link
                    to={`/dashboard/chat/${saved.profileDetails.user_id}`} // Example chat link, needs actual routing/state
                    className="text-sm text-sky-400 hover:text-sky-300"
                    onClick={(e) => { e.preventDefault(); alert(`TODO: Open chat with ${saved.profileDetails?.username}`);}} // Placeholder
                  >
                    Message
                  </Link>
                  <button
                    onClick={() => handleUnsave(saved.id)}
                    className="text-sm text-red-500 hover:text-red-400 font-semibold"
                  >
                    Unsave
                  </button>
                </div>
              </div>
            ) : (
              <div key={saved.id} className="bg-slate-800 rounded-lg shadow-lg p-6">
                 <p className="text-slate-400">Profile data not available for saved entry ID: {saved.id}. User ID: {saved.saved_profile_user_id}</p>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProfilesPage;
