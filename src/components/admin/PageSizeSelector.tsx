"use client";

import React from "react";

interface PageSizeSelectorProps {
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
}

export default function PageSizeSelector({
  itemsPerPage,
  onItemsPerPageChange,
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center">
      <label htmlFor="items-per-page" className="mr-2 text-sm text-gray-700">
        Items per page:
      </label>
      <select
        id="items-per-page"
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  );
}
