"use client";
import { useState, useEffect } from "react";
import { updateUserProfile, getProfile } from "@/src/lib/actions/users";
import { useUI } from "@/src/contexts/UIContext";
import Button from "@/src/components/UI/Button";
import Input from "@/src/components/UI/Input";
import { cx } from "@/src/utils";
import { useRouter } from "next/navigation";

const ProfileForm = ({ user, userProfile: initialUserProfile }) => {
  const [username, setUsername] = useState(initialUserProfile?.username || "");
  const [bio, setBio] = useState(initialUserProfile?.bio || "");
  const [website, setWebsite] = useState(initialUserProfile?.website || "");
  const [location, setLocation] = useState(initialUserProfile?.location || "");
  const [twitter, setTwitter] = useState(initialUserProfile?.twitter || "");
  const [github, setGithub] = useState(initialUserProfile?.github || "");
  const [linkedin, setLinkedin] = useState(initialUserProfile?.linkedin || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { showToast } = useUI();
  const router = useRouter();

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!initialUserProfile) {
        setIsLoading(true);
        try {
          const response = await getProfile();
          if (response.success && response.profile) {
            const profile = response.profile;
            setUsername(profile.username || "");
            setBio(profile.bio || "");
            setWebsite(profile.website || "");
            setLocation(profile.location || "");
            setTwitter(profile.twitter || "");
            setGithub(profile.github || "");
            setLinkedin(profile.linkedin || "");
          } else {
            showToast("Failed to load profile data", "error");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          showToast("Failed to load profile data", "error");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
  }, [initialUserProfile, showToast]);

  // Update form values when initialUserProfile changes
  useEffect(() => {
    if (initialUserProfile) {
      setUsername(initialUserProfile.username || "");
      setBio(initialUserProfile.bio || "");
      setWebsite(initialUserProfile.website || "");
      setLocation(initialUserProfile.location || "");
      setTwitter(initialUserProfile.twitter || "");
      setGithub(initialUserProfile.github || "");
      setLinkedin(initialUserProfile.linkedin || "");
    }
  }, [initialUserProfile]);

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    // Username validation - required and format check
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    // Website validation - URL format if provided
    if (website && !website.match(/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/)) {
      newErrors.website = "Please enter a valid URL";
    }

    // Bio validation - max length
    if (bio && bio.length > 500) {
      newErrors.bio = "Bio cannot exceed 500 characters";
    }

    // Social media validation - format checks if provided
    if (twitter && !twitter.match(/^@?[a-zA-Z0-9_]{1,15}$/) && !twitter.match(/^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]{1,15}$/)) {
      newErrors.twitter = "Please enter a valid Twitter username or URL";
    }

    if (github && !github.match(/^[a-zA-Z0-9_-]+$/) && !github.match(/^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+$/)) {
      newErrors.github = "Please enter a valid GitHub username or URL";
    }

    if (linkedin && !linkedin.match(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/)) {
      newErrors.linkedin = "Please enter a valid LinkedIn profile URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("bio", bio);
      formData.append("website", website);
      formData.append("location", location);
      formData.append("twitter", twitter);
      formData.append("github", github);
      formData.append("linkedin", linkedin);

      const result = await updateUserProfile(formData);

      if (result && result.success) {
        showToast("Profile updated successfully!", "success");
        // Refresh the page to show updated data
        router.refresh();
      } else {
        showToast(result?.error || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(error.message || "Failed to update profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-dark dark:text-light">
          Profile Information
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Update your public profile information.
        </p>
      </div>

      {isLoading ? (
        <div className="p-6 flex justify-center items-center">
          <div className="animate-pulse text-gray-600 dark:text-gray-400">
            Loading profile data...
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Email"
                value={user.primaryEmail}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed here. Use your account settings.
              </p>
            </div>

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              error={errors.username}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className={cx(
                  "w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                  "dark:bg-gray-800 dark:text-white dark:placeholder-gray-500",
                  errors.bio ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                )}
              />
              {errors.bio && (
                <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {bio ? bio.length : 0}/500 characters
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              type="url"
              error={errors.website}
            />

            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-dark dark:text-light">
              Social Links
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Twitter"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username or full URL"
                error={errors.twitter}
              />

              <Input
                label="GitHub"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="username or full URL"
                error={errors.github}
              />
            </div>

            <Input
              label="LinkedIn"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="Profile URL"
              error={errors.linkedin}
            />
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileForm;