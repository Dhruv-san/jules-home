import React from 'react';
import { useQuery, useMutation, gql, ApolloCache } from '@apollo/client'; // types are available via package
import { useUserData } from '@nhost/react'; // types are available via package
import { HiOutlineChatAlt2, HiOutlineTrash, HiOutlineUserCircle, HiOutlineBookmark } from 'react-icons/hi';

// Types
interface ProfileMin {
  user_id: string;
  username: string;
  full_name?: string | null;
  primary_role_seeking?: string | null;
  avatar_url?: string | null; // Added for avatar
  bio?: string | null;
}

interface SavedProfileEntry {
  id: string;
  saved_profile_user_id: string;
  profileDetails?: ProfileMin | null;
}

const GET_SAVED_PROFILES_QUERY = gql`
  query GetSavedProfiles($currentUserId: uuid!) {
    saved_profiles(
      where: { saving_user_id: { _eq: $currentUserId } },
      order_by: { created_at: desc }
    ) {
      id
      saved_profile_user_id
      profileDetails { # This MUST match the relationship name in Hasura
        user_id
        username
        full_name
        avatar_url # Fetch avatar_url
        primary_role_seeking
        bio
      }
    }
  }
`;

const UNSAVE_PROFILE_BY_ENTRY_ID_MUTATION = gql`
  mutation UnsaveProfileByEntryId($savedEntryId: uuid!) {
    delete_saved_profiles_by_pk(id: $savedEntryId) {
      id
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
      fetchPolicy: 'network-only',
    }
  );

  const [unsaveProfile] = useMutation(UNSAVE_PROFILE_BY_ENTRY_ID_MUTATION);

  const handleUnsave = async (savedEntryId: string) => {
    try {
      await unsaveProfile({
        variables: { savedEntryId },
        update: (cache: ApolloCache<{ saved_profiles: SavedProfileEntry }>) => {
            cache.evict({ id: cache.identify({ __typename: 'saved_profiles', id: savedEntryId }) });
            cache.gc();
        }
      });
      // No need to call refetch() if cache update is successful and sufficient
    } catch (err) {
      console.error('Error unsaving profile:', err);
      alert('Failed to unsave profile.');
      refetch(); // Refetch on error as a fallback
    }
  };

  if (loading) return <p className="text-center p-10 text-slate-600 dark:text-slate-300">Loading saved profiles...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Error loading saved profiles: {error.message}. Check Hasura relationship name for &apos;profileDetails&apos;.</p>;

  const savedProfiles = data?.saved_profiles || [];

  return (
    <div className="p-4 md:p-8 bg-slate-100 dark:bg-slate-900 min-h-full">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">My Saved Profiles</h1>
      {savedProfiles.length === 0 ? (
        <div className="text-center py-10">
          <HiOutlineBookmark className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">You haven&apos;t saved any profiles yet.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Start swiping to find potential co-founders!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProfiles.map((saved: SavedProfileEntry) => (
            saved.profileDetails ? (
              <div key={saved.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 transform transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-start space-x-4 mb-4">
                  {saved.profileDetails.avatar_url ? (
                    <img src={saved.profileDetails.avatar_url} alt={saved.profileDetails.username} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"/>
                  ) : (
                    <HiOutlineUserCircle className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                  )}
                  <div className="flex-grow">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{saved.profileDetails.username}</h2>
                    {saved.profileDetails.full_name && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">{saved.profileDetails.full_name}</p>}
                    {saved.profileDetails.primary_role_seeking && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Seeking: {saved.profileDetails.primary_role_seeking}
                      </p>
                    )}
                  </div>
                </div>

                {saved.profileDetails.bio && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic line-clamp-3 mb-4">&quot;{saved.profileDetails.bio}&quot;</p>
                )}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                  <button // Changed Link to button for consistency with onClick alert
                    // to={`/dashboard/chat/${saved.profileDetails.user_id}`} // Actual navigation to be handled by DashboardPage state
                    onClick={(e) => { e.preventDefault(); alert(`TODO: Open chat with ${saved.profileDetails?.username}`);}}
                    className="flex items-center text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 font-medium p-2 rounded-md hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <HiOutlineChatAlt2 className="w-4 h-4 mr-1.5" /> Message
                  </button>
                  <button
                    onClick={() => handleUnsave(saved.id)}
                    className="flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-medium p-2 rounded-md hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4 mr-1.5" /> Unsave
                  </button>
                </div>
              </div>
            ) : (
              <div key={saved.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                 <p className="text-slate-500 dark:text-slate-400">Profile data not available for saved entry ID: {saved.id}. User ID: {saved.saved_profile_user_id}</p>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProfilesPage;
