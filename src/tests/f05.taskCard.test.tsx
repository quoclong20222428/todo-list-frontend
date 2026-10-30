// @vitest-environment jsdom

/**
 * F05 — TaskCard component: updateTask() and deleteTask() behavior
 *
 * Tests both edit-and-confirm and delete flows through the rendered <TaskCard>.
 * Production code under test: src/components/TaskCard.tsx
 *
 * What regressions this can detect:
 *   - PUT/DELETE endpoint path changed (e.g. "/tasks/:id" renamed)
 *   - PUT body fields changed (title/description keys renamed)
 *   - Authorization header removed from PUT or DELETE request
 *   - handleTaskChanged() not called after successful update or delete
 *   - handleTaskChanged() erroneously called on API error
 *   - Error path changed so toast.error is no longer fired on failure
 *
 * Button selectors (no aria-label or text in production markup):
 *   Status toggle  — first button (rounded-full class distinguishes it)
 *   Edit/Confirm   — only button with class containing "hover:text-info"
 *   Delete         — only button with class containing "hover:text-destructive"
 * jsdom does not apply CSS so hidden group-hover buttons are reachable.
 * CSS class substrings are the most intention-revealing stable selector
 * available without modifying production markup.
 *
 * Mocks:
 *   @clerk/react  — fake getToken() returning "test-token"
 *   sonner        — captures toast calls for assertion
 *   api.put       — vi.spyOn; default resolves; can be overridden per-test
 *   api.delete    — vi.spyOn; default resolves; can be overridden per-test
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
import TaskCard from "@/components/TaskCard";
import { api } from "@/api/api";
import type { Task } from "@/lib/data";
import { toast } from "sonner";

// --- Module mocks ---

vi.mock("@clerk/react", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Helpers ---

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    _id: "task-1",
    title: "Original Title",
    description: "Original Desc",
    status: "pending",
    createdAt: new Date("2024-01-01"),
    completedAt: null,
    ...overrides,
  };
}

// --- Suite ---

describe("F05 — TaskCard component: updateTask() and deleteTask()", () => {
  let mockHandleTaskChanged: ReturnType<typeof vi.fn>;
  let mockPut: ReturnType<typeof vi.spyOn>;
  let mockDelete: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockHandleTaskChanged = vi.fn();
    mockPut = vi
      .spyOn(api, "put")
      .mockResolvedValue({ data: {} } as any);
    mockDelete = vi
      .spyOn(api, "delete")
      .mockResolvedValue({ data: { message: "Task deleted" } } as any);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  // ── updateTask() ─────────────────────────────────────────────────────────────

  describe("updateTask()", () => {
    it("sends PUT /tasks/:id with edited title, description, and Authorization header", async () => {
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      // Edit button is uniquely identified by its hover:text-info Tailwind class.
      // No aria-label or text content exists in production markup.
      const editButton = container.querySelector('[class*="hover:text-info"]') as HTMLElement;
      await user.click(editButton);

      // Clear and type new values into the edit inputs
      const titleInput = screen.getByPlaceholderText("Edit task title...");
      const descInput = screen.getByPlaceholderText("Edit task description...");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");
      await user.clear(descInput);
      await user.type(descInput, "Updated Desc");

      // Confirm click — button class changes to hover:text-info still (CheckCircle2 icon now).
      await user.click(container.querySelector('[class*="hover:text-info"]') as HTMLElement);

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
      });
      expect(mockPut).toHaveBeenCalledWith(
        `/tasks/${task._id}`,
        { title: "Updated Title", description: "Updated Desc" },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("calls handleTaskChanged() exactly once on successful update", async () => {
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      const editBtn = container.querySelector('[class*="hover:text-info"]') as HTMLElement;
      await user.click(editBtn); // enter edit mode
      await user.click(container.querySelector('[class*="hover:text-info"]') as HTMLElement); // confirm

      await waitFor(() => {
        expect(mockHandleTaskChanged).toHaveBeenCalledTimes(1);
      });
    });

    it("does NOT call handleTaskChanged() and fires toast.error when PUT rejects", async () => {
      mockPut.mockRejectedValueOnce(new Error("500 Internal Server Error"));
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      const editBtn = container.querySelector('[class*="hover:text-info"]') as HTMLElement;
      await user.click(editBtn); // enter edit mode
      await user.click(container.querySelector('[class*="hover:text-info"]') as HTMLElement); // confirm

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalled();
      });
      expect(mockHandleTaskChanged).not.toHaveBeenCalled();
    });
  });

  // ── deleteTask() ─────────────────────────────────────────────────────────────

  describe("deleteTask()", () => {
    it("sends DELETE /tasks/:id with Authorization header", async () => {
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      // Delete button is uniquely identified by its hover:text-destructive Tailwind class.
      const deleteButton = container.querySelector('[class*="hover:text-destructive"]') as HTMLElement;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
      });
      expect(mockDelete).toHaveBeenCalledWith(
        `/tasks/${task._id}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("calls handleTaskChanged() exactly once on successful delete", async () => {
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      await user.click(container.querySelector('[class*="hover:text-destructive"]') as HTMLElement);

      await waitFor(() => {
        expect(mockHandleTaskChanged).toHaveBeenCalledTimes(1);
      });
    });

    it("does NOT call handleTaskChanged() and fires toast.error when DELETE rejects", async () => {
      mockDelete.mockRejectedValueOnce(new Error("Network error"));
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      await user.click(container.querySelector('[class*="hover:text-destructive"]') as HTMLElement);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalled();
      });
      expect(mockHandleTaskChanged).not.toHaveBeenCalled();
    });
  });
});
