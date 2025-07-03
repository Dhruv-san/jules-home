import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useNhostClient, useSignInEmailPassword } from '@nhost/react';
import { NhostSession, NhostSignInResult } from '@nhost/nhost-js';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nhost = useNhostClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signInEmailPassword, isLoading, isSuccess, needsEmailVerification, isError, error } = useSignInEmailPassword();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleGoogleLogin = async () => {
    try {
      const result: NhostSignInResult = await nhost.auth.signIn({
        provider: 'google',
      });
      if (result.error) {
        console.error('Google Sign In Error:', result.error);
        alert(`Google Sign In Error: ${result.error.message}`);
      } else if (result.session) {
        // Google sign-in successful
        // ProtectedRoute will check profile completion and redirect accordingly
        navigate(from, { replace: true });
      }
    } catch (e) {
      console.error('Google Sign In Exception:', e);
      alert('An unexpected error occurred during Google Sign In.');
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await signInEmailPassword(email, password);
    // Hook state (isSuccess, isError) will update and useEffect will handle redirection/messaging
  };

  useEffect(() => {
    if (isSuccess) {
      // If needsEmailVerification is true, the user hasn't verified their email yet.
      // They shouldn't be able to fully log in. Nhost session might be null or limited.
      if (needsEmailVerification) {
        alert('Please verify your email address before logging in.');
        // Optionally, you could clear the attempted session or guide them.
        // For now, just an alert. They remain on login page.
        // Consider `nhost.auth.signOut()` if a partial session was created that needs clearing.
      } else {
        // Login successful and email is verified (or verification not required)
        // ProtectedRoute will handle redirection to /profile-setup or /dashboard.
        navigate(from, { replace: true });
      }
    }
  }, [isSuccess, needsEmailVerification, navigate, from]);

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 shadow-xl rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Log In to CoFound</h1>

        <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="••••••••"
            />
          </div>

          {isError && error && (
            <p className="text-sm text-red-400 text-center">Error: {error.message}</p>
          )}
          {needsEmailVerification && ( // Show this if login attempt results in needsEmailVerification
             <p className="text-sm text-yellow-400 text-center">Please verify your email before logging in.</p>
          )}


          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-rose-500 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Log In with Email'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center px-8 py-3 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-rose-500"
            >
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 3.023c1.652 0 3 1.348 3 3s-1.348 3-3 3-3-1.348-3-3 1.348-3 3-3zm0 1.094c-1.05 0-1.906.857-1.906 1.906s.857 1.906 1.906 1.906 1.906-.857 1.906-1.906S11.05 6.117 10 6.117zM10 13.5c-2.48 0-4.5 2.02-4.5 4.5h9c0-2.48-2.02-4.5-4.5-4.5zm0 1c1.93 0 3.5 1.57 3.5 3.5H6.5c0-1.93 1.57-3.5 3.5-3.5z" clipRule="evenodd"></path></svg>
              Log In with Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-rose-500 hover:text-rose-400">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
