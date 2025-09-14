export const FilterTypes = {
    all: 'all',
    pending: 'pending',
    inprogress: 'inprogress',
    completed: 'completed',
}

export type Task = {
    _id: string;
    title: string;
    description: string;
    status: keyof typeof FilterTypes;
    completedAt: null | Date;
    createdAt: Date;
}

export const options = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "all_time", label: "All Time" },
]

export const visibleTaskLimit = 4;