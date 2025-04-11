"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  
  // Generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };
  
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setTitle("");
      setContent("");
      setSlug("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <div>
          <p className="truncate">Your most recent post: {latestPost.title}</p>
          {latestPost.content && (
            <p className="mt-1 text-sm truncate">{latestPost.content}</p>
          )}
        </div>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ 
            title, 
            content, 
            slug 
          });
        }}
        className="flex flex-col gap-2 mt-4"
      >
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <input
          type="text"
          placeholder="Post slug (URL)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <textarea
          placeholder="Post content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl px-4 py-2 text-black"
          rows={3}
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Creating..." : "Create Post"}
        </button>
      </form>
    </div>
  );
}
