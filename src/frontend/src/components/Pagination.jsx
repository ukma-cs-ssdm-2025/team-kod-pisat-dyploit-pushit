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
      let middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }

    return [];
  }, [totalItems, pageSize, currentPage]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
      
      {/* PREV BUTTON */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="
          px-3 py-1 rounded-lg border border-black 
          bg-[#1a1a1a] text-[#d6cecf]
          hover:bg-[#2b2727]
          disabled:opacity-40 disabled:cursor-not-allowed 
          transition-colors cursor-pointer
        "
      >
        Prev
      </button>

      {/* PAGES */}
      {paginationRange.map((pageNumber, index) => {
        if (pageNumber === '...') {
          return <span key={index} className="text-[#d6cecf] px-2">...</span>;
        }

        const isActive = pageNumber === currentPage;

        return (
          <button
            key={index}
            onClick={() => onPageChange(pageNumber)}
            className={`
              px-3 py-1 rounded-lg border font-semibold transition-colors cursor-pointer
              ${isActive 
                ? 'bg-[#e6e1e2] text-[#1a1a1a] border-black' 
                : 'bg-[#1a1a1a] text-[#d6cecf] border-black hover:bg-[#2b2727]'
              }
            `}
          >
            {pageNumber}
          </button>
        );
      })}

      {/* NEXT BUTTON */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="
          px-3 py-1 rounded-lg border border-black 
          bg-[#1a1a1a] text-[#d6cecf]
          hover:bg-[#2b2727]
          disabled:opacity-40 disabled:cursor-not-allowed 
          transition-colors cursor-pointer
        "
      >
        Next
      </button>
    </div>
  );
}
