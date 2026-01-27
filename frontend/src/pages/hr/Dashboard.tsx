import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock, CheckCircle2, MapPin, Timer, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { format, formatDistanceToNow } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification, Complaint, LeaveRequest } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    onLeave: number;
    pendingApprovals: number;
}

interface DepartmentStat {
    name: string;
    count: number;
    percent: string;
    color: string;
    track: string;
    text: string;
}

interface DashboardData {
    stats: DashboardStats;
    notifications: any[];
    complaints: any[];
    leaves: any[];
    departments: DepartmentStat[];
}

export default function HRDashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLocationDialog, setShowLocationDialog] = useState(false);

    // Attendance State
    const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [punchInTime, setPunchInTime] = useState<Date | null>(null);

    const fetchAttendanceStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            // Use HR specific status endpoint
            const res = await fetch('/api/hr/attendance/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAttendanceRecord(data);
                if (data && data.punchIn) {
                    const [h, m, s] = data.punchIn.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h, m, s);
                    setPunchInTime(d);
                } else {
                    setPunchInTime(null);
                }
                // Set location from DB if available
                if (data && data.locationIn && !data.punchOut) {
                    setLocation(data.locationIn);
                }
            }
        } catch (error) {
            console.error("Failed to fetch attendance", error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/hr/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        fetchDashboardData();
        fetchAttendanceStatus();
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const handlePunchIn = async () => {
        setLoadingAttendance(true);
        try {
            // Get location first (User Request: Ask permission when click on punchin)
            const loc = await getCurrentLocation();

            const token = localStorage.getItem('token');
            const res = await fetch('/api/hr/punch-in', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location: loc })
            });

            if (res.ok) {
                await fetchAttendanceStatus();
                fetchDashboardData(); // Update "Present Today" count
            } else {
                const err = await res.json();
                alert(err.message || "Punch In Failed");
            }
        } catch (error: any) {
            console.error("Punch In Error", error);
            if (error.message !== "Location permission denied") {
                alert(error.message || "Failed to get location or punch in.");
            }
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handlePunchOut = async () => {
        setLoadingAttendance(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/hr/punch-out', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location: location || { lat: 0, lng: 0 } })
            });

            if (res.ok) {
                await fetchAttendanceStatus();
            } else {
                const err = await res.json();
                alert(err.message || "Punch Out Failed");
            }
        } catch (error) {
            console.error("Punch Out Error", error);
        } finally {
            setLoadingAttendance(false);
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
        const diff = currentTime.getTime() - punchInTime.getTime();
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

    if (loading) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">Loading dashboard...</div>;
    }

    const { stats, notifications, complaints, leaves, departments } = dashboardData || {
        stats: { totalEmployees: 0, presentToday: 0, onLeave: 0, pendingApprovals: 0 },
        notifications: [],
        complaints: [],
        leaves: [],
        departments: []
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* WELCOME */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Welcome, <span className="text-blue-500">{user?.name}</span> !
                </h1>
                <p className="text-muted-foreground mt-1">Manage employees, leaves, and recruitment efficiently.</p>
            </div>

            {/* ATTENDANCE TRACKER (Kept as is for now) */}

            {/* SUMMARY */}
            <div className="grid gap-6 md:grid-cols-4">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees?.toString() || "0"}
                    color="blue"
                    icon={Users}
                />
                <StatCard
                    title="Present Today"
                    value={stats.presentToday?.toString() || "0"}
                    color="green"
                    icon={UserCheck}
                />
                <StatCard
                    title="On Leave"
                    value={stats.onLeave?.toString() || "0"}
                    color="orange"
                    icon={UserX}
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals?.toString() || "0"}
                    color="indigo"
                    icon={Clock}
                />
            </div>

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
                                onClick={isPunchedIn ? handlePunchOut : handlePunchIn}
                                disabled={isPunchedOut || loadingAttendance}
                            >
                                {loadingAttendance ? "Processing..." : isPunchedOut ? "Completed" : isPunchedIn ? "Punch Out" : "Punch In"}
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


            {/* NOTIFICATIONS & COMPLAINTS */}
            <div className="grid gap-8 md:grid-cols-2">
                {/* NOTIFICATIONS SECTION */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        Recent Notifications
                    </h2>
                    <div className="space-y-3">
                        {notifications.slice(0, 5).map((item: any) => (
                            <Card
                                key={item._id || item.id}
                                onClick={() => setSelectedNotification(item)}
                                className="border-l-4 border-l-blue-500 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer bg-white group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                            {item.type === 'alert' ? <AlertTriangle className="h-4 w-4" /> :
                                                item.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                                                    <Info className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{item.message}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full whitespace-nowrap">
                                        {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                                    </span>
                                </div>
                            </Card>
                        ))}
                        {notifications.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No new notifications</p>
                        )}
                    </div>
                </div>

                {/* COMPLAINTS SECTION */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        Recent Complaints
                    </h2>
                    <div className="space-y-3">
                        {complaints.slice(0, 5).map((item: any) => {
                            const isResolved = item.status === "Resolved";
                            const isOpen = item.status === "Open";

                            const cardBorderClass = isResolved ? "border-l-green-500" : isOpen ? "border-l-blue-500" : "border-l-orange-500";
                            const iconBgClass = isResolved ? "bg-green-50" : isOpen ? "bg-blue-50" : "bg-orange-50";
                            const iconTextClass = isResolved ? "text-green-600" : isOpen ? "text-blue-600" : "text-orange-600";
                            const groupHoverTextClass = isResolved ? "group-hover:text-green-600" : isOpen ? "group-hover:text-blue-600" : "group-hover:text-orange-600";

                            return (
                                <Card
                                    key={item._id || item.id}
                                    onClick={() => setSelectedComplaint(item)}
                                    className={`border-l-4 ${cardBorderClass} shadow-sm p-4 hover:shadow-md transition-all cursor-pointer bg-white group`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full ${iconBgClass} flex items-center justify-center ${iconTextClass} shrink-0`}>
                                                <AlertTriangle className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className={`font-semibold text-sm text-slate-800 ${groupHoverTextClass} transition-colors line-clamp-1`}>
                                                    {item.subject}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn("h-5 px-1.5 text-[10px] font-medium border",
                                                            item.status === "Resolved" ? "bg-green-50 text-green-600 border-green-100" :
                                                                item.status === "Open" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                    "bg-orange-50 text-orange-600 border-orange-100"
                                                        )}
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">{item.userName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full whitespace-nowrap">
                                            {format(new Date(item.date), 'MMM dd')}
                                        </span>
                                    </div>
                                </Card>
                            );
                        })}
                        {complaints.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No complaints found</p>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">

                {/* RECENT LEAVE REQUESTS */}
                <div className="col-span-4 space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        Recent Leave Requests
                    </h2>
                    <div className="space-y-3">
                        {leaves.slice(0, 5).map((item: any) => (
                            <Card
                                key={item._id || item.id}
                                onClick={() => setSelectedLeave(item)}
                                className="group border-l-4 border-l-blue-500 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer bg-white"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 border shadow-sm">
                                            <AvatarImage src={`https://i.pravatar.cc/150?u=${item.userId}`} />
                                            <AvatarFallback>{item.userName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.userName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-blue-50 text-blue-600 border-blue-100 font-medium">{item.type} Leave</Badge>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {format(new Date(item.startDate), "MMM dd")} - {format(new Date(item.endDate), "MMM dd")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "capitalize",
                                                item.status === "Approved" ? "text-green-600 bg-green-50 border-green-200" :
                                                    item.status === "Rejected" ? "text-red-600 bg-red-50 border-red-200" :
                                                        "text-orange-600 bg-orange-50 border-orange-200"
                                            )}
                                        >
                                            {item.status}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {leaves.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No recent leave requests</p>
                        )}
                    </div>
                </div>

                {/* DEPARTMENT HEADCOUNT */}
                <div className="col-span-3 space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        Department Headcount
                    </h2>
                    <Card className="shadow-md border-none bg-white p-6">
                        <CardContent className="p-0 space-y-6">
                            {departments.map((dept, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                                            {dept.name}
                                        </span>
                                        <span className={`font-bold ${dept.text}`}>{dept.count}</span>
                                    </div>
                                    <div className={`h-2 w-full ${dept.track} rounded-full overflow-hidden`}>
                                        <div className={`h-full ${dept.color} rounded-full shadow-sm`} style={{ width: dept.percent }}></div>
                                    </div>
                                </div>
                            ))}
                            {departments.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground">No data available</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* NOTIFICATION DIALOG */}
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
                        <Button variant="outline" onClick={() => setSelectedNotification(null)}>Close</Button>
                        {!selectedNotification?.read && (
                            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setSelectedNotification(null)}>Mark as Read</Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* COMPLAINT DIALOG */}
            <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                {selectedComplaint?.subject}
                                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                                    Reported by {selectedComplaint?.userName} • {selectedComplaint?.date ? format(new Date(selectedComplaint.date), 'MMM dd, yyyy') : ''}
                                </p>
                            </div>
                        </DialogTitle>
                        <DialogDescription className="pt-4 space-y-4">
                            <div className="text-sm bg-gray-50 border border-gray-200 p-4 rounded-lg text-slate-700">
                                {selectedComplaint?.description}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Update Status</label>
                                <Select defaultValue={selectedComplaint?.status}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="Investigating">Investigating</SelectItem>
                                        <SelectItem value="Resolved">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
                        <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setSelectedComplaint(null)}>Update Status</Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* LEAVE REQUEST DIALOG */}
            <Dialog open={!!selectedLeave} onOpenChange={(open) => !open && setSelectedLeave(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <Avatar className="h-10 w-10 border shadow-sm">
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedLeave?.userId}`} />
                                <AvatarFallback>{selectedLeave?.userName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                {selectedLeave?.userName}
                                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                                    Applied on {selectedLeave?.appliedOn ? format(new Date(selectedLeave.appliedOn), 'MMM dd, yyyy') : ''}
                                </p>
                            </div>
                        </DialogTitle>
                        <DialogDescription className="pt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-medium uppercase">Leave Type</span>
                                    <p className="text-sm font-semibold text-slate-800">{selectedLeave?.type} Leave</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground font-medium uppercase">Duration</span>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {selectedLeave && format(new Date(selectedLeave.startDate), "MMM dd")} - {selectedLeave && format(new Date(selectedLeave.endDate), "MMM dd")}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Reason</span>
                                <p className="text-sm text-slate-700">{selectedLeave?.reason}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Update Status</label>
                                <Select defaultValue={selectedLeave?.status}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setSelectedLeave(null)}>Cancel</Button>
                        <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setSelectedLeave(null)}>Update Status</Button>
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
                            handlePunchIn();
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
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${currentStyle.iconBg}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}
