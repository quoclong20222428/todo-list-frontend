import { FilterTypes } from "@/lib/data";
import { Filter } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface StatsAndFiltersProps {
  pendingTasksCount?: number;
  inProgressTasksCount?: number;
  completedTasksCount?: number;
  filter?: "all" | "completed" | "pending" | "inprogress";
  setFilter: any;
}

const statusStyles = {
  pending: {
    bg: "bg-white/50",
    text: "text-accent-foreground",
    border: "border-info/20",
  },
  inprogress: {
    bg: "bg-white/50",
    text: "text-orange-600",
    border: "border-info/20",
  },
  completed: {
    bg: "bg-white/50",
    text: "text-success",
    border: "border-success/20",
  },
};

const StatsAndFilters = ({
  pendingTasksCount,
  inProgressTasksCount,
  completedTasksCount,
  filter = "all",
  setFilter,
}: StatsAndFiltersProps) => {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      {/* Statics */}
      <div className="flex gap-3">
        <Badge
          variant="secondary"
          className={`${statusStyles.pending.bg} ${statusStyles.pending.text} ${statusStyles.pending.border}`}
        >
          {pendingTasksCount ?? 0}{" "}
          {FilterTypes.pending.charAt(0).toUpperCase() +
            FilterTypes.pending.slice(1)}
        </Badge>
        <Badge
          variant="secondary"
          className={`${statusStyles.inprogress.bg} ${statusStyles.inprogress.text} ${statusStyles.inprogress.border}`}
        >
          {inProgressTasksCount ?? 0}{" "}
          {FilterTypes.inprogress.charAt(0).toUpperCase() +
            FilterTypes.inprogress.slice(1)}
        </Badge>
        <Badge
          variant="secondary"
          className={`${statusStyles.completed.bg} ${statusStyles.completed.text} ${statusStyles.completed.border}`}
        >
          {completedTasksCount ?? 0}{" "}
          {FilterTypes.completed.charAt(0).toUpperCase() +
            FilterTypes.completed.slice(1)}
        </Badge>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-1 sm:flex-row">
        {Object.keys(FilterTypes).map((key) => (
          <Button
            key={key}
            variant={filter === key ? "gradient" : "ghost"}
            size="sm"
            className="capitalize"
            onClick={() => setFilter(key)}
          >
            <Filter className="size-4" />
            {FilterTypes[key as keyof typeof FilterTypes]}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StatsAndFilters;
