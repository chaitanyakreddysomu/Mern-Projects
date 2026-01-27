import { useMemo, useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_ATTENDANCE } from "@/data/mock";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import {
    Clock,
    CheckCircle2,
    XCircle,
    Timer,
    BarChart3,
    LineChart as LineIcon,
    Repeat,
    Coffee,
    Calendar,
    Loader2
} from "lucide-react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const statusUI = {
    Present: {
        ribbon: "border-l-green-500",
        badge: "success",
        icon: CheckCircle2,
        iconBg: "bg-green-100 text-green-600",
    },
    Late: {
        ribbon: "border-l-orange-500",
        badge: "warning",
        icon: Clock,
        iconBg: "bg-orange-100 text-orange-600",
    },
    Absent: {
        ribbon: "border-l-red-500",
        badge: "destructive",
        icon: XCircle,
        iconBg: "bg-red-100 text-red-600",
    },
    "Half Day": {
        ribbon: "border-l-yellow-500",
        badge: "warning",
        icon: Timer,
        iconBg: "bg-yellow-100 text-yellow-600",
    },
    "On Leave": {
        ribbon: "border-l-blue-500",
        badge: "secondary",
        icon: Coffee,
        iconBg: "bg-blue-100 text-blue-600",
    },
    Holiday: {
        ribbon: "border-l-purple-500",
        badge: "secondary",
        icon: Calendar,
        iconBg: "bg-purple-100 text-purple-600",
    },
} as const;

export default function Attendance() {
    const now = new Date();

    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [view, setView] = useState<"week" | "month">("week");
    const [chartType, setChartType] = useState<"bar" | "line">("bar");
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    /* ======================
       FETCH ATTENDANCE
       ====================== */
    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                // Backend uses 0-indexed month
                const res = await fetch(`/api/attendance?month=${month}&year=${year}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAttendanceRecords(data);
                }
            } catch (error) {
                console.error("Failed to fetch attendance history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [month, year]);

    /* ======================
       CHART DATA
       ====================== */
    const chartData = useMemo(() => {
        // Simplified Logic for chart: show hours per day in the fetched list
        // Note: Real data might be sparse (skipping weekends/leaves), this simple map works for now
        // Sort by date ascending for chart
        const sorted = [...attendanceRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return sorted.map(r => ({
            name: new Date(r.date).getDate().toString(), // Day of month
            hours: r.totalHours || 0
        }));
    }, [attendanceRecords]);

    /* ======================
       SUMMARY CALCS
       ====================== */
    const summary = useMemo(() => {
        let todayHours = 0;
        let monthHours = 0;
        let weekHours = 0; // Simplified placeholder

        // Find today's record in the fetched list (if it is this month/year)
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = attendanceRecords.find(r => r.date.startsWith(todayStr));
        if (todayRecord) todayHours = todayRecord.totalHours || 0;

        monthHours = attendanceRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);

        // Accurate week logic requires complex date math, using simple placeholder or same as month for now to avoid errors
        weekHours = monthHours / 4; // Approx

        return { today: todayHours, month: monthHours, week: weekHours };
    }, [attendanceRecords]);


    /* ======================
       HELPERS
       ====================== */
    const formatTime = (time: string | null) => {
        if (!time) return "--";
        // Handle both HH:MM:SS format
        const [h, m] = time.split(':');
        const d = new Date();
        d.setHours(Number(h), Number(m));
        return d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDuration = (hours: number = 0) => {
        if (!hours) return "0h 0m";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    const formatDateStr = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 bg-lime-600 rounded-lg flex items-center justify-center shadow-lg shadow-lime-600/30">
                    <Timer className="h-6 w-6 text-white" />
                </div>
                Attendance
            </h1>

            {/* SUMMARY */}
            <div className="grid gap-6 md:grid-cols-3">
                <SummaryCard title="Today" value={formatDuration(summary.today)} />
                <SummaryCard title="Total Month Hours" value={formatDuration(summary.month)} />
                <SummaryCard title="Avg Weekly Hours" value={formatDuration(summary.week)} />
            </div>

            {/* CHART */}
            <Card className="shadow-md">
                <CardHeader className="flex flex-row justify-between gap-4">
                    <div>
                        <CardTitle>Work Hours</CardTitle>
                        <CardDescription>
                            Daily hours for selected month
                        </CardDescription>
                    </div>

                    <div className="flex gap-2">
                        <div className="bg-lime-50 px-3 py-1 rounded text-sm text-lime-700 font-medium">
                            {MONTHS[month]} {year}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === "bar" ? (
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="hours" fill="#65a30d" />
                            </BarChart>
                        ) : (
                            <LineChart data={chartData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    dataKey="hours"
                                    stroke="#65a30d"
                                    strokeWidth={3}
                                />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ATTENDANCE HISTORY */}
            <Card className="border-none shadow-sm">
                {/* KEEP THIS HEADER */}
                <CardHeader className="bg-lime-50/60 border-b border-lime-600/20 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lime-700">
                        Attendance History
                    </CardTitle>
                    <div className="flex gap-2">
                        <Select value={month.toString()} onValueChange={(val) => setMonth(Number(val))}>
                            <SelectTrigger className="w-[140px] bg-white border-lime-200 focus:ring-lime-500">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={year.toString()} onValueChange={(val) => setYear(Number(val))}>
                            <SelectTrigger className="w-[100px] bg-white border-lime-200 focus:ring-lime-500">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {[2023, 2024, 2025, 2026].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>

                {/* CARD LIST */}
                <CardContent className="p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
                        </div>
                    ) : attendanceRecords.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            No attendance records for selected month.
                        </div>
                    ) : (
                        attendanceRecords.map((r, i) => {
                            const ui = statusUI[r.status as keyof typeof statusUI] || statusUI["Present"]; // Fallback
                            const Icon = ui.icon;

                            return (
                                <Card
                                    key={r._id || i}
                                    className={`group border-l-4 ${ui.ribbon} bg-white shadow-sm hover:shadow-md transition-all`}
                                >
                                    <CardContent className="p-5 grid grid-cols-[56px_1fr_auto] items-center gap-4">
                                        {/* LEFT ICON BOX */}
                                        <div
                                            className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-sm ${ui.iconBg}`}
                                        >
                                            <Icon className="h-6 w-6" />
                                        </div>

                                        {/* CENTER INFO */}
                                        <div>
                                            <div className="font-semibold">{formatDateStr(r.date)}</div>

                                            <div className="text-sm text-muted-foreground">
                                                {formatTime(r.punchIn)} - {formatTime(r.punchOut)} ({formatDuration(r.totalHours)})
                                            </div>
                                        </div>

                                        {/* RIGHT STATUS */}
                                        <Badge variant={ui.badge as any}>
                                            {r.status}
                                        </Badge>
                                    </CardContent>
                                </Card>

                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* ======================
   SUMMARY CARD
   ====================== */
function SummaryCard({ title, value }: { title: string; value: string }) {
    return (
        <Card className="border-l-4 border-l-lime-600 bg-lime-50/40 shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-lime-700">
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}
