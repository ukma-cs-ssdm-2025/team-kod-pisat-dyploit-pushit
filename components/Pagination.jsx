import { useMemo } from 'react';

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginationRange = useMemo(() => {
    const totalPageNumbers = 5;
    
    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * 1;
      let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * 1;
      let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
      return [firstPageIndex, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
      return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }
    
    return [];
  }, [totalItems, pageSize, currentPage]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-lg bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        Prev
      </button>
      
      {paginationRange.map((pageNumber, index) => {
        if (pageNumber === '...') {
          return <span key={index} className="text-gray-500 px-2">...</span>;
        }

        return (
          <button
            key={index}
            onClick={() => onPageChange(pageNumber)}
            className={`px-3 py-1 rounded-lg border transition-colors cursor-pointer font-medium ${
              pageNumber === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-lg bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        Next
      </button>
    </div>
  );
}