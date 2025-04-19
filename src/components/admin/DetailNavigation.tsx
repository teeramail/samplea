"use client";

import React from "react";

interface DetailNavigationProps {
  currentIndex: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function DetailNavigation({
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
}: DetailNavigationProps) {
  return (
    <div className="mb-6 flex justify-between">
      <button
        onClick={onPrevious}
        disabled={currentIndex <= 0}
        className={`flex items-center ${currentIndex <= 0 ? "cursor-not-allowed text-gray-400" : "text-blue-600 hover:text-blue-800"}`}
      >
        <svg
          className="mr-1 h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          ></path>
        </svg>
        Previous
      </button>
      <span className="text-gray-500">
        {currentIndex + 1} of {totalItems}
      </span>
      <button
        onClick={onNext}
        disabled={currentIndex >= totalItems - 1}
        className={`flex items-center ${currentIndex >= totalItems - 1 ? "cursor-not-allowed text-gray-400" : "text-blue-600 hover:text-blue-800"}`}
      >
        Next
        <svg
          className="ml-1 h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          ></path>
        </svg>
      </button>
    </div>
  );
}
