"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { format } from "date-fns";
// import toast from "react-hot-toast"; // Optional

// Define the type for a single post based on the router output
type PostType = {
  id: string;
  title: string;
  status: string;
  publishedAt?: Date | string | null;
  isFeatured: boolean;
  // Add other required properties
};

// Reuse or import the ToggleSwitch component
function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`${enabled ? "bg-indigo-600" : "bg-gray-200"} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        aria-hidden="true"
        className={`${enabled ? "translate-x-5" : "translate-x-0"} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
}

export default function AdminPostsPage() {
  // Fetch the list of posts (might want to fetch ALL statuses for admin)
  const {
    data: postsData,
    isLoading,
    error,
    refetch,
  } = api.post.list.useQuery({ status: "ALL" }); // Ensure list procedure exists

  // Mutation for toggling the featured status
  const toggleFeaturedMutation = api.post.toggleFeatured.useMutation({
    onSuccess: () => {
      void refetch();
      // toast.success("Post featured status updated");
    },
    onError: (error) => {
      console.error("Failed to update featured status:", error);
      // toast.error("Failed to update featured status");
    },
  });

  const handleToggleFeatured = (post: PostType) => {
    if (!post) return;
    toggleFeaturedMutation.mutate({
      id: post.id,
      isFeatured: !post.isFeatured,
    });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM dd, yyyy");
  };

  if (isLoading) return <div className="p-4">Loading posts...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Error loading posts: {error.message}
      </div>
    );

  // Adjust based on list procedure return type ({ items, nextCursor } or just array)
  const posts = postsData ?? [];

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manage Blog Posts</h1>
        <div className="flex gap-x-4">
          <Link
            href="/admin/posts/fix-slugs"
            className="rounded-md bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
          >
            Fix Invalid Slugs
          </Link>
          <Link
            href="/admin/posts/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Create New Post
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Published
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Featured
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {post.title}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${post.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(post.publishedAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                  <ToggleSwitch
                    enabled={!!post.isFeatured} // Use !! to ensure boolean
                    onChange={() => handleToggleFeatured(post)}
                  />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                  {/* Add delete button/logic here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {posts.length === 0 && (
        <div className="py-4 text-center text-gray-500">No posts found.</div>
      )}
    </div>
  );
}
