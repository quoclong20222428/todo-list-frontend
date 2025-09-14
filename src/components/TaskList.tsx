import type { Task } from "@/lib/data";
import { FilterTypes } from "@/lib/data";
import TaskCard from "./TaskCard";
import TaskEmptyState from "./TaskEmptyState";

interface TaskListProps {
  filteredTasks: Task[];
  filter: keyof typeof FilterTypes;
  handleTaskChanged: any;
}

const TaskList = ({filteredTasks = [], filter, handleTaskChanged} : TaskListProps) => {
  // Use the filter parameter or default to "all"
  const currentFilter = filter || FilterTypes.all;

  if (filteredTasks.length === 0 || !filteredTasks) {
    return <TaskEmptyState filter={currentFilter} />;
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task, index) => (
        <TaskCard key={task._id} task={task} index={index} handleTaskChanged={handleTaskChanged}/>
      ))}
    </div>
  );
};

export default TaskList;
