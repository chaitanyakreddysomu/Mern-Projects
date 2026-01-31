import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    CreditCard,
    Search,
    Download,
    Building2,

    Users,
    Clock,
    AlertCircle,
    type LucideIcon,
    Loader2
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminBankDetails() {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [employees, setEmployees] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        bankAccountsAdded: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [loading, setLoading] = useState(true);

    const fetchBankDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10'
            });

            if (searchTerm) params.append('search', searchTerm);
            if (roleFilter !== 'ALL') params.append('role', roleFilter);
            if (statusFilter !== 'ALL') params.append('status', statusFilter);

            const res = await apiFetch(`/api/admin/employee-bank-details?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees);
                setStats(data.stats);
                if (data.pagination) {
                    setTotalPages(data.pagination.pages);
                    setTotalRecords(data.pagination.total);
                }
            }
        } catch (error) {
            console.error("Failed to fetch bank details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBankDetails();
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, roleFilter, statusFilter]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, statusFilter]);

    const pendingVerification = 0; // Mock until backend supports it
    const missingDetails = stats.totalEmployees - stats.bankAccountsAdded;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Bank Details</h1>
                    <p className="text-muted-foreground mt-1">View and manage employee bank accounts and PF details.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees.toString()}
                    color="violet"
                    icon={Users}
                />
                <StatCard
                    title="Bank Accounts Added"
                    value={stats.bankAccountsAdded.toString()}
                    color="green"
                    icon={CreditCard}
                />
                <StatCard
                    title="Pending Verification"
                    value={pendingVerification.toString()}
                    color="orange"
                    icon={Clock}
                />
                <StatCard
                    title="Missing Details"
                    value={missingDetails.toString()}
                    color="red"
                    icon={AlertCircle}
                />
            </div>

            <Card className="border-t-4 border-t-purple-600 shadow-lg">
                <CardHeader className="px-6 py-4 border-b bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Employee Accounts
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px] bg-white">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="ADDED">Bank Details Added</SelectItem>
                                    <SelectItem value="NOT_ADDED">Bank Details Not Added</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[130px] bg-white">
                                    <SelectValue placeholder="Filter Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Roles</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search employees or banks..."
                                    className="pl-8 bg-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Account Details</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Bank Name</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Branch & IFSC</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                                Loading details...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">No bank details found.</TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp) => (
                                        <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage className="object-cover" src={emp.profileImage || emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}&background=random`} />
                                                        <AvatarFallback>{(emp.name || '?').charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900">{emp.name}</span>
                                                        <span className="text-xs text-muted-foreground">{emp.id} • {emp.designation}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`
                                                ${emp.role === 'HR' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                        'bg-blue-100 text-blue-700 border-blue-200'}
                                            `}>
                                                    {emp.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-1">
                                                    {emp.bankDetails?.accountNumber ? (
                                                        <>
                                                            <span className="text-xs uppercase text-muted-foreground">A/C No.</span>
                                                            <span className="font-mono text-sm">{emp.bankDetails.accountNumber}</span>
                                                            <span className="text-xs text-muted-foreground">Holder: {emp.bankDetails.holderName}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">No details</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-purple-500" />
                                                    <span className="font-medium">{emp.bankDetails?.bankName || 'Not Added'}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col space-y-1">
                                                    {emp.bankDetails?.branch ? (
                                                        <>
                                                            <span className="text-sm font-medium">{emp.bankDetails.branch}</span>
                                                            <Badge variant="outline" className="w-fit font-mono text-xs bg-slate-50">
                                                                {emp.bankDetails.ifsc}
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )))}
                            </TableBody>
                        </Table>
                    </div>

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
