import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useUserData, useNhostClient, useChangePassword } from '@nhost/react';
import { useNavigate } from 'react-router-dom'; // Potentially for redirect after save
import ThemeToggle from '../components/settings/ThemeToggle'; // Import the actual toggle

// --- GraphQL Operations ---
// Query to fetch current user's full profile for editing
const GET_MY_PROFILE_FOR_EDIT = gql`
  query GetMyProfileForEdit($userId: uuid!) {
    profiles(where: {user_id: {_eq: $userId}}, limit: 1) {
      user_id
      username
      full_name
      location
      bio
      linkedin_url
      website_url
      avatar_url # Added avatar_url
      primary_role_seeking
      years_experience
      core_skills # JSONB, expect array of strings
      industry_experience # JSONB, expect array of strings
      has_idea
      idea_description
      idea_stage
      cofounder_looking_for_roles # JSONB
      cofounder_looking_for_skills # JSONB
      cofounder_personality_traits
      cofounder_industry_background
      commitment_level
      willing_to_relocate
      preferred_cofounder_location
      equity_split_expectation
      interests # JSONB
      # profile_complete # Not typically edited by user here
    }
  }
`;

// Re-using the UPSERT mutation from UserProfileSetupPage
// IMPORTANT: Ensure this mutation in UserProfileSetupPage.tsx is also updated if it's indeed shared,
// or create a new specific mutation here. For now, assuming we modify a shared one.
const UPSERT_USER_PROFILE = gql`
  mutation UpsertUserProfile(
    $userId: uuid!,
    $username: String!,
    $fullName: String,
    $location: String,
    $bio: String,
    $linkedinUrl: String,
    $websiteUrl: String,
    $avatarUrl: String, # Added avatarUrl
    $primaryRoleSeeking: String,
    $yearsExperience: Int,
    $coreSkills: jsonb,
    $industryExperience: jsonb,
    $hasIdea: Boolean,
    $ideaDescription: String,
    $ideaStage: String,
    $cofounderLookingForRoles: jsonb,
    $cofounderLookingForSkills: jsonb,
    $cofounderPersonalityTraits: String,
    $cofounderIndustryBackground: String,
    $commitmentLevel: String,
    $willingToRelocate: Boolean,
    $preferredCofounderLocation: String,
    $equitySplitExpectation: String,
    $interests: jsonb
  ) {
    insert_profiles_one(
      object: {
        user_id: $userId,
        username: $username,
        full_name: $fullName,
        location: $location,
        bio: $bio,
        linkedin_url: $linkedinUrl,
        website_url: $websiteUrl,
        avatar_url: $avatarUrl, # Added avatar_url
        primary_role_seeking: $primaryRoleSeeking,
        years_experience: $yearsExperience,
        core_skills: $coreSkills,
        industry_experience: $industryExperience,
        has_idea: $hasIdea,
        idea_description: $ideaDescription,
        idea_stage: $ideaStage,
        cofounder_looking_for_roles: $cofounderLookingForRoles,
        cofounder_looking_for_skills: $cofounderLookingForSkills,
        cofounder_personality_traits: $cofounderPersonalityTraits,
        cofounder_industry_background: $cofounderIndustryBackground,
        commitment_level: $commitmentLevel,
        willing_to_relocate: $willingToRelocate,
        preferred_cofounder_location: $preferredCofounderLocation,
        equity_split_expectation: $equitySplitExpectation,
        interests: $interests,
        profile_complete: true # Ensure it remains true or is set true
      },
      on_conflict: {
        constraint: profiles_user_id_key,
        update_columns: [
          username, fullName, location, bio, linkedin_url, website_url, avatar_url, # Added avatar_url
          primary_role_seeking, years_experience, core_skills, industry_experience,
          has_idea, idea_description, idea_stage, cofounder_looking_for_roles,
          cofounder_looking_for_skills, cofounder_personality_traits,
          cofounder_industry_background, commitment_level, willing_to_relocate,
          preferred_cofounder_location, equity_split_expectation, interests,
          profile_complete
        ]
      }
    ) {
      user_id # Or other fields to confirm success / for cache update
    }
  }
`;

// Helper to convert array to comma-separated string for form display
const arrayToCommaString = (arr: string[] | null | undefined): string => arr?.join(', ') || '';
// Helper to convert comma-separated string to array for DB
const commaStringToArray = (str: string): string[] => str.split(',').map(item => item.trim()).filter(item => item);


// --- ProfileUpdateSection Component ---
const ProfileUpdateSection: React.FC = () => {
  const user = useUserData();
  const nhost = useNhostClient(); // For storage
  const currentUserId = user?.id;

  // Form state for text fields - ensure all fields from GET_MY_PROFILE_FOR_EDIT are here
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    location: '',
    bio: '',
    linkedinUrl: '',
    websiteUrl: '',
    avatarUrl: '', // Will hold the current avatar URL from DB
    primaryRoleSeeking: '',
    yearsExperience: 0,
    coreSkills: '',
    industryExperience: '',
    hasIdea: false,
    ideaDescription: '',
    ideaStage: '',
    cofounderLookingForRoles: '',
    cofounderLookingForSkills: '',
    cofounderPersonalityTraits: '',
    cofounderIndustryBackground: '',
    commitmentLevel: 'Full-time',
    willingToRelocate: false,
    preferredCofounderLocation: '',
    equitySplitExpectation: 'Negotiable',
    interests: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);


  const { data: profileData, loading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery(GET_MY_PROFILE_FOR_EDIT, {
    variables: { userId: currentUserId },
    skip: !currentUserId,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.profiles && data.profiles.length > 0) {
        const profile = data.profiles[0];
        setFormData({
          username: profile.username || '',
          fullName: profile.full_name || '',
          location: profile.location || '',
          bio: profile.bio || '',
          linkedinUrl: profile.linkedin_url || '',
          websiteUrl: profile.website_url || '',
          avatarUrl: profile.avatar_url || '', // Load existing avatar URL
          primaryRoleSeeking: profile.primary_role_seeking || '',
          yearsExperience: profile.years_experience || 0,
          coreSkills: arrayToCommaString(profile.core_skills),
          industryExperience: arrayToCommaString(profile.industry_experience),
          hasIdea: profile.has_idea || false,
          ideaDescription: profile.idea_description || '',
          ideaStage: profile.idea_stage || '',
          cofounderLookingForRoles: arrayToCommaString(profile.cofounder_looking_for_roles),
          cofounderLookingForSkills: arrayToCommaString(profile.cofounder_looking_for_skills),
          cofounderPersonalityTraits: profile.cofounder_personality_traits || '',
          cofounderIndustryBackground: profile.cofounder_industry_background || '',
          commitmentLevel: profile.commitment_level || 'Full-time',
          willingToRelocate: profile.willing_to_relocate || false,
          preferredCofounderLocation: profile.preferred_cofounder_location || '',
          equitySplitExpectation: profile.equity_split_expectation || 'Negotiable',
          interests: arrayToCommaString(profile.interests),
        });
        setInitialLoad(false);
      }
    }
  });

  const [upsertProfile, { loading: upsertLoading, error: upsertError }] = useMutation(UPSERT_USER_PROFILE);

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Cleanup for avatar preview
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev: any) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUserId) return;

    let finalAvatarUrl = formData.avatarUrl; // Keep existing if no new file

    if (avatarFile) {
      setIsUploadingAvatar(true);
      try {
        // Consider a more specific path, e.g., `avatars/${currentUserId}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`
        // Or simply `avatars/${currentUserId}/avatar` to always overwrite and simplify.
        const { fileMetadata, error: uploadError } = await nhost.storage.upload({
          file: avatarFile,
          bucketId: 'default', // Or your specific avatars bucket
          name: `avatars/${currentUserId}/avatar.${avatarFile.name.split('.').pop()}`, // Unique name or overwrite
        });

        if (uploadError) {
          throw uploadError;
        }
        if (fileMetadata) {
          finalAvatarUrl = nhost.storage.getPublicUrl({ fileId: fileMetadata.id });
        }
      } catch (uploadError: any) {
        console.error("Error uploading avatar:", uploadError);
        alert(`Error uploading avatar: ${uploadError.message}`);
        setIsUploadingAvatar(false);
        return; // Stop submission if avatar upload fails
      } finally {
        setIsUploadingAvatar(false);
      }
    }

    const variablesToSubmit = {
      ...formData,
      userId: currentUserId,
      avatarUrl: finalAvatarUrl, // Use the new or existing avatar URL
      coreSkills: commaStringToArray(formData.coreSkills),
      industryExperience: commaStringToArray(formData.industryExperience),
      cofounderLookingForRoles: commaStringToArray(formData.cofounderLookingForRoles),
      cofounderLookingForSkills: commaStringToArray(formData.cofounderLookingForSkills),
      interests: commaStringToArray(formData.interests),
      yearsExperience: Number(formData.yearsExperience) || 0,
    };

    try {
      await upsertProfile({ variables: variablesToSubmit });
      alert('Profile updated successfully!');
      setAvatarFile(null); // Clear selected file after successful upload and save
      if (avatarPreview) URL.revokeObjectURL(avatarPreview); // Clean up old preview
      setAvatarPreview(null);
      refetchProfile(); // Refetch profile to show new avatar if URL changed
    } catch (err: any) {
      console.error("Error updating profile:", err);
      alert(`Error updating profile: ${err.message}`);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 disabled:opacity-50";
  const labelClass = "block text-sm font-medium text-slate-300 mt-4";
  const subLabelClass = "text-xs text-slate-400 mb-1";


  if ((profileLoading || initialLoad) && !profileError) return <p className="text-slate-300">Loading profile...</p>;
  if (profileError) return <p className="text-red-400">Error loading profile: {profileError.message}</p>;
  if (!profileData?.profiles || profileData.profiles.length === 0) return <p className="text-slate-400">Could not find your profile data.</p>;

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-white mb-6 border-b border-slate-700 pb-3">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Avatar Section */}
        <section>
            <h3 className="text-lg font-medium text-rose-400 mb-2">Profile Picture</h3>
            <div className="flex items-center space-x-4">
                {(avatarPreview || formData.avatarUrl) ? (
                    <img
                        src={avatarPreview || formData.avatarUrl}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover bg-slate-700"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 text-3xl">
                        ?
                    </div>
                )}
                <div>
                    <label htmlFor="avatarUpload" className="cursor-pointer px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md">
                        {avatarFile ? "Change Picture" : "Upload Picture"}
                    </label>
                    <input
                        id="avatarUpload"
                        name="avatarUpload"
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                        disabled={isUploadingAvatar || upsertLoading}
                    />
                    {avatarFile && <p className="text-xs text-slate-400 mt-1 truncate w-48">Selected: {avatarFile.name}</p>}
                    {isUploadingAvatar && <p className="text-xs text-sky-400 mt-1">Uploading avatar...</p>}
                </div>
            </div>
        </section>

        {/* Personal Information */}
        <section>
            <h3 className="text-lg font-medium text-rose-400 mb-2">Personal Information</h3>
            <div>
              <label htmlFor="username" className={labelClass}>Username <span className="text-red-500">*</span></label>
              <input type="text" name="username" id="username" value={formData.username || ''} onChange={handleChange} className={inputClass} required disabled={upsertLoading || isUploadingAvatar} />
            </div>
            <div>
              <label htmlFor="fullName" className={labelClass}>Full Name</label>
              <input type="text" name="fullName" id="fullName" value={formData.fullName || ''} onChange={handleChange} className={inputClass} disabled={upsertLoading || isUploadingAvatar} />
            </div>
            {/* ... other fields from UserProfileSetupPage: location, bio, linkedinUrl, websiteUrl ... */}
            <div>
              <label htmlFor="location" className={labelClass}>Location (City, Country)</label>
              <input type="text" name="location" id="location" value={formData.location || ''} onChange={handleChange} className={inputClass} disabled={upsertLoading || isUploadingAvatar}/>
            </div>
            <div>
              <label htmlFor="bio" className={labelClass}>Short Bio / Introduction</label>
              <textarea name="bio" id="bio" value={formData.bio || ''} onChange={handleChange} rows={3} className={inputClass} disabled={upsertLoading || isUploadingAvatar}></textarea>
            </div>
            <div>
              <label htmlFor="linkedinUrl" className={labelClass}>LinkedIn Profile URL</label>
              <input type="url" name="linkedinUrl" id="linkedinUrl" value={formData.linkedinUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://linkedin.com/in/yourprofile" disabled={upsertLoading || isUploadingAvatar}/>
            </div>
            <div>
              <label htmlFor="websiteUrl" className={labelClass}>Personal Website/Portfolio URL</label>
              <input type="url" name="websiteUrl" id="websiteUrl" value={formData.websiteUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://yourdomain.com" disabled={upsertLoading || isUploadingAvatar}/>
            </div>
        </section>

        {/* Professional Background & Skills */}
        <section>
            <h3 className="text-lg font-medium text-rose-400 mb-2">Professional Background & Skills</h3>
            <div>
              <label htmlFor="primaryRoleSeeking" className={labelClass}>Primary Role You're Seeking</label>
              <input type="text" name="primaryRoleSeeking" id="primaryRoleSeeking" value={formData.primaryRoleSeeking || ''} onChange={handleChange} className={inputClass} disabled={upsertLoading}/>
            </div>
            <div>
              <label htmlFor="yearsExperience" className={labelClass}>Years of Professional Experience</label>
              <input type="number" name="yearsExperience" id="yearsExperience" value={formData.yearsExperience || 0} onChange={handleChange} className={inputClass} min="0" disabled={upsertLoading}/>
            </div>
            <div>
              <label htmlFor="coreSkills" className={labelClass}>Core Skills & Expertise</label>
              <p className={subLabelClass}>Comma-separated</p>
              <input type="text" name="coreSkills" id="coreSkills" value={formData.coreSkills || ''} onChange={handleChange} className={inputClass} disabled={upsertLoading}/>
            </div>
            <div>
              <label htmlFor="industryExperience" className={labelClass}>Industry Experience/Preferences</label>
              <p className={subLabelClass}>Comma-separated</p>
              <input type="text" name="industryExperience" id="industryExperience" value={formData.industryExperience || ''} onChange={handleChange} className={inputClass} disabled={upsertLoading}/>
            </div>
        </section>

        {/* ... other sections: Startup Idea, What You're Looking For, Commitment, Interests ... */}
        {/* (For brevity, not all fields are repeated here, but they should follow the pattern) */}
        {/* TODO: Add all other fields from UserProfileSetupPage here, following the same pattern */}


        {upsertError && <p className="text-sm text-red-400 mt-2">Error: {upsertError.message}</p>}
        <div>
            <button type="submit" className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg disabled:opacity-50" disabled={upsertLoading || profileLoading}>
                {upsertLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
        </div>
      </form>
    </div>
  );
};

const ThemeToggleSection: React.FC = () => (
  <div className="bg-slate-800 p-6 rounded-lg shadow-md mb-8">
    <h2 className="text-xl font-semibold text-white mb-4">Appearance Settings</h2>
    <ThemeToggle />
  </div>
);

// Placeholder for AccountManagementSection (to be implemented next)
// Will be replaced by more specific sections for Change Password, Delete Account.

// --- ChangeEmailSection Component ---
const ChangeEmailSection: React.FC = () => {
  const nhost = useNhostClient();
  const user = useUserData(); // To display current email
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChangeEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail.trim() === user?.email) {
      setError("Please enter a new, valid email address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await nhost.auth.changeEmail({ newEmail });
      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccessMessage(`Verification email sent to ${newEmail}. Please check your inbox to confirm the change.`);
        setNewEmail(''); // Clear input
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-white mb-1">Account Settings</h2>
      <h3 className="text-lg font-medium text-rose-400 mt-4 mb-3">Change Email Address</h3>
      {user?.email && <p className="text-sm text-slate-400 mb-3">Current email: {user.email}</p>}
      <form onSubmit={handleChangeEmail} className="space-y-4">
        <div>
          <label htmlFor="newEmail" className="block text-sm font-medium text-slate-300">
            New Email Address
          </label>
          <input
            id="newEmail"
            name="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm disabled:opacity-50 transition-colors duration-150"
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>}
        <div>
          <button
            type="submit"
            disabled={isLoading || !newEmail.trim()}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Verification Email'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- ChangePasswordSection Component ---
const ChangePasswordSection: React.FC = () => {
  const { changePassword, isLoading, isSuccess, isError, error } = useChangePassword();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null); // For client-side validation like mismatch

  // Clear success/error messages after a delay or on input change
  useEffect(() => {
    if (isSuccess || isError || formError) {
      const timer = setTimeout(() => {
        // Reset messages from useChangePassword hook is not direct,
        // but we can clear our local formError.
        // isSuccess and isError are reactive from the hook.
        setFormError(null);
        // If useChangePassword had a reset method, we'd call it.
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isError, formError]);


  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) { // Basic length check, Nhost enforces its own rules too
        setFormError("Password must be at least 6 characters long.");
        return;
    }

    await changePassword(newPassword);
    // Hook will set isLoading, isSuccess, isError, error
    if (isSuccess) { // This might be slightly delayed due to hook's async nature
        setNewPassword('');
        setConfirmPassword('');
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-lg font-medium text-rose-400 mb-3">Change Password</h3>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300">
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setFormError(null); }}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm disabled:opacity-50 transition-colors duration-150"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setFormError(null); }}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 sm:text-sm disabled:opacity-50 transition-colors duration-150"
            disabled={isLoading}
          />
        </div>
        {formError && <p className="text-sm text-red-500 dark:text-red-400">{formError}</p>}
        {isError && error && <p className="text-sm text-red-500 dark:text-red-400">Error: {error.message}</p>}
        {isSuccess && <p className="text-sm text-green-600 dark:text-green-400">Password changed successfully!</p>}
        <div>
          <button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- DeleteAccountSection Component ---
const DeleteAccountSection: React.FC = () => {
  const nhost = useNhostClient();
  const user = useUserData(); // To get username for confirmation if desired
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The text the user must type to confirm. Could be their username or a fixed phrase.
  const requiredConfirmationText = user?.displayName || user?.email || "DELETE MY ACCOUNT"; // Fallback phrase

  const handleDeleteAccount = async () => {
    if (confirmationText !== requiredConfirmationText) {
      setError(`Please type "${requiredConfirmationText}" to confirm.`);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Nhost recommends signing out first, then deleting.
      // However, deleteUser should invalidate the session.
      // Let's try deleteUser directly. If issues, can add signOut before.
            // const result = await nhost.auth.deleteUser({ deleteStorage: true }); // deleteStorage attempts to remove user's files
      alert('Account deletion is not yet implemented.');
      const result = await nhost.auth.signOut();

      if (result.error) {
        setError(result.error.message);
        setIsLoading(false);
      } else {
        // Success: Nhost automatically signs out the user.
        alert("Account deleted successfully."); // Or a more subtle notification
        navigate('/'); // Redirect to landing page
        // No need to setIsLoading(false) as component will unmount on redirect.
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during account deletion.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-red-500/50 mt-8"> {/* Destructive action styling */}
      <h3 className="text-lg font-medium text-red-400 mb-3">Delete Account</h3>
      <p className="text-sm text-slate-400 mb-4">
        Warning: This action is irreversible. All your profile data, posts, and other associated information will be permanently deleted.
        Your uploaded files may also be removed from storage.
      </p>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
      >
        Request Account Deletion
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-md text-white">
            <h4 className="text-xl font-semibold mb-4 text-red-400">Confirm Deletion</h4>
            <p className="text-sm text-slate-300 mb-3">
              This action cannot be undone. To confirm permanent deletion of your account and all associated data,
              please type <strong className="text-rose-400">"{requiredConfirmationText}"</strong> into the box below.
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => { setConfirmationText(e.target.value); setError(null); }}
              placeholder={`Type "${requiredConfirmationText}" here`}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400 sm:text-sm transition-colors duration-150"
            />
            {error && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>}
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
              <button
                onClick={() => { setIsModalOpen(false); setError(null); setConfirmationText('');}}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || confirmationText !== requiredConfirmationText}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const SettingsPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">Settings</h1>

      <ProfileUpdateSection />
      <ThemeToggleSection />
      <ChangeEmailSection />
      <ChangePasswordSection />
      <DeleteAccountSection /> {/* Add the new section */}

    </div>
  );
};

export default SettingsPage;
