'use client';

import React from 'react';

interface SortableHeaderProps<T extends string = string> {
  label: string;
  field: T;
  currentSortField: T;
  currentSortDirection: 'asc' | 'desc';
  onSort: (field: T) => void;
  className?: string;
}

export default function SortableHeader<T extends string = string>({
  label,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  className = ''
}: SortableHeaderProps<T>) {
  return (
    <th 
      scope="col" 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => onSort(field)}
    >
      {label}
      {currentSortField === field && (
        <span className="ml-1">{currentSortDirection === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );
}
