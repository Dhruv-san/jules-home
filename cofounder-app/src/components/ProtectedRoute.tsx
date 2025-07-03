import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthenticationStatus, useUserData, useNhostClient } from '@nhost/react'; // Added useNhostClient
import { gql, useQuery, ApolloProvider } from '@apollo/client'; // Added ApolloProvider

// Nhost provides an Apollo Client instance, let's use that.
// We need to wrap the part of the tree that uses useQuery with ApolloProvider
// if it's not already provided higher up by NhostProvider (which it should be for v3+ of @nhost/react).

// Check Nhost docs: @nhost/react v3+ NhostProvider already includes ApolloProvider.
// So, direct use of useQuery should be fine if @nhost/react is v3 or newer.
// The installed version is "@nhost/react": "^3.11.0", so it should be fine.

const GET_USER_PROFILE_STATUS = gql`
  query GetUserProfileStatus($userId: uuid!) {
    # Assuming your 'profiles' table has 'user_id' as a unique key,
    # and you want to fetch the profile associated with the logged-in user.
    # The primary key of the 'profiles' table itself is 'id'.
    # We query the 'profiles' table where its 'user_id' column matches the logged-in user's ID.
    profiles(where: {user_id: {_eq: $userId}}, limit: 1) {
      # id # This is the PK of the profiles table itself
      user_id # This is the FK to auth.users.id
      profile_complete
    }
  }
`;

const ProfileCompletionGate: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const user = useUserData();
  const location = useLocation();

  const { data, loading, error } = useQuery(GET_USER_PROFILE_STATUS, {
    variables: { userId: user?.id },
    skip: !user?.id, // Skip query if no user ID or if user data is not yet available
  });

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading user profile...</p></div>;
  }

  if (error) {
    console.error('Error fetching profile status:', error);
    // TODO: Implement better error handling, maybe redirect to an error page or show a toast
    return <div className="flex justify-center items-center h-screen"><p>Error checking profile status. Please try logging out and in again.</p></div>;
  }

  const profile = data?.profiles[0];
  const isProfileComplete = profile?.profile_complete;

  // If there's a user session but no profile record yet (e.g., first signup before profile creation step)
  // or if the profile is explicitly marked as incomplete.
  if (user && !isProfileComplete) {
    // Redirect them to the profile setup page.
    return <Navigate to="/profile-setup" state={{ from: location }} replace />;
  }

  return children; // Render the requested route if profile is complete or no user (letting auth gate handle it)
};


const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading authentication status...</p></div>; // Or a global spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, proceed to check profile completion.
  // Outlet renders the child route element (e.g., DashboardPage).
  return (
    <ProfileCompletionGate>
      <Outlet />
    </ProfileCompletionGate>
  );
};

export default ProtectedRoute;
