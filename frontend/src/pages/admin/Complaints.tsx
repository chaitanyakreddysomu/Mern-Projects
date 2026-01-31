import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    AlertCircle,
    Search,
    Eye,
    FileWarning,
    CircleDot,
    CheckCircle2,
    Loader2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Complaint {
    id: string; // mapped from _id
    userId: string;
    userName: string;
    subject: string;
    description: string;
    date: string;
    status: "Open" | "Investigating" | "Resolved";
    avatar?: string;
    profileImage?: string;
    department: string;
}

export default function AdminComplaints() {
    // State for Employee Complaints Management
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("All");
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    // Pagination & Stats
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        investigating: 0,
        resolved: 0
    });

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams();
            queryParams.append('page', currentPage.toString());
            queryParams.append('limit', '10');
            if (filterStatus !== 'All') queryParams.append('status', filterStatus);
            if (debouncedSearch) queryParams.append('search', debouncedSearch);

            const res = await apiFetch(`/api/admin/complaints?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();

                // Handle new paginated response structure
                const rawComplaints = data.complaints || [];
                const pagination = data.pagination;

                const mapped = rawComplaints.map((c: any) => ({
                    id: c._id,
                    userId: c.userId,
                    userName: c.userName || 'Unknown',
                    subject: c.subject,
                    description: c.description,
                    date: c.date,
                    status: c.status,
                    avatar: c.avatar,
                    profileImage: c.profileImage,
                    department: c.department || 'General'
                }));
                setComplaints(mapped);

                if (pagination) {
                    setTotalPages(pagination.pages);
                    if (pagination.stats) {
                        setStats(pagination.stats);
                    }
                }
            }
        } catch (error) {
            console.error("Fetch complaints failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [filterStatus, debouncedSearch, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, debouncedSearch]);

    const handleUpdateStatus = async (status: string) => {
        if (!selectedComplaint) return;
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/admin/complaints/${selectedComplaint.id}?update=${status}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                // Update local list
                setComplaints(complaints.map(c => c.id === selectedComplaint.id ? { ...c, status: updated.status } : c));
                // Update selected detail logic
                setSelectedComplaint({ ...selectedComplaint, status: updated.status });
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Update status failed", error);
        }
    };

    // Stats are now fetched from backend
    const totalComplaints = stats.total;
    const openComplaints = stats.open;
    const investigatingComplaints = stats.investigating;
    const resolvedComplaints = stats.resolved;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <div className="h-10 w-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/30">
                        <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    Complaints Administration
                </h1>
                <p className="text-muted-foreground mt-1 ml-14">Investigate and resolve employee grievances.</p>
            </div>

            {/* STAT CARDS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Complaints" value={totalComplaints.toString()} color="violet" icon={FileWarning} />
                <StatCard title="Open" value={openComplaints.toString()} color="red" icon={AlertCircle} />
                <StatCard title="Investigating" value={investigatingComplaints.toString()} color="orange" icon={CircleDot} />
                <StatCard title="Resolved" value={resolvedComplaints.toString()} color="green" icon={CheckCircle2} />
            </div>

            {/* FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Search complaints..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
            </div>

            <Card className="shadow-md border-none">
                <CardHeader className="bg-amber-50/50 border-b">
                    <CardTitle className="text-amber-800">Received Complaints</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b bg-slate-50">
                                <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Employee</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Subject</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Department</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                                                Loading...
                                            </div>
                                        </td>
                                    </tr>
                                ) : complaints.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">No complaints found.</td>
                                    </tr>
                                ) : (
                                    complaints.map((complaint) => (
                                        <tr key={complaint.id} className="border-b transition-colors hover:bg-slate-50/50">
                                            <td className="p-4 align-middle font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border cursor-pointer hover:ring-2 hover:ring-sky-100 transition-all">
                                                        <AvatarImage className="object-cover" src={complaint.profileImage || `https://ui-avatars.com/api/?name=${complaint.userName}&background=2563EB&color=fff`} alt={complaint.userName} />
                                                        <AvatarFallback className="bg-sky-100 text-sky-700">{complaint.userName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{complaint.userName}</span>
                                                        <span className="text-xs text-muted-foreground">{complaint.userId}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium truncate max-w-[200px]">{complaint.subject}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{complaint.description}</div>
                                            </td>
                                            <td className="p-4 align-middle whitespace-nowrap">
                                                {new Date(complaint.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {complaint.department}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge variant="outline" className={cn(
                                                    "font-normal",
                                                    complaint.status === "Resolved" && "bg-green-100 text-green-700 border-green-200",
                                                    complaint.status === "Investigating" && "bg-orange-100 text-orange-700 border-orange-200",
                                                    complaint.status === "Open" && "bg-red-100 text-red-700 border-red-200"
                                                )}>
                                                    {complaint.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedComplaint(complaint);
                                                        setIsDetailsOpen(true);
                                                    }}
                                                    className="h-9 w-9 bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center justify-center shadow-md shadow-amber-600/30 transition-colors active:scale-95 text-white"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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

            {/* DETAILS DIALOG */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Complaint Details</DialogTitle>
                        <DialogDescription>Review and investigation status update.</DialogDescription>
                    </DialogHeader>
                    {selectedComplaint && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 pb-4 border-b">
                                <span className="text-xl font-bold">{selectedComplaint.subject}</span>
                                <span className="text-sm text-muted-foreground">Raised by {selectedComplaint.userName} • {selectedComplaint.department}</span>
                                <span className="text-xs text-muted-foreground">{new Date(selectedComplaint.date).toLocaleString()}</span>
                            </div>

                            <div className="p-4 rounded-md bg-slate-50 text-sm leading-relaxed border max-h-[150px] overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-200">
                                {selectedComplaint.description}
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Update Status</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={selectedComplaint.status === "Open" ? "default" : "outline"}
                                        className={cn(selectedComplaint.status === "Open" && "bg-red-600 hover:bg-red-700")}
                                        onClick={() => handleUpdateStatus("Open")}
                                    >
                                        Open
                                    </Button>
                                    <Button
                                        variant={selectedComplaint.status === "Investigating" ? "default" : "outline"}
                                        className={cn(selectedComplaint.status === "Investigating" && "bg-amber-500 hover:bg-amber-600 text-white")}
                                        onClick={() => handleUpdateStatus("Investigating")}
                                    >
                                        Investigating
                                    </Button>
                                    <Button
                                        variant={selectedComplaint.status === "Resolved" ? "default" : "outline"}
                                        className={cn(selectedComplaint.status === "Resolved" && "bg-green-600 hover:bg-green-700")}
                                        onClick={() => handleUpdateStatus("Resolved")}
                                    >
                                        Resolved
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
