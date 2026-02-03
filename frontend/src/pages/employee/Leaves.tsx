import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
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
import {
    PlusCircle,
    Calendar as CalendarIcon,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    ClipboardList,
    Sparkles,
    Wand2,
    Loader2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { format, differenceInDays, parseISO } from "date-fns";

interface Leave {
    _id: string; // Ensure backend uses _id
    id?: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: "Pending" | "Approved" | "Rejected";
    appliedOn: string;
    rejectionReason?: string;
}

export default function Leaves() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [leaves, setLeaves] = useState<Leave[]>([]);

    const [formData, setFormData] = useState({
        type: "Annual",
        reason: "",
        startDate: "",
        endDate: ""
    });
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchLeaves = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/employee/leaves', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLeaves(data);
            }
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            // setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleApplyLeave = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/employee/leaves', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsDialogOpen(false);
                fetchLeaves(); // Refresh list
                setFormData({
                    type: "Annual",
                    reason: "",
                    startDate: "",
                    endDate: ""
                });
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to apply');
            }
        } catch (error) {
            console.error("Failed to apply leave", error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-10 w-10 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/30">
                            <ClipboardList className="h-6 w-6 text-white" />
                        </div>
                        Leaves
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-14">
                        Manage your leave requests and balances.
                    </p>
                </div>

                {/* APPLY BUTTON */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                            {/* AI GENERATION SECTION */}
                            <div className="md:col-span-2 space-y-2 p-4 bg-violet-50/50 rounded-lg border border-dashed border-violet-200">
                                <Label className="text-violet-700 flex items-center gap-2 font-medium">
                                    <Sparkles className="h-4 w-4 text-violet-500" />
                                    AI Leave Assistant
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. I have a fever and need leave for tomorrow..."
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        className="bg-white border-violet-200 focus-visible:ring-violet-500"
                                    />
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            if (!aiPrompt) return;
                                            setIsGenerating(true);
                                            try {
                                                const token = localStorage.getItem('token');
                                                if (!token) {
                                                    alert("Authentication token not found. Please log in again.");
                                                    setIsGenerating(false);
                                                    return;
                                                }

                                                console.log("Sending AI request with token length:", token.length);

                                                const res = await apiFetch('/api/ai/generate-leave', {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${token}` },
                                                    body: JSON.stringify({ reason: aiPrompt })
                                                });

                                                const data = await res.json();

                                                if (res.ok) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        reason: data.reason,
                                                        startDate: data.startDate || prev.startDate,
                                                        endDate: data.endDate || prev.endDate
                                                    }));
                                                } else {
                                                    console.error("AI Error:", data.message);
                                                    if (data.message === "Invalid Token" || data.message === "Access Denied") {
                                                        alert("Your session has expired or is invalid. Please log out and log in again.");
                                                    } else {
                                                        alert(`Failed to generate: ${data.message}`);
                                                    }
                                                }
                                            } catch (e) {
                                                console.error("AI Request Failed", e);
                                                alert("Something went wrong. Please check console.");
                                            } finally {
                                                setIsGenerating(false);
                                            }
                                        }}
                                        disabled={isGenerating || !aiPrompt}
                                        className="bg-violet-600 text-white shrink-0 hover:bg-violet-700"
                                    >
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                        {isGenerating ? "Generating..." : "Auto-Fill"}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Describe your reason and dates naturally. AI will auto-fill the form details above.
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Leave Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Annual">Annual</SelectItem>
                                            <SelectItem value="Casual">Casual</SelectItem>
                                            <SelectItem value="Sick">Sick</SelectItem>
                                            <SelectItem value="Work From Home">Work From Home</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Balance: 4 Days
                                    </p>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Reason</Label>
                                    <Input
                                        placeholder="Reason"
                                        className="bg-muted/30"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        className="bg-muted/30"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        className="bg-muted/30"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2 bg-violet-50 border border-violet-200 text-violet-900 p-3 rounded-md text-xs flex gap-2">
                                    <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                                    Sick leave beyond 2 days requires a medical certificate.
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
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
                <StatCard title="Annual Leave" value="12 / 18" color="blue" />
                <StatCard title="Casual Leave" value="4 / 12" color="green" />
                <StatCard title="Sick Leave" value="2 / 10" color="orange" />

                <Card className="bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm opacity-90">Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">22 Days</div>
                        <p className="text-xs opacity-80 mt-1">Available</p>
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
                        {leaves.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No leave history found.</p>
                        ) : (
                            leaves.map((leave) => {
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

                                // Safe access to config, fallback to Pending if unknown status
                                const config = statusConfig[leave.status] || statusConfig.Pending;
                                const StatusIcon = config.icon;

                                // Calculate Duration
                                let duration = 0;
                                if (leave.startDate && leave.endDate) {
                                    duration = differenceInDays(parseISO(leave.endDate), parseISO(leave.startDate)) + 1;
                                }

                                return (
                                    <Card
                                        key={leave._id || leave.id}
                                        className={`group border-l-4 ${statusBorderMap[leave.status] || "border-l-gray-400"} bg-white shadow-sm hover:shadow-lg transition-all`}
                                    >

                                        <CardContent className="p-0 block">
                                            <div className="p-5 grid grid-cols-[160px_220px_1fr_160px_140px] items-center gap-4">
                                                {/* TYPE + STATUS ICON */}
                                                <div className="flex items-center gap-3 font-semibold">
                                                    <div
                                                        className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm ${config.iconBg}`}
                                                    >
                                                        <StatusIcon className="h-5 w-5" />
                                                    </div>
                                                    {leave.type}
                                                </div>

                                                {/* DURATION */}
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1 font-medium">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        {leave.startDate ? format(parseISO(leave.startDate), 'dd MMM yyyy') : 'N/A'} – {leave.endDate ? format(parseISO(leave.endDate), 'dd MMM yyyy') : 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {duration} Days
                                                    </div>
                                                </div>

                                                {/* REASON */}
                                                <div className="text-sm text-foreground/90 font-medium truncate">
                                                    {leave.reason}
                                                </div>

                                                {/* APPLIED ON */}
                                                <div className="text-xs text-muted-foreground">
                                                    {leave.appliedOn ? format(parseISO(leave.appliedOn), 'dd MMM yyyy') : ''}
                                                </div>

                                                {/* STATUS (TEXT ONLY) */}
                                                <div className="flex justify-end">
                                                    <Badge
                                                        variant={(config.badge as any) || "secondary"}
                                                    >
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
                            })
                        )}
                    </div>
                </CardContent>


            </Card>
        </div>
    );
}

/* ======================
   STAT CARD
   ====================== */
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
