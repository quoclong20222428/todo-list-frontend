interface FooterProps {
  pendingTasksCount: number;
  inProgressTasksCount: number;
  completedTasksCount: number;
}

const getEncouragementMessage = ({
  pendingTasksCount,
  inProgressTasksCount,
  completedTasksCount,
}: FooterProps): string => {
  // 1. Không có task nào
  if (
    pendingTasksCount === 0 &&
    inProgressTasksCount === 0 &&
    completedTasksCount === 0
  ) {
    return "🌟 You have no tasks right now. Perfect time to relax or plan something new!";
  }

  // 2. Chỉ có pending
  if (
    pendingTasksCount > 0 &&
    inProgressTasksCount === 0 &&
    completedTasksCount === 0
  ) {
    return `✨ Let's get started! You have ${pendingTasksCount} pending ${
      pendingTasksCount === 1 ? "task" : "tasks"
    } waiting for you.`;
  }

  // 3. Chỉ có in-progress
  if (
    pendingTasksCount === 0 &&
    inProgressTasksCount > 0 &&
    completedTasksCount === 0
  ) {
    return `⚡ You’re working on ${inProgressTasksCount} ${
      inProgressTasksCount === 1 ? "task" : "tasks"
    }. Stay focused and keep going!`;
  }

  // 4. Chỉ có completed
  if (
    pendingTasksCount === 0 &&
    inProgressTasksCount === 0 &&
    completedTasksCount > 0
  ) {
    return `🎉 Awesome! You completed ${
      completedTasksCount === 1 ? "a task" : `${completedTasksCount} tasks`
    } already! Time to celebrate your progress.`;
  }

  // 5. Có completed + (pending hoặc inprogress)
  if (
    completedTasksCount > 0 &&
    (pendingTasksCount > 0 || inProgressTasksCount > 0)
  ) {
    let msg = `🎉 Great job! You’ve completed ${completedTasksCount} ${
      completedTasksCount === 1 ? "task" : "tasks"
    } so far.`;

    const details: string[] = [];
    if (pendingTasksCount > 0) {
      details.push(
        `${pendingTasksCount} pending ${
          pendingTasksCount === 1 ? "task" : "tasks"
        }`
      );
    }
    if (inProgressTasksCount > 0) {
      details.push(
        `${inProgressTasksCount} in-progress ${
          inProgressTasksCount === 1 ? "task" : "tasks"
        }`
      );
    }

    msg += ` You still have ${details.join(" and ")} to go. Keep it up! 💪`;
    return msg;
  }

  // 6. Có pending + inprogress nhưng chưa completed
  if (
    pendingTasksCount > 0 &&
    inProgressTasksCount > 0 &&
    completedTasksCount === 0
  ) {
    return `🚀 You’ve got ${pendingTasksCount} pending ${
      pendingTasksCount === 1 ? "task" : "tasks"
    } and ${inProgressTasksCount} in-progress ${
      inProgressTasksCount === 1 ? "task" : "tasks"
    }. Let’s tackle them one by one!`;
  }

  // fallback
  return "Keep going! Every step you take brings you closer to your goals. 🌟";
};

const Footer = ({
  pendingTasksCount,
  inProgressTasksCount,
  completedTasksCount,
}: FooterProps) => {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-200 font-medium">
        {getEncouragementMessage({
          pendingTasksCount,
          inProgressTasksCount,
          completedTasksCount,
        })}
      </p>
    </div>
  );
};

export default Footer;