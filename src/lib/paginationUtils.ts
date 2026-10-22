/**
 * paginationUtils.ts
 *
 * Pure utility extracted from TaskListPagination.tsx (D2 extraction).
 * Contains the EXACT same algorithm as the original inline closure.
 * No behavior change.
 *
 * Exported so it can be independently unit-tested (F01).
 */

/**
 * Returns the list of page tokens to display in the pagination control.
 * Numeric entries are page numbers (≥ 1); string entries are "..." ellipsis markers.
 *
 * @param page       Current active page (1-indexed)
 * @param totalPages Total number of pages
 */
export function generatePages(
  page: number,
  totalPages: number
): (number | string)[] {
  const pages: (number | string)[] = [];

  if (totalPages < 4) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (page <= 2) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (page > totalPages - 1) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page, "...", totalPages);
    }
  }

  return pages;
}
