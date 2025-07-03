import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';

interface Profile {
  user_id: string;
  username: string;
  full_name?: string;
  bio?: string;
  location?: string;
  primary_role_seeking?: string;
  core_skills?: string[];
  industry_experience?: string[];
  interests?: string[];
}

// GraphQL Definitions (ensure these are accurate and match your Hasura schema + relationships)
const GET_SWIPE_CANDIDATES = gql`
  query GetSwipeCandidates($currentUserId: uuid!, $limit: Int = 10) {
    profiles(
      limit: $limit,
      where: {
        _and: [
          { user_id: { _neq: $currentUserId } },
          { profile_complete: { _eq: true } },
          {
            _not: {
              # This relationship name 'swipes_where_profile_is_swiped' MUST match what's in Hasura
              # on 'profiles' table, pointing to 'swipes' table via profiles.user_id = swipes.swiped_user_id
              swipes_where_profile_is_swiped: { # VERIFY THIS RELATIONSHIP NAME in Hasura console
                swiper_user_id: { _eq: $currentUserId }
              }
            }
          }
        ]
      },
      order_by: { created_at: desc }
    ) {
      user_id
      username
      full_name
      bio
      primary_role_seeking
      core_skills
      industry_experience
      interests
    }
  }
`;

const RECORD_SWIPE_MUTATION = gql`
  mutation RecordSwipe($swipedUserId: uuid!, $action: String!) {
    insert_swipes_one(object: { swiped_user_id: $swipedUserId, action: $action }) {
      id
    }
  }
`;

const CHECK_FOR_MATCH_QUERY = gql`
  query CheckForMatch($currentUserId: uuid!, $swipedUserId: uuid!) {
    swipes(
      where: {
        swiper_user_id: { _eq: $swipedUserId },
        swiped_user_id: { _eq: $currentUserId },
        action: { _eq: "like" }
      },
      limit: 1
    ) {
      id
    }
  }
`;

const SAVE_PROFILE_MUTATION = gql`
  mutation SaveProfile($savedProfileUserId: uuid!) {
    insert_saved_profiles_one(object: { saved_profile_user_id: $savedProfileUserId }) {
      # saving_user_id is set by Hasura permission X-Hasura-User-Id preset
      id
    }
  }
`;

const UNSAVE_PROFILE_MUTATION = gql`
  mutation UnsaveProfile($currentUserId: uuid!, $savedProfileUserId: uuid!) {
    delete_saved_profiles(
      where: {
        saving_user_id: { _eq: $currentUserId },
        saved_profile_user_id: { _eq: $savedProfileUserId }
      }
    ) {
      affected_rows
    }
  }
`;

const GET_MY_SAVED_PROFILE_IDS = gql`
  query GetMySavedProfileIds($currentUserId: uuid!) {
    saved_profiles(where: {saving_user_id: {_eq: $currentUserId}}) {
      saved_profile_user_id
    }
  }
`;


const SwipePage: React.FC = () => {
  const user = useUserData();
  const currentUserId = user?.id;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUserName, setMatchedUserName] = useState('');
  const [savedProfileIds, setSavedProfileIds] = useState<Set<string>>(new Set());

  const { loading, error, data, refetch: refetchCandidates } = useQuery(GET_SWIPE_CANDIDATES, {
    variables: { currentUserId },
    skip: !currentUserId,
    fetchPolicy: 'network-only',
  });

  const { refetch: refetchMySavedIds } = useQuery(GET_MY_SAVED_PROFILE_IDS, {
    variables: { currentUserId },
    skip: !currentUserId,
    onCompleted: (data) => {
      const ids: Set<string> = new Set(data.saved_profiles.map((p: { saved_profile_user_id: string }) => p.saved_profile_user_id));
      setSavedProfileIds(ids);
    }
  });

  const [recordSwipe] = useMutation(RECORD_SWIPE_MUTATION);
  const { refetch: checkForMatch } = useQuery(CHECK_FOR_MATCH_QUERY, { skip: true, fetchPolicy: 'network-only' });
  const [saveProfileMutation] = useMutation(SAVE_PROFILE_MUTATION);
  const [unsaveProfileMutation] = useMutation(UNSAVE_PROFILE_MUTATION);

  useEffect(() => {
    if (data?.profiles) {
      setProfiles(data.profiles);
      setCurrentIndex(0);
    }
  }, [data]);

  const handleAdvanceCard = () => {
    if (currentIndex >= profiles.length - 1) {
      refetchCandidates();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSwipe = async (swipedUserId: string, action: 'like' | 'pass') => {
    if (!currentUserId) return;
    handleAdvanceCard();

    try {
      await recordSwipe({ variables: { swipedUserId, action } });
      if (action === 'like') {
        const matchResult = await checkForMatch({ variables: { currentUserId, swipedUserId }});
        if (matchResult.data?.swipes && matchResult.data.swipes.length > 0) {
          const matchedProfile = profiles.find(p => p.user_id === swipedUserId);
          setMatchedUserName(matchedProfile?.username || 'Someone');
          setShowMatchModal(true);
        }
      }
    } catch (e) {
      console.error('Error recording swipe:', e);
    }
  };

  const handleSaveToggle = async (profileToSaveId: string) => {
    if (!currentUserId) return;
    const isCurrentlySaved = savedProfileIds.has(profileToSaveId);

    try {
      if (isCurrentlySaved) {
        await unsaveProfileMutation({ variables: { currentUserId, savedProfileUserId: profileToSaveId } });
        setSavedProfileIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(profileToSaveId);
          return newSet;
        });
      } else {
        await saveProfileMutation({ variables: { savedProfileUserId: profileToSaveId } });
        setSavedProfileIds(prev => new Set(prev).add(profileToSaveId));
      }
      refetchMySavedIds(); // Or update local state optimistically / based on mutation response
    } catch (err) {
        console.error("Error toggling save state:", err)
        // Handle error (e.g., if save fails due to constraint, or unsave fails)
        // Potentially revert optimistic update here
    }
  };


  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchedUserName('');
  };

  if (loading) return <p className="text-center p-10">Loading profiles...</p>;
  if (error) return <p className="text-center p-10 text-red-500">Error loading profiles: {error.message}. Please ensure the Hasura relationship in GET_SWIPE_CANDIDATES is correctly named.</p>;

  const currentProfile = profiles[currentIndex];

  if (!currentProfile && profiles.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <h3 className="text-2xl font-semibold mb-4">No More Profiles</h3>
        <p className="text-slate-400 mb-6">You've seen all available profiles for now. Check back later!</p>
        <button onClick={() => refetchCandidates()} className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md">Refresh</button>
      </div>
    );
  }

  if (!currentProfile && currentIndex > 0 && profiles.length > 0) {
     return (
        <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <h3 className="text-2xl font-semibold mb-4">Fetching more...</h3>
            <button onClick={() => refetchCandidates()} className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md">Refresh Manually</button>
        </div>
     );
  }

  if (!currentProfile) {
    return <p className="text-center p-10">No profiles available at the moment. Try refreshing.</p>;
  }

  const Card: React.FC<{ profile: Profile; onSwipe: (action: 'like' | 'pass') => void; onSave: () => void; isSaved: boolean }> =
    ({ profile, onSwipe, onSave, isSaved }) => (
    <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white">
          {profile.username.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-3xl font-bold text-white">{profile.username}</h2>
        {profile.full_name && <p className="text-slate-400">{profile.full_name}</p>}
      </div>

      <div className="space-y-3 mb-6 text-sm">
        {profile.bio && <p className="text-slate-300 leading-relaxed text-center italic">"{profile.bio}"</p>}
        {profile.primary_role_seeking && <p><strong className="text-slate-200">Seeking:</strong> {profile.primary_role_seeking}</p>}
        {profile.core_skills && profile.core_skills.length > 0 && <div><strong className="text-slate-200">Skills:</strong> <span className="text-slate-400">{profile.core_skills.join(', ')}</span></div>}
        {profile.interests && profile.interests.length > 0 && <div><strong className="text-slate-200">Interests:</strong> <span className="text-slate-400">{profile.interests.join(', ')}</span></div>}
      </div>

      <div className="flex justify-around items-center pt-6 border-t border-slate-700">
        <button onClick={() => onSwipe('pass')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full text-2xl text-red-500 transition-transform transform hover:scale-110" aria-label="Pass">✕</button>
        <button onClick={onSave} className={`p-3 rounded-full text-2xl transition-transform transform hover:scale-110 ${isSaved ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-amber-400'}`} aria-label="Save">★</button>
        <button onClick={() => onSwipe('like')} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full text-2xl text-green-500 transition-transform transform hover:scale-110" aria-label="Like">❤️</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.32))] py-8 px-4">
      <Card
        profile={currentProfile}
        onSwipe={(action) => handleSwipe(currentProfile.user_id, action)}
        onSave={() => handleSaveToggle(currentProfile.user_id)}
        isSaved={savedProfileIds.has(currentProfile.user_id)}
      />

      {showMatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
            <h2 className="text-4xl font-bold text-rose-500 mb-4">It's a Match!</h2>
            <p className="text-xl text-white mb-6">You and {matchedUserName} have liked each other.</p>
            <button onClick={closeMatchModal} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-lg mr-2">Keep Swiping</button>
            <button onClick={() => { closeMatchModal(); alert('Navigate to chat with ' + matchedUserName); }} className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-lg">Send a Message</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipePage;
