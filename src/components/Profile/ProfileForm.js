"use client";
import { useState } from "react";
import { updateUserProfile } from "@/src/lib/actions/users";
import { useUI } from "@/src/contexts/UIContext";
import Button from "@/src/components/UI/Button";
import Input from "@/src/components/UI/Input";
import { cx } from "@/src/utils";

const ProfileForm = ({ user, userProfile }) => {
  const [username, setUsername] = useState(userProfile?.username || "");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [website, setWebsite] = useState(userProfile?.website || "");
  const [location, setLocation] = useState(userProfile?.location || "");
  const [twitter, setTwitter] = useState(userProfile?.twitter || "");
  const [github, setGithub] = useState(userProfile?.github || "");
  const [linkedin, setLinkedin] = useState(userProfile?.linkedin || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useUI();

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      await updateUserProfile(formData);
      showToast("Profile updated successfully!", "success");
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
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            className={cx(
              "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
            type="url"
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
            />

            <Input
              label="GitHub"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="username or full URL"
            />
          </div>

          <Input
            label="LinkedIn"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="Profile URL"
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
    </div>
  );
};

export default ProfileForm;