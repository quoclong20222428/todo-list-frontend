// @vitest-environment jsdom

/**
 * F06 — TaskCard component: toggleTaskStatus() request shape
 *
 * Tests that the correct PUT body is sent for each status transition,
 * with particular attention to the completedAt field which must be a
 * non-null ISO string when transitioning to "completed" and null otherwise.
 *
 * Production code under test: src/components/TaskCard.tsx (toggleTaskStatus)
 *
 * What regressions this can detect:
 *   - Status transition order changed (e.g. pending → completed instead of inprogress)
 *   - completedAt set to null for "completed" transition (backend date ignored)
 *   - completedAt NOT set to null when reverting from completed
 *   - Authorization header missing from status toggle PUT
 *   - handleTaskChanged() not called after successful status change
 *   - handleTaskChanged() called even when PUT rejects
 *
 * Note on F02 overlap:
 *   F02 tests a manually-reimplemented copy of the ternary algorithm.
 *   F06 tests the actual PUT request emitted by the production component —
 *   these are complementary: F06 will catch regressions that F02 cannot
 *   (e.g. wrong completedAt value, missing Authorization header, wrong endpoint).
 *
 * Mocks:
 *   @clerk/react  — fake getToken() returning "test-token"
 *   sonner        — captures toast.error for error-path assertions
 *   api.put       — vi.spyOn; inspected for call arguments
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

// --- Helper ---

function makeTask(status: Task["status"]): Task {
  return {
    _id: "task-1",
    title: "Test Task",
    description: "Test Desc",
    status,
    createdAt: new Date("2024-01-01"),
    completedAt: status === "completed" ? new Date("2024-01-02") : null,
  };
}

// --- Suite ---

describe("F06 — TaskCard component: toggleTaskStatus() PUT request shape", () => {
  let mockHandleTaskChanged: ReturnType<typeof vi.fn>;
  let mockPut: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockHandleTaskChanged = vi.fn();
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

  async function clickStatusButton() {
    // The status toggle is always the first button rendered in <TaskCard>.
    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button")[0]);
  }

  // ── Status transitions ───────────────────────────────────────────────────────

  it("pending → inprogress: sends { status: 'inprogress', completedAt: null }", async () => {
    render(
      <TaskCard
        task={makeTask("pending")}
        index={0}
        handleTaskChanged={mockHandleTaskChanged}
      />
    );
    await clickStatusButton();

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledTimes(1);
    });
    expect(mockPut).toHaveBeenCalledWith(
      "/tasks/task-1",
      { status: "inprogress", completedAt: null },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      })
    );
  });

  it("inprogress → completed: sends { status: 'completed', completedAt: <ISO string> }", async () => {
    render(
      <TaskCard
        task={makeTask("inprogress")}
        index={0}
        handleTaskChanged={mockHandleTaskChanged}
      />
    );
    await clickStatusButton();

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledTimes(1);
    });

    // Inspect the body argument directly to verify completedAt shape.
    const body = mockPut.mock.calls[0][1] as {
      status: string;
      completedAt: string | null;
    };
    expect(body.status).toBe("completed");
    expect(body.completedAt).not.toBeNull();
    // Verify it is a valid ISO-8601 timestamp string.
    expect(typeof body.completedAt).toBe("string");
    expect(body.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("completed → pending: sends { status: 'pending', completedAt: null }", async () => {
    render(
      <TaskCard
        task={makeTask("completed")}
        index={0}
        handleTaskChanged={mockHandleTaskChanged}
      />
    );
    await clickStatusButton();

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledTimes(1);
    });
    expect(mockPut).toHaveBeenCalledWith(
      "/tasks/task-1",
      { status: "pending", completedAt: null },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      })
    );
  });

  // ── Callback and error behavior ──────────────────────────────────────────────

  it("calls handleTaskChanged() once on successful toggle", async () => {
    render(
      <TaskCard
        task={makeTask("pending")}
        index={0}
        handleTaskChanged={mockHandleTaskChanged}
      />
    );
    await clickStatusButton();

    await waitFor(() => {
      expect(mockHandleTaskChanged).toHaveBeenCalledTimes(1);
    });
  });

  it("does NOT call handleTaskChanged() and fires toast.error when PUT rejects", async () => {
    mockPut.mockRejectedValueOnce(new Error("Network error"));
    render(
      <TaskCard
        task={makeTask("pending")}
        index={0}
        handleTaskChanged={mockHandleTaskChanged}
      />
    );
    await clickStatusButton();

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalled();
    });
    expect(mockHandleTaskChanged).not.toHaveBeenCalled();
  });
});
