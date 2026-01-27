
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export default function DatePicker({
    date,
    setDate,
    placeholder = "Select date",
    className,
    disabled,
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start gap-2 rounded-md border px-3 py-2 text-left text-sm font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {date ? format(date, "MMMM do, yyyy") : placeholder}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={8}
                className="w-auto rounded-xl border bg-white p-3 shadow-lg"
            >
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-lg"
                    classNames={{
                        months: "space-y-4",
                        month: "space-y-4",
                        caption: "flex justify-center relative items-center",
                        caption_label: "text-sm font-semibold",
                        nav: "flex items-center gap-1",
                        nav_button:
                            "h-7 w-7 rounded-md border bg-transparent p-0 opacity-80 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse",
                        head_row: "flex justify-between",
                        head_cell:
                            "w-9 text-center text-xs font-medium text-muted-foreground",
                        row: "flex w-full justify-between mt-2",
                        cell:
                            "relative h-9 w-9 text-center text-sm rounded-md hover:bg-gray-100 focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 rounded-md",
                        day_selected:
                            "bg-zinc-900 text-white hover:bg-zinc-900",
                        day_today: "bg-gray-100 text-gray-900",
                        day_outside: "text-muted-foreground opacity-40",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
