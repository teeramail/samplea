'use client';

import React from 'react';

interface PageSizeSelectorProps {
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
}

export default function PageSizeSelector({ itemsPerPage, onItemsPerPageChange }: PageSizeSelectorProps) {
  return (
    <div className="flex items-center">
      <label htmlFor="items-per-page" className="text-sm text-gray-700 mr-2">
        Items per page:
      </label>
      <select
        id="items-per-page"
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        className="border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm py-1 px-2"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  );
}
