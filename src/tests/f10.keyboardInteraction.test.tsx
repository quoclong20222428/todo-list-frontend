// @vitest-environment jsdom

/**
 * F10 — Keyboard interaction: Enter key in <AddTask> and <TaskCard>
 *
 * Production code under test:
 *   - src/components/AddTask.tsx   — handleKeyPress (onKeyPress on both Input elements)
 *   - src/components/TaskCard.tsx  — handleKeyPress (onKeyPress on edit Inputs)
 *
 * What regressions this can detect:
 *   - handleKeyPress removed from either Input in AddTask
 *   - handleKeyPress removed from either Input in TaskCard's edit mode
 *   - addTask() guard logic changed so Enter fires even when fields are empty
 *   - updateTask() no longer called on Enter in edit mode
 *   - setIsEditing(false) no longer called after Enter confirmation
 *
 * IMPLEMENTATION NOTES:
 *   AddTask.tsx uses `onKeyPress` (deprecated but functional in jsdom via
 *   userEvent). userEvent.type() fires keypress events for each typed character
 *   and also for explicit key strings like "{Enter}".
 *
 *   The guard in addTask():
 *     if (newTaskTitle.trim() && newTaskDescription.trim()) { ... }
 *   means pressing Enter when both fields are non-empty triggers the API call.
 *   When either field is empty/whitespace-only, the else branch fires
 *   toast.error("Please fill in both title and description.").
 *
 *   IMPORTANT — field reset timing in AddTask:
 *     setNewTaskTitle("") and setNewTaskDescription("") are outside the
 *     try/catch block (lines 30-31 in AddTask.tsx). They run whenever the
 *     if-condition is true, regardless of API success or failure.
 *     F10 tests only verify the API call and callback are triggered; field
 *     reset behavior is already covered in F04.
 *
 *   TaskCard edit mode:
 *     handleKeyPress calls updateTask() then setIsEditing(false).
 *     The component confirms edit and exits editing when Enter is pressed
 *     inside either edit Input.
 *
 * Mocks:
 *   @clerk/react  — fake getToken()
 *   sonner        — captures toast calls
 *   api.post      — vi.spyOn; prevents real HTTP
 *   api.put       — vi.spyOn; prevents real HTTP
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
import AddTask from "@/components/AddTask";
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
    _id: "task-kb-1",
    title: "Original Title",
    description: "Original Desc",
    status: "pending",
    createdAt: new Date("2024-01-01"),
    completedAt: null,
    ...overrides,
  };
}

// --- Suite ---

describe("F10 — Keyboard interaction: Enter key in AddTask and TaskCard", () => {
  let mockHandleNewTaskAdded: ReturnType<typeof vi.fn>;
  let mockHandleTaskChanged: ReturnType<typeof vi.fn>;
  let mockPost: ReturnType<typeof vi.spyOn>;
  let mockPut: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockHandleNewTaskAdded = vi.fn();
    mockHandleTaskChanged = vi.fn();
    mockPost = vi
      .spyOn(api, "post")
      .mockResolvedValue({ data: { _id: "new-1", title: "KB Task" } } as any);
    mockPut = vi
      .spyOn(api, "put")
      .mockResolvedValue({ data: {} } as any);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  // ── F10-1: AddTask — Enter with valid data ────────────────────────────────

  describe("F10-1: AddTask submits via Enter when both fields are filled", () => {
    it("pressing Enter in the title input calls api.post with correct endpoint and body", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);

      // Fill both fields
      await user.type(screen.getByPlaceholderText("Task Title"), "KB Task Title");
      await user.type(screen.getByPlaceholderText("Task Description"), "KB Desc");

      // Press Enter inside the title input — onKeyPress fires addTask()
      const titleInput = screen.getByPlaceholderText("Task Title");
      await user.type(titleInput, "{Enter}");

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
      });

      expect(mockPost).toHaveBeenCalledWith(
        "/tasks",
        { title: "KB Task Title", description: "KB Desc" },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("pressing Enter in the description input also triggers api.post", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);

      await user.type(screen.getByPlaceholderText("Task Title"), "KB Task Title");
      await user.type(screen.getByPlaceholderText("Task Description"), "KB Desc");

      // Press Enter inside the description input
      const descInput = screen.getByPlaceholderText("Task Description");
      await user.type(descInput, "{Enter}");

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
      });

      expect(mockPost).toHaveBeenCalledWith(
        "/tasks",
        { title: "KB Task Title", description: "KB Desc" },
        expect.anything()
      );
    });

    it("pressing Enter calls handleNewTaskAdded once on success", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);

      await user.type(screen.getByPlaceholderText("Task Title"), "KB Task");
      await user.type(screen.getByPlaceholderText("Task Description"), "KB Desc");
      await user.type(screen.getByPlaceholderText("Task Title"), "{Enter}");

      await waitFor(() => {
        expect(mockHandleNewTaskAdded).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ── F10-2: AddTask — Enter with incomplete data ───────────────────────────

  describe("F10-2: AddTask Enter behavior when fields are not fully filled", () => {
    it("pressing Enter with only title filled does NOT call api.post", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);

      await user.type(screen.getByPlaceholderText("Task Title"), "Title only");
      // Leave description empty
      await user.type(screen.getByPlaceholderText("Task Title"), "{Enter}");

      // addTask() enters else branch → toast.error, no API call
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          "Please fill in both title and description."
        );
      });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("pressing Enter with only description filled does NOT call api.post", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);

      await user.type(screen.getByPlaceholderText("Task Description"), "Desc only");
      await user.type(screen.getByPlaceholderText("Task Description"), "{Enter}");

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          "Please fill in both title and description."
        );
      });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("pressing Enter with both fields empty does NOT call api.post", async () => {
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);

      // Both fields are empty — press Enter in the title input
      await user.click(screen.getByPlaceholderText("Task Title"));
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          "Please fill in both title and description."
        );
      });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("pressing Enter with whitespace-only title does NOT call api.post", async () => {
      /**
       * addTask() guard: newTaskTitle.trim() is "" for "   " → falsy.
       * So the API is not called and toast.error fires.
       * Note: the backend (B15-1) accepts whitespace, but the frontend
       * guards against it at the trim() check in addTask().
       */
      const user = userEvent.setup();
      render(<AddTask handleNewTaskAdded={mockHandleNewTaskAdded} />);

      await user.type(screen.getByPlaceholderText("Task Title"), "   ");
      await user.type(screen.getByPlaceholderText("Task Description"), "Valid desc");
      await user.type(screen.getByPlaceholderText("Task Title"), "{Enter}");

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          "Please fill in both title and description."
        );
      });
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  // ── F10-3: TaskCard — Enter confirms edit ────────────────────────────────

  describe("F10-3: TaskCard confirms edit via Enter in edit mode", () => {
    it("pressing Enter in the title edit input calls api.put with updated title", async () => {
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      // Enter edit mode by clicking the edit button (hover:text-info)
      const editBtn = container.querySelector('[class*="hover:text-info"]') as HTMLElement;
      await user.click(editBtn);

      // Edit inputs are now visible
      const titleInput = screen.getByPlaceholderText("Edit task title...");
      await user.clear(titleInput);
      await user.type(titleInput, "New Title via Enter");

      // Press Enter in the title input to confirm
      await user.type(titleInput, "{Enter}");

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
      });

      expect(mockPut).toHaveBeenCalledWith(
        `/tasks/${task._id}`,
        expect.objectContaining({ title: "New Title via Enter" }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("pressing Enter in the description edit input calls api.put with updated description", async () => {
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      // Enter edit mode
      const editBtn = container.querySelector('[class*="hover:text-info"]') as HTMLElement;
      await user.click(editBtn);

      const descInput = screen.getByPlaceholderText("Edit task description...");
      await user.clear(descInput);
      await user.type(descInput, "New Desc via Enter");

      // Press Enter in the description input
      await user.type(descInput, "{Enter}");

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
      });

      expect(mockPut).toHaveBeenCalledWith(
        `/tasks/${task._id}`,
        expect.objectContaining({ description: "New Desc via Enter" }),
        expect.anything()
      );
    });

    it("pressing Enter calls handleTaskChanged once on successful update", async () => {
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      // Enter edit mode and press Enter to confirm
      await user.click(
        container.querySelector('[class*="hover:text-info"]') as HTMLElement
      );
      const titleInput = screen.getByPlaceholderText("Edit task title...");
      await user.type(titleInput, "{Enter}");

      await waitFor(() => {
        expect(mockHandleTaskChanged).toHaveBeenCalledTimes(1);
      });
    });

    it("pressing Enter in edit mode exits editing (edit inputs no longer visible)", async () => {
      /**
       * handleKeyPress in TaskCard calls updateTask() then setIsEditing(false).
       * After Enter, the edit inputs should disappear from the DOM.
       */
      const user = userEvent.setup();
      const task = makeTask();
      const { container } = render(
        <TaskCard
          task={task}
          index={0}
          handleTaskChanged={mockHandleTaskChanged}
        />
      );

      // Enter edit mode
      await user.click(
        container.querySelector('[class*="hover:text-info"]') as HTMLElement
      );

      // Verify edit inputs are visible
      expect(screen.getByPlaceholderText("Edit task title...")).toBeDefined();

      // Press Enter to confirm and exit edit mode
      await user.type(screen.getByPlaceholderText("Edit task title..."), "{Enter}");

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
      });

      // After Enter, setIsEditing(false) is called — edit inputs should be gone
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Edit task title...")
        ).toBeNull();
      });
    });
  });
});
