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

  const currentProfile = profiles[currentIndex];

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
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)', padding: 32, maxWidth: 420, margin: '0 auto', marginBottom: 32, transition: 'box-shadow 0.3s' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} style={{ width: 128, height: 128, background: '#e2e8f0', borderRadius: '50%', margin: '0 auto 18px', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}/>
        ) : (
            <HiOutlineUserCircle style={{ width: 128, height: 128, color: '#94a3b8', margin: '0 auto 18px' }}/>
        )}
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{profile.username}</h2>
        {profile.full_name && <p style={{ color: '#64748b', fontSize: 16, marginTop: 4 }}>{profile.full_name}</p>}
      </div>

      <div style={{ marginBottom: 24, fontSize: 15, borderTop: '1.5px solid #e2e8f0', paddingTop: 18 }}>
        {profile.bio && <p style={{ color: '#334155', fontStyle: 'italic', textAlign: 'center', marginBottom: 12 }}>&quot;{profile.bio}&quot;</p>}

        {profile.primary_role_seeking && (
          <div style={{ marginTop: 12 }}>
            <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Seeking Role:</h4>
            <p style={{ color: '#64748b' }}>{profile.primary_role_seeking}</p>
          </div>
        )}

        {(profile.core_skills && profile.core_skills.length > 0) &&
          <div style={{ marginTop: 12 }}>
            <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Core Skills:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.core_skills.map(skill => <span key={skill} style={{ background: '#fbcfe8', color: '#be185d', padding: '6px 16px', fontSize: 13, borderRadius: 999, fontWeight: 500, boxShadow: '0 1px 4px rgba(244,63,94,0.08)' }}>{skill}</span>)}
            </div>
          </div>
        }
        {(profile.interests && profile.interests.length > 0) &&
          <div style={{ marginTop: 12 }}>
            <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Interests:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.interests.map(interest => <span key={interest} style={{ background: '#bae6fd', color: '#0ea5e9', padding: '6px 16px', fontSize: 13, borderRadius: 999, fontWeight: 500, boxShadow: '0 1px 4px rgba(14,165,233,0.08)' }}>{interest}</span>)}
            </div>
          </div>
        }
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingTop: 18, borderTop: '1.5px solid #e2e8f0' }}>
        <button onClick={() => onSwipe('pass')} style={{ padding: 18, background: '#fff', borderRadius: '50%', color: '#ef4444', border: 'none', fontSize: 0, boxShadow: '0 2px 8px rgba(239,68,68,0.10)', cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }} aria-label="Pass">
          <HiX style={{ width: 32, height: 32 }} />
        </button>
        <button onClick={onSave} style={{ padding: 18, borderRadius: '50%', background: isSaved ? '#f59e42' : '#fff', color: isSaved ? '#fff' : '#f59e42', border: 'none', fontSize: 0, boxShadow: isSaved ? '0 2px 8px rgba(245,158,66,0.15)' : '0 2px 8px rgba(245,158,66,0.08)', cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }} aria-label="Save">
          <HiBookmark style={{ width: 28, height: 28 }} />
        </button>
        <button onClick={() => onSwipe('like')} style={{ padding: 18, background: '#fff', borderRadius: '50%', color: '#22c55e', border: 'none', fontSize: 0, boxShadow: '0 2px 8px rgba(34,197,94,0.10)', cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }} aria-label="Like">
          <HiHeart style={{ width: 32, height: 32 }} />
        </button>
      </div>
    </div>
  );

  // --- Main Return for SwipePage ---
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 12px' }}>
      {loading && <p style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading profiles...</p>}
      {error && <p style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>Error loading profiles: {error.message}. (Ensure 'swipes_received' relationship on 'profiles' table is correct in Hasura)</p>}

      {!currentProfile && profiles.length === 0 && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 420, margin: '0 auto', padding: 32, background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)' }}>
          <HiOutlineUserCircle style={{ width: 96, height: 96, color: '#94a3b8', marginBottom: 24 }} />
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>No More Profiles</h3>
          <p style={{ color: '#64748b', marginBottom: 24 }}>You&apos;ve explored all available profiles for now. Why not check back later or adjust your preferences?</p>
          <button onClick={() => refetchCandidates()} style={{ padding: '12px 32px', background: 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)', color: '#fff', fontWeight: 700, borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(244,63,94,0.10)', fontSize: 16, cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }}>Refresh</button>
        </div>
      )}

      {!currentProfile && currentIndex > 0 && profiles.length > 0 && !loading && (
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 32 }}>
             <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>Fetching more...</h3>
             <button onClick={() => refetchCandidates()} style={{ padding: '12px 32px', background: 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)', color: '#fff', fontWeight: 700, borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(244,63,94,0.10)', fontSize: 16, cursor: 'pointer', transition: 'background 0.2s, transform 0.1s', marginTop: 12 }}>Refresh Manually</button>
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
           <p style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Something went wrong loading the current profile. Try refreshing.</p>
      )}

      {showMatchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: 36, borderRadius: 24, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)', textAlign: 'center', maxWidth: 380, width: '100%', margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <span role="img" aria-label="match celebration" style={{ fontSize: 64, display: 'block', animation: 'bounce 1s infinite alternate' }}>🎉</span>
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#f43f5e', marginBottom: 12 }}>It's a Match!</h2>
            <p style={{ fontSize: 18, color: '#64748b', marginBottom: 32 }}>
              You and <span style={{ fontWeight: 600, color: '#1e293b' }}>{matchedUserName}</span> are now connected!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                <button
                    onClick={closeMatchModal}
                    style={{ padding: '12px 32px', background: '#e2e8f0', color: '#1e293b', fontWeight: 700, borderRadius: 10, border: 'none', fontSize: 16, cursor: 'pointer', marginBottom: 8 }}
                >
                    Keep Swiping
                </button>
                <button
                    onClick={() => { closeMatchModal(); alert('TODO: Navigate to chat with ' + matchedUserName); }}
                    style={{ padding: '12px 32px', background: 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)', color: '#fff', fontWeight: 700, borderRadius: 10, border: 'none', fontSize: 16, cursor: 'pointer' }}
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
