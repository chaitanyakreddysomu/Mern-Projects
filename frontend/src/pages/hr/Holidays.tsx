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
} from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    PlusCircle,
    CalendarDays,
    Type,
    Layers,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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

export default function HRHolidays() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [holidays, setHolidays] = useState<any[]>([]); // Using any[] to allow Date objects in state, while API returns strings
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Form State
    const [newHolidayName, setNewHolidayName] = useState("");
    const [newHolidayStartDate, setNewHolidayStartDate] = useState("");
    const [newHolidayEndDate, setNewHolidayEndDate] = useState("");
    const [newHolidayType, setNewHolidayType] = useState("Holiday");

    const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);

    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

    // Fetch Holidays
    const fetchHolidays = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/holidays`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Convert date strings to Date objects for the calendar
                const formattedData = data.map((h: any) => ({
                    ...h,
                    id: h._id, // Map _id to id for consistency
                    startDate: new Date(h.startDate),
                    endDate: new Date(h.endDate)
                }));
                setHolidays(formattedData);
            }
        } catch (error) {
            console.error("Failed to fetch holidays", error);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleAddHoliday = async () => {
        if (!newHolidayName || !newHolidayStartDate || !newHolidayEndDate) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/holidays`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newHolidayName,
                    type: newHolidayType,
                    startDate: newHolidayStartDate,
                    endDate: newHolidayEndDate
                })
            });

            if (res.ok) {
                fetchHolidays(); // Refresh list
                resetForm();
            }
        } catch (error) {
            console.error("Failed to add holiday", error);
        }
    };

    const handleUpdateHoliday = async () => {
        if (!newHolidayName || !newHolidayStartDate || !newHolidayEndDate || !editingHolidayId) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/holidays/${editingHolidayId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newHolidayName,
                    type: newHolidayType,
                    startDate: newHolidayStartDate,
                    endDate: newHolidayEndDate
                })
            });

            if (res.ok) {
                fetchHolidays(); // Refresh list
                resetForm();
            }
        } catch (error) {
            console.error("Failed to update holiday", error);
        }
    };

    const handleEditClick = (holiday: any) => {
        setEditingHolidayId(holiday.id);
        setNewHolidayName(holiday.name);
        setNewHolidayType(holiday.type);
        setNewHolidayStartDate(format(holiday.startDate, 'yyyy-MM-dd'));
        setNewHolidayEndDate(format(holiday.endDate, 'yyyy-MM-dd'));
        setIsAddDialogOpen(true);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmationId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmationId) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/holidays/${deleteConfirmationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchHolidays(); // Refresh
                setDeleteConfirmationId(null);
            }
        } catch (error) {
            console.error("Failed to delete holiday", error);
        }
    };

    const resetForm = () => {
        setIsAddDialogOpen(false);
        setNewHolidayName("");
        setNewHolidayStartDate("");
        setNewHolidayEndDate("");
        setNewHolidayType("Holiday");
        setEditingHolidayId(null);
    };


    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));
    const totalDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayEvents = (date: Date) =>
        holidays.filter(h =>
            isDateInRange(date, h.startDate, h.endDate)
        );

    const monthHolidays = holidays.filter(h => {
        // Simple overlap check
        const mStart = startOfMonth(currentMonth);
        const mEnd = endOfMonth(currentMonth);
        return (h.startDate <= mEnd && h.endDate >= mStart);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <div className="h-10 w-10 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/30">
                        <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    Holidays
                </h1>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-700 active:scale-95">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Holiday
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingHolidayId ? "Edit Holiday" : "Add New Holiday"}</DialogTitle>
                            <DialogDescription>
                                {editingHolidayId ? "Update the details of the selected holiday." : "Add a new holiday or event to the calendar."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Holiday Name</Label>
                                <div className="relative">
                                    <Input
                                        id="name"
                                        placeholder="e.g. New Year"
                                        className="pl-9"
                                        value={newHolidayName}
                                        onChange={(e) => setNewHolidayName(e.target.value)}
                                    />
                                    <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <div className="relative">
                                        <Input
                                            id="start-date"
                                            type="date"
                                            className="pl-9"
                                            value={newHolidayStartDate}
                                            onChange={(e) => setNewHolidayStartDate(e.target.value)}
                                        />
                                        <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <div className="relative">
                                        <Input
                                            id="end-date"
                                            type="date"
                                            className="pl-9"
                                            value={newHolidayEndDate}
                                            onChange={(e) => setNewHolidayEndDate(e.target.value)}
                                        />
                                        <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Event Type</Label>
                                <div className="relative">
                                    <Select value={newHolidayType} onValueChange={setNewHolidayType}>
                                        <SelectTrigger className="w-full pl-9">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Holiday">Holiday</SelectItem>
                                            <SelectItem value="National">National</SelectItem>
                                            <SelectItem value="Festival">Festival</SelectItem>
                                            <SelectItem value="Event">Event</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Layers className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                            <Button onClick={editingHolidayId ? handleUpdateHoliday : handleAddHoliday} className="bg-sky-600 hover:bg-sky-700 text-white">
                                {editingHolidayId ? "Update Holiday" : "Add Holiday"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmationId} onOpenChange={(open) => !open && setDeleteConfirmationId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this holiday? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteConfirmationId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-200">
                            {monthHolidays.map((h, index) => {
                                const style = TYPE_CARD_STYLE_MAP[h.type] || TYPE_CARD_STYLE_MAP.Holiday;

                                return (
                                    <Card
                                        key={index}
                                        className={cn(
                                            "group border-l-4 shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white relative overflow-hidden",
                                            style.card
                                        )}
                                        onClick={() => handleEditClick(h)}
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            {/* DATE BOX */}
                                            <div
                                                className={cn(
                                                    "h-14 w-14 rounded-lg flex flex-col items-center justify-center font-bold shadow-md shrink-0",
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
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-base font-bold truncate", style.title)}>
                                                    {h.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                    {h.startDate.getTime() === h.endDate.getTime()
                                                        ? format(h.startDate, "EEEE, MMMM d, yyyy")
                                                        : `${format(h.startDate, "MMM d")} - ${format(h.endDate, "MMM d, yyyy")}`
                                                    }
                                                </p>
                                            </div>

                                            {/* ACTIONS */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => handleDeleteClick(h.id, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
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
