"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

export default function ChatWidget() {
  useEffect(() => {
    // Save the current Tawk_API and Tawk_LoadStart if they exist
    const existingTawkApi = window.Tawk_API;
    const existingTawkLoadStart = window.Tawk_LoadStart;

    // Initialize Tawk.to
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Configure Tawk.to to not automatically show the chat box
    window.Tawk_API.onLoad = function () {
      // Hide the chat window but keep the widget/bubble visible
      window.Tawk_API.hideWidget();
    };

    // Create and append the Tawk.to script using the exact code provided
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://embed.tawk.to/67fde3c103705119092a84c9/1iors3b0j"; // Actual Tawk.to Property ID
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    document.head.appendChild(script);

    // Cleanup function to remove the script when component unmounts
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }

      // Restore previous values if they existed
      if (existingTawkApi) window.Tawk_API = existingTawkApi;
      if (existingTawkLoadStart) window.Tawk_LoadStart = existingTawkLoadStart;
    };
  }, []);

  return null; // This component doesn't render anything visible
}
