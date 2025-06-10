"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Import ChatWidget with dynamic loading to prevent SSR issues
const ChatWidget = dynamic(() => import("./ChatWidget"), {
  ssr: false,
});

export default function ChatWidgetWrapper() {
  const pathname = usePathname();
  
  // Don't render chat widget on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return <ChatWidget />;
}
