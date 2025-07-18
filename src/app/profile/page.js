import { stackServerApp } from "@/src/stack";
import { getUserByStackId } from "@/src/lib/actions/users";
import ProfileForm from "@/src/components/Profile/ProfileForm";

export const metadata = {
  title: "Profile Settings",
  description: "Manage your profile and account settings",
};

export default async function ProfilePage() {
  // The middleware will handle authentication check and redirection
  const user = await stackServerApp.getUser();
  const userProfile = await getUserByStackId(user.id);

  return (
    <main className="min-h-screen bg-light dark:bg-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark dark:text-light mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your public profile and account information.
            </p>
          </div>

          <ProfileForm user={user} userProfile={userProfile} />
        </div>
      </div>
    </main>
  );
}