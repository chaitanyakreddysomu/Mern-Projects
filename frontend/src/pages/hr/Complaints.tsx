import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    PlusCircle,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Clock,
    Search,
    Eye,
} from "lucide-react";
import * as React from "react"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Mock data for Employee Complaints management view
// Mock data for Employee Complaints management view

const TextareaSimple = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
TextareaSimple.displayName = "Textarea"

export default function HRComplaints() {
    // State for My Complaints
    const [isRaiseDialogOpen, setIsRaiseDialogOpen] = useState(false);
    const [myComplaints, setMyComplaints] = useState<any[]>([]);
    const [newComplaint, setNewComplaint] = useState({ subject: "", description: "" });
    const [myLoading, setMyLoading] = useState(false);

    // State for Employee Complaints Management
    const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [employeeComplaints, setEmployeeComplaints] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [empLoading, setEmpLoading] = useState(false);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch Employee Complaints
    const fetchEmployeeComplaints = async () => {
        setEmpLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams();
            if (filterStatus !== 'All') queryParams.append('status', filterStatus);
            if (debouncedSearch) queryParams.append('search', debouncedSearch);

            const res = await apiFetch(`/api/hr/employee-complaints?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployeeComplaints(data);
            }
        } catch (error) {
            console.error("Failed to fetch employee complaints", error);
        } finally {
            setEmpLoading(false);
        }
    };

    // Fetch My Complaints
    const fetchMyComplaints = async () => {
        setMyLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/hr/my-complaints', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyComplaints(data);
            }
        } catch (error) {
            console.error("Failed to fetch my complaints", error);
        } finally {
            setMyLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeComplaints();
    }, [filterStatus, debouncedSearch]);

    useEffect(() => {
        fetchMyComplaints();
    }, []);

    const handleUpdateStatus = async (status: string) => {
        if (!selectedComplaint) return;
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/hr/employee-complaints/${selectedComplaint._id}?update=${status}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                const updated = await res.json();
                setEmployeeComplaints(prev => prev.map(c => c._id === updated._id ? updated : c));
                setSelectedComplaint(updated);
                // setIsDetailsOpen(false); // Optional: close or keep open
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handlePostComplaint = async () => {
        if (!newComplaint.subject || !newComplaint.description) return;
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/hr/my-complaints', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newComplaint)
            });

            if (res.ok) {
                setIsRaiseDialogOpen(false);
                setNewComplaint({ subject: "", description: "" });
                fetchMyComplaints();
            }
        } catch (error) {
            console.error("Failed to post complaint", error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <div className="h-10 w-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/30">
                        <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    Complaints & Grievances
                </h1>
                <p className="text-muted-foreground mt-1 ml-14">Manage employee concerns and raise your own.</p>
            </div>

            <Tabs defaultValue="employee-complaints" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-slate-100">
                    <TabsTrigger value="employee-complaints">Employee Complaints</TabsTrigger>
                    <TabsTrigger value="my-complaints">My Complaints</TabsTrigger>
                </TabsList>

                {/* --- EMPLOYEE COMPLAINTS TAB --- */}
                <TabsContent value="employee-complaints" className="space-y-6 mt-6">
                    {/* FILTERS */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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
                                className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                                        {empLoading ? (
                                            <tr><td colSpan={6} className="h-24 text-center text-muted-foreground">Loading...</td></tr>
                                        ) : employeeComplaints.length === 0 ? (
                                            <tr><td colSpan={6} className="h-24 text-center text-muted-foreground">No complaints found.</td></tr>
                                        ) : (
                                            employeeComplaints.map((complaint) => (
                                                <tr key={complaint._id} className="border-b transition-colors hover:bg-slate-50/50">
                                                    <td className="p-4 align-middle font-medium">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{complaint.userName}</span>
                                                            <span className="text-xs text-muted-foreground">{complaint.userId}</span>
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
                                                        {complaint.department || 'N/A'}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Badge variant={
                                                            complaint.status === "Resolved" ? "success" :
                                                                complaint.status === "Investigating" ? "warning" : "destructive"
                                                        }>
                                                            {complaint.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedComplaint(complaint);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                            className="h-10 w-10 bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/30 transition-colors active:scale-95"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-6 w-6 text-white" />
                                                        </button>
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

                {/* --- MY COMPLAINTS TAB --- */}
                <TabsContent value="my-complaints" className="space-y-6 mt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                My Complaints
                            </h2>
                            <p className="text-muted-foreground">
                                History of complaints raised by you.
                            </p>
                        </div>
                        <Dialog open={isRaiseDialogOpen} onOpenChange={setIsRaiseDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-destructive text-white shadow-lg shadow-destructive/30 hover:bg-destructive/90 hover:scale-105 active:scale-95 transition-all duration-300">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Raise Complaint
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-destructive">
                                        <AlertCircle className="h-5 w-5" />
                                        New Grievance
                                    </DialogTitle>
                                    <DialogDescription>
                                        Please provide detailed information to help us resolve your issue efficiently.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-3">
                                        <Label className="text-base">Subject</Label>
                                        <Input
                                            placeholder="Short summary of the issue"
                                            className="h-11"
                                            value={newComplaint.subject}
                                            onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-base">Detailed Description</Label>
                                        <TextareaSimple
                                            placeholder="Please describe the incident, including dates, times, and any relevant details..."
                                            className="min-h-[200px] resize-none leading-relaxed"
                                            value={newComplaint.description}
                                            onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Your complaint will be handled with strict confidentiality.
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsRaiseDialogOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" className="px-8 shadow-sm" onClick={handlePostComplaint}>Submit Complaint</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-6">
                        {myLoading ? (
                            <p>Loading...</p>
                        ) : myComplaints.length === 0 ? (
                            <Card className="text-center py-16 border-dashed border-2 bg-muted/10">
                                <CardContent>
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">No complaints filed</h3>
                                    <p className="text-muted-foreground mt-1 max-w-sm mx-auto">You haven't raised any complaints yet.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            myComplaints.map(complaint => {
                                const isResolved = complaint.status === "Resolved";
                                const isInvestigating = complaint.status === "Investigating";

                                return (
                                    <Card
                                        key={complaint._id}
                                        className={cn(
                                            "group hover:-translate-y-1 transition-all duration-300 border-l-4",
                                            isResolved
                                                ? "bg-green-50/50 border-l-green-500 shadow-lg shadow-green-500/10 hover:shadow-green-500/20"
                                                : isInvestigating
                                                    ? "bg-orange-50/50 border-l-orange-500 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20"
                                                    : "bg-red-50/50 border-l-red-500 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
                                        )}
                                    >
                                        <CardHeader className="pb-3 md:flex-row md:items-start md:justify-between gap-4">
                                            <div className="space-y-3 flex-1">
                                                <CardTitle className={cn(
                                                    "text-lg font-bold flex items-center gap-2",
                                                    isResolved ? "text-green-700" : isInvestigating ? "text-orange-700" : "text-red-700"
                                                )}>
                                                    {isResolved ? <CheckCircle className="h-5 w-5" /> : isInvestigating ? <Clock className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                                    {complaint.subject}
                                                </CardTitle>

                                                <div className={cn(
                                                    "p-3 rounded-md text-sm font-medium",
                                                    isResolved ? "bg-green-100/50 text-green-800" : isInvestigating ? "bg-orange-100/50 text-orange-800" : "bg-red-100/50 text-red-800"
                                                )}>
                                                    <p className="leading-relaxed mb-2 max-h-20 overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-200">{complaint.description}</p>
                                                    <div className={cn(
                                                        "flex items-center gap-2 text-xs",
                                                        isResolved ? "text-green-600" : isInvestigating ? "text-orange-600" : "text-red-600"
                                                    )}>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(complaint.date), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={
                                                isResolved ? "success" : isInvestigating ? "warning" : "destructive"
                                            } className={cn("uppercase text-[10px] tracking-wider px-2 py-0.5 h-6 shrink-0", isInvestigating && "bg-orange-500 hover:bg-orange-600 text-white border-transparent")}>
                                                {complaint.status}
                                            </Badge>
                                        </CardHeader>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* DETAILS WRAPPER FOR EMPLOYEE COMPLAINTS */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Complaint Details</DialogTitle>
                        <DialogDescription>Review and update status.</DialogDescription>
                    </DialogHeader>
                    {selectedComplaint && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 pb-4 border-b">
                                <span className="text-xl font-bold">{selectedComplaint.subject}</span>
                                <span className="text-sm text-muted-foreground">Raised by {selectedComplaint.userName} • {selectedComplaint.department}</span>
                                <span className="text-xs text-muted-foreground">{new Date(selectedComplaint.date).toLocaleString()}</span>
                            </div>

                            <div className="p-4 rounded-md bg-slate-50 text-sm leading-relaxed max-h-[150px] overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-200">
                                {selectedComplaint.description}
                            </div>

                            <div className="space-y-2">
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
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
