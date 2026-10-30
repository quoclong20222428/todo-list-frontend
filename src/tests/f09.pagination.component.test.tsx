// @vitest-environment jsdom

/**
 * F09 — TaskListPagination component integration tests
 *
 * Production code under test: src/components/TaskListPagination.tsx
 * Supporting utility under test: src/lib/paginationUtils.ts (via the component)
 *
 * What regressions this can detect:
 *   - handleNextPage callback not wired to the Next anchor click
 *   - handlePrevPage callback not wired to the Previous anchor click
 *   - handlePageChange(n) not called when a page number anchor is clicked
 *   - Disabled state (pointer-events-none, onClick=undefined) removed for
 *     page=1 (Prev) or page=totalPages (Next)
 *   - Ellipsis ("...") no longer rendered when totalPages >= 4
 *   - Active page anchor no longer has aria-current="page"
 *
 * IMPLEMENTATION NOTES:
 *   PaginationPrevious and PaginationNext render <a> elements with:
 *     - aria-label="Go to previous page" / "Go to next page"
 *   When disabled (page=1 for Prev, page=totalPages for Next):
 *     - onClick is set to undefined (not a button disabled attribute)
 *     - CSS class "pointer-events-none opacity-50" is applied
 *   jsdom does not enforce pointer-events, so we test the observable behavior:
 *     - clicking a disabled anchor does NOT call the handler
 *     - clicking an enabled anchor DOES call the handler
 *   This directly matches what the production code implements.
 *
 *   PaginationEllipsis renders aria-hidden="true" with sr-only text "More pages".
 *   We assert its presence via the sr-only text accessible to getByText
 *   (or the aria-hidden span via container.querySelector).
 *
 * F01 covers generatePages() in isolation. F09 covers the component behavior
 * that depends on generatePages() output being rendered and interactive.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskListPagination from "@/components/TaskListPagination";

// --- Suite ---

describe("F09 — TaskListPagination component integration", () => {
  let mockHandleNextPage: Mock<() => void>;
  let mockHandlePrevPage: Mock<() => void>;
  let mockHandlePageChange: Mock<(newPage: number) => void>;

  beforeEach(() => {
    mockHandleNextPage = vi.fn<() => void>();
    mockHandlePrevPage = vi.fn<() => void>();
    mockHandlePageChange = vi.fn<(newPage: number) => void>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  function renderPagination(page: number, totalPages: number) {
    return render(
      <TaskListPagination
        page={page}
        totalPages={totalPages}
        handleNextPage={mockHandleNextPage}
        handlePrevPage={mockHandlePrevPage}
        handlePageChange={mockHandlePageChange}
      />
    );
  }

  /**
   * Get all pagination <a> elements by data-slot attribute.
   * <a> tags without href are NOT recognized as role="link" in jsdom's
   * accessibility tree, so getByRole("link") fails. We use the stable
   * data-slot="pagination-link" attribute from the shadcn component instead.
   */
  function getPaginationLinks(container: HTMLElement) {
    return Array.from(
      container.querySelectorAll<HTMLAnchorElement>("[data-slot='pagination-link']")
    );
  }

  /** Get the Prev <a> by its aria-label. */
  function getPrevLink(container: HTMLElement): HTMLAnchorElement {
    return container.querySelector(
      "[aria-label='Go to previous page']"
    ) as HTMLAnchorElement;
  }

  /** Get the Next <a> by its aria-label. */
  function getNextLink(container: HTMLElement): HTMLAnchorElement {
    return container.querySelector(
      "[aria-label='Go to next page']"
    ) as HTMLAnchorElement;
  }

  // ── Test 1: Prev disabled on first page ──────────────────────────────────

  describe("Test 1 — First page: Previous anchor has no onClick handler", () => {
    it("clicking Previous on page 1 does NOT call handlePrevPage", async () => {
      const user = userEvent.setup();
      const { container } = renderPagination(1, 3);

      const prevLink = getPrevLink(container);
      await user.click(prevLink);

      // onClick is set to undefined → handler must NOT be called
      expect(mockHandlePrevPage).not.toHaveBeenCalled();
    });

    it("Previous anchor has pointer-events-none class when on page 1", () => {
      const { container } = renderPagination(1, 3);
      const prevLink = getPrevLink(container);
      expect(prevLink).not.toBeNull();
      // The production code injects the unconditional 'pointer-events-none' token
      // (not the Tailwind modifier 'disabled:pointer-events-none' which is always
      // present in buttonVariants). Check exact class token, not a substring.
      const classes = prevLink.className.split(" ");
      expect(classes).toContain("pointer-events-none");
    });
  });

  // ── Test 2: Next disabled on last page ───────────────────────────────────

  describe("Test 2 — Last page: Next anchor has no onClick handler", () => {
    it("clicking Next on the last page does NOT call handleNextPage", async () => {
      const user = userEvent.setup();
      const { container } = renderPagination(3, 3);

      const nextLink = getNextLink(container);
      await user.click(nextLink);

      // onClick is set to undefined → handler must NOT be called
      expect(mockHandleNextPage).not.toHaveBeenCalled();
    });

    it("Next anchor has pointer-events-none class when on last page", () => {
      const { container } = renderPagination(3, 3);
      const nextLink = getNextLink(container);
      expect(nextLink).not.toBeNull();
      // Same as Prev: check for the exact unconditional class token.
      const classes = nextLink.className.split(" ");
      expect(classes).toContain("pointer-events-none");
    });
  });

  // ── Test 3: Click Next on a non-last page ────────────────────────────────

  describe("Test 3 — Next page: clicking Next calls handleNextPage", () => {
    it("clicking Next on page 1 of 3 calls handleNextPage exactly once", async () => {
      const user = userEvent.setup();
      const { container } = renderPagination(1, 3);

      const nextLink = getNextLink(container);
      await user.click(nextLink);

      expect(mockHandleNextPage).toHaveBeenCalledTimes(1);
      expect(mockHandlePrevPage).not.toHaveBeenCalled();
    });

    it("Next anchor does NOT have literal 'pointer-events-none' class (only disabled:pointer-events-none from base styles)", () => {
      /**
       * buttonVariants always includes 'disabled:pointer-events-none' as a
       * Tailwind responsive/state modifier in the base class string.
       * The production code CONDITIONALLY adds the literal 'pointer-events-none'
       * class (without prefix) only when page === totalPages.
       * When page < totalPages, the literal unconditional class must be absent.
       *
       * Regex: match 'pointer-events-none' NOT preceded by 'disabled:'.
       * We check that the conditional class injected by `cn(... page===totalPages && "pointer-events-none")`
       * is absent, i.e. no whitespace/start-of-string before 'pointer-events-none'.
       */
      const { container } = renderPagination(1, 3);
      const nextLink = getNextLink(container);
      // The conditional class 'pointer-events-none' (without any prefix)
      // should NOT appear as a standalone token when not on the last page.
      const classes = nextLink.className.split(" ");
      expect(classes).not.toContain("pointer-events-none");
    });
  });

  // ── Test 4: Click Prev on a non-first page ───────────────────────────────

  describe("Test 4 — Previous page: clicking Previous calls handlePrevPage", () => {
    it("clicking Previous on page 2 of 3 calls handlePrevPage exactly once", async () => {
      const user = userEvent.setup();
      const { container } = renderPagination(2, 3);

      const prevLink = getPrevLink(container);
      await user.click(prevLink);

      expect(mockHandlePrevPage).toHaveBeenCalledTimes(1);
      expect(mockHandleNextPage).not.toHaveBeenCalled();
    });
  });

  // ── Test 5: Click a specific page number ─────────────────────────────────

  describe("Test 5 — Page number click calls handlePageChange with correct page number", () => {
    it("clicking page 2 when on page 1 calls handlePageChange(2)", async () => {
      const user = userEvent.setup();
      // totalPages=3 → generatePages(1,3) returns [1, 2, 3]
      const { container } = renderPagination(1, 3);

      // Get all pagination anchors via data-slot (no href → not role="link" in a11y tree)
      const allLinks = getPaginationLinks(container);
      // allLinks: [Previous, 1, 2, 3, Next]
      const page2Link = allLinks.find((el) => el.textContent?.trim() === "2");
      expect(page2Link, "Could not find page 2 anchor").toBeDefined();

      await user.click(page2Link!);

      expect(mockHandlePageChange).toHaveBeenCalledTimes(1);
      expect(mockHandlePageChange).toHaveBeenCalledWith(2);
    });

    it("clicking the currently active page does NOT call handlePageChange", async () => {
      const user = userEvent.setup();
      // Page 2 is active; clicking it should not call handlePageChange
      // production code guard: if (p !== page) { handlePageChange(p) }
      const { container } = renderPagination(2, 3);

      const allLinks = getPaginationLinks(container);
      const page2Link = allLinks.find((el) => el.textContent?.trim() === "2");
      expect(page2Link).toBeDefined();

      await user.click(page2Link!);

      // Guard: p !== page → false → no call
      expect(mockHandlePageChange).not.toHaveBeenCalled();
    });

    it("active page anchor has aria-current='page'", () => {
      const { container } = renderPagination(2, 3);
      const allLinks = getPaginationLinks(container);
      const page2Link = allLinks.find((el) => el.textContent?.trim() === "2");
      expect(page2Link).toBeDefined();
      expect(page2Link!.getAttribute("aria-current")).toBe("page");
    });
  });

  // ── Test 6: Ellipsis rendered when totalPages >= 4 ───────────────────────

  describe("Test 6 — Ellipsis is rendered for large page counts", () => {
    it("renders 'More pages' sr-only text (ellipsis) when totalPages=5 and page=1", () => {
      /**
       * generatePages(1, 5) returns [1, 2, 3, "...", 5]
       * PaginationEllipsis renders:
       *   <span aria-hidden="true">
       *     <MoreHorizontalIcon />
       *     <span class="sr-only">More pages</span>
       *   </span>
       * The sr-only text is findable by getByText even though parent is aria-hidden.
       */
      render(
        <TaskListPagination
          page={1}
          totalPages={5}
          handleNextPage={mockHandleNextPage}
          handlePrevPage={mockHandlePrevPage}
          handlePageChange={mockHandlePageChange}
        />
      );

      // "More pages" is the sr-only text inside PaginationEllipsis
      expect(screen.getByText("More pages")).toBeDefined();
    });

    it("does NOT render ellipsis when totalPages <= 3", () => {
      render(
        <TaskListPagination
          page={1}
          totalPages={3}
          handleNextPage={mockHandleNextPage}
          handlePrevPage={mockHandlePrevPage}
          handlePageChange={mockHandlePageChange}
        />
      );

      // generatePages(1, 3) → [1, 2, 3] — no "..." entry → no PaginationEllipsis
      expect(screen.queryByText("More pages")).toBeNull();
    });
  });
});
