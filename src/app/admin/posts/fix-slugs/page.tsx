"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import slugify from "slugify";

export default function FixPostSlugsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const { data: fetchedPosts, isLoading, refetch } = api.post.list.useQuery({
    status: "ALL",
    limit: 100,
  });

  const updateSlugMutation = api.post.updateSlug.useMutation({
    onSuccess: () => {
      console.log("Slug updated successfully!");
      refetch();
    },
    onError: (error) => {
      console.error("Failed to update slug:", error);
    },
  });

  useEffect(() => {
    if (fetchedPosts) {
      setPosts(fetchedPosts);
    }
  }, [fetchedPosts]);

  const handleFixSlug = (post: any) => {
    const newSlug = slugify(post.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    updateSlugMutation.mutate({ id: post.id, newSlug });
  };

  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch (_) {
      return false;
    }
  };

  const invalidPosts = posts.filter((p) => isUrl(p.slug));

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Fix Post Slugs</h1>
      <p className="mb-4 text-gray-600">
        The posts below have invalid slugs that look like URLs. Click "Fix Slug"
        to generate a new, valid slug from the post title.
      </p>

      {isLoading && <p>Loading posts...</p>}

      {invalidPosts.length === 0 && !isLoading && (
        <p className="text-green-600">All post slugs seem to be valid!</p>
      )}

      <div className="space-y-4">
        {invalidPosts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between rounded-md border p-4"
          >
            <div>
              <p className="font-semibold">{post.title}</p>
              <p className="text-sm text-red-500">
                <span className="font-medium">Invalid Slug:</span> {post.slug}
              </p>
            </div>
            <button
              onClick={() => handleFixSlug(post)}
              disabled={updateSlugMutation.isPending}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Fix Slug
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 