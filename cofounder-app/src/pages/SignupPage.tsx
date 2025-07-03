import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNhostClient, useSignUpEmailPassword } from '@nhost/react'; // useSignUpEmailPassword hook
import { NhostSignUpResult } from '@nhost/nhost-js';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const nhost = useNhostClient();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Nhost hook for email/password sign up
  const { signUpEmailPassword, isLoading, isSuccess, needsEmailVerification, isError, error } = useSignUpEmailPassword();

  const handleGoogleSignup = async () => {
    try {
      const result: NhostSignUpResult = await nhost.auth.signIn({
        provider: 'google',
      });
      if (result.error) {
        console.error('Google Sign Up Error:', result.error);
        alert(`Google Sign Up Error: ${result.error.message}`); // Simple alert for now
      } else if (result.session) {
        // Google sign-in successful, Nhost usually handles user creation.
        // The ProtectedRoute will handle redirection to /profile-setup or /dashboard.
        navigate('/dashboard'); // Or let ProtectedRoute handle it
      }
    } catch (e) {
      console.error('Google Sign Up Exception:', e);
      alert('An unexpected error occurred during Google Sign Up.');
    }
  };

  const handleEmailPasswordSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) {
        alert('Username is required.');
        return;
    }
    // The Nhost backend needs to be configured to use username along with email/password.
    // By default, Nhost's `signUpEmailPassword` only takes email and password.
    // For username, we need to pass it in the `options.defaultAllowedRoles` and `options.metadata`
    // Or, more commonly, collect username during a separate profile setup step.
    // For now, let's assume we collect it and intend to store it in user metadata or profile later.
    // The hook `useSignUpEmailPassword` does not directly support arbitrary metadata like username during signup.
    // We'll use nhost.auth.signUp directly for more control if needed, or collect username later.
    // For this step, we'll use the hook and note that username needs to be handled post-signup in profile setup.

    const result = await signUpEmailPassword(email, password, {
        // Nhost's useSignUpEmailPassword hook has an `options` parameter.
        // We can specify metadata here if the backend is configured to accept it.
        // However, 'username' is a top-level concept in Nhost auth for passwordless email.
        // For standard email/password, username is typically part of the user's profile data, not direct auth credentials.
        // Let's proceed, assuming username will be set in the profile setup page.
        // displayName: username, // This would be a good place if supported directly by the hook for user table.
                                // Nhost's default user table has `displayName`.
        metadata: {
            // We *could* put username here if we plan to copy it to the profile table later.
            // For now, let's keep it simple and assume username is primarily for the profile table.
        }
    });

    // After calling signUpEmailPassword, the hook's state (isSuccess, isError, etc.) will update.
    // No need to manually check result here if we rely on hook's state for UI feedback.
  };

  // Handle redirection and messages based on hook state
  React.useEffect(() => {
    if (isSuccess) {
      // If needsEmailVerification is true, Nhost sends a verification email.
      // The user is technically "signed up" but needs to verify.
      // You might want to show a message here.
      // For this app, we'll redirect to profile-setup assuming they'll verify later
      // or if auto-verification is on / not required for local dev.
      // Nhost default is email verification ON.
      if (needsEmailVerification) {
        alert('Signup successful! Please check your email to verify your account before logging in.');
        navigate('/login'); // Go to login after showing verification message
      } else {
        // If no verification needed or auto-verified (common in local dev with Nhost CLI)
        // The user session is active. Let ProtectedRoute handle next step.
        // Typically, this means redirecting to /profile-setup if profile is incomplete.
        navigate('/profile-setup'); // Or let ProtectedRoute decide by navigating to a protected area like /dashboard
      }
    }
  }, [isSuccess, needsEmailVerification, navigate]);


  return (
    <div className="min-h-screen bg-slate-800 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 shadow-xl rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Create Your Account</h1>

        <form onSubmit={handleEmailPasswordSignup} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300">
              Username (set in profile later)
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-colors duration-150 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              placeholder="Your desired username"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This will be your public display name.</p>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6} // Nhost default min password length
              className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm border border-slate-300 dark:border-slate-600 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm transition-colors duration-150 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {isError && error && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center">Error: {error.message}</p>
          )}
           {needsEmailVerification && isSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">Success! Please check your email to verify your account.</p>
          )}


          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800 focus:ring-rose-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing up...' : 'Sign Up with Email'}
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
              onClick={handleGoogleSignup}
              type="button"
              className="w-full flex items-center justify-center px-8 py-3 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-rose-500"
            >
              {/* Basic SVG for Google logo - replace with actual SVG if available */}
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 3.023c1.652 0 3 1.348 3 3s-1.348 3-3 3-3-1.348-3-3 1.348-3 3-3zm0 1.094c-1.05 0-1.906.857-1.906 1.906s.857 1.906 1.906 1.906 1.906-.857 1.906-1.906S11.05 6.117 10 6.117zM10 13.5c-2.48 0-4.5 2.02-4.5 4.5h9c0-2.48-2.02-4.5-4.5-4.5zm0 1c1.93 0 3.5 1.57 3.5 3.5H6.5c0-1.93 1.57-3.5 3.5-3.5z" clipRule="evenodd"></path></svg>
              Sign Up with Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-rose-500 hover:text-rose-400">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
