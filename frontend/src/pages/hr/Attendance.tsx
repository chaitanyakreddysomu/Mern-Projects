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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
    Search,
    Home,
    Loader2
} from "lucide-react";

/* ======================
   CONSTANTS & MOCKS
   ====================== */
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
    "WFH": {
        ribbon: "border-l-indigo-500",
        badge: "default",
        icon: Home,
        iconBg: "bg-indigo-100 text-indigo-600",
    }
} as const;

export default function HRAttendance() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [view, setView] = useState<"week" | "month">("week");
    const [chartType, setChartType] = useState<"bar" | "line">("bar");

    // Employee Attendance State
    // Initialize with local date in YYYY-MM-DD format
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    });
    const [employeeRecords, setEmployeeRecords] = useState<any[]>([]);
    const [employeeStats, setEmployeeStats] = useState({ present: 0, late: 0, absent: 0, wfh: 0, total: 0 });

    // My Attendance State
    const [myAttendance, setMyAttendance] = useState<any[]>([]);
    const [myStats, setMyStats] = useState({ today: 0, week: 0, month: 0 });
    const [loading, setLoading] = useState(false);

    // Fetch My Attendance
    const fetchMyAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            // Fetch for selected month/year
            const res = await fetch(`/api/attendance?self=true&month=${month}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyAttendance(data);
            }
        } catch (error) {
            console.error("Failed to fetch my attendance", error);
        }
    };

    // Fetch Employee Attendance
    const fetchEmployeeAttendance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/hr/attendance?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployeeRecords(data.records);
                setEmployeeStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch employee attendance", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyAttendance();

        // Fetch stats only once or when appropriate
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/attendance/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setMyStats(await res.json());
                }
            } catch (e) {
                console.error("Stats fetch error", e);
            }
        };
        fetchStats();
    }, [month, year]);

    useEffect(() => {
        fetchEmployeeAttendance();
    }, [selectedDate]);


    /* ======================
       CHART DATA
       ====================== */
    const chartData = useMemo(() => {
        if (!myAttendance) return [];

        if (view === "month") {
            // Aggregate by week (Simple 4-5 weeks bucket)
            const weeks = [0, 0, 0, 0, 0];
            myAttendance.forEach(rec => {
                const d = new Date(rec.date);
                const date = d.getDate();
                const weekIdx = Math.floor((date - 1) / 7);
                if (weekIdx < 5) weeks[weekIdx] += (rec.totalHours || 0);
            });
            return weeks.map((h, i) => ({
                name: `Week ${i + 1}`,
                hours: parseFloat(h.toFixed(1))
            }));
        } else {
            // Daily View (Current Week or First Week of Selected Month)
            const targetDate = new Date();
            // If selected month/year is different from today, start from 1st of that month
            if (month !== targetDate.getMonth() || year !== targetDate.getFullYear()) {
                targetDate.setFullYear(year);
                targetDate.setMonth(month);
                targetDate.setDate(1);
            }

            // Find Monday of the target week
            const day = targetDate.getDay(); // 0=Sun, 1=Mon
            const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(targetDate);
            monday.setDate(diff);

            // Generate Mon-Sun
            const days = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];

                // Find record
                const rec = myAttendance.find(r => r.date.startsWith(dateStr));
                const hours = rec ? (rec.totalHours || 0) : 0;

                days.push({
                    name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    hours: parseFloat(hours.toFixed(1))
                });
            }
            return days;
        }
    }, [view, myAttendance, month, year]);

    /* ======================
       HELPERS
       ====================== */
    const formatTime = (time: string | null) => {
        if (!time || time === "--") return "--";
        // Convert "HH:mm:ss" or "HH:mm" to 12 hour format
        const [hours, minutes, seconds] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));
        date.setSeconds(seconds ? parseInt(seconds) : 0);

        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
    };

    const formatDuration = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0) return `${m} min`;
        return `${h}hr ${m} min`;
    };

    const formatDateStr = (dateStr: string) => {
        if (!dateStr) return "";
        // Parse YYYY-MM-DD explicitly to avoid timezone issues
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts.map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        return dateStr;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance Management</h1>
                <p className="text-muted-foreground">View your attendance history and manage employee records.</p>
            </div>

            <Tabs defaultValue="employee-attendance" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-slate-100">
                    <TabsTrigger value="employee-attendance">Employee Attendance</TabsTrigger>
                    <TabsTrigger value="my-attendance">My Attendance</TabsTrigger>
                </TabsList>

                {/* MY ATTENDANCE TAB */}
                <TabsContent value="my-attendance" className="space-y-6 mt-6">
                    {/* SUMMARY */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <SummaryCard title="Today" value={formatDuration(myStats.today)} />
                        <SummaryCard title="This Week" value={formatDuration(myStats.week)} />
                        <SummaryCard title="This Month" value={formatDuration(myStats.month)} />
                    </div>

                    {/* CHART */}
                    <Card className="shadow-md">
                        <CardHeader className="flex flex-row justify-between gap-4">
                            <div>
                                <CardTitle>Work Hours</CardTitle>
                                <CardDescription>
                                    {view === "week" ? "Daily hours" : "Weekly hours"}
                                </CardDescription>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="bg-lime-600 text-white hover:bg-lime-700"
                                    onClick={() => setView(view === "week" ? "month" : "week")}
                                >
                                    <Repeat className="h-4 w-4 mr-2" />
                                    {view === "week" ? "Month" : "Week"}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setChartType(chartType === "bar" ? "line" : "bar")}
                                >
                                    {chartType === "bar" ? (
                                        <>
                                            <LineIcon className="h-4 w-4 mr-2" />
                                            Line
                                        </>
                                    ) : (
                                        <>
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Bar
                                        </>
                                    )}
                                </Button>
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
                                        <Line dataKey="hours" stroke="#65a30d" strokeWidth={3} />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* ATTENDANCE HISTORY */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-lime-50/60 border-b border-lime-600/20 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lime-700">
                                My Attendance History
                            </CardTitle>
                            <div className="flex gap-2">
                                <Select value={month.toString()} onValueChange={(v) => setMonth(Number(v))}>
                                    <SelectTrigger className="w-[140px] bg-white">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((m, i) => (
                                            <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
                                    <SelectTrigger className="w-[100px] bg-white">
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

                        <CardContent className="p-4 space-y-3">
                            {myAttendance.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    No attendance records for selected month.
                                </div>
                            )}

                            {myAttendance.map((r) => {
                                // @ts-ignore
                                const ui = statusUI[r.status] || statusUI["Present"];
                                const Icon = ui.icon;
                                const isOngoing = !r.punchOut;

                                return (
                                    <Card
                                        key={r.id}
                                        className={`group border-l-4 ${ui.ribbon} bg-white shadow-sm hover:shadow-md transition-all`}
                                    >
                                        <CardContent className="p-5 grid grid-cols-[56px_1fr_auto] items-center gap-4">
                                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center shadow-sm ${ui.iconBg}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{formatDateStr(r.date)}</div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <span>{formatTime(r.punchIn)} - {formatTime(r.punchOut)}</span>
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium">
                                                        {isOngoing ? "On-going" : formatDuration(r.totalHours || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* @ts-ignore */}
                                            <Badge variant={ui.badge}>{r.status}</Badge>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* EMPLOYEE ATTENDANCE TAB */}
                <TabsContent value="employee-attendance" className="space-y-6 mt-6">
                    {/* STAT CARDS */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <EmployeeStatCard title="Present Today" value={employeeStats.present.toString()} icon={CheckCircle2} color="green" />
                        <EmployeeStatCard title="Late Today" value={employeeStats.late.toString()} icon={Clock} color="orange" />
                        <EmployeeStatCard title="Absent Today" value={employeeStats.absent.toString()} icon={XCircle} color="red" />
                        <EmployeeStatCard title="WFH Today" value={employeeStats.wfh.toString()} icon={Home} color="indigo" />
                    </div>

                    {/* FILTERS & SEARCH */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Search employees by name..."
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto items-center">
                            <span className="text-sm font-medium text-slate-600 mr-2">Select Date:</span>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-auto bg-white"
                            />
                            <Button className="bg-blue-600 hover:bg-blue-700">Export Report</Button>
                        </div>
                    </div>

                    {/* TABLE CARD */}
                    <Card className="shadow-md border-none">
                        <CardHeader className="bg-blue-50/50 border-b flex flex-row justify-between items-center">
                            <CardTitle className="text-blue-700">Attendance Records - {selectedDate}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b bg-slate-50">
                                        <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Employee</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Punch In</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Punch Out</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Location</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Time Working</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="h-24 text-center">
                                                    <div className="flex justify-center items-center h-full">
                                                        <Loader2 className="h-6 w-6 animate-spin text-lime-600" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : employeeRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                                                    No records found for this date.
                                                </td>
                                            </tr>
                                        ) : (
                                            employeeRecords.map((emp) => (

                                                <tr key={emp.id} className="border-b transition-colors hover:bg-transparent">
                                                    <td className="p-4 align-middle font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={emp.profileImage || emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}&background=random`} />
                                                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span>{emp.name}</span>
                                                                <span className="text-xs text-muted-foreground font-normal">{emp.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle bg-slate-50/30">{formatDateStr(emp.date)}</td>
                                                    <td className="p-4 align-middle text-xs">{formatTime(emp.punchIn)}</td>
                                                    <td className="p-4 align-middle text-xs">{formatTime(emp.punchOut)}</td>
                                                    <td className="p-4 align-middle text-xs text-muted-foreground">
                                                        {emp.latitude && emp.longitude ? (
                                                            <a
                                                                href={`https://www.google.com/maps/search/?api=1&query=${emp.latitude},${emp.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hover:underline hover:text-blue-600 flex items-center gap-1"
                                                            >
                                                                {Number(emp.latitude).toFixed(4)}, {Number(emp.longitude).toFixed(4)}
                                                            </a>
                                                        ) : (
                                                            "--"
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <StatusBadge status={emp.status} />
                                                    </td>
                                                    <td className="p-4 align-middle text-right font-medium">
                                                        <TimeTracker punchIn={emp.punchIn} punchOut={emp.punchOut} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

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

function EmployeeStatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: "green" | "red" | "indigo" | "blue" | "orange" }) {
    const styles = {
        green: "bg-green-50 border-green-200 text-green-700",
        red: "bg-red-50 border-red-200 text-red-700",
        indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        orange: "bg-orange-50 border-orange-200 text-orange-700",
    };

    return (
        <Card className={`border shadow-sm border-l-4 ${styles[color] === styles.green ? 'border-l-green-500' : styles[color] === styles.red ? 'border-l-red-500' : styles[color] === styles.indigo ? 'border-l-indigo-500' : styles[color] === styles.orange ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    <h3 className={`text-2xl font-bold ${styles[color] ? styles[color].split(' ').pop() : ''}`}>{value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${styles[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Present: "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200",
        Late: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200",
        Absent: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
        "Half Day": "bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200",
        "On Leave": "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200",
        "WFH": "bg-indigo-100 text-indigo-700 hover:bg-indigo-100/80 border-indigo-200",
    };

    return (
        <Badge variant="outline" className={`font-normal border ${styles[status] || "bg-gray-100"}`}>
            {status}
        </Badge>
    );
}

function TimeTracker({ punchIn, punchOut }: { punchIn: string; punchOut: string }) {
    const [elapsed, setElapsed] = useState("00:00:00");

    useEffect(() => {
        if (!punchIn || punchIn === "--") {
            setElapsed("--");
            return;
        }

        const calculateTime = () => {
            // Create date objects for today
            const now = new Date();
            const [inH, inM, inS] = punchIn.split(':').map(Number);
            const inTime = new Date();
            inTime.setHours(inH, inM, inS || 0);

            let diff = 0;

            if (punchOut && punchOut !== "--") {
                // Static calculation
                const [outH, outM, outS] = punchOut.split(':').map(Number);
                const outTime = new Date();
                outTime.setHours(outH, outM, outS || 0);
                diff = outTime.getTime() - inTime.getTime();
            } else {
                // Live calculation
                diff = now.getTime() - inTime.getTime();
            }

            if (diff < 0) diff = 0;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setElapsed(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        calculateTime();

        // Only set interval if we are tracking live time
        let interval: ReturnType<typeof setInterval>;
        if (!punchOut || punchOut === "--") {
            interval = setInterval(calculateTime, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [punchIn, punchOut]);

    // Visual queue for live tracking
    const isLive = (!punchOut || punchOut === "--") && punchIn && punchIn !== "--";

    return (
        <div className={`flex items-center gap-1.5 justify-end ${isLive ? 'text-green-600 font-bold' : 'text-slate-600'}`}>
            {isLive && <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>}
            {elapsed}
        </div>
    );
}

