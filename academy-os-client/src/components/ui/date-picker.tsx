import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
  id?: string
}

function DatePicker({
  date,
  onDateChange,
  placeholder = "JJ/MM/AAAA",
  disabled = false,
  error = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-start text-left font-normal rounded-xl border px-4",
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-slate-200 dark:border-white/10",
            !date && "text-slate-400 dark:text-slate-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 text-slate-400" />
          {date ? (
            format(date, "dd/MM/yyyy", { locale: fr })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
export type { DatePickerProps }
