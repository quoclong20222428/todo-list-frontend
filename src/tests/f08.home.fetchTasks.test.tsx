// @vitest-environment jsdom

/**
 * ResizeObserver polyfill for jsdom.
 *
 * The shadcn <Command> component (used by DateTimeFilter via cmdk) calls
 * `new ResizeObserver(...)` in a useEffect. jsdom does not implement
 * ResizeObserver. Without this stub the tests that open the DateTimeFilter
 * popover throw "ReferenceError: ResizeObserver is not defined".
 *
 * This is a test-environment limitation, not a production code issue.
 * The stub is defined before any imports so it is available when cmdk's
 * module-level code executes.
 */
// @ts-ignore — ResizeObserver is not in the jsdom type definitions
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// cmdk calls element.scrollIntoView() on CommandItem selection — jsdom stub.
if (typeof window !== "undefined" && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

/**
 * F08 — Home component: fetchTasks() error path and dateQuery-triggered refetch
 *
 * Production code under test: src/pages/Home.tsx
 *   - fetchTasks() catch block   (Home.tsx:45–48)
 *   - useEffect([dateQuery])      (Home.tsx:24–26)
 *
 * What regressions this can detect:
 *   - toast.error removed or changed in the catch block of fetchTasks()
 *   - useEffect dependency changed from [dateQuery] to [], preventing refetch
 *   - api.get not called with updated query string when dateQuery changes
 *   - Component crashes on API error instead of handling gracefully
 *
 * Mocks:
 *   @clerk/react        — useAuth, useUser, UserButton
 *   @clerk/react-router — useAuth, Show, RedirectToSignIn
 *   sonner              — toast.success / toast.error
 *   api.get             — vi.spyOn; controls success/failure per test
 *   api.post            — vi.spyOn; prevents real HTTP from AddTask
 *   api.put             — vi.spyOn; prevents real HTTP from TaskCard
 *   api.delete          — vi.spyOn; prevents real HTTP from TaskCard
 *
 * NOTE on DateTimeFilter interaction (F08-2, F08-3):
 *   DateTimeFilter renders a Popover + CommandList (shadcn/ui). The
 *   CommandItem onSelect callback fires with the item's `value` prop.
 *   We open the popover by clicking its trigger button, then click a
 *   CommandItem by its visible text label to simulate a real user selection.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/pages/Home";
import { api } from "@/api/api";
import { toast } from "sonner";

// --- Module mocks ---

vi.mock("@clerk/react", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
  }),
  useUser: () => ({ user: { firstName: "Test" } }),
  UserButton: () => null,
}));

vi.mock("@clerk/react-router", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
  }),
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === "signed-in" ? <>{children}</> : null,
  RedirectToSignIn: () => null,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Shared test data ---

const SUCCESS_RESPONSE = {
  data: {
    tasks: [
      {
        _id: "1",
        title: "Task Alpha",
        description: "desc",
        status: "pending",
        createdAt: new Date("2024-01-01").toISOString(),
        completedAt: null,
      },
    ],
    pendingCount: 1,
    inProgressCount: 0,
    completedCount: 0,
  },
};

const SUCCESS_RESPONSE_2 = {
  data: {
    tasks: [
      {
        _id: "2",
        title: "Task Beta",
        description: "desc",
        status: "pending",
        createdAt: new Date("2024-01-02").toISOString(),
        completedAt: null,
      },
    ],
    pendingCount: 1,
    inProgressCount: 0,
    completedCount: 0,
  },
};

// --- Suite ---

describe("F08 — Home component: fetchTasks() error path and dateQuery refetch", () => {
  beforeEach(() => {
    vi.spyOn(api, "post").mockResolvedValue({ data: {} } as any);
    vi.spyOn(api, "put").mockResolvedValue({ data: {} } as any);
    vi.spyOn(api, "delete").mockResolvedValue({ data: {} } as any);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  // ── F08-1: Error path ─────────────────────────────────────────────────────

  describe("F08-1: fetchTasks() error path", () => {
    it("calls toast.error with the production message when api.get rejects", async () => {
      // Arrange: api.get rejects on every call
      vi.spyOn(api, "get").mockRejectedValue(new Error("Network failure"));

      // Act: render component (fetchTasks is called inside useEffect on mount)
      render(<Home />);

      // Assert: toast.error is called with the production error message
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1);
      });
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Failed to fetch tasks");
    });

    it("does NOT call toast.error when api.get succeeds", async () => {
      vi.spyOn(api, "get").mockResolvedValue(SUCCESS_RESPONSE as any);

      render(<Home />);

      // Wait for the successful fetch to complete
      await waitFor(() => {
        expect(screen.getByText("Task Alpha")).toBeDefined();
      });

      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
    });

    it("component remains rendered (does not crash) when api.get rejects", async () => {
      vi.spyOn(api, "get").mockRejectedValue(new Error("Network failure"));

      // If component crashes, render() would throw
      expect(() => render(<Home />)).not.toThrow();

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalled();
      });

      // Component should still be in the DOM
      expect(document.body.children.length).toBeGreaterThan(0);
    });
  });

  // ── F08-2: dateQuery refetch ──────────────────────────────────────────────

  describe("F08-2: api.get is called again when dateQuery changes via DateTimeFilter", () => {
    it("calls api.get a second time with the new filter query string after user selects 'This Week'", async () => {
      const user = userEvent.setup();
      const mockGet = vi
        .spyOn(api, "get")
        .mockResolvedValue(SUCCESS_RESPONSE as any);

      render(<Home />);

      // Wait for the initial fetch (filter=all_time is the initial dateQuery)
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(1);
      });

      // The initial call should use the default dateQuery value from Home's useState
      expect(mockGet).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("/tasks?filter="),
        expect.anything()
      );

      // Open the DateTimeFilter popover by clicking its trigger button
      const comboboxButton = screen.getByRole("combobox");
      await user.click(comboboxButton);

      // Click "This Week" option in the CommandList
      const thisWeekOption = await screen.findByText("This Week");
      await user.click(thisWeekOption);

      // api.get must be called again with the new filter
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(2);
      });

      // The second call must include the new filter value
      expect(mockGet).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("filter=this_week"),
        expect.anything()
      );
    });

    it("calls api.get a second time with filter=today after user selects 'Today'", async () => {
      const user = userEvent.setup();
      const mockGet = vi
        .spyOn(api, "get")
        .mockResolvedValue(SUCCESS_RESPONSE as any);

      render(<Home />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(1);
      });

      // Open popover
      await user.click(screen.getByRole("combobox"));

      // Click "Today" option
      const todayOption = await screen.findByText("Today");
      await user.click(todayOption);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(2);
      });

      expect(mockGet).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("filter=today"),
        expect.anything()
      );
    });
  });

  // ── F08-3: UI updates with new data after refetch ─────────────────────────

  describe("F08-3: task list shows new data after dateQuery-triggered refetch", () => {
    it("displays the task from the second API response after changing the date filter", async () => {
      const user = userEvent.setup();
      vi.spyOn(api, "get")
        // First call: returns Task Alpha
        .mockResolvedValueOnce(SUCCESS_RESPONSE as any)
        // Second call (after filter change): returns Task Beta
        .mockResolvedValueOnce(SUCCESS_RESPONSE_2 as any);

      render(<Home />);

      // Initial render: Task Alpha appears
      await waitFor(() => {
        expect(screen.getByText("Task Alpha")).toBeDefined();
      });

      // Change filter to "This Month"
      await user.click(screen.getByRole("combobox"));
      const thisMonthOption = await screen.findByText("This Month");
      await user.click(thisMonthOption);

      // After refetch: Task Beta appears, Task Alpha is gone
      await waitFor(() => {
        expect(screen.getByText("Task Beta")).toBeDefined();
      });
      expect(screen.queryByText("Task Alpha")).toBeNull();
    });
  });
});
