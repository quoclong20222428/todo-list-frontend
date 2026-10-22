import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { generatePages } from "@/lib/paginationUtils";

interface TaskListPaginationProps {
  handleNextPage: () => void;
  handlePrevPage: () => void;
  page: number;
  totalPages: number;
  handlePageChange: (newPage: number) => void;
}

const TaskListPagination = ({
  handleNextPage,
  handlePrevPage,
  page,
  totalPages,
  handlePageChange,
}: TaskListPaginationProps) => {

  const pagesToShow = generatePages(page, totalPages);

  return (
    <div className="flex justify-center mt-4 ">
      <Pagination>
        <PaginationContent>
          {/* Prev page */}
          <PaginationItem>
            <PaginationPrevious
              onClick={page === 1 ? undefined : handlePrevPage}
              className={cn(
                "cursor-pointer text-sm text-gray-200 font-medium",
                page === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>

          {pagesToShow.map((p: number | string, index: number) => (
            <PaginationItem key={index}>
              {p === "..." ? (
                <PaginationEllipsis className="cursor-default text-sm text-gray-200 font-medium" />
              ) : (
                <PaginationLink
                  isActive={p === page}
                  onClick={() => {
                    if (p !== page) {
                      handlePageChange(p as number);
                    }
                  }}
                  className={cn(
                    "cursor-pointer text-sm font-medium",
                    p === page
                      ? "bg-white text-gray-900 shadow"
                      : "text-gray-200 hover:text-white hover:bg-gray-700"
                  )}
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Next page */}
          <PaginationItem>
            <PaginationNext
              onClick={page === totalPages ? undefined : handleNextPage}
              className={cn(
                "cursor-pointer text-sm text-gray-200 font-medium",
                page === totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default TaskListPagination;
