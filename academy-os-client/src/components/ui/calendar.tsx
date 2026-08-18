import * as React from "react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={fr}
      formatters={{
        formatWeekdayName: (date) => format(date, "EEE", { locale: fr }).slice(0, 1).toUpperCase(),
      }}
      classNames={{
        root: "p-3",
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        caption: "flex justify-between items-center px-1 pt-1",
        caption_label: "text-sm font-semibold text-slate-900 dark:text-white",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-7 w-7 rounded-lg bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/10"
        ),
        table: "w-full border-collapse",
        head: "flex flex-row",
        head_row: "flex flex-row w-full",
        head_cell: "text-slate-500 dark:text-slate-400 rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex flex-row w-full mt-2",
        cell: "text-slate-900 dark:text-slate-200 h-8 w-8 text-center text-sm p-0 relative",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 rounded-lg text-sm font-medium p-0 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 aria-selected:opacity-100"
        ),
        day_selected: "bg-[#FF6B0B] text-white hover:bg-[#FF6B0B]/90 hover:text-white focus:bg-[#FF6B0B] focus:text-white",
        day_today: "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold",
        day_outside: "text-slate-400 dark:text-slate-600 opacity-50",
        day_disabled: "text-slate-400 dark:text-slate-600 opacity-50",
        day_range_middle: "aria-selected:bg-[#FF6B0B]/20 aria-selected:text-[#FF6B0B]",
        day_range_start: "day-selected rounded-l-lg",
        day_range_end: "day-selected rounded-r-lg",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
      className={cn(className)}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
