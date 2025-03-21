"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [latestEvent] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const createEvent = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setTitle("");
      setDescription("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestEvent ? (
        <div>
          <p className="truncate">Your most recent event: {latestEvent.title}</p>
          {latestEvent.description && (
            <p className="mt-1 text-sm truncate">{latestEvent.description}</p>
          )}
        </div>
      ) : (
        <p>You have no events yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createEvent.mutate({ title, description });
        }}
        className="flex flex-col gap-2 mt-4"
      >
        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <textarea
          placeholder="Event description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl px-4 py-2 text-black"
          rows={3}
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createEvent.isPending}
        >
          {createEvent.isPending ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}
