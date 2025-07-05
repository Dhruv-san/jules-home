import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNhostClient, useSignUpEmailPassword } from '@nhost/react'; // useSignUpEmailPassword hook


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
      const result = await nhost.auth.signIn({
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

    await signUpEmailPassword(email, password, {
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
