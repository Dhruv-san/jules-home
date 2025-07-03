import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthenticationStatus, useNhostClient } from '@nhost/react'; // Added useNhostClient for logout

const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuthenticationStatus();
  const nhost = useNhostClient();

  const handleLogout = async () => {
    await nhost.auth.signOut();
    // Redirect or further action after logout can be handled by ProtectedRoute or page redirects
  };

  return (
    <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
      <Link to="/">Home</Link>
      {!isAuthenticated && <Link to="/login">Login</Link>}
      {!isAuthenticated && <Link to="/signup">Sign Up</Link>}
      {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
      {isAuthenticated && <Link to="/profile-setup">Profile Setup</Link>} {/* Link to profile setup for easy access during dev */}
      {isAuthenticated && (
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', padding: 0, color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navbar;
