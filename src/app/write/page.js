import { stackServerApp } from "@/src/stack";
import WriteForm from "@/src/components/Write/WriteForm";

export const metadata = {
  title: "Write a New Story",
  description: "Share your thoughts and stories with the world",
};

export default async function WritePage() {
  // The middleware will handle authentication check and redirection
  const user = await stackServerApp.getUser();

  return (
    <main className="min-h-screen bg-light dark:bg-dark">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark dark:text-light mb-2">
              Write a New Story
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share your thoughts, experiences, and insights with the community.
            </p>
          </div>

          <WriteForm />
        </div>
      </div>
    </main>
  );
}