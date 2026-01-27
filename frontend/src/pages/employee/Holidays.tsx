import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    startOfWeek,
    endOfWeek,
    parseISO,
} from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Holiday {
    _id: string;
    name: string;
    type: string;
    startDate: Date;
    endDate: Date;
}

/* ======================
   TYPE → COLOR MAP
   ====================== */
const TYPE_COLOR_MAP: Record<string, string> = {
    Holiday: "bg-blue-600",
    National: "bg-red-500",
    Festival: "bg-yellow-500",
    Event: "bg-purple-500",
};

/* ======================
   TYPE → CARD STYLE MAP
   ====================== */
const TYPE_CARD_STYLE_MAP: Record<
    string,
    { card: string; dateBox: string; title: string }
> = {
    Holiday: {
        card: "border-l-blue-600 bg-blue-50/40 shadow-blue-500/15",
        dateBox: "bg-blue-600 text-white",
        title: "text-blue-700",
    },
    National: {
        card: "border-l-red-600 bg-red-50/40 shadow-red-500/15",
        dateBox: "bg-red-600 text-white",
        title: "text-red-700",
    },
    Festival: {
        card: "border-l-yellow-500 bg-yellow-50/40 shadow-yellow-500/20",
        dateBox: "bg-yellow-500 text-white",
        title: "text-yellow-700",
    },
    Event: {
        card: "border-l-purple-600 bg-purple-50/40 shadow-purple-500/15",
        dateBox: "bg-purple-600 text-white",
        title: "text-purple-700",
    },
};

/* ======================
   RANGE CHECK
   ====================== */
const isDateInRange = (date: Date, start: Date, end: Date) => {
    const d = date.setHours(0, 0, 0, 0);
    const s = start.setHours(0, 0, 0, 0);
    const e = end.setHours(0, 0, 0, 0);
    return d >= s && d <= e;
};

export default function Holidays() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/employee/holidays', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Parse dates
                    const parsedData = data.map((h: any) => ({
                        ...h,
                        startDate: parseISO(h.startDate),
                        endDate: parseISO(h.endDate)
                    }));
                    setHolidays(parsedData);
                }
            } catch (error) {
                console.error("Failed to fetch holidays", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHolidays();
    }, []);

    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));
    const totalDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayEvents = (date: Date) =>
        holidays.filter(h =>
            isDateInRange(date, h.startDate, h.endDate)
        );

    const monthHolidays = holidays.filter(h => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        // Check overlap
        return (h.startDate <= monthEnd && h.endDate >= monthStart);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <div className="h-10 w-10 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                Holidays
            </h1>

            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                {/* Calendar */}
                <Card className="border shadow-md">
                    <CardContent className="p-4 space-y-4">
                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                <ChevronLeft />
                            </Button>

                            <div className="flex gap-2 items-center">
                                <div className="px-4 py-1 border-2 border-sky-500 rounded-md font-semibold text-sky-500">
                                    {format(currentMonth, "MMMM")}
                                </div>
                                <div className="px-4 py-1 border-2 border-sky-500 rounded-md font-semibold text-sky-500">
                                    {format(currentMonth, "yyyy")}
                                </div>

                                <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date())}>
                                    Today
                                </Button>
                            </div>

                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                <ChevronRight />
                            </Button>
                        </div>

                        {/* Weekdays */}
                        <div className="grid grid-cols-7 text-sm text-center font-medium text-muted-foreground">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                <div key={d}>{d}</div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-2">
                            {totalDays.map((date, i) => {
                                const events = getDayEvents(date);
                                const isCurrent = isSameMonth(date, currentMonth);

                                const eventColor =
                                    events.length > 0
                                        ? TYPE_COLOR_MAP[events[0].type]
                                        : "";

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-12 flex items-center justify-center rounded-lg text-sm font-medium",
                                            !isCurrent && "text-muted-foreground",
                                            eventColor && `${eventColor} text-white`
                                        )}
                                    >
                                        {format(date, "d")}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 pt-4 text-sm">
                            <Legend color="bg-blue-600" label="Holiday" />
                            <Legend color="bg-red-500" label="National" />
                            <Legend color="bg-yellow-500" label="Festival" />
                            <Legend color="bg-purple-500" label="Event" />
                        </div>
                    </CardContent>
                </Card>

                {/* Holiday List */}
                <Card className="border shadow-md">
                    <CardHeader>
                        <CardTitle>
                            Holiday List ({monthHolidays.length})
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {monthHolidays.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No holidays available in this month.
                            </p>
                        )}

                        {monthHolidays.map((h, index) => {
                            const style = TYPE_CARD_STYLE_MAP[h.type];

                            return (
                                <Card
                                    key={index}
                                    className={cn(
                                        "group border-l-4 shadow-lg transition-all duration-300 hover:-translate-y-1",
                                        style.card
                                    )}
                                >
                                    <CardContent className="p-4 flex items-center gap-4">
                                        {/* DATE BOX */}
                                        <div
                                            className={cn(
                                                "h-14 w-14 rounded-lg flex flex-col items-center justify-center font-bold shadow-md",
                                                style.dateBox
                                            )}
                                        >
                                            <span className="text-xl">
                                                {format(h.startDate, "d")}
                                            </span>
                                            <span className="text-xs uppercase">
                                                {format(h.startDate, "MMM")}
                                            </span>
                                        </div>

                                        {/* CONTENT */}
                                        <div>
                                            <p className={cn("text-base font-bold", style.title)}>
                                                {h.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(h.startDate, "EEEE, MMMM d, yyyy")}
                                                {h.startDate.getTime() !== h.endDate.getTime() && (
                                                    <> – {format(h.endDate, "EEEE, MMMM d, yyyy")}</>
                                                )}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/* ======================
   LEGEND COMPONENT
   ====================== */
function Legend({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-full", color)} />
            <span className="text-muted-foreground">{label}</span>
        </div>
    );
}
