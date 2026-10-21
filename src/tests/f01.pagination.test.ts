/**
 * F01 — generatePages() pagination logic unit tests
 *
 * Tests the extracted pure utility from paginationUtils.ts.
 * This function was originally an inline closure in TaskListPagination.tsx.
 *
 * CONTRACT UNDER TEST (verbatim from source):
 *   - totalPages < 4: return [1, 2, ..., totalPages]
 *   - totalPages >= 4 and page <= 2: return [1, 2, 3, "...", totalPages]
 *   - totalPages >= 4 and page > totalPages - 1: return [1, "...", totalPages-2, totalPages-1, totalPages]
 *   - totalPages >= 4 and 2 < page <= totalPages-1: return [1, "...", page, "...", totalPages]
 *
 * NOTE: The audit's DEF-4 claim (negative page numbers for totalPages=0) is
 * not reproducible. When totalPages=0, the branch `if (totalPages < 4)` is
 * taken, the for-loop `for i=1; i<=0` never executes, and an empty array is
 * returned. No negative numbers are produced. This is documented below.
 */

import { describe, it, expect } from "vitest";
import { generatePages } from "@/lib/paginationUtils";

describe("F01 — generatePages() (pure function, no component mounting)", () => {
  // ─── totalPages = 0 ─────────────────────────────────────────────────────────
  describe("totalPages = 0", () => {
    it("page 1 → [] (loop never runs; DEF-4 not reproduced)", () => {
      const result = generatePages(1, 0);
      expect(result).toEqual([]);
      // Verify no numeric entries below 1
      const numbers = result.filter((p): p is number => typeof p === "number");
      expect(numbers.every((n) => n >= 1)).toBe(true);
    });
  });

  // ─── totalPages = 1 ─────────────────────────────────────────────────────────
  describe("totalPages = 1", () => {
    it("page 1 → [1]", () => {
      expect(generatePages(1, 1)).toEqual([1]);
    });
  });

  // ─── totalPages = 3 (boundary: just below the else branch) ──────────────────
  describe("totalPages = 3", () => {
    it("page 1 → [1, 2, 3]", () => {
      expect(generatePages(1, 3)).toEqual([1, 2, 3]);
    });
    it("page 2 → [1, 2, 3]", () => {
      expect(generatePages(2, 3)).toEqual([1, 2, 3]);
    });
    it("page 3 (last) → [1, 2, 3]", () => {
      expect(generatePages(3, 3)).toEqual([1, 2, 3]);
    });
  });

  // ─── totalPages = 5 ─────────────────────────────────────────────────────────
  describe("totalPages = 5", () => {
    it("page 1 (first) → [1, 2, 3, '...', 5]", () => {
      expect(generatePages(1, 5)).toEqual([1, 2, 3, "...", 5]);
    });

    it("page 2 → [1, 2, 3, '...', 5]", () => {
      expect(generatePages(2, 5)).toEqual([1, 2, 3, "...", 5]);
    });

    it("page 3 (middle) → [1, '...', 3, '...', 5]", () => {
      expect(generatePages(3, 5)).toEqual([1, "...", 3, "...", 5]);
    });

    it("page 4 → [1, '...', 4, '...', 5]", () => {
      // page 4 > totalPages - 1 = 4: false (4 > 4 is false), so middle branch
      // Actually: page > totalPages - 1 → 4 > 4 → false → middle branch
      expect(generatePages(4, 5)).toEqual([1, "...", 4, "...", 5]);
    });

    it("page 5 (last) → [1, '...', 3, 4, 5]", () => {
      // page > totalPages - 1 → 5 > 4 → true
      expect(generatePages(5, 5)).toEqual([1, "...", 3, 4, 5]);
    });
  });

  // ─── Invariant: all numeric entries must be >= 1 for any valid input ─────────
  describe("numeric entries are always >= 1", () => {
    const cases = [
      [1, 0], [1, 1], [2, 3], [1, 4], [3, 5], [5, 5], [1, 10], [5, 10], [10, 10],
    ] as [number, number][];

    for (const [page, totalPages] of cases) {
      it(`generatePages(${page}, ${totalPages}) has no numeric entries < 1`, () => {
        const result = generatePages(page, totalPages);
        const numbers = result.filter((p): p is number => typeof p === "number");
        for (const n of numbers) {
          expect(n, `Found invalid page number ${n} in result`).toBeGreaterThanOrEqual(1);
        }
      });
    }
  });
});
