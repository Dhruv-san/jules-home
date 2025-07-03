import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';
import { HiX, HiHeart, HiBookmark, HiOutlineUserCircle } from 'react-icons/hi';

// --- Types ---
interface Profile {
  user_id: string;
  username: string;
  full_name?: string | null;
  bio?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  primary_role_seeking?: string | null;
  core_skills?: string[] | null;
  industry_experience?: string[] | null;
  interests?: string[] | null;
}

// --- GraphQL Definitions ---
const GET_SWIPE_CANDIDATES = gql`
  query GetSwipeCandidates($currentUserId: uuid!, $limit: Int = 10) {
    profiles(
      limit: $limit,
      where: {
        _and: [
          { user_id: { _neq: $currentUserId } },
          { profile_complete: { _eq: true } },
          { _not: { swipes_received: { swiper_user_id: { _eq: $currentUserId } } } }
        ]
      },
      order_by: { created_at: desc }
    ) {
      user_id
      username
      full_name
      bio
      avatar_url
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

// --- SwipePage Component ---
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
    fetchPolicy: 'network-only', // Ensure it fetches when needed
    onCompleted: (data) => {
      const ids = new Set(data.saved_profiles.map((p: { saved_profile_user_id: string }) => p.saved_profile_user_id));
      setSavedProfileIds(ids);
    }
  });

  const [recordSwipe] = useMutation(RECORD_SWIPE_MUTATION);
  const [checkForMatch] = useQuery(CHECK_FOR_MATCH_QUERY, { skip: true, fetchPolicy: 'network-only' });
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
      // console.error('Error recording swipe:', e); // Keep console.error for debugging
    }
  };

  const handleSaveToggle = async (profileToSaveId: string) => {
    if (!currentUserId) return;
    const isCurrentlySaved = savedProfileIds.has(profileToSaveId);

    try {
      if (isCurrentlySaved) {
        await unsaveProfileMutation({ variables: { currentUserId, savedProfileUserId: profileToSaveId } });
      } else {
        await saveProfileMutation({ variables: { savedProfileUserId: profileToSaveId } });
      }
      refetchMySavedIds();
    } catch (err) {
        console.error("Error toggling save state:", err);
    }
  };

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchedUserName('');
  };

  // --- Card Sub-Component ---
  const Card: React.FC<{ profile: Profile; onSwipe: (action: 'like' | 'pass') => void; onSave: () => void; isSaved: boolean }> =
    ({ profile, onSwipe, onSave, isSaved }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto transform transition-all duration-300 ease-in-out hover:shadow-slate-300/50 dark:hover:shadow-rose-500/20">
      <div className="text-center mb-6">
        {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-32 h-32 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 object-cover border-4 border-white dark:border-slate-700 shadow-lg"/>
        ) : (
            <HiOutlineUserCircle className="w-32 h-32 text-slate-400 dark:text-slate-500 mx-auto mb-4"/>
        )}
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{profile.username}</h2>
        {profile.full_name && <p className="text-slate-500 dark:text-slate-400 text-md mt-1">{profile.full_name}</p>}
      </div>

      <div className="space-y-4 mb-8 text-sm border-t border-slate-200 dark:border-slate-700 pt-6">
        {profile.bio && <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-center italic text-md line-clamp-3">"{profile.bio}"</p>}

        {profile.primary_role_seeking && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Seeking Role:</h4>
            <p className="text-slate-600 dark:text-slate-300">{profile.primary_role_seeking}</p>
          </div>
        )}

        {(profile.core_skills && profile.core_skills.length > 0) &&
          <div className="mt-4">
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Core Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {profile.core_skills.map(skill => <span key={skill} className="bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300 px-3 py-1 text-xs rounded-full font-medium shadow-sm">{skill}</span>)}
            </div>
          </div>
        }
        {(profile.interests && profile.interests.length > 0) &&
          <div className="mt-4">
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Interests:</h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(interest => <span key={interest} className="bg-sky-100 dark:bg-sky-900/80 text-sky-700 dark:text-sky-300 px-3 py-1 text-xs rounded-full font-medium shadow-sm">{interest}</span>)}
            </div>
          </div>
        }
      </div>

      <div className="flex justify-around items-center pt-6 border-t border-slate-200 dark:border-slate-700">
        <button onClick={() => onSwipe('pass')} className="p-4 bg-white dark:bg-slate-700/80 hover:bg-red-100 dark:hover:bg-red-500/30 rounded-full text-red-500 dark:text-red-400 transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 shadow-xl hover:shadow-red-300/50 dark:hover:shadow-red-500/40" aria-label="Pass">
          <HiX className="w-8 h-8" />
        </button>
        <button onClick={onSave} className={`p-4 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 shadow-xl ${isSaved ? 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400 hover:shadow-amber-400/50 dark:hover:shadow-amber-500/40' : 'bg-white dark:bg-slate-700/80 hover:bg-amber-100 dark:hover:bg-amber-500/30 text-amber-500 dark:text-amber-400 focus:ring-amber-500 hover:shadow-amber-300/50 dark:hover:shadow-amber-500/40'} focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800`} aria-label="Save">
          <HiBookmark className="w-7 h-7" />
        </button>
        <button onClick={() => onSwipe('like')} className="p-4 bg-white dark:bg-slate-700/80 hover:bg-green-100 dark:hover:bg-green-500/30 rounded-full text-green-500 dark:text-green-400 transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 shadow-xl hover:shadow-green-300/50 dark:hover:shadow-green-500/40" aria-label="Like">
          <HiHeart className="w-8 h-8" />
        </button>
      </div>
    </div>
  );

  // --- Main Return for SwipePage ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      {loading && <p className="text-center p-10 text-slate-700 dark:text-slate-300">Loading profiles...</p>}
      {error && <p className="text-center p-10 text-red-600 dark:text-red-400">Error loading profiles: {error.message}. (Ensure 'swipes_received' relationship on 'profiles' table is correct in Hasura)</p>}

      {!currentProfile && profiles.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 bg-white dark:bg-slate-800 rounded-xl shadow-xl">
          <HiOutlineUserCircle className="w-24 h-24 text-slate-400 dark:text-slate-500 mb-6" />
          <h3 className="text-2xl font-semibold mb-3 text-slate-700 dark:text-white">No More Profiles</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">You've explored all available profiles for now. Why not check back later or adjust your preferences?</p>
          <button onClick={() => refetchCandidates()} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-md transition-colors">Refresh</button>
        </div>
      )}

      {!currentProfile && currentIndex > 0 && profiles.length > 0 && !loading && (
         <div className="flex flex-col items-center justify-center text-center p-8">
             <h3 className="text-2xl font-semibold mb-4 text-slate-700 dark:text-white">Fetching more...</h3>
             <button onClick={() => refetchCandidates()} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-md transition-colors mt-2">Refresh Manually</button>
         </div>
      )}

      {currentProfile && (
        <Card
          profile={currentProfile}
          onSwipe={(action) => handleSwipe(currentProfile.user_id, action)}
          onSave={() => handleSaveToggle(currentProfile.user_id)}
          isSaved={savedProfileIds.has(currentProfile.user_id)}
        />
      )}

      {!currentProfile && !loading && profiles.length > 0 && currentIndex === 0 && (
           <p className="text-center p-10 text-slate-700 dark:text-slate-300">Something went wrong loading the current profile. Try refreshing.</p>
      )}

      {showMatchModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 dark:bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-auto">
            <div className="mb-5">
              <span role="img" aria-label="match celebration" className="text-7xl block animate-bounce">🎉</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-rose-500 dark:text-rose-400 mb-3 tracking-tight">It's a Match!</h2>
            <p className="text-lg text-slate-600 dark:text-slate-200 mb-8">
              You and <span className="font-semibold text-slate-800 dark:text-white">{matchedUserName}</span> are now connected!
            </p>
            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-col sm:space-y-3 md:flex-row md:space-y-0 md:justify-center md:space-x-4">
                <button
                    onClick={closeMatchModal}
                    className="w-full md:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-semibold rounded-lg transition-colors"
                >
                    Keep Swiping
                </button>
                <button
                    onClick={() => { closeMatchModal(); alert('TODO: Navigate to chat with ' + matchedUserName); }}
                    className="w-full md:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors"
                >
                    Send a Message
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipePage;
