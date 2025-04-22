•'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  
  return (
    <div className="mt-6 flex justify-center">
      <nav className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          First
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          &lt;
        </button>
        
        {/* Page numbers */}
        {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
          // Show pages around current page
          let pageNum;
          if (pageCount <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= pageCount - 2) {
            pageNum = pageCount - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
          className={`px-3 py-1 rounded-md ${currentPage === pageCount ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          &gt;
        </button>
        <button
          onClick={() => onPageChange(pageCount)}
          disabled={currentPage === pageCount}
          className={`px-3 py-1 rounded-md ${currentPage === pageCount ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Last
        </button>
      </nav>
    </div>
  );
}
•"(d7429fb60ae57934cc67b28279260400fa51fe822cfile:///c:/work/projects/newpro/teeonedWinsurf/teeramuaythaione/src/components/admin/Pagination.tsx:?file:///c:/work/projects/newpro/teeonedWinsurf/teeramuaythaione