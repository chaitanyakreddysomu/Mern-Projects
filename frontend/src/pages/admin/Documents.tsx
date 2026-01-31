import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    FileCheck,
    Search,
    Eye,
    CheckCircle,
    XCircle,
    FileText,
    Clock,


    BookOpen,
    GraduationCap,
    Briefcase,
    IdCard,
    CreditCard,
    FileBadge,
    Image as ImageIcon,
    AlertCircle,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ======================
   TYPES
   ====================== */
interface Employee {
    id: string;
    name: string;
    department: string;
    designation: string;
    profileImage?: string;
    avatar?: string;
    // status: "Active" | "Inactive"; // Not returned by API yet
    uploads: number;
    pending: number;
    verified: number;
    rejected: number;
}

type DocCategory = "Government" | "Educational" | "Personal" | "Experience";
type DocStatus = "Verified" | "Rejected" | "Pending" | "Review";

interface DocItem {
    id: string;
    name: string;
    category: DocCategory;
    status: DocStatus;
    uploadedOn: string;
    path: string;
    rejectionReason?: string;
    size?: string;
}

const DOC_ICONS: Record<string, any> = {
    "Aadhaar Card": IdCard,
    "PAN Card": CreditCard,
    "Passport": FileBadge,
    "10th Certificate": BookOpen,
    "12th Certificate": BookOpen,
    "Degree Certificate": GraduationCap,
    "Photo": ImageIcon,
    "Resume": FileText,
    "Offer Letter": Briefcase,
};

export default function AdminDocuments() {
    const [searchTerm, setSearchTerm] = useState("");
    const [docStatusFilter, setDocStatusFilter] = useState("All");
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, rejected: 0 });
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                search: searchTerm,
                status: docStatusFilter,
                page: currentPage.toString(),
                limit: '10'
            });
            const response = await apiFetch(`/api/admin/documents?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEmployees(data.employees);
                setStats(data.stats);
                if (data.pagination) {
                    setTotalPages(data.pagination.pages);
                    setTotalRecords(data.pagination.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, docStatusFilter]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDocuments();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, docStatusFilter, currentPage]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <FileCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employee Documents</h1>
                    </div>
                </div>

            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Uploads" value={stats.total.toString()} color="violet" icon={FileText} />
                <StatCard title="Verified" value={stats.verified.toString()} color="green" icon={CheckCircle} />
                <StatCard title="Pending Review" value={stats.pending.toString()} color="blue" icon={Clock} />
                <StatCard title="Rejected" value={stats.rejected.toString()} subtitle="Action Required" color="orange" icon={AlertCircle} />
            </div>

            {/* Main Table */}
            <Card className="border shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                    <div className="flex items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                className="pl-10 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Select value={docStatusFilter} onValueChange={setDocStatusFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Status</SelectItem>
                                    <SelectItem value="Pending">Pending Review</SelectItem>
                                    <SelectItem value="Verified">Fully Verified</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Employee</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Uploads</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell>
                                </TableRow>
                            ) : employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No employees found.</TableCell>
                                </TableRow>
                            ) : (
                                employees.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-slate-50/50">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage className="object-cover" src={emp.profileImage || emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}&background=random`} />
                                                    <AvatarFallback>{(emp.name || '?').charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-800">{emp.name}</span>
                                                    <span className="text-xs text-muted-foreground">{emp.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{emp.designation}</span>
                                                <span className="text-xs text-muted-foreground">{emp.department}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-100">{emp.uploads} Files</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {emp.pending > 0 ? (
                                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">{emp.pending} Pending</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">All Verified</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button size="icon" onClick={() => setSelectedEmp(emp)} className="h-8 w-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-md shadow-violet-600/20">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-4 py-4 border-t bg-slate-50/50">
                        <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-medium min-w-[3rem] text-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Document Details Dialog */}
            <DocumentReviewDialog
                employee={selectedEmp}
                open={!!selectedEmp}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedEmp(null);
                        fetchDocuments(); // Refresh stats on close
                    }
                }}
            />
        </div>
    );
}

function StatCard({ title, value, subtitle, color, icon: Icon }: { title: string; value: string; subtitle?: string; color: "violet" | "green" | "orange" | "blue"; icon: LucideIcon }) {
    const styles = {
        violet: { border: "border-l-violet-500", text: "text-violet-600", bg: "bg-violet-50/50", iconBg: "bg-violet-500 shadow-violet-200" },
        green: { border: "border-l-green-500", text: "text-green-600", bg: "bg-green-50/50", iconBg: "bg-green-600 shadow-green-200" },
        orange: { border: "border-l-orange-500", text: "text-orange-600", bg: "bg-orange-50/50", iconBg: "bg-orange-500 shadow-orange-200" },
        blue: { border: "border-l-blue-500", text: "text-blue-600", bg: "bg-blue-50/50", iconBg: "bg-blue-500 shadow-blue-200" },
    };
    const currentStyle = styles[color];
    return (
        <Card className={`group border-l-4 shadow-sm hover:shadow-md transition-all ${currentStyle.bg} ${currentStyle.border}`}>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <CardTitle className={`text-xs font-bold uppercase tracking-wider mb-2 ${currentStyle.text}`}>{title}</CardTitle>
                    <div className="text-2xl font-bold text-slate-800 tracking-tight">{value}</div>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>}
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${currentStyle.iconBg}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function DocumentReviewDialog({ employee, open, onOpenChange }: { employee: Employee | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [activeTab, setActiveTab] = useState<DocCategory>("Government");
    const [docs, setDocs] = useState<Record<string, DocItem[]>>({ government: [], educational: [], personal: [], experience: [] });
    const [loading, setLoading] = useState(false);

    // Rejection State
    const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const fetchEmployeeDocs = async () => {
        if (!employee) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/admin/documents/${employee.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data: DocItem[] = await res.json();
                // Categorize
                setDocs({
                    government: data.filter(d => d.category === 'Government'),
                    educational: data.filter(d => d.category === 'Educational'),
                    personal: data.filter(d => d.category === 'Personal'),
                    experience: data.filter(d => d.category === 'Experience')
                });
            }
        } catch (error) {
            console.error("Failed to fetch employee docs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && employee) {
            fetchEmployeeDocs();
        }
    }, [open, employee]);

    const updateStatus = async (docId: string, status: DocStatus, reason?: string) => {
        if (!employee) return;
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/admin/documents/${employee.id}/${docId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, reason })
            });

            if (res.ok) {
                // Update local state
                const categoryKey = activeTab.toLowerCase();
                setDocs(prev => ({
                    ...prev,
                    [categoryKey]: (prev as any)[categoryKey]?.map((d: DocItem) => d.id === docId ? { ...d, status, rejectionReason: reason } : d)
                }));
                // Close rejection dialog if open
                setRejectingDocId(null);
                setRejectionReason("");
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    const handlePreview = async (path: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/admin/document-preview?path=${encodeURIComponent(path)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                window.open(data.url, '_blank');
            } else {
                alert("Failed to get preview URL");
            }
        } catch (error) {
            console.error("Preview error", error);
        }
    };

    const handleRejectClick = (docId: string) => {
        setRejectingDocId(docId);
        setRejectionReason("");
    };

    if (!employee) return null;

    const currentTabDocs = (docs as any)[activeTab.toLowerCase()] || [];
    const TABS: DocCategory[] = ["Government", "Educational", "Personal", "Experience"];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle className="flex flex-col gap-1">
                        <span className="text-2xl font-bold flex items-center gap-2">Review Documents</span>
                        <div className="flex items-center gap-2 text-base font-normal text-muted-foreground mt-1">
                            <span className="font-semibold text-slate-800">{employee.name}</span>
                            <span>•</span>
                            <span>{employee.id}</span>
                            <span>•</span>
                            <span>{employee.department}</span>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Review uploaded documents for {employee.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* TAB SWITCHER */}
                    <div className="relative grid grid-cols-4 w-full bg-slate-100 rounded-xl p-1 select-none">
                        <span className={cn("absolute inset-1 w-[calc(25%-0.25rem)] rounded-lg bg-green-500 shadow-md transition-all duration-300 ease-in-out", activeTab === "Government" && "translate-x-0", activeTab === "Educational" && "translate-x-full", activeTab === "Personal" && "translate-x-[200%]", activeTab === "Experience" && "translate-x-[300%]")} />
                        {TABS.map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("relative z-10 w-full py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2", activeTab === tab ? "text-white" : "text-slate-600 hover:text-slate-900")}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* DOCUMENTS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">
                        {loading ? (
                            <div className="col-span-2 flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
                        ) : currentTabDocs.length === 0 ? (
                            <div className="col-span-2 flex flex-col items-center justify-center p-12 text-muted-foreground bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                <FileText className="h-12 w-12 opacity-20 mb-3" />
                                <p>No documents uploaded in this category.</p>
                            </div>
                        ) : (
                            currentTabDocs.map((doc: DocItem) => {
                                const DocIcon = DOC_ICONS[doc.name] || FileText;
                                return (
                                    <Card key={doc.id} className="overflow-hidden border shadow-sm group hover:shadow-md transition-all">
                                        <CardHeader className="flex flex-row items-start justify-between bg-slate-50/50 pb-3 border-b">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-white border rounded-lg flex items-center justify-center text-slate-600 shadow-sm"><DocIcon className="h-5 w-5" /></div>
                                                <div>
                                                    <CardTitle className="text-base font-semibold text-slate-800">{doc.name}</CardTitle>
                                                    <CardDescription className="text-xs mt-0.5">Uploaded: {doc.uploadedOn ? new Date(doc.uploadedOn).toLocaleDateString() : 'N/A'}</CardDescription>
                                                </div>
                                            </div>
                                            <Badge className={cn("capitalize shadow-none", doc.status === "Verified" && "bg-green-100 text-green-700", doc.status === "Rejected" && "bg-red-100 text-red-700", doc.status === "Review" && "bg-amber-100 text-amber-700")}>
                                                {doc.status === "Review" ? "Pending Review" : doc.status}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            {/* Preview/Icon Area */}
                                            <div className="rounded-lg bg-slate-100 border-2 border-dashed border-slate-200 aspect-[3/1] flex items-center justify-center relative overflow-hidden group-hover:border-indigo-200 transition-colors">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <FileText className="h-8 w-8" />
                                                    <span className="text-xs font-medium">{doc.size || 'Unknown Size'}</span>
                                                </div>
                                            </div>

                                            {doc.status === 'Rejected' && doc.rejectionReason && (
                                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 italic">
                                                    Reason: {doc.rejectionReason}
                                                </div>
                                            )}

                                            <div className="space-y-2 pt-2">
                                                <Button size="sm" variant="outline" onClick={() => handlePreview(doc.path)} className="h-8 gap-1 w-full bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                                                    <Eye className="h-3.5 w-3.5" /> Preview
                                                </Button>

                                                <div className="grid grid-cols-2 gap-2">
                                                    {doc.status === "Review" || doc.status === "Pending" ? (
                                                        <>
                                                            <Button onClick={() => updateStatus(doc.id, "Verified")} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                                                                <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                                            </Button>
                                                            <Button onClick={() => handleRejectClick(doc.id)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9">
                                                                <XCircle className="h-4 w-4 mr-2" /> Reject
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" className="col-span-2 text-muted-foreground h-9" disabled>
                                                            {doc.status === "Verified" ? (
                                                                <span className="flex items-center gap-2 text-emerald-600"><CheckCircle className="h-4 w-4" /> Approved</span>
                                                            ) : (
                                                                <span className="flex items-center gap-2 text-red-600"><XCircle className="h-4 w-4" /> Rejected</span>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>

                {/* Rejection Reason Dialog */}
                <Dialog open={!!rejectingDocId} onOpenChange={(open) => !open && setRejectingDocId(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Reject Document</DialogTitle>
                            <DialogDescription>Please provide a reason for rejecting this document. This will be visible to the employee.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="reason">Rejection Reason</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="e.g. Image not clear, wrong document..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectingDocId(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => rejectingDocId && updateStatus(rejectingDocId, "Rejected", rejectionReason)} disabled={!rejectionReason.trim()}>
                                Confirm Rejection
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </DialogContent>
        </Dialog>
    );
}
