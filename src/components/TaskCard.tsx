import { api } from "@/api/api";
import type { Task } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  Circle,
  SquarePen,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

interface TaskCardProps {
  task: Task;
  index: any;
  handleTaskChanged: any;
}

const TaskCard = ({ task, index, handleTaskChanged }: TaskCardProps) => {
  const { getToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title || "");
  const [editDescription, setEditDescription] = useState(
    task.description || ""
  );

  const deleteTask = async (taskId: string) => {
    try {
      const token = await getToken();
      await api.delete(`/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Task deleted successfully");
      handleTaskChanged();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      updateTask();
      setIsEditing(false);
    }
  };

  const updateTask = async () => {
    try {
      const token = await getToken();
      await api.put(
        `/tasks/${task._id}`,
        {
          title: editTitle,
          description: editDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Task updated successfully");
      handleTaskChanged();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const toggleTaskStatus = async () => {
    try {
      const nextStatus =
        task.status === "pending"
          ? "inprogress"
          : task.status === "inprogress"
          ? "completed"
          : "pending";

      const token = await getToken();
      await api.put(
        `/tasks/${task._id}`,
        {
          status: nextStatus,
          completedAt:
            nextStatus === "completed" ? new Date().toISOString() : null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`Task marked as ${nextStatus}`);
      handleTaskChanged();
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  return (
    <Card
      className={cn(
        "p-4 bg-gradient-card border-0 shadow-custom-md hover:shadow-custom-lg transition-all duration-200 animate-fade-in group",
        task.status === "completed" && "opacity-75"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* show status */}
        <Button
          variant={"ghost"}
          size={"icon"}
          className={cn(
            "flex-shrink-0 size-8 rounded-full transition-all duration-200",
            task.status === "completed"
              ? "text-success hover:text-primary"
              : "text-muted-foreground hover:text-primary"
          )}
          onClick={toggleTaskStatus}
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="size-5" />
          ) : task.status === "inprogress" ? (
            <div className="size-5 border-2 border-dashed rounded-full animate-spin border-primary" />
          ) : (
            <Circle className="size-5" />
          )}
        </Button>

        {/* Show editing tasks */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div
              className="flex flex-col gap-2"
              tabIndex={-1}
              onBlur={(e) => {
                // chỉ thoát khi blur ra ngoài toàn bộ container
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  updateTask();
                  setIsEditing(false);
                }
              }}
            >
              <Input
                placeholder="Edit task title..."
                className="flex-1 h-12 text-base border-border/50 focus:border-primary/50 focus:bg-primary-primary/5 focus:ring-0/20"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Input
                placeholder="Edit task description..."
                className="flex-1 h-12 text-base border-border/50 focus:border-primary/50 focus:bg-primary-primary/5 focus:ring-0/20"
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          ) : (
            <>
              <p
                className={cn(
                  "text-base font-bold transition-all duration-200",
                  task.status === "completed"
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {task.title}
                <span className="inline-block ml-2 text-xs font-normal text-primary/80">
                  ({task.status.charAt(0).toUpperCase() + task.status.slice(1)})
                </span>
              </p>

              {/* Show date created and completed */}
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
                {task.completedAt && task.status === "completed" && (
                  <>
                    <span className="text-xs text-muted-foreground mx-1">
                      -
                    </span>
                    <Calendar className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.completedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              <p
                className={cn(
                  "text-base transition-all duration-200",
                  task.status === "completed"
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {task.description}
              </p>
            </>
          )}
        </div>

        {/* Editing and delete button */}
        <div className="hidden gap-2 group-hover:inline-flex animate-slide-up">
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 transition-colors size-8 text-muted-foreground hover:text-info"
            onClick={() => {
              if (isEditing) {
                updateTask();
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <SquarePen className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 transition-colors size-8 text-muted-foreground hover:text-destructive"
            onClick={() => deleteTask(task._id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
