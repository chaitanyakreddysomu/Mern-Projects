import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
    PlusCircle,
    Calendar as CalendarIcon,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    ClipboardList,
    Search,
    Eye,
    Check,
    X,
} from "lucide-react";




export default function HRLeaves() {
    const { addToast } = useToast();
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

    // Data State
    const [allLeaves, setAllLeaves] = useState<any[]>([]);
    const [myLeaves, setMyLeaves] = useState<any[]>([]);

    // Apply Form State
    const [applyForm, setApplyForm] = useState({
        type: "Annual",
        startDate: "",
        endDate: "",
        reason: "",
        duration: "1 Day" // Simple default, ideally calculated
    });

    // Employee Management State
    const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("All");

    const fetchAllLeaves = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/leaves', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setAllLeaves(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMyLeaves = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/leaves/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setMyLeaves(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchAllLeaves();
        fetchMyLeaves();
    }, []);

    const filteredLeaves = allLeaves.filter(leave => {
        if (filterStatus === "All") return true;
        return leave.status === filterStatus;
    });

    const handleAction = async (action: "Approve" | "Reject") => {
        if (action === "Reject") {
            setIsRejectDialogOpen(true);
        } else {
            await updateStatus(selectedLeave._id, "Approved");
            setIsDetailsOpen(false);
            setSelectedLeave(null);
        }
    };

    const confirmReject = async () => {
        if (!rejectionReason) return;
        await updateStatus(selectedLeave._id, "Rejected", rejectionReason);
        setIsRejectDialogOpen(false);
        setIsDetailsOpen(false);
        setSelectedLeave(null);
        setRejectionReason("");
    }

    const updateStatus = async (id: string, status: string, reason?: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/leaves/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, rejectionReason: reason })
            });
            if (res.ok) {
                addToast(`Leave request ${status}`, "success");
                fetchAllLeaves();
            }
        } catch (error) {
            addToast("Failed to update status", "error");
            console.error(error);
        }
    };

    const handleApplyLeave = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/leaves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(applyForm)
            });

            if (res.ok) {
                addToast("Leave request submitted", "success");
                setIsApplyDialogOpen(false);
                fetchMyLeaves();
                // Also refresh all leaves since I exist in that list too
                fetchAllLeaves();
                setApplyForm({ type: "Annual", startDate: "", endDate: "", reason: "", duration: "1 Day" });
            }
        } catch (error) {
            addToast("Failed to submit request", "error");
            console.error(error);
        }
    };

    // Derived Stats
    const myStats = {
        annual: myLeaves.filter(l => l.type === 'Annual' && l.status === 'Approved').length,
        casual: myLeaves.filter(l => l.type === 'Casual' && l.status === 'Approved').length,
        sick: myLeaves.filter(l => l.type === 'Sick' && l.status === 'Approved').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Leave Management</h1>
                <p className="text-muted-foreground">Manage your leaves and review employee requests.</p>
            </div>

            <Tabs defaultValue="employee-leaves" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-slate-100">
                    <TabsTrigger value="employee-leaves">Employee Leaves</TabsTrigger>
                    <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
                </TabsList>

                {/* EMPLOYEE LEAVES TAB */}
                <TabsContent value="employee-leaves" className="space-y-6 mt-6">
                    {/* FILTERS */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Search employees..."
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <select
                                className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    <Card className="shadow-md border-none">
                        <CardHeader className="bg-blue-50/50 border-b">
                            <CardTitle className="text-blue-700">Leave Requests</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b bg-slate-50">
                                        <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Employee</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Type</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Duration</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Reason</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {filteredLeaves.map((leave) => (
                                            <tr key={leave._id || leave.id} className="border-b transition-colors hover:bg-slate-50/50">
                                                <td className="p-4 align-middle font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={leave.profileImage || leave.avatar || `https://ui-avatars.com/api/?name=${leave.userName}&background=random`} />
                                                            <AvatarFallback>{leave.userName ? leave.userName.charAt(0) : "E"}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-semibold">{leave.userName}</div>
                                                            <div className="text-xs text-muted-foreground">{new Date(leave.appliedOn).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">{leave.type}</td>
                                                <td className="p-4 align-middle">
                                                    <div className="text-sm font-medium">{leave.duration}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle max-w-[200px] truncate" title={leave.reason}>
                                                    {leave.reason}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <LeaveStatusBadge status={leave.status} />
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLeave(leave);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                            className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4 text-white" />
                                                        </button>

                                                        {leave.status === "Pending" && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedLeave(leave);
                                                                        handleAction("Approve");
                                                                    }}
                                                                    className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center shadow-md shadow-green-500/30 hover:bg-green-600 transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <Check className="h-4 w-4 text-white" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedLeave(leave);
                                                                        handleAction("Reject");
                                                                    }}
                                                                    className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center shadow-md shadow-red-500/30 hover:bg-red-600 transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <X className="h-4 w-4 text-white" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* MY LEAVES TAB - Duplicated from employee/Leaves.tsx */}
                <TabsContent value="my-leaves" className="space-y-6 mt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                My Leaves
                            </h2>
                            <p className="text-muted-foreground">
                                Manage your leave requests and balances.
                            </p>
                        </div>
                        {/* APPLY BUTTON */}
                        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-700 active:scale-95">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Apply Leave
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Apply for Leave</DialogTitle>
                                    <DialogDescription>
                                        Submit a new leave request for approval.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Leave Type</Label>
                                            <Select
                                                value={applyForm.type}
                                                onValueChange={(val) => setApplyForm({ ...applyForm, type: val })}
                                            >
                                                <SelectTrigger className="w-full h-10">
                                                    <SelectValue placeholder="Select leave type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Annual">Annual</SelectItem>
                                                    <SelectItem value="Casual">Casual</SelectItem>
                                                    <SelectItem value="Sick">Sick</SelectItem>
                                                    <SelectItem value="Work From Home">Work From Home</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Balance: Check Policy
                                            </p>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Reason</Label>
                                            <Input
                                                placeholder="Reason"
                                                className="bg-muted/30"
                                                value={applyForm.reason}
                                                onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input
                                                type="date"
                                                className="bg-muted/30"
                                                value={applyForm.startDate}
                                                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input
                                                type="date"
                                                className="bg-muted/30"
                                                value={applyForm.endDate}
                                                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                                            />
                                        </div>

                                        <div className="md:col-span-2 bg-violet-50 border border-violet-200 text-violet-900 p-3 rounded-md text-xs flex gap-2">
                                            <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                                            Sick leave beyond 2 days requires a medical certificate.
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsApplyDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleApplyLeave} className="bg-violet-600 text-white shadow-md shadow-violet-600/30">
                                        Submit Request
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* STATS */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <StatCard title="Annual Leave" value={`${myStats.annual} / 18`} color="blue" />
                        <StatCard title="Casual Leave" value={`${myStats.casual} / 12`} color="green" />
                        <StatCard title="Sick Leave" value={`${myStats.sick} / 10`} color="orange" />

                        <Card className="bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm opacity-90">Total Approved</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{myStats.annual + myStats.casual + myStats.sick} Days</div>
                                <p className="text-xs opacity-80 mt-1">Consumed</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* HISTORY */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-violet-50/60 border-b border-violet-600/20">
                            <CardTitle className="flex items-center gap-2 text-violet-700">
                                <ClipboardList className="h-5 w-5" />
                                Leave History
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="space-y-4 p-4">
                                {myLeaves.length === 0 && <div className="text-center text-muted-foreground py-4">No leave history found.</div>}
                                {myLeaves.map((leave) => {
                                    const statusBorderMap = {
                                        Approved: "border-l-green-500",
                                        Pending: "border-l-orange-500",
                                        Rejected: "border-l-red-500",
                                    } as const;


                                    const statusConfig = {
                                        Approved: {
                                            icon: CheckCircle2,
                                            iconBg: "bg-green-100 text-green-600",
                                            badge: "success",
                                        },
                                        Pending: {
                                            icon: Clock,
                                            iconBg: "bg-orange-100 text-orange-600",
                                            badge: "warning",
                                        },
                                        Rejected: {
                                            icon: XCircle,
                                            iconBg: "bg-red-100 text-red-600",
                                            badge: "destructive",
                                        },
                                    } as const;

                                    const statusKey = (leave.status as keyof typeof statusConfig) || "Pending";
                                    const StatusIcon = statusConfig[statusKey] ? statusConfig[statusKey].icon : statusConfig.Pending.icon;
                                    const borderClass = statusBorderMap[statusKey as keyof typeof statusBorderMap] || statusBorderMap.Pending;

                                    return (
                                        <Card
                                            key={leave._id || leave.id}
                                            className={`group border-l-4 ${borderClass} bg-white shadow-sm hover:shadow-lg transition-all`}
                                        >
                                            <CardContent className="p-0 block">
                                                <div className="p-5 grid grid-cols-[160px_220px_1fr_160px_140px] items-center gap-4">
                                                    {/* TYPE + STATUS ICON */}
                                                    <div className="flex items-center gap-3 font-semibold">
                                                        <div
                                                            className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm ${statusConfig[statusKey] ? statusConfig[statusKey].iconBg : statusConfig.Pending.iconBg}`}
                                                        >
                                                            <StatusIcon className="h-5 w-5" />
                                                        </div>
                                                        {leave.type}
                                                    </div>

                                                    {/* DURATION */}
                                                    <div className="text-sm">
                                                        <div className="flex items-center gap-1 font-medium">
                                                            <CalendarIcon className="h-4 w-4" />
                                                            {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            3 Days
                                                        </div>
                                                    </div>

                                                    {/* REASON */}
                                                    <div className="text-sm text-foreground/90 font-medium truncate">
                                                        {leave.reason}
                                                    </div>

                                                    {/* APPLIED ON */}
                                                    {/* APPLIED ON */}
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(leave.appliedOn).toLocaleDateString()}
                                                    </div>

                                                    {/* STATUS (TEXT ONLY) */}
                                                    <div className="flex justify-end">
                                                        {/* @ts-ignore */}
                                                        <Badge variant={statusConfig[leave.status].badge}>
                                                            {leave.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {leave.status === 'Rejected' && leave.rejectionReason && (
                                                    <div className="bg-red-50/50 px-5 py-3 border-t border-red-100 flex items-start gap-2 rounded-b-lg">
                                                        <span className="text-xs font-bold text-red-600 uppercase tracking-wide shrink-0 mt-0.5">Rejection Reason:</span>
                                                        <span className="text-sm text-red-800">{leave.rejectionReason}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* DETAILS DIALOG */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Leave Details</DialogTitle>
                        {/* Removed DialogDescription here to fix lint warning if unused, providing it now */}
                        <DialogDescription>Review details of the selected leave request.</DialogDescription>
                    </DialogHeader>
                    {selectedLeave && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={selectedLeave.profileImage || selectedLeave.avatar || `https://ui-avatars.com/api/?name=${selectedLeave.userName}&background=random`} />
                                    <AvatarFallback>{selectedLeave.userName ? selectedLeave.userName.charAt(0) : "E"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-lg">{selectedLeave.userName}</div>
                                    <div className="text-muted-foreground text-sm">Software Developer</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Leave Type</Label>
                                    <div className="font-medium mt-1">{selectedLeave.type}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Duration</Label>
                                    <div className="font-medium mt-1">{selectedLeave.duration}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Start Date</Label>
                                    <div className="font-medium mt-1">{selectedLeave.startDate}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">End Date</Label>
                                    <div className="font-medium mt-1">{selectedLeave.endDate}</div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Reason</Label>
                                <div className="mt-1 p-3 bg-slate-50 rounded-md text-sm">
                                    {selectedLeave.reason}
                                </div>
                            </div>

                            {selectedLeave.status === "Rejected" && selectedLeave.rejectionReason && (
                                <div>
                                    <Label className="text-red-600 text-xs uppercase tracking-wider">Rejection Reason</Label>
                                    <div className="mt-1 p-3 bg-red-50 border border-red-100 text-red-900 rounded-md text-sm">
                                        {selectedLeave.rejectionReason}
                                    </div>
                                </div>
                            )}

                            {selectedLeave.status === "Pending" && (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAction("Reject")}>
                                        Reject
                                    </Button>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction("Approve")}>
                                        Approve
                                    </Button>
                                </div>
                            )}

                            {selectedLeave.status !== "Pending" && (
                                <div className="pt-4 border-t text-center">
                                    <LeaveStatusBadge status={selectedLeave.status} />
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* REJECT REASON DIALOG */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Leave Request</DialogTitle>
                        <DialogDescription>Please provide a reason for rejection.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Reason for Rejection</Label>
                        <Textarea
                            placeholder="e.g., Important project deadline approaching..."
                            value={rejectionReason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmReject} disabled={!rejectionReason.trim()}>Confirm Rejection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({
    title,
    value,
    color,
}: {
    title: string;
    value: string;
    color: "blue" | "green" | "orange";
}) {
    const colorMap = {
        blue: "border-l-blue-500 bg-blue-50/40 text-blue-700",
        green: "border-l-green-500 bg-green-50/40 text-green-700",
        orange: "border-l-orange-500 bg-orange-50/40 text-orange-700",
    };

    return (
        <Card className={`border-l-4 shadow-md ${colorMap[color]}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    Available / Total
                </p>
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
