import { stackServerApp } from "@/src/stack";
import { getUserByStackId } from "@/src/lib/actions/users";
import ProfileForm from "@/src/components/Profile/ProfileForm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile Settings",
  description: "Manage your profile and account settings",
};

export default async function ProfilePage() {
  // Get the authenticated user
  const user = await stackServerApp.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login?redirect=/profile");
  }

  // Fetch user profile data from our database
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

          {userProfile ? (
            <ProfileForm user={user} userProfile={userProfile} />
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Loading profile information...
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}