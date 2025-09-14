import { Circle } from "lucide-react";
import { Card } from "./ui/card";

const TaskEmptyState = (props: { filter: String }) => {
  return (
    <Card className="p-8 text-center border-0 bg-gradient-card shadow-custom-md">
      <div className="space-y-3">
        <Circle className="size-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-medium text-foreground">
            {props.filter === "pending"
              ? "No pending tasks!"
              : props.filter === "inprogress"
              ? "No tasks in progress!"
              : props.filter === "completed"
              ? "No completed tasks!"
              : "No tasks available!"}
          </h3>

          <p>
            {props.filter === "all"
              ? "Create a new task to get started!"
              : `Please change to 'All' filter to see others tasks.`}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TaskEmptyState;
