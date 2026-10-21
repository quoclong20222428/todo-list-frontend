/**
 * F02 — Status cycle logic unit test
 *
 * SCOPE DISCLAIMER:
 *   This test replicates the 3-line ternary from TaskCard.tsx:81-86 that
 *   computes `nextStatus` from the current task status. It does NOT mount
 *   the component and does NOT provide coverage of:
 *     - API call made by toggleTaskStatus()
 *     - Token retrieval via useAuth()
 *     - Toast notifications
 *     - UI re-render after status change
 *
 *   The test verifies that the status transition ALGORITHM (the ternary) is
 *   correct. Component-level and E2E coverage is deferred to a later batch.
 *
 * The algorithm under test (TaskCard.tsx:81-86):
 *   const nextStatus =
 *     task.status === "pending"
 *       ? "inprogress"
 *       : task.status === "inprogress"
 *       ? "completed"
 *       : "pending";
 */

import { describe, it, expect } from "vitest";

type TaskStatus = "pending" | "inprogress" | "completed";

/**
 * Replicates the nextStatus ternary from TaskCard.tsx:81-86 verbatim.
 * This is NOT a production import — it is a faithful copy of the algorithm
 * used to test the transition logic in isolation.
 */
function computeNextStatus(currentStatus: TaskStatus): TaskStatus {
  return currentStatus === "pending"
    ? "inprogress"
    : currentStatus === "inprogress"
    ? "completed"
    : "pending";
}

describe("F02 — Status cycle algorithm (algorithm replication; not component coverage)", () => {
  it("pending → inprogress", () => {
    expect(computeNextStatus("pending")).toBe("inprogress");
  });

  it("inprogress → completed", () => {
    expect(computeNextStatus("inprogress")).toBe("completed");
  });

  it("completed → pending (wraparound)", () => {
    expect(computeNextStatus("completed")).toBe("pending");
  });

  it("full cycle: pending → inprogress → completed → pending", () => {
    let status: TaskStatus = "pending";
    status = computeNextStatus(status);
    expect(status).toBe("inprogress");
    status = computeNextStatus(status);
    expect(status).toBe("completed");
    status = computeNextStatus(status);
    expect(status).toBe("pending");
  });

  it("each valid status produces a valid status", () => {
    const validStatuses: TaskStatus[] = ["pending", "inprogress", "completed"];
    for (const s of validStatuses) {
      const next = computeNextStatus(s);
      expect(validStatuses).toContain(next);
    }
  });
});
