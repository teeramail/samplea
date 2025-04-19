"use client";

import dynamic from "next/dynamic";

// Import ChatWidget with dynamic loading to prevent SSR issues
const ChatWidget = dynamic(() => import("./ChatWidget"), {
  ssr: false,
});

export default function ChatWidgetWrapper() {
  return <ChatWidget />;
}
