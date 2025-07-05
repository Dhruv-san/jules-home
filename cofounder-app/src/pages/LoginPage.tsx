import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useNhostClient, useSignInEmailPassword } from '@nhost/react';


const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nhost = useNhostClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signInEmailPassword, isLoading, isSuccess, needsEmailVerification, isError, error } = useSignInEmailPassword();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleGoogleLogin = async () => {
    try {
      const result = await nhost.auth.signIn({
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
              className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-colors duration-150 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
              className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-colors duration-150 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {isError && error && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center">Error: {error.message}</p>
          )}
          {needsEmailVerification && (
             <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">Please verify your email before logging in.</p>
          )}


          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800 focus:ring-rose-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Logging in...' : 'Log In with Email'}
            </button>
          </div>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-8 py-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-base font-semibold text-slate-700 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.07 1.53 7.47 2.81l5.54-5.39C33.64 3.61 29.28 1.5 24 1.5 14.98 1.5 7.13 7.73 4.13 15.19l6.91 5.37C12.98 15.13 17.06 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.66 7.01l7.19 5.59C43.87 37.13 46.1 31.3 46.1 24.55z"/>
                  <path fill="#FBBC05" d="M11.04 28.56A14.5 14.5 0 0 1 9.5 24c0-1.58.27-3.11.76-4.56l-6.91-5.37A23.97 23.97 0 0 0 0 24c0 3.77.9 7.34 2.5 10.56l8.54-6z"/>
                  <path fill="#EA4335" d="M24 46.5c6.28 0 11.55-2.08 15.39-5.67l-7.19-5.59c-2.01 1.35-4.59 2.16-8.2 2.16-6.94 0-11.02-5.63-12.96-8.87l-8.54 6C7.13 40.27 14.98 46.5 24 46.5z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </g>
              </svg>
              Log In with Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-rose-500 hover:text-rose-400">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
