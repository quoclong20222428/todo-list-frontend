import { api } from "@/api/api";
import { visibleTaskLimit, type FilterTypes, type Task } from "@/lib/data";
import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  useAuth,
} from "@clerk/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddTask from "../components/AddTask";
import DateTimeFilter from "../components/DateTimeFilter";
import Footer from "../components/Footer";
import { Header } from "../components/Header";
import StatsAndFilters from "../components/StatsAndFilters";
import TaskList from "../components/TaskList";
import TaskListPagination from "../components/TaskListPagination";

function Home() {
  const { getToken } = useAuth();
  const [taskBuffer, setTaskBuffer] = useState<Task[]>([]);
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);
  const [inProgressTasksCount, setInProgressTasksCount] = useState<number>(0);
  const [filter, setFilter] = useState<keyof typeof FilterTypes>("all");
  const [dateQuery, setDateQuery] = useState<string>("all_time");
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    fetchTasks();
  }, [dateQuery]);

  useEffect(() => {
    setPage(1);
  }, [filter, dateQuery]);

  const fetchTasks = async () => {
    try {
      const token = await getToken();
      const res = await api.get(`/tasks?filter=${dateQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTaskBuffer(res.data?.tasks ?? []);
      setPendingTasksCount(res.data.pendingCount ?? 0);
      setCompletedTasksCount(res.data.completedCount ?? 0);
      setInProgressTasksCount(res.data.inProgressCount ?? 0);
      console.log("Fetched tasks: ", res.data?.tasks ?? []);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
      toast.error("Failed to fetch tasks");
    }
  };

  const filteredTasks = (taskBuffer ?? []).filter((task) => {
    switch (filter) {
      case "pending":
        return task.status === "pending";
      case "completed":
        return task.status === "completed";
      case "inprogress":
        return task.status === "inprogress";
      default:
        return true;
    }
  });

  const visibleTasks = filteredTasks.slice(
    (page - 1) * visibleTaskLimit,
    page * visibleTaskLimit
  );

  const totalPages = Math.ceil(filteredTasks.length / visibleTaskLimit);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleTaskChanged = () => {
    fetchTasks();
  };

  if (filteredTasks.length === 0) {
    handlePrevPage();
  }

  return (
    <>
      <SignedIn>
        <div className="min-h-screen w-full relative">
          {/* Radial Gradient Background from Top */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(125% 90% at 50% 10%, #fff 40%, #8656f5 100%)",
            }}
          />
          {/* Your Content/Components */}
          <div className="container pt-8 mx-auto">
            <div className="w-full max-w-4xl p-6 mx-auto space-y-6">
              <Header />

              <AddTask handleNewTaskAdded={handleTaskChanged} />

              <StatsAndFilters
                pendingTasksCount={pendingTasksCount}
                completedTasksCount={completedTasksCount}
                inProgressTasksCount={inProgressTasksCount}
                setFilter={setFilter}
                filter={filter}
              />

              <TaskList
                filteredTasks={visibleTasks}
                filter={filter}
                handleTaskChanged={handleTaskChanged}
              />

              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <TaskListPagination
                  handleNextPage={handleNextPage}
                  handlePrevPage={handlePrevPage}
                  page={page}
                  totalPages={totalPages}
                  handlePageChange={handlePageChange}
                />

                <DateTimeFilter
                  dateQuery={dateQuery}
                  setDateQuery={setDateQuery}
                />
              </div>

              <Footer
                pendingTasksCount={pendingTasksCount}
                completedTasksCount={completedTasksCount}
                inProgressTasksCount={inProgressTasksCount}
              />
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default Home;
