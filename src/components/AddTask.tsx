import { api } from "@/api/api";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { useAuth } from "@clerk/clerk-react";

const AddTask = ({ handleNewTaskAdded }: any) => {
  const { getToken } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskDescription, setNewTaskDescription] = useState<string>("");

  const addTask = async () => {
    if (newTaskTitle.trim() && newTaskDescription.trim()) {
      try {
        const token = await getToken();
        await api.post(
          "/tasks",
          { title: newTaskTitle, description: newTaskDescription },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("New task add successfully!");
        handleNewTaskAdded();
      } catch (error) {
        console.log("Error add new task: ", error);
        toast.error("Error add new task. Please try again.");
      }
      setNewTaskTitle("");
      setNewTaskDescription("");
    } else {
      toast.error("Please fill in both title and description.");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      addTask();
    }
  };

  return (
    <div>
      <Card className="p-6 border-0 bg-gradient-card shadow-custom-lg">
        <div className="flex flex-col gap-3">
          <Input
            type="text"
            placeholder="Task Title"
            className="
            bg-white/80 
            placeholder:text-gray-500 
            rounded-md px-3 py-2
            border border-gray-300
            focus:border-primary focus:ring-2 focus:ring-primary/40 
            focus:outline-none
            transition
            "
            value={newTaskTitle}
            onChange={(even) => setNewTaskTitle(even.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Input
            type="text"
            placeholder="Task Description"
            className="
            bg-white/80 
            placeholder:text-gray-500 
            rounded-md px-3 py-2 h-16 text-base
            border border-gray-300
            focus:border-primary focus:ring-2 focus:ring-primary/40 
            focus:outline-none
            transition
            "
            value={newTaskDescription}
            onChange={(even) => setNewTaskDescription(even.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant={"gradient"}
            size={"xl"}
            className="px-6"
            onClick={addTask}
            disabled={!newTaskTitle.trim() || !newTaskDescription.trim()}
          >
            <Plus className="size-5" />
            Add Task
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AddTask;
