import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Activity,
    Search,
    Download,
    AlertCircle,
    CheckCircle2,

    AlertTriangle,
    Loader2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
// import { Select } from "@/components/ui/select"; // Removed unused Select component
import { cn } from "@/lib/utils";

/* ======================
   TYPES
   ====================== */
type LogSeverity = "Info" | "Warning" | "Error" | "Success";
type LogAction = "Create" | "Update" | "Delete" | "Login" | "Logout" | "Approve" | "Reject" | "View" | "Export";

interface LogEntry {
    _id: string;
    timestamp: string;
    action: LogAction;
    module: string;
    description: string;
    user: {
        id: string;
        name: string;
        role: "ADMIN" | "HR" | "EMPLOYEE";
        profileImage?: string;
    };
    severity: LogSeverity;
    ipAddress: string;
}

/* ======================
   MOCK DATA
   ====================== */
// Mock data removed. Logs are fetched from the backend via useEffect.
const getSeverityColor = (severity: LogSeverity) => {
    switch (severity) {
        case "Success": return "bg-green-100 text-green-700 border-green-200";
        case "Error": return "bg-red-100 text-red-700 border-red-200";
        case "Warning": return "bg-amber-100 text-amber-700 border-amber-200";
        case "Info": return "bg-blue-100 text-blue-700 border-blue-200";
        default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

const getSeverityIcon = (severity: LogSeverity) => {
    switch (severity) {
        case "Success": return CheckCircle2;
        case "Error": return AlertCircle;
        case "Warning": return AlertTriangle;
        default: return Activity;
    }
};

export default function AdminLogs() {
    const [searchTerm, setSearchTerm] = useState("");
    const [moduleFilter, setModuleFilter] = useState<string>("All");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [severityFilter, setSeverityFilter] = useState<string>("All");
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [stats, setStats] = useState({
        errors: 0,
        warnings: 0,
        successful: 0
    });

    // Fetch logs from backend
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', '10'); // Changed to 10 per page

            if (searchTerm) params.append('search', searchTerm);
            if (moduleFilter !== 'All') params.append('module', moduleFilter);
            if (severityFilter !== 'All') params.append('severity', severityFilter);

            const response = await fetch(`/api/logs?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data.pagination) {
                setLogs(data.logs || []);
                setTotalPages(data.pagination.pages);
                setTotalRecords(data.pagination.total);
                if (data.pagination.stats) {
                    setStats(data.pagination.stats);
                }
            } else {
                setLogs(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Effect for fetching logs
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, moduleFilter, severityFilter, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, moduleFilter, severityFilter]);

    // Client-side filtering is no longer needed as the server handles it
    const filteredLogs = logs;

    const uniqueModules = Array.from(new Set(logs.map(log => log.module)));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/20">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Logs</h1>
                        <p className="text-muted-foreground">Monitor system activity and audit trails.</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" /> Export Logs
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Events"
                    value={totalRecords.toString()}
                    color="blue"
                    icon={Activity}
                />
                <StatCard
                    title="Errors"
                    value={stats.errors.toString()}
                    color="red"
                    icon={AlertCircle}
                />
                <StatCard
                    title="Warnings"
                    value={stats.warnings.toString()}
                    color="orange"
                    icon={AlertTriangle}
                />
                <StatCard
                    title="Successful"
                    value={stats.successful.toString()}
                    color="green"
                    icon={CheckCircle2}
                />
            </div>

            {/* Filters & Table */}
            <Card className="border shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b p-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-10 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <select
                                value={moduleFilter}
                                onChange={(e) => setModuleFilter(e.target.value)}
                                className="w-[150px] bg-white cursor-pointer h-10 px-3 py-2 rounded-md border border-input text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <option value="All">All Modules</option>
                                <option value="Auth">Auth</option>
                                <option value="User">User</option>
                                <option value="Policy">Policy</option>
                                <option value="Admin">Admin</option>
                                {/* Add more static options or keep dynamic if preferred */}
                            </select>

                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="w-[150px] bg-white cursor-pointer h-10 px-3 py-2 rounded-md border border-input text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <option value="All">All Severity</option>
                                <option value="Info">Info</option>
                                <option value="Success">Success</option>
                                <option value="Warning">Warning</option>
                                <option value="Error">Error</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold text-slate-700 pl-6">Timestamp</TableHead>
                                    <TableHead className="font-semibold text-slate-700">User</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Module</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Action</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Description</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right pr-6">IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                                                Loading logs...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                            No logs found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => {
                                        const SeverityIcon = getSeverityIcon(log.severity);
                                        return (
                                            <TableRow key={log._id} className="hover:bg-slate-50/50">
                                                <TableCell className="pl-6 font-mono text-xs text-slate-600">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={log.user.profileImage || `https://ui-avatars.com/api/?name=${log.user.name}&background=2563EB&color=fff`} />
                                                            <AvatarFallback className="text-xs font-bold">{log.user.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm text-slate-900">{log.user.name}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-50">
                                                        {log.user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700 hover:bg-slate-200">
                                                        {log.module}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-sm text-slate-700">{log.action}</span>
                                                </TableCell>
                                                <TableCell className="max-w-[300px]">
                                                    <p className="text-sm text-slate-600 truncate" title={log.description}>
                                                        {log.description}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn("gap-1 pl-1 pr-2 shadow-none font-normal", getSeverityColor(log.severity))}>
                                                        <SeverityIcon className="h-3 w-3" />
                                                        {log.severity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6 font-mono text-xs text-slate-500">
                                                    {log.ipAddress}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
                        <div className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-slate-900">{currentPage}</span> of <span className="font-medium text-slate-900">{totalPages === 0 ? 1 : totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || loading}
                                className="h-8"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage >= totalPages || loading}
                                className="h-8"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    color,
    icon: Icon,
}: {
    title: string;
    value: string;
    subtitle?: string;
    color: "violet" | "green" | "orange" | "blue" | "red";
    icon: LucideIcon;
}) {
    const styles = {
        violet: {
            border: "border-l-violet-500",
            text: "text-violet-600",
            bg: "bg-violet-50/50",
            iconBg: "bg-violet-500 shadow-violet-200",
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
        blue: {
            border: "border-l-blue-500",
            text: "text-blue-600",
            bg: "bg-blue-50/50",
            iconBg: "bg-blue-500 shadow-blue-200",
        },
        red: {
            border: "border-l-red-500",
            text: "text-red-600",
            bg: "bg-red-50/50",
            iconBg: "bg-red-500 shadow-red-200",
        },
    };

    // @ts-ignore
    const currentStyle = styles[color] || styles.blue;

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
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
                    )}
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${currentStyle.iconBg}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}
