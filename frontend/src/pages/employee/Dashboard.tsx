import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/config/api";
import {
    Card,
    CardContent,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Timer,
    CalendarDays,
    Clock,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Info,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(false);

    // Data State
    const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [showLocationDialog, setShowLocationDialog] = useState(false);

    // Attendance State
    const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [punchInTime, setPunchInTime] = useState<Date | null>(null);

    const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by this browser."));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setLocation(loc);
                    setLocationError(null);
                    resolve(loc);
                },
                (error) => {
                    console.error("Error getting location", error);
                    let msg = "Location access denied or unavailable.";
                    if (error.code === 1) {
                        msg = "Location permission denied";
                        setShowLocationDialog(true);
                    } else {
                        setLocationError(msg);
                    }
                    reject(new Error(msg));
                }
            );
        });
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Attendance Status & Stats
            const statusRes = await apiFetch('/api/attendance/today', { headers });
            if (statusRes.ok) {
                const data = await statusRes.json();
                setAttendanceRecord(data);
                if (data && data.punchIn) {
                    const [h, m, s] = data.punchIn.split(':').map(Number);
                    const d = new Date(); d.setHours(h, m, s);
                    setPunchInTime(d);
                } else {
                    setPunchInTime(null);
                }

                if (data && data.locationIn && !data.punchOut) {
                    setLocation(data.locationIn);
                }
            }

            const statsRes = await apiFetch('/api/attendance/stats', { headers });
            if (statsRes.ok) setStats(await statsRes.json());

            // 2. Notifications
            const notifRes = await apiFetch('/api/employee/notifications', { headers });
            if (notifRes.ok) {
                const data = await notifRes.json();
                setNotifications(data.filter((n: any) => !n.read));
            }

            // 3. Holidays
            const holidaysRes = await apiFetch('/api/employee/holidays', { headers });
            if (holidaysRes.ok) {
                const data = await holidaysRes.json();
                // Filter upcoming only
                const upcoming = data.filter((h: any) => new Date(h.startDate) >= new Date()).slice(0, 4);
                setHolidays(upcoming);
            }

        } catch (error) {
            console.error("Dashboard Data Fetch Error", error);
        }
    };

    // Fetch All Data
    useEffect(() => {
        fetchData();
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const handlePunch = async () => {
        setLoading(true);
        try {
            const isPunchedIn = attendanceRecord && attendanceRecord.punchIn && !attendanceRecord.punchOut;
            const url = isPunchedIn ? '/api/attendance/punch-out' : '/api/attendance/punch-in';
            const method = isPunchedIn ? 'PATCH' : 'POST';

            let loc = location;

            if (!isPunchedIn) {
                // For Punch In, we MUST get fresh location
                loc = await getCurrentLocation();
            } else {
                // For Punch Out, use defaults if null
                if (!loc) loc = { lat: 0, lng: 0 };
            }

            const token = localStorage.getItem('token');
            const res = await apiFetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ location: loc })
            });

            if (res.ok) {
                await fetchData(); // Refresh all data including stats
            } else {
                const err = await res.json();
                alert(err.message || 'Action failed');
            }
        } catch (error: any) {
            console.error("Punch action failed", error);
            if (error.message !== "Location permission denied") {
                alert(error.message || "Network error");
            }
        } finally {
            setLoading(false);
        }
    };

    const isPunchedIn = attendanceRecord && attendanceRecord.punchIn && !attendanceRecord.punchOut;
    const isPunchedOut = attendanceRecord && attendanceRecord.punchOut;

    const getDuration = () => {
        if (!punchInTime || !isPunchedIn) {
            if (isPunchedOut && attendanceRecord?.totalHours) {
                const h = Math.floor(attendanceRecord.totalHours);
                const m = Math.round((attendanceRecord.totalHours - h) * 60);
                return `${h}h ${m}m`; // Show completed duration
            }
            return "00:00:00";
        }
        const diff = Math.max(0, currentTime.getTime() - punchInTime.getTime());
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const currentStatus = useMemo(() => {
        if (!attendanceRecord) return { label: "Absent", style: "bg-slate-100 text-slate-700 border-slate-200" };
        if (attendanceRecord.status === 'Late') return { label: "Late", style: "bg-yellow-100 text-yellow-700 border-yellow-200" };
        return { label: "Present", style: "bg-green-100 text-green-700 border-green-200" };
    }, [attendanceRecord]);

    const formatHours = (hours: number) => {
        if (hours < 0) hours = 0;
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0 && m === 0) return "0min";
        if (h === 0) return `${m}min`;
        return `${h}hr ${m}min`;
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">

            {/* WELCOME */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Welcome, <span className="text-blue-500">{user?.name}</span> !
                </h1>

            </div>

            {/* SUMMARY */}
            <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                    title="Today"
                    value={formatHours(stats.today)}
                    color="blue"
                    icon={Clock}
                />
                <StatCard
                    title="This Week"
                    value={formatHours(stats.week)}
                    color="green"
                    icon={CalendarDays}
                />
                <StatCard
                    title="This Month"
                    value={formatHours(stats.month)}
                    color="orange"
                    icon={Calendar}
                />
            </div>

            {/* ATTENDANCE TRACKER */}
            {/* ATTENDANCE TRACKER */}
            <Card className="border-l-4 border-l-blue-600 shadow-md bg-white">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-6 w-full">
                            {/* Header */}
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Attendance Tracker</h2>
                            </div>

                            <div className="flex flex-wrap gap-8">
                                {/* Location Info */}
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Location</p>
                                        <p className="text-slate-700 font-medium mt-0.5">
                                            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : locationError || "Detecting..."}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Info */}
                                {attendanceRecord && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Info className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Today's Status</p>
                                            <div className="mt-0.5">
                                                <Badge variant="outline" className={`font-medium border ${currentStatus.style}`}>
                                                    {attendanceRecord.punchOut ? 'Present (Completed)' : currentStatus.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Button */}
                        <div className="w-full md:w-auto">
                            <Button
                                size="lg"
                                className={`w-full md:w-40 h-12 text-base font-semibold shadow-xl transition-all ${isPunchedIn
                                    ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                                    : isPunchedOut
                                        ? "bg-gray-400 cursor-not-allowed shadow-none"
                                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                                    }`}
                                onClick={handlePunch}
                                disabled={isPunchedOut || loading}
                            >
                                {loading ? "Processing..." : isPunchedOut ? "Completed" : isPunchedIn ? "Punch Out" : "Punch In"}
                            </Button>
                        </div>
                    </div>

                    {/* Stats (After Punch In) */}
                    {(isPunchedIn || isPunchedOut) && (
                        <div className="mt-8 pt-8 border-t grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                            <StatCard
                                title="Punch In Time"
                                value={attendanceRecord?.punchIn || "--:--"}
                                color="indigo"
                                icon={Clock}
                            />
                            <StatCard
                                title={isPunchedOut ? "Punch Out Time" : "Current Time"}
                                value={isPunchedOut ? attendanceRecord.punchOut : format(currentTime, "hh:mm:ss a")}
                                color="pink"
                                icon={Clock}
                            />
                            <StatCard
                                title="Duration"
                                value={getDuration()}
                                color="cyan"
                                icon={Timer}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* BOTTOM SECTIONS */}
            <div className="grid gap-8 md:grid-cols-2">

                {/* NOTIFICATIONS SECTION */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        {/* <Bell className="h-5 w-5 text-blue-600" /> */}
                        Recent Notifications
                    </h2>
                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No new notifications</p>
                        ) : (
                            notifications.slice(0, 5).map((item) => (
                                <Card
                                    key={item.id || item._id}
                                    onClick={() => setSelectedNotification(item)}
                                    className="border-l-4 border-l-blue-500 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer bg-white group"
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {item.title}
                                        </p>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full whitespace-nowrap">
                                            {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : 'Now'}
                                        </span>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* HOLIDAYS SECTION */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        {/* <CalendarDays className="h-5 w-5 text-teal-600" /> */}
                        Upcoming Holidays
                    </h2>
                    <div className="space-y-4">
                        {holidays.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No upcoming holidays</p>
                        ) : (
                            holidays.map((item, i) => {
                                const d = new Date(item.startDate);
                                const dateNum = d.getDate();
                                const monthShort = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                                // Random color assignment based on index
                                const colors = ["blue", "red", "amber", "purple"];
                                const colorKey = colors[i % colors.length];

                                const styleMap = {
                                    blue: { border: "border-l-blue-600", bg: "bg-blue-600", text: "text-blue-700", shadow: "shadow-lg shadow-blue-200" },
                                    red: { border: "border-l-red-600", bg: "bg-red-600", text: "text-red-700", shadow: "shadow-lg shadow-red-200" },
                                    amber: { border: "border-l-amber-500", bg: "bg-amber-500", text: "text-amber-700", shadow: "shadow-lg shadow-amber-200" },
                                    purple: { border: "border-l-purple-600", bg: "bg-purple-600", text: "text-purple-700", shadow: "shadow-lg shadow-purple-200" },
                                };
                                const style = styleMap[colorKey as keyof typeof styleMap];

                                return (
                                    <Card key={i} className={`group border-l-4 ${style.border} shadow-sm p-4 hover:shadow-md transition-all cursor-pointer bg-white`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`h-14 w-12 rounded-lg flex flex-col items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 ${style.bg} ${style.shadow}`}>
                                                <span className="text-xl font-bold leading-none">{dateNum}</span>
                                                <span className="text-[10px] font-bold uppercase leading-none mt-1">{monthShort}</span>
                                            </div>
                                            <div>
                                                <p className={`font-bold text-base ${style.text}`}>{item.name}</p>
                                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                                    {format(d, "EEE, MMM d")} - {item.days} Day(s)
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between gap-3 text-xl w-full">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    !selectedNotification?.read ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                                )}>
                                    {selectedNotification?.type === 'alert' ? <AlertTriangle className="h-5 w-5" /> :
                                        selectedNotification?.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                                            <Info className="h-5 w-5" />}
                                </div>
                                <span>{selectedNotification?.title}</span>
                                {selectedNotification?.source && (
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        From {selectedNotification.source}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={cn(
                                    "text-xs font-normal whitespace-nowrap shrink-0",
                                    !selectedNotification?.read ? "text-blue-600" : "text-gray-500"
                                )}>
                                    {selectedNotification?.date && formatDistanceToNow(new Date(selectedNotification.date), { addSuffix: true })}
                                </span>

                            </div>
                        </DialogTitle>
                        <DialogDescription className="pt-4">
                            <div className={cn(
                                "text-sm leading-relaxed p-4 rounded-lg border",
                                !selectedNotification?.read
                                    ? "bg-blue-50 border-blue-100 text-foreground"
                                    : "bg-gray-50 border-gray-200 text-muted-foreground"
                            )}>
                                {selectedNotification?.message}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        {/* <Button variant="outline" onClick={() => setSelectedNotification(null)}>Close</Button> */}
                        {!selectedNotification?.read && (
                            <Button className="bg-blue-600 text-white hover:bg-blue-700">Mark as Read</Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* LOCATION PERMISSION DIALOG */}
            <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <MapPin className="h-5 w-5" />
                            Location Access Required
                        </DialogTitle>
                        <DialogDescription className="pt-4 space-y-3">
                            <p className="text-slate-700">
                                To mark your attendance, we need access to your current location.
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600 space-y-1">
                                <p className="font-semibold">If you don't see the browser popup:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Check your browser's address bar for a blocked location icon.</li>
                                    <li>Click it and select <strong>"Allow"</strong> or <strong>"Always allow"</strong>.</li>
                                    <li>Refresh the page and try Punching In again.</li>
                                </ul>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowLocationDialog(false)}>Close</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                            setShowLocationDialog(false);
                            handlePunch();
                        }}>
                            Try Again
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ======================
   COMPONENTS
   ====================== */

function StatCard({
    title,
    value,
    color,
    icon: Icon,
}: {
    title: string;
    value: string;
    color: "blue" | "green" | "orange" | "indigo" | "pink" | "cyan";
    icon: LucideIcon;
}) {
    const styles = {
        blue: {
            border: "border-l-blue-500",
            text: "text-blue-600",
            bg: "bg-blue-50/50",
            iconBg: "bg-blue-500 shadow-blue-200",
        },
        green: {
            border: "border-l-green-500",
            text: "text-green-600",
            bg: "bg-green-50/50",
            iconBg: "bg-green-600 shadow-green-200",
        },
        orange: {
            border: "border-l-orange-500",
            text: "text-orange-600",
            bg: "bg-orange-50/50",
            iconBg: "bg-orange-500 shadow-orange-200",
        },
        indigo: {
            border: "border-l-indigo-500",
            text: "text-indigo-600",
            bg: "bg-indigo-50/50",
            iconBg: "bg-indigo-500 shadow-indigo-200",
        },
        pink: {
            border: "border-l-pink-500",
            text: "text-pink-600",
            bg: "bg-pink-50/50",
            iconBg: "bg-pink-500 shadow-pink-200",
        },
        cyan: {
            border: "border-l-cyan-500",
            text: "text-cyan-600",
            bg: "bg-cyan-50/50",
            iconBg: "bg-cyan-500 shadow-cyan-200",
        },
    };

    const currentStyle = styles[color];

    return (
        <Card className={`group border-l-4 shadow-sm hover:shadow-md transition-all ${currentStyle.bg} ${currentStyle.border}`}>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <CardTitle className={`text-xs font-bold uppercase tracking-wider mb-2 ${currentStyle.text}`}>
                        {title}
                    </CardTitle>
                    <div className="text-2xl font-bold text-slate-800 tracking-tight">
                        {value}
                    </div>
                </div>
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${currentStyle.iconBg}`}>
                    <Icon className="h-7 w-7" />
                </div>
            </CardContent>
        </Card>
    );
}
