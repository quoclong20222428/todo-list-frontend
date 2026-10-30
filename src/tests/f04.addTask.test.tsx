// @vitest-environment jsdom

/**
 * F04 — AddTask component: addTask() behavior
 *
 * Tests the addTask() function through the rendered <AddTask> component.
 * Production code under test: src/components/AddTask.tsx
 *
 * What regressions this can detect:
 *   - POST endpoint path changed ("/tasks" → something else)
 *   - Request body fields renamed (title/description → other names)
 *   - Authorization header removed or mis-keyed
 *   - handleNewTaskAdded() callback no longer called on success
 *   - handleNewTaskAdded() called even when the API rejects
 *   - Button enabled/disabled guard logic removed or inverted
 *   - Error path changed so toast.error is not fired on failure
 *
 * Mocks:
 *   @clerk/react  — fake getToken() returning "test-token"
 *   sonner        — captures toast.success / toast.error calls
 *   api.post      — vi.spyOn on the shared axios instance;
 *                   prevents real HTTP while letting production code execute
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddTask from "@/components/AddTask";
import { api } from "@/api/api";
import { toast } from "sonner";

// --- Module mocks (hoisted before imports) ---

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

// --- Test suite ---

describe("F04 — AddTask component: addTask() behavior", () => {
  let mockHandleNewTaskAdded: ReturnType<typeof vi.fn>;
  let mockPost: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockHandleNewTaskAdded = vi.fn();
    // Spy on the shared api singleton — same object AddTask.tsx imports.
    // Returning a resolved promise prevents any real HTTP request.
    mockPost = vi
      .spyOn(api, "post")
      .mockResolvedValue({ data: { _id: "new-1", title: "My Task" } } as any);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  // ── Button disabled state (empty-field guard) ────────────────────────────────

  describe("Add Task button disabled state", () => {
    it("is disabled when both fields are empty", () => {
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);
      expect(
        (screen.getByRole("button", { name: /add task/i }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
    });

    it("is disabled when only title is filled", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);
      await user.type(screen.getByPlaceholderText("Task Title"), "My Task");
      expect(
        (screen.getByRole("button", { name: /add task/i }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
    });

    it("is disabled when only description is filled", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);
      await user.type(
        screen.getByPlaceholderText("Task Description"),
        "Some description"
      );
      expect(
        (screen.getByRole("button", { name: /add task/i }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
    });

    it("is enabled when both title and description are filled", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);
      await user.type(screen.getByPlaceholderText("Task Title"), "My Task");
      await user.type(
        screen.getByPlaceholderText("Task Description"),
        "My Desc"
      );
      expect(
        (screen.getByRole("button", { name: /add task/i }) as HTMLButtonElement)
          .disabled
      ).toBe(false);
    });
  });

  // ── Successful POST ──────────────────────────────────────────────────────────

  describe("Successful POST", () => {
    async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByPlaceholderText("Task Title"), "My Task");
      await user.type(
        screen.getByPlaceholderText("Task Description"),
        "My Desc"
      );
      await user.click(screen.getByRole("button", { name: /add task/i }));
    }

    it("calls api.post with the correct endpoint and body", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);
      await fillAndSubmit(user);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        "/tasks",
        { title: "My Task", description: "My Desc" },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("calls handleNewTaskAdded() callback exactly once on success", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);
      await fillAndSubmit(user);

      await vi.waitFor(() => {
        expect(mockHandleNewTaskAdded).toHaveBeenCalledTimes(1);
      });
    });

    it("clears both input fields after successful submission", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);
      const titleInput = screen.getByPlaceholderText(
        "Task Title"
      ) as HTMLInputElement;
      const descInput = screen.getByPlaceholderText(
        "Task Description"
      ) as HTMLInputElement;

      await fillAndSubmit(user);

      await vi.waitFor(() => {
        expect(titleInput.value).toBe("");
        expect(descInput.value).toBe("");
      });
    });
  });

  // ── Failed POST ──────────────────────────────────────────────────────────────

  describe("Failed POST", () => {
    it("does NOT call handleNewTaskAdded() when api.post rejects", async () => {
      mockPost.mockRejectedValueOnce(new Error("Network error"));
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);

      await user.type(screen.getByPlaceholderText("Task Title"), "My Task");
      await user.type(
        screen.getByPlaceholderText("Task Description"),
        "My Desc"
      );
      await user.click(screen.getByRole("button", { name: /add task/i }));

      await vi.waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalled();
      });
      expect(mockHandleNewTaskAdded).not.toHaveBeenCalled();
    });
  });
});
