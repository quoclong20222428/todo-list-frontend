// @vitest-environment jsdom

/**
 * F07 — Home component: client-side task filter logic
 *
 * Tests the filteredTasks derivation inside <Home> by:
 *   1. Mocking api.get to return a known task set
 *   2. Clicking filter buttons rendered by <StatsAndFilters>
 *   3. Asserting which task titles are visible / absent in <TaskList>
 *
 * Production code under test:
 *   - src/pages/Home.tsx (filteredTasks switch, filter state, page reset)
 *   - src/components/StatsAndFilters.tsx (filter button onClick)
 *   - src/components/TaskList.tsx (renders visibleTasks)
 *   - src/components/TaskCard.tsx (renders task.title)
 *
 * What regressions this can detect:
 *   - filter switch condition changed (e.g. wrong status string)
 *   - Filter button wiring broken (onClick no longer calls setFilter)
 *   - filteredTasks uses wrong field (e.g. "type" instead of "status")
 *   - "all" filter accidentally excludes a status
 *
 * Mocks:
 *   @clerk/react        — useAuth (for AddTask + TaskCard)
 *   @clerk/react-router — useAuth + Show + RedirectToSignIn (for Home)
 *   sonner              — toast (side-effect, not primary assertion)
 *   api.get             — vi.spyOn; returns controlled task list
 *   api.post            — vi.spyOn; prevents real HTTP from AddTask on mount
 *   api.put             — vi.spyOn; prevents real HTTP from TaskCard interactions
 *   api.delete          — vi.spyOn; prevents real HTTP from TaskCard interactions
 *
 * Test data: 3 tasks with distinct statuses (one per status).
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

// --- Module mocks ---

vi.mock("@clerk/react", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
  }),
  // Header uses useUser and UserButton — stub them out
  useUser: () => ({ user: { firstName: "Test" } }),
  UserButton: () => null,
}));

vi.mock("@clerk/react-router", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
  }),
  // Show renders children only when when="signed-in"
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === "signed-in" ? <>{children}</> : null,
  RedirectToSignIn: () => null,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// --- Test data ---

const TASKS = [
  {
    _id: "1",
    title: "Pending Task",
    description: "desc",
    status: "pending",
    createdAt: new Date("2024-01-01").toISOString(),
    completedAt: null,
  },
  {
    _id: "2",
    title: "Completed Task",
    description: "desc",
    status: "completed",
    createdAt: new Date("2024-01-02").toISOString(),
    completedAt: new Date("2024-01-03").toISOString(),
  },
  {
    _id: "3",
    title: "Inprogress Task",
    description: "desc",
    status: "inprogress",
    createdAt: new Date("2024-01-03").toISOString(),
    completedAt: null,
  },
];

const API_RESPONSE = {
  data: {
    tasks: TASKS,
    pendingCount: 1,
    completedCount: 1,
    inProgressCount: 1,
  },
};

// --- Suite ---

describe("F07 — Home component: client-side task filter logic", () => {
  beforeEach(async () => {
    // Import api inside beforeEach so spies are set up fresh each test
    const { api } = await import("@/api/api");
    vi.spyOn(api, "get").mockResolvedValue(API_RESPONSE as any);
    vi.spyOn(api, "post").mockResolvedValue({ data: {} } as any);
    vi.spyOn(api, "put").mockResolvedValue({ data: {} } as any);
    vi.spyOn(api, "delete").mockResolvedValue({ data: {} } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  async function renderAndWaitForTasks() {
    render(<Home />);
    // Wait for the async fetchTasks() to complete and tasks to render
    await waitFor(() => {
      expect(screen.getByText("Pending Task")).toBeDefined();
    });
  }

  it("'all' filter shows all tasks regardless of status", async () => {
    await renderAndWaitForTasks();

    // The default filter is "all" — all 3 task titles must be visible
    expect(screen.getByText("Pending Task")).toBeDefined();
    expect(screen.getByText("Completed Task")).toBeDefined();
    expect(screen.getByText("Inprogress Task")).toBeDefined();
  });

  it("'pending' filter shows only pending tasks", async () => {
    const user = userEvent.setup();
    await renderAndWaitForTasks();

    await user.click(screen.getByRole("button", { name: /^pending$/i }));

    await waitFor(() => {
      expect(screen.getByText("Pending Task")).toBeDefined();
      expect(screen.queryByText("Completed Task")).toBeNull();
      expect(screen.queryByText("Inprogress Task")).toBeNull();
    });
  });

  it("'completed' filter shows only completed tasks", async () => {
    const user = userEvent.setup();
    await renderAndWaitForTasks();

    await user.click(screen.getByRole("button", { name: /^completed$/i }));

    await waitFor(() => {
      expect(screen.getByText("Completed Task")).toBeDefined();
      expect(screen.queryByText("Pending Task")).toBeNull();
      expect(screen.queryByText("Inprogress Task")).toBeNull();
    });
  });

  it("'inprogress' filter shows only in-progress tasks", async () => {
    const user = userEvent.setup();
    await renderAndWaitForTasks();

    await user.click(screen.getByRole("button", { name: /^inprogress$/i }));

    await waitFor(() => {
      expect(screen.getByText("Inprogress Task")).toBeDefined();
      expect(screen.queryByText("Pending Task")).toBeNull();
      expect(screen.queryByText("Completed Task")).toBeNull();
    });
  });

  it("switching from 'pending' back to 'all' restores all tasks", async () => {
    const user = userEvent.setup();
    await renderAndWaitForTasks();

    await user.click(screen.getByRole("button", { name: /^pending$/i }));
    await waitFor(() => {
      expect(screen.queryByText("Completed Task")).toBeNull();
    });

    await user.click(screen.getByRole("button", { name: /^all$/i }));
    await waitFor(() => {
      expect(screen.getByText("Completed Task")).toBeDefined();
      expect(screen.getByText("Inprogress Task")).toBeDefined();
      expect(screen.getByText("Pending Task")).toBeDefined();
    });
  });
});
