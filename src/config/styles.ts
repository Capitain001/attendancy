export const attendanceStatus = {
  present:  "border-2 bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 hover:bg-green-600/5 dark:hover:bg-green-400/5",
  absent:   "border-transparent bg-destructive/10 text-destructive/70 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 hover:bg-destructive/5",
  late:     "border bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 hover:bg-amber-600/5 dark:hover:bg-amber-400/5",
  excused:  "border bg-blue-600/10 text-blue-600 focus-visible:ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:focus-visible:ring-blue-400/40 hover:bg-blue-600/5 dark:hover:bg-blue-400/5",
} as const
