import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    FileText,
    ArrowUpDown,
    Check,
    X,
    Eye,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface LeaveRequest {
    _id: string; // Mongo ID
    userId: string;
    userName: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    appliedOn: string;
    rejectionReason?: string;
    profileImage?: string;
    avatar?: string;
}

interface LeaveStats {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
}

export default function AdminLeaves() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [stats, setStats] = useState<LeaveStats>({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Rejection Dialog State
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    // Details Dialog State
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
            if (sortConfig) {
                params.append('sortBy', sortConfig.key);
                params.append('order', sortConfig.direction);
            }

            const res = await fetch(`http://localhost:5000/api/admin/leaves?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data.leaves);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeaves();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const updateStatus = async (id: string, action: 'approve' | 'reject') => {
        if (action === 'reject') {
            setRejectId(id);
            setIsRejectDialogOpen(true);
            return;
        }

        // Approve Logic (Immediate)
        await performStatusUpdate(id, 'Approved');
    };

    const confirmReject = async () => {
        if (!rejectId || !rejectionReason.trim()) return;
        await performStatusUpdate(rejectId, 'Rejected', rejectionReason);
        setIsRejectDialogOpen(false);
        setRejectId(null);
        setRejectionReason("");
    };

    const performStatusUpdate = async (id: string, status: string, reason?: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/admin/leaves/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status,
                    rejectionReason: reason
                })
            });

            if (res.ok) {
                fetchLeaves(); // Refresh data
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const getDuration = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
        return diffDays === 1 ? '1 Day' : `${diffDays} Days`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Leave Management</h1>
                <p className="text-muted-foreground">Review and manage employee leave requests.</p>
            </div>

            {/* STATS */}
            <div className="grid gap-6 md:grid-cols-4">
                <StatCard title="Total Requests" value={stats.total} icon={FileText} color="blue" />
                <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="green" />
                <StatCard title="Pending" value={stats.pending} icon={Clock} color="orange" />
                <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
            </div>

            {/* FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto items-center">
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value)}
                    >
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* TABLE */}
            <Card className="shadow-md border-none">
                <CardHeader className="bg-blue-50/50 border-b flex flex-row justify-between items-center">
                    <CardTitle className="text-blue-700">Leave Requests</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b bg-slate-50">
                                <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:bg-slate-100" onClick={() => handleSort('userName')}>
                                        <div className="flex items-center gap-1">Employee <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:bg-slate-100" onClick={() => handleSort('type')}>
                                        <div className="flex items-center gap-1">Type <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Duration</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Reason</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                                        <div className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
                                    </th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center items-center h-full">
                                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">No leave requests found.</td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req._id || req._id} className="border-b transition-colors hover:bg-transparent">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={req.profileImage || req.avatar || `https://ui-avatars.com/api/?name=${req.userName}&background=random`} alt={req.userName} />
                                                        <AvatarFallback>{req.userName ? req.userName.charAt(0) : 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{req.userName}</span>
                                                        <span className="text-xs text-muted-foreground">{req.appliedOn ? format(parseISO(req.appliedOn), 'yyyy-MM-dd') : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle font-medium">{req.type}</td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{getDuration(req.startDate, req.endDate)}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {req.startDate ? format(parseISO(req.startDate), 'yyyy-MM-dd') : 'N/A'} - {req.endDate ? format(parseISO(req.endDate), 'yyyy-MM-dd') : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle max-w-[200px]" title={req.reason}>
                                                <div className="truncate">{req.reason}</div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-col items-start gap-1">
                                                    <LeaveStatusBadge status={req.status} />
                                                    {/* {req.status === 'Rejected' && req.rejectionReason && (
                                                        <div className="text-[10px] text-red-600 max-w-[150px] leading-tight bg-red-50 p-1 rounded border border-red-100 mt-1">
                                                            <span className="font-bold">Reason:</span> {req.rejectionReason}
                                                        </div>
                                                    )} */}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg shadow-sm"
                                                        onClick={() => {
                                                            setSelectedLeave(req);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    {req.status === 'Pending' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-lg shadow-sm"
                                                                onClick={() => updateStatus(req._id, 'approve')}
                                                                title="Approve"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg shadow-sm"
                                                                onClick={() => updateStatus(req._id, 'reject')}
                                                                title="Reject"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>


            </Card>

            {/* DETAILS DIALOG */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave Request Details</DialogTitle>
                    </DialogHeader>
                    {selectedLeave && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={selectedLeave.profileImage || selectedLeave.avatar || `https://ui-avatars.com/api/?name=${selectedLeave.userName}&background=random`} />
                                    <AvatarFallback>{selectedLeave.userName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedLeave.userName}</h3>
                                    <p className="text-sm text-muted-foreground">Applied on {selectedLeave.appliedOn ? format(parseISO(selectedLeave.appliedOn), 'dd MMM yyyy') : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Leave Type</Label>
                                    <p className="font-medium">{selectedLeave.type}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1"><LeaveStatusBadge status={selectedLeave.status} /></div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Start Date</Label>
                                    <p className="font-medium">{selectedLeave.startDate ? format(parseISO(selectedLeave.startDate), 'dd MMM yyyy') : 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">End Date</Label>
                                    <p className="font-medium">{selectedLeave.endDate ? format(parseISO(selectedLeave.endDate), 'dd MMM yyyy') : 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Reason</Label>
                                <p className="text-sm mt-1 p-3 bg-slate-50 rounded-md border">{selectedLeave.reason}</p>
                            </div>
                            {selectedLeave.rejectionReason && (
                                <div>
                                    <Label className="text-red-600">Rejection Reason</Label>
                                    <p className="text-sm mt-1 p-3 bg-red-50 text-red-700 rounded-md border border-red-100">{selectedLeave.rejectionReason}</p>
                                </div>
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                                {selectedLeave.status === 'Pending' && (
                                    <>
                                        <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => {
                                            updateStatus(selectedLeave._id, 'approve');
                                            setIsDetailsOpen(false);
                                        }}>Approve</Button>
                                        <Button variant="destructive" onClick={() => {
                                            if (selectedLeave._id) {
                                                setRejectId(selectedLeave._id);
                                                setIsDetailsOpen(false);
                                                setIsRejectDialogOpen(true);
                                            }
                                        }}>Reject</Button>
                                    </>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* REJECTION DIALOG */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Leave Request</DialogTitle>
                        <DialogDescription>Please provide a reason for rejection. This will be visible to the employee.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="reason">Reason for Rejection</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Important client meeting, Insufficient leave balance..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmReject} disabled={!rejectionReason.trim()}>
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: "blue" | "green" | "orange" | "red" | "violet" }) {
    const styles = {
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        green: "bg-green-50 border-green-200 text-green-700",
        orange: "bg-orange-50 border-orange-200 text-orange-700",
        red: "bg-red-50 border-red-200 text-red-700",
        violet: "bg-violet-50 border-violet-200 text-violet-700",
    };

    // @ts-ignore
    const current = styles[color] || styles.blue;

    return (
        <Card className={`border shadow-sm border-l-4 ${color === 'blue' ? 'border-l-blue-500' :
            color === 'green' ? 'border-l-green-500' :
                color === 'orange' ? 'border-l-orange-500' :
                    color === 'red' ? 'border-l-red-500' :
                        'border-l-violet-500'
            }`}>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    <h3 className={`text-2xl font-bold ${current.split(' ').pop()}`}>{value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${current}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function LeaveStatusBadge({ status }: { status: string }) {
    const statusConfig = {
        Approved: {
            icon: CheckCircle2,
            iconBg: "bg-green-100 text-green-600",
            badge: "bg-green-100 text-green-700 border-green-200",
        },
        Pending: {
            icon: Clock,
            iconBg: "bg-orange-100 text-orange-600",
            badge: "bg-orange-100 text-orange-700 border-orange-200",
        },
        Rejected: {
            icon: XCircle,
            iconBg: "bg-red-100 text-red-600",
            badge: "bg-red-100 text-red-700 border-red-200",
        },
    } as const;

    // @ts-ignore
    const config = statusConfig[status] || statusConfig.Pending;
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={`gap-1 pr-3 pl-2 py-1 font-normal border ${config.badge}`}>
            <Icon className="h-3 w-3" />
            {status}
        </Badge>
    );
}
