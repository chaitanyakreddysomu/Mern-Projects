import { useState, useEffect } from 'react';
import API_BASE_URL, { apiFetch } from "@/config/api"; // Updated import statement
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, AlertTriangle, Activity, UserCheck, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { LucideIcon } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

// Type Definitions
interface DashboardData {
    kpi: {
        totalStaff: { value: number; trend: string };
        presentToday: { value: number; trend: string };
        onBench: { value: number; trend: string };
        systemAlerts: { value: number; trend: string };
    };
    charts: {
        attendanceDistribution: { name: string; value: number; color: string }[];
        attendanceTrend: { date: string; present: number; note: string | null }[];
        resourceUtilization: { name: string; value: number; color: string }[];
    };
    quickActions: {
        pendingApprovals: number;
        alerts: number;
    };
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState("7d");
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData>({
        kpi: {
            totalStaff: { value: 0, trend: "Loading..." },
            presentToday: { value: 0, trend: "Loading..." },
            onBench: { value: 0, trend: "Loading..." },
            systemAlerts: { value: 0, trend: "Loading..." },
        },
        charts: {
            attendanceDistribution: [],
            attendanceTrend: [],
            resourceUtilization: []
        },
        quickActions: {
            pendingApprovals: 0,
            alerts: 0
        }
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Ideally, get token from AuthContext or localStorage
                const token = localStorage.getItem('token');

                const response = await apiFetch('/api/admin/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    console.error("Failed to fetch dashboard data");
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
        console.log("Admin Dashboard API Base URL:", API_BASE_URL);
    }, []);

    // Helper for Pie Chart Labels (Absolute + %)
    const renderResourceLegend = (value: string, entry: any) => {
        const { payload } = entry;
        const total = data.charts.resourceUtilization.reduce((acc, cur) => acc + cur.value, 0);
        const percent = total > 0 ? ((payload.value / total) * 100).toFixed(0) : 0;
        return <span className="text-slate-700 font-medium ml-2">{value}: <span className="text-slate-900 font-bold">{payload.value} ({percent}%)</span></span>;
    };

    // Custom Tooltip for Line Chart to show notes
    const CustomLineTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const pointData = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg text-sm">
                    <p className="font-bold text-slate-800 mb-1">{label}</p>
                    <p className="text-blue-600 font-semibold mb-1">
                        Present: {payload[0].value}
                    </p>
                    {pointData.note && (
                        <div className="mt-1 inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                            {pointData.note}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-4">
            {/* HEADER & FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome, <span className="text-blue-600">{user?.name}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        System Overview & Performance Metrics
                    </p>
                </div>

                {/* FILTERS */}
                <div className="flex gap-2">
                    <select
                        className="bg-white border border-slate-200 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                    <select className="bg-white border border-slate-200 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="all">All Departments</option>
                        <option value="eng">Engineering</option>
                        <option value="hr">HR</option>
                    </select>
                </div>
            </div>

            {/* SUMMARY STATS (KPIs) */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Staff"
                    value={isLoading ? "-" : data.kpi.totalStaff.value.toString()}
                    trend={isLoading ? "-" : data.kpi.totalStaff.trend}
                    trendColor="text-green-600"
                    color="blue"
                    icon={Users}
                />
                <StatCard
                    title="Present Today"
                    value={isLoading ? "-" : data.kpi.presentToday.value.toString()}
                    trend={isLoading ? "-" : data.kpi.presentToday.trend}
                    trendColor="text-red-500"
                    color="green"
                    icon={UserCheck}
                />
                <StatCard
                    title="On Bench"
                    value={isLoading ? "-" : data.kpi.onBench.value.toString()}
                    trend={isLoading ? "-" : data.kpi.onBench.trend}
                    trendColor="text-orange-600"
                    color="orange"
                    icon={Clock}
                />
                <StatCard
                    title="System Alerts"
                    value={isLoading ? "-" : data.kpi.systemAlerts.value.toString()}
                    trend={isLoading ? "-" : data.kpi.systemAlerts.trend}
                    trendColor="text-red-600"
                    color="red"
                    icon={AlertTriangle}
                />
            </div>

            {/* CHARTS ROW 1 */}
            <div className="grid gap-6 md:grid-cols-7">

                {/* ATTENDANCE DISTRIBUTION (DONUT) */}
                <Card className="md:col-span-3 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            Daily Attendance Split
                        </CardTitle>
                        <CardDescription>Who is working where today?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[250px] w-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <div className="h-[250px] w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.charts.attendanceDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.charts.attendanceDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}
                                            itemStyle={{ fontWeight: 'bold', color: '#334155' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-800">{isLoading ? "-" : data.kpi.totalStaff.value}</div>
                                        <div className="text-xs text-muted-foreground font-medium uppercase">Total</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ATTENDANCE TREND (LINE) */}
                <Card className="md:col-span-4 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            Attendance Trend
                        </CardTitle>
                        <CardDescription>Is attendance improving or declining?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[250px] w-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.charts.attendanceTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip content={<CustomLineTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="present"
                                            stroke="#3B82F6"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* CHARTS ROW 2 */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* RESOURCE UTILIZATION (PIE) */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-indigo-500" />
                            Resource Utilization
                        </CardTitle>
                        <CardDescription>Allocation: Project vs Bench</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[250px] w-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            </div>
                        ) : (
                            <div className="h-[250px] w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.charts.resourceUtilization}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={80}
                                            paddingAngle={0}
                                            dataKey="value"
                                        >
                                            {data.charts.resourceUtilization.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none' }}
                                            itemStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                        />
                                        <Legend
                                            verticalAlign="middle"
                                            align="right"
                                            layout="vertical"
                                            iconType="circle"
                                            formatter={renderResourceLegend}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* QUICK ACTIONS */}
                <Card className="shadow-sm border-slate-200 bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 grid-cols-2">
                        <ActionButton
                            icon={Users}
                            label="Add Employee"
                            desc="Onboard new staff"
                            color="blue"
                        />
                        <ActionButton
                            icon={CheckCircle}
                            label="Approvals"
                            desc={`${data.quickActions.pendingApprovals} Pending`}
                            color="green"
                        />
                        <ActionButton
                            icon={Briefcase}
                            label="New Project"
                            desc="Create workspace"
                            color="indigo"
                        />
                        <ActionButton
                            icon={AlertTriangle}
                            label="Alerts"
                            desc={`${data.quickActions.alerts} Critical`}
                            color="red"
                            isDestructive
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- COMPONENTS ---

function ActionButton({ icon: Icon, label, desc, color, isDestructive }: { icon: any, label: string, desc: string, color: string, isDestructive?: boolean }) {
    const colors: any = {
        blue: "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
        indigo: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
        green: "bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white",
        orange: "bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
        red: "bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white",
    };

    return (
        <div className={`
            group flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white shadow-sm 
            hover:shadow-md hover:border-blue-300 transition-all cursor-pointer
            ${isDestructive ? 'hover:border-red-200' : ''}
        `}>
            <div className={`h-10 w-10 rounded-md flex items-center justify-center transition-colors ${colors[color] || colors.blue}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-bold text-sm text-slate-800 group-hover:text-current transition-colors">{label}</h3>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
        </div>
    )
}

function StatCard({
    title,
    value,
    trend,
    trendColor,
    color,
    icon: Icon,
}: {
    title: string;
    value: string;
    trend: string;
    trendColor: string;
    color: "blue" | "green" | "orange" | "red" | "indigo" | "pink";
    icon: LucideIcon;
}) {
    const styles = {
        blue: { border: "border-l-blue-500", text: "text-blue-600", bg: "bg-blue-50/30", iconBg: "bg-blue-500 shadow-blue-200/50" },
        green: { border: "border-l-green-500", text: "text-green-600", bg: "bg-green-50/30", iconBg: "bg-green-600 shadow-green-200/50" },
        orange: { border: "border-l-orange-500", text: "text-orange-600", bg: "bg-orange-50/30", iconBg: "bg-orange-500 shadow-orange-200/50" },
        red: { border: "border-l-red-500", text: "text-red-600", bg: "bg-red-50/30", iconBg: "bg-red-500 shadow-red-200/50" },
        indigo: { border: "border-l-indigo-500", text: "text-indigo-600", bg: "bg-indigo-50/30", iconBg: "bg-indigo-500 shadow-indigo-200/50" },
        pink: { border: "border-l-pink-500", text: "text-pink-600", bg: "bg-pink-50/30", iconBg: "bg-pink-500 shadow-pink-200/50" },
    };

    const currentStyle = styles[color] || styles.blue;

    return (
        <Card className={`group border border-l-4 shadow-md hover:shadow-lg transition-all duration-300 ${currentStyle.bg} ${currentStyle.border}`}>
            <CardContent className="p-5 flex items-center justify-between relative overflow-hidden">
                <div className="z-10">
                    <CardTitle className="text-sm font-medium text-slate-500 mb-1">{title}</CardTitle>
                    <div className="text-2xl font-bold text-slate-800 tracking-tight">{value}</div>
                    <div className={`text-xs font-semibold mt-1 ${trendColor || currentStyle.text}`}>
                        {trend}
                    </div>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${currentStyle.iconBg} z-10`}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}
