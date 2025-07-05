import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '@nhost/react';
import { gql, useMutation } from '@apollo/client';

const UPSERT_USER_PROFILE = gql`
  mutation UpsertUserProfile(
    $userId: uuid!,
    $username: String!, # Make username required in form and here
    $fullName: String,
    $location: String,
    $bio: String,
    $linkedinUrl: String,
    $websiteUrl: String,
    $primaryRoleSeeking: String,
    $yearsExperience: Int,
    $coreSkills: jsonb, # Expects array of strings e.g., ["React", "Node.js"]
    $industryExperience: jsonb, # Expects array of strings
    $hasIdea: Boolean,
    $ideaDescription: String,
    $ideaStage: String,
    $cofounderLookingForRoles: jsonb, # Expects array of strings
    $cofounderLookingForSkills: jsonb, # Expects array of strings
    $cofounderPersonalityTraits: String,
    $cofounderIndustryBackground: String,
    $commitmentLevel: String,
    $willingToRelocate: Boolean,
    $preferredCofounderLocation: String,
    $equitySplitExpectation: String,
    $interests: jsonb # Expects array of strings
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
        profile_complete: true
      },
      on_conflict: {
        constraint: profiles_user_id_key, # The unique constraint on user_id
        update_columns: [
          username, full_name, location, bio, linkedin_url, website_url,
          primary_role_seeking, years_experience, core_skills, industry_experience,
          has_idea, idea_description, idea_stage, cofounder_looking_for_roles,
          cofounder_looking_for_skills, cofounder_personality_traits,
          cofounder_industry_background, commitment_level, willing_to_relocate,
          preferred_cofounder_location, equity_split_expectation, interests,
          profile_complete
          # updated_at will be handled by the trigger
        ]
      }
    ) {
      user_id
      profile_complete
    }
  }
`;

// Helper for multi-select or comma-separated string to array
const parseStringToArray = (str: string): string[] => {
    if (!str.trim()) return [];
    return str.split(',').map(item => item.trim()).filter(item => item);
};


const UserProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserData(); // Nhost hook to get current user data

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    location: '',
    bio: '',
    linkedinUrl: '',
    websiteUrl: '',
    primaryRoleSeeking: '',
    yearsExperience: 0,
    coreSkills: '', // Input as comma-separated string
    industryExperience: '', // Input as comma-separated string
    hasIdea: false,
    ideaDescription: '',
    ideaStage: '',
    cofounderLookingForRoles: '', // Input as comma-separated string
    cofounderLookingForSkills: '', // Input as comma-separated string
    cofounderPersonalityTraits: '',
    cofounderIndustryBackground: '',
    commitmentLevel: 'Full-time', // Default value
    willingToRelocate: false,
    preferredCofounderLocation: '',
    equitySplitExpectation: 'Negotiable', // Default value
    interests: '', // Input as comma-separated string
  });

  const [upsertProfile, { loading, error }] = useMutation(UPSERT_USER_PROFILE);

  useEffect(() => {
    // This effect should only run once when the user data is loaded and the username is not yet set.
    if (user && !formData.username) {
      let suggestedUsername = '';
      if (user.displayName) {
        suggestedUsername = user.displayName.split(' ')[0].toLowerCase() + Math.floor(Math.random() * 100);
      } else if (user.email) {
        suggestedUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/gi, '') + Math.floor(Math.random() * 100);
      }
      if (suggestedUsername) {
        setFormData(prev => ({ ...prev, username: suggestedUsername }));
      }
    }
  }, [user, formData.username]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    }
    else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) {
      alert('User not authenticated. Please log in.');
      return;
    }
    if (!formData.username.trim()) {
        alert('Username is required.');
        return;
    }

    const profileDataForDb = {
      ...formData,
      userId: user.id,
      coreSkills: parseStringToArray(formData.coreSkills),
      industryExperience: parseStringToArray(formData.industryExperience),
      cofounderLookingForRoles: parseStringToArray(formData.cofounderLookingForRoles),
      cofounderLookingForSkills: parseStringToArray(formData.cofounderLookingForSkills),
      interests: parseStringToArray(formData.interests),
      yearsExperience: Number(formData.yearsExperience) || 0,
    };

    try {
      const result = await upsertProfile({ variables: profileDataForDb });
      if (result.data?.insert_profiles_one?.profile_complete) {
        // Invalidate Apollo Cache for GET_USER_PROFILE_STATUS if necessary, or refetch.
        // For now, direct navigation. ProtectedRoute will re-check on next load.
        navigate('/dashboard');
      } else {
        // Handle case where mutation succeeded but profile_complete is not true (should not happen with this logic)
        console.error('Profile setup completed but profile_complete flag is false.', result);
        alert('Profile saved, but there might be an issue marking it complete. Please contact support.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      // Error is also available in the `error` object from useMutation hook
    }
  };

  // Basic form styling with Tailwind. This will be a long form.
  const inputClass = "mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500";
  const labelClass = "block text-sm font-medium text-slate-300 mt-4";
  const subLabelClass = "text-xs text-slate-400 mb-1";

  if (!user) {
    return <div className="min-h-screen bg-slate-800 flex justify-center items-center"><p className="text-white">Loading user data...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-800 text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-slate-900 shadow-xl rounded-lg p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Profile</h1>
        <p className="text-center text-slate-300 mb-8">
          This information will help us find the best co-founder matches for you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-slate-700 pb-2">Personal Information</h2>
            <div>
              <label htmlFor="username" className={labelClass}>Username <span className="text-red-500">*</span></label>
              <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label htmlFor="fullName" className={labelClass}>Full Name</label>
              <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="location" className={labelClass}>Location (City, Country)</label>
              <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="bio" className={labelClass}>Short Bio / Introduction</label>
              <textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} rows={3} className={inputClass}></textarea>
            </div>
            <div>
              <label htmlFor="linkedinUrl" className={labelClass}>LinkedIn Profile URL</label>
              <input type="url" name="linkedinUrl" id="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className={inputClass} placeholder="https://linkedin.com/in/yourprofile"/>
            </div>
            <div>
              <label htmlFor="websiteUrl" className={labelClass}>Personal Website/Portfolio URL</label>
              <input type="url" name="websiteUrl" id="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className={inputClass} placeholder="https://yourdomain.com"/>
            </div>
          </section>

          {/* Professional Background & Skills */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-slate-700 pb-2">Professional Background & Skills</h2>
            <div>
              <label htmlFor="primaryRoleSeeking" className={labelClass}>Primary Role You&apos;re Seeking (e.g., CEO, CTO, Technical)</label>
              <input type="text" name="primaryRoleSeeking" id="primaryRoleSeeking" value={formData.primaryRoleSeeking} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="yearsExperience" className={labelClass}>Years of Professional Experience</label>
              <input type="number" name="yearsExperience" id="yearsExperience" value={formData.yearsExperience} onChange={handleChange} className={inputClass} min="0" />
            </div>
            <div>
              <label htmlFor="coreSkills" className={labelClass}>Core Skills & Expertise</label>
              <p className={subLabelClass}>Comma-separated, e.g., React, Node.js, Product Management</p>
              <input type="text" name="coreSkills" id="coreSkills" value={formData.coreSkills} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="industryExperience" className={labelClass}>Industry Experience/Preferences</label>
              <p className={subLabelClass}>Comma-separated, e.g., Fintech, SaaS, Healthcare</p>
              <input type="text" name="industryExperience" id="industryExperience" value={formData.industryExperience} onChange={handleChange} className={inputClass} />
            </div>
          </section>

          {/* Startup Idea & Vision */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-slate-700 pb-2">Startup Idea & Vision</h2>
            <div className="flex items-center mt-2">
              <input type="checkbox" name="hasIdea" id="hasIdea" checked={formData.hasIdea} onChange={handleChange} className="h-4 w-4 text-rose-600 border-slate-500 rounded focus:ring-rose-500 bg-slate-700"/>
              <label htmlFor="hasIdea" className="ml-2 text-sm text-slate-300">I have a startup idea I&apos;m passionate about.</label>
            </div>
            {formData.hasIdea && (
              <>
                <div>
                  <label htmlFor="ideaDescription" className={labelClass}>Briefly describe your idea</label>
                  <textarea name="ideaDescription" id="ideaDescription" value={formData.ideaDescription} onChange={handleChange} rows={3} className={inputClass}></textarea>
                </div>
                <div>
                  <label htmlFor="ideaStage" className={labelClass}>What stage is your idea at?</label>
                  <select name="ideaStage" id="ideaStage" value={formData.ideaStage} onChange={handleChange} className={inputClass}>
                    <option value="">Select Stage</option>
                    <option value="Idea">Idea Stage</option>
                    <option value="MVP">MVP/Prototype</option>
                    <option value="Early Traction">Early Traction</option>
                    <option value="Growth">Growth Stage</option>
                  </select>
                </div>
              </>
            )}
          </section>

          {/* What You're Looking For in a Co-founder */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-slate-700 pb-2">What You&apos;re Looking For in a Co-founder</h2>
            <div>
              <label htmlFor="cofounderLookingForRoles" className={labelClass}>Primary role(s) you&apos;re looking for in a co-founder</label>
              <p className={subLabelClass}>Comma-separated, e.g., CTO, Marketing Lead</p>
              <input type="text" name="cofounderLookingForRoles" id="cofounderLookingForRoles" value={formData.cofounderLookingForRoles} onChange={handleChange} className={inputClass} />
            </div>
             <div>
              <label htmlFor="cofounderLookingForSkills" className={labelClass}>Key skills or expertise they should have</label>
              <p className={subLabelClass}>Comma-separated, e.g., Python, Sales, UI/UX Design</p>
              <input type="text" name="cofounderLookingForSkills" id="cofounderLookingForSkills" value={formData.cofounderLookingForSkills} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="cofounderPersonalityTraits" className={labelClass}>Important personality traits or working styles</label>
              <textarea name="cofounderPersonalityTraits" id="cofounderPersonalityTraits" value={formData.cofounderPersonalityTraits} onChange={handleChange} rows={2} className={inputClass}></textarea>
            </div>
             <div>
              <label htmlFor="cofounderIndustryBackground" className={labelClass}>Specific industry background preferred (if any)</label>
              <input type="text" name="cofounderIndustryBackground" id="cofounderIndustryBackground" value={formData.cofounderIndustryBackground} onChange={handleChange} className={inputClass} />
            </div>
          </section>

          {/* Commitment & Preferences */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-slate-700 pb-2">Commitment & Preferences</h2>
            <div>
              <label htmlFor="commitmentLevel" className={labelClass}>Your availability/commitment level</label>
              <select name="commitmentLevel" id="commitmentLevel" value={formData.commitmentLevel} onChange={handleChange} className={inputClass}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Weekends/Evenings">Weekends/Evenings</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
            <div className="flex items-center mt-4">
              <input type="checkbox" name="willingToRelocate" id="willingToRelocate" checked={formData.willingToRelocate} onChange={handleChange} className="h-4 w-4 text-rose-600 border-slate-500 rounded focus:ring-rose-500 bg-slate-700"/>
              <label htmlFor="willingToRelocate" className="ml-2 text-sm text-slate-300">I am willing to relocate for the right opportunity.</label>
            </div>
            <div>
              <label htmlFor="preferredCofounderLocation" className={labelClass}>Preferred co-founder location (if any)</label>
              <input type="text" name="preferredCofounderLocation" id="preferredCofounderLocation" value={formData.preferredCofounderLocation} onChange={handleChange} className={inputClass} placeholder="e.g., Remote, San Francisco, London"/>
            </div>
            <div>
              <label htmlFor="equitySplitExpectation" className={labelClass}>Equity split expectations (general idea)</label>
               <select name="equitySplitExpectation" id="equitySplitExpectation" value={formData.equitySplitExpectation} onChange={handleChange} className={inputClass}>
                <option value="Negotiable">Negotiable</option>
                <option value="Equal">Equal Split</option>
                <option value="Majority for Idea Holder">Majority for Idea Holder</option>
                <option value="Majority for Primary Executor">Majority for Primary Executor</option>
              </select>
            </div>
          </section>

          {/* Interests for News Feed */}
           <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-slate-700 pb-2">Interests</h2>
            <div>
              <label htmlFor="interests" className={labelClass}>Select a few areas of interest (for news feed & matching)</label>
              <p className={subLabelClass}>Comma-separated, e.g., AI, SaaS, Fintech, Healthtech</p>
              <input type="text" name="interests" id="interests" value={formData.interests} onChange={handleChange} className={inputClass} />
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-400 text-center mt-4">Error saving profile: {error.message}</p>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-rose-500 disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'Save Profile & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileSetupPage;
