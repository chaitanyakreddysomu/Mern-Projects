import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Home,
    Search,
    ArrowUpDown,
    Loader2
} from "lucide-react";

interface AttendanceRecord {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    profileImage?: string; // Added
    designation: string;
    department: string;
    date: string;
    punchIn: string;
    punchOut: string;
    status: string;
    timeWorking: number | null; // Assuming backend sends totalHours or explicit string
    latitude?: number | string;
    longitude?: number | string;
}

interface AttendanceStats {
    present: number;
    late: number;
    absent: number;
    wfh: number;
    leave?: number;
    total: number;
}

export default function AdminAttendance() {
    // State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<AttendanceStats>({
        present: 0,
        late: 0,
        absent: 0,
        wfh: 0,
        total: 0
    });
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Fetch Data
    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                date: selectedDate,
                search: searchTerm,
            });

            if (sortConfig) {
                params.append('sortBy', sortConfig.key);
                params.append('order', sortConfig.direction);
            }

            const res = await apiFetch(`/api/admin/attendance?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRecords(data.records);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce Search & Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAttendance();
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedDate, searchTerm, sortConfig]);

    // Handlers
    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // Helpers
    const formatTime = (time: string | null) => {
        if (!time || time === "--") return "--";
        // Assuming backend sends "HH:mm:ss" or similar
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance Management</h1>
                <p className="text-muted-foreground">Monitor and manage employee daily attendance records.</p>
            </div>

            {/* STAT CARDS */}
            <div className="grid gap-6 md:grid-cols-4">
                <EmployeeStatCard title="Present Today" value={stats.present.toString()} icon={CheckCircle2} color="green" />
                <EmployeeStatCard title="Late Today" value={stats.late.toString()} icon={Clock} color="orange" />
                <EmployeeStatCard title="Absent Today" value={stats.absent.toString()} icon={XCircle} color="red" />
                <EmployeeStatCard title="WFH Today" value={stats.wfh.toString()} icon={Home} color="indigo" />
            </div>

            {/* FILTERS & SEARCH */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Search employees by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">Employee <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Punch In</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Punch Out</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Location</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                                        <div className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Time Working</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="h-24 text-center">
                                            <div className="flex justify-center items-center h-full">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No records found for this date.
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((emp) => (
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
                                            <td className="p-4 align-middle bg-slate-50/30">{emp.date}</td>
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
        </div>
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
            const now = new Date();
            const [inH, inM, inS] = punchIn.split(':').map(Number);
            const inTime = new Date();
            inTime.setHours(inH, inM, inS || 0);

            let diff = 0;

            if (punchOut && punchOut !== "--") {
                const [outH, outM, outS] = punchOut.split(':').map(Number);
                const outTime = new Date();
                outTime.setHours(outH, outM, outS || 0);
                diff = outTime.getTime() - inTime.getTime();
            } else {
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

        let interval: ReturnType<typeof setInterval>;
        if (!punchOut || punchOut === "--") {
            interval = setInterval(calculateTime, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [punchIn, punchOut]);

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
