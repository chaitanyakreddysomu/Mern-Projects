import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
    Wallet,
    CreditCard,
    Banknote,
    Calendar,
    Eye,
    PlusCircle,
    Search,
    FileText,
    Edit,
    CheckCircle2,
    DollarSign,
    Download,
    Trash2,
    FileCheck,
    type LucideIcon
} from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import icsLogo from "@/assets/ics_logo.jpeg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- TYPES ---
type PayslipStatus = "Draft" | "Created" | "Paid";

interface EmployeePayslip {
    id: string;
    empId: string;
    name: string;
    month: string;
    year: string;
    netPay: number;
    status: PayslipStatus;
    generatedOn: string;
    // Details for Edit/View
    basicSalary?: number;
    pf?: number;
    esi?: number;
    pt?: number;
    tds?: number;
    leavesTaken?: number;
    leaveDeduction?: number;
    totalWorkingDays?: number;
    paidDays?: number;
    startDate?: string;
    endDate?: string;
    profileImage?: string;
    avatar?: string;
}

// --- MOCK DATA ---
// --- MOCK DATA ---
// const MOCK_EMPLOYEE_PAYSLIPS: EmployeePayslip[] = [
//     {
//         id: "P101", empId: "EMP001", name: "John Doe", month: "October", year: "2023", netPay: 85000, status: "Paid", generatedOn: "2023-10-31",
//         basicSalary: 90000, pf: 1800, pt: 200, tds: 3000, totalWorkingDays: 31, paidDays: 31, leavesTaken: 0, startDate: "2023-10-01", endDate: "2023-10-31"
//     },
//     {
//         id: "P102", empId: "EMP002", name: "Jane Smith", month: "October", year: "2023", netPay: 78000, status: "Created", generatedOn: "2023-10-31",
//         basicSalary: 82000, pf: 1800, pt: 200, tds: 2000, totalWorkingDays: 31, paidDays: 31, leavesTaken: 0, startDate: "2023-10-01", endDate: "2023-10-31"
//     },
//     {
//         id: "P103", empId: "EMP003", name: "Robert Fox", month: "October", year: "2023", netPay: 92000, status: "Draft", generatedOn: "2023-10-31",
//         basicSalary: 98000, pf: 1800, pt: 200, tds: 4000, totalWorkingDays: 31, paidDays: 31, leavesTaken: 0, startDate: "2023-10-01", endDate: "2023-10-31"
//     },
// ];



const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2023", "2024", "2025", "2026"];

export default function AdminPayslips() {
    // --- STATE ---
    const [payslips, setPayslips] = useState<EmployeePayslip[]>([]);
    const [employees, setEmployees] = useState<any[]>([]); // For dropdown
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(true); // Added table loading state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null); // Track editing state
    const [showPreview, setShowPreview] = useState(false);
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterMonth, setFilterMonth] = useState("All");
    const [filterYear, setFilterYear] = useState("All");


    const [pdfData, setPdfData] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        employee: "John Doe (EMP001)",
        month: "November",
        year: "2023",
        status: "Draft" as PayslipStatus,
        startDate: "",
        endDate: "",
        totalWorkingDays: 30,
        paidDays: 30,
        leavesTaken: 0,
        leaveDeduction: 0,

        // Salary Details
        basicSalary: 0,
        salaryInputType: "monthly" as "monthly" | "yearly",
        yearlyPackage: 0,
        monthlyGross: 0,

        pf: 0,
        esi: 0,
        pt: 0,
        tds: 0,
    });

    const [salaryStructures, setSalaryStructures] = useState<any[]>([]); // New State

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Stats & Search State
    const [stats, setStats] = useState({ total: 0, draft: 0, created: 0, paid: 0 });
    const [searchTerm, setSearchTerm] = useState("");

    // --- EFFECTS ---
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayslips();
        }, 300);
        return () => clearTimeout(timer);
    }, [filterMonth, filterYear, filterStatus, currentPage, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterMonth, filterYear, filterStatus, searchTerm]);

    useEffect(() => {
        // fetchEmployees(); // Already called in main useEffect
        fetchEmployees();
        fetchSalaryStructures();
    }, []);

    const fetchSalaryStructures = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/admin/salary-structures', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSalaryStructures(await res.json());
        } catch (error) {
            console.error("Fetch Structures Error", error);
        }
    };

    // Updated fetchSalaryDetails to accept structureId
    const fetchSalaryDetails = async (empId: string, structureId?: string) => {
        try {
            const token = localStorage.getItem('token');
            // Append structureId if provided
            const url = `/api/admin/salary-structures/calculate/${empId}${structureId ? `?structureId=${structureId}` : ''}`;
            const res = await apiFetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const pf = data.deductions.find((d: any) => /PF|Provident/i.test(d.label))?.amount || 0;
                const esi = data.deductions.find((d: any) => /ESI/i.test(d.label))?.amount || 0;
                const pt = data.deductions.find((d: any) => /PT|Professional/i.test(d.label))?.amount || 0;
                const tds = data.deductions.find((d: any) => /TDS|Tax/i.test(d.label) && !/Professional/i.test(d.label))?.amount || 0;

                setFormData(prev => ({
                    ...prev,
                    basicSalary: data.basicSalary,
                    pf,
                    esi,
                    pt,
                    tds
                }));
            }
        } catch (error) {
            console.error("Auto-fetch salary error", error);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Trigger fetch if Employee or Structure changes
            if (field === 'employee' || field === 'selectedStructure') {
                const empId = (field === 'employee' ? value : updated.employee)?.split('(')[1]?.replace(')', '');
                const structId = field === 'selectedStructure' ? value : (updated as any).selectedStructure;

                if (empId) fetchSalaryDetails(empId, structId);
            }
            return updated;
        });
    };

    const fetchPayslips = async () => {
        setTableLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Build Query Params including Pagination & Filters & Search
            const query = new URLSearchParams();
            if (searchTerm) query.append('search', searchTerm);
            if (filterMonth && filterMonth !== 'All') query.append('month', filterMonth);
            if (filterYear && filterYear !== 'All') query.append('year', filterYear);
            if (filterStatus && filterStatus !== 'All') query.append('status', filterStatus);
            query.append('page', currentPage.toString());
            query.append('limit', '10');

            const res = await apiFetch(`/api/admin/payslips?${query.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.payslips) {
                    setPayslips(data.payslips.map((d: any) => ({ ...d, id: d._id })));

                    if (data.pagination) {
                        setTotalPages(data.pagination.pages);
                        setTotalRecords(data.pagination.total);

                        // Extract Stats from Pagination
                        setStats({
                            total: data.pagination.totalAll || 0,
                            draft: data.pagination.drafts || 0,
                            created: data.pagination.created || 0,
                            paid: data.pagination.paid || 0
                        });
                    }
                } else if (Array.isArray(data)) {
                    // Fallback for legacy
                    setPayslips(data.map((d: any) => ({ ...d, id: d._id })));
                } else {
                    setPayslips([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch payslips", error);
        } finally {
            setTableLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/admin/employees?role=EMPLOYEE,HR&status=Active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees || (Array.isArray(data) ? data : []));
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    // 1. Auto-set Date Range & Total Days based on Month/Year
    useEffect(() => {
        const monthIndex = MONTHS.indexOf(formData.month);
        const year = parseInt(formData.year);

        if (monthIndex !== -1 && !isNaN(year)) {
            const firstDay = new Date(year, monthIndex, 1);
            const lastDay = new Date(year, monthIndex + 1, 0);
            const daysInMonth = lastDay.getDate();

            // Format YYYY-MM-DD
            const formatDate = (d: Date) => d.toISOString().split('T')[0];

            setFormData(prev => ({
                ...prev,
                startDate: formatDate(firstDay),
                endDate: formatDate(lastDay),
                totalWorkingDays: daysInMonth,
                paidDays: daysInMonth - (prev.leavesTaken || 0),
            }));
        }
    }, [formData.month, formData.year, formData.employee]);



    // 2. Auto-calculate Paid Days & Leave Deduction
    useEffect(() => {
        const leaves = formData.leavesTaken || 0;
        const totalDays = formData.totalWorkingDays || 30;
        const basic = formData.basicSalary || 0;

        const calculatedPaidDays = Math.max(0, totalDays - leaves);

        // Deduction formula: (Basic / TotalDays) * Leaves
        const calculatedDeduction = totalDays > 0 ? Math.round((basic / totalDays) * leaves) : 0;

        setFormData(prev => {
            // Only update if changed to avoid loop
            if (prev.paidDays === calculatedPaidDays && prev.leaveDeduction === calculatedDeduction) return prev;
            return {
                ...prev,
                paidDays: calculatedPaidDays,
                leaveDeduction: calculatedDeduction
            };
        });
    }, [formData.leavesTaken, formData.totalWorkingDays, formData.basicSalary]);

    // --- CALCULATIONS ---

    const grossEarnings = formData.basicSalary;
    const totalDeductions = (formData.pf || 0) + (formData.esi || 0) + (formData.pt || 0) + (formData.tds || 0) + (formData.leaveDeduction || 0);
    const netPay = grossEarnings - totalDeductions;

    // --- HANDLERS ---
    const handleCreate = async () => {
        setLoading(true);
        const slipData = {
            empId: formData.employee.split('(')[1].replace(')', ''),
            name: formData.employee.split('(')[0].trim(),
            month: formData.month,
            year: formData.year,
            netPay: netPay,
            status: formData.status,
            basicSalary: formData.basicSalary,
            pf: formData.pf,
            esi: formData.esi,
            pt: formData.pt,
            tds: formData.tds,
            leavesTaken: formData.leavesTaken,
            leaveDeduction: formData.leaveDeduction,
            totalWorkingDays: formData.totalWorkingDays,
            paidDays: formData.paidDays,
            startDate: formData.startDate,
            endDate: formData.endDate
        };

        try {
            const token = localStorage.getItem('token');
            let res;

            if (editingId) {
                res = await apiFetch(`/api/admin/payslips/${editingId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(slipData)
                });
            } else {
                res = await apiFetch(`/api/admin/payslips`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(slipData)
                });
            }

            if (res.ok) {
                await fetchPayslips(); // Refresh list
                resetForm();
            } else {
                alert("Failed to save payslip");
            }
        } catch (error) {
            console.error("Save error", error);
            alert("Error saving payslip");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setIsCreateDialogOpen(false);
        setEditingId(null);
        setShowPreview(false);
        setFormData(prev => ({
            ...prev,
            employee: "John Doe (EMP001)", // Reset default?
            basicSalary: 0, pf: 0, esi: 0, pt: 0, tds: 0, leavesTaken: 0, leaveDeduction: 0,
            status: "Draft"
        }));
    };

    const handleEdit = (slip: EmployeePayslip) => {
        setEditingId(slip.id);
        const fullName = `${slip.name} (${slip.empId})`;
        setFormData(prev => ({
            ...prev,
            employee: fullName,
            month: slip.month,
            year: slip.year,
            status: slip.status,
            basicSalary: slip.basicSalary || 0,
            pf: slip.pf || 0,
            esi: slip.esi || 0,
            pt: slip.pt || 0,
            tds: slip.tds || 0,
            leavesTaken: slip.leavesTaken || 0,
            leaveDeduction: slip.leaveDeduction || 0,
            totalWorkingDays: slip.totalWorkingDays || 30,
            paidDays: slip.paidDays || 30,
            startDate: slip.startDate || "",
            endDate: slip.endDate || ""
        }));
        setIsCreateDialogOpen(true);
        setShowPreview(false);
    }

    const handleView = (slip: EmployeePayslip) => {
        handleEdit(slip); // Load data
        setShowPreview(true); // Switch to preview
    }

    const handleDownload = async (slip: EmployeePayslip) => {
        setPdfData(slip);
        // Wait for render
        setTimeout(async () => {
            const element = document.getElementById('payslip-pdf-content');
            if (element) {
                try {
                    const canvas = await html2canvas(element, { scale: 2 });
                    const data = canvas.toDataURL('image/png');
                    const pdf = new jsPDF();
                    const imgProps = pdf.getImageProperties(data);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`Payslip_${slip.name}_${slip.month}_${slip.year}.pdf`);
                } catch (e) {
                    console.error("PDF Gen Error:", e);
                }
                setPdfData(null);
            }
        }, 100);
    };

    const advanceStatus = async (id: string, currentStatus: PayslipStatus) => {
        let newStatus: PayslipStatus = currentStatus;
        if (currentStatus === "Draft") newStatus = "Created";
        else if (currentStatus === "Created") newStatus = "Paid";

        if (newStatus !== currentStatus) {
            try {
                const token = localStorage.getItem('token');
                const res = await apiFetch(`/api/admin/payslips/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    // Update local state optimizingly
                    setPayslips(payslips.map(p => p.id === id ? { ...p, status: newStatus } : p));
                }
            } catch (e) {
                console.error("Failed to update status", e);
            }
        }
    };

    const deletePayslip = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payslip?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/admin/payslips/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setPayslips(payslips.filter(p => p.id !== id));
            } else {
                alert("Failed to delete payslip");
            }
        } catch (error) {
            console.error("Delete error", error);
            alert("Error deleting payslip");
        }
    };

    // Backend handles filtering & sorting
    const filteredEmployeePayslips = payslips;

    const numberToWords = (num: number): string => {
        if (num === 0) return "Zero Rupees Only";

        const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
        const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        const convertLessThanOneThousand = (n: number): string => {
            if (n === 0) return "";
            if (n < 10) return units[n];
            if (n < 20) return teens[n - 10];
            const digit = n % 10;
            return tens[Math.floor(n / 10)] + (digit ? " " + units[digit] : "");
        };

        const convert = (n: number): string => {
            if (n === 0) return "";
            if (n < 100) return convertLessThanOneThousand(n);
            if (n < 1000) {
                return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
            }
            if (n < 100000) {
                return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
            }
            if (n < 10000000) {
                return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
            }
            return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
        };

        return "Rupees " + convert(num) + " Only";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/30">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                    Payslips Management
                </h1>
                <p className="text-muted-foreground mt-1 ml-14">Manage employee salaries and view your own payslips.</p>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Payslips"
                    value={stats.total.toString()}
                    color="violet"
                    icon={Wallet}
                />
                <StatCard
                    title="Drafts"
                    value={stats.draft.toString()}
                    color="orange"
                    icon={FileText}
                />
                <StatCard
                    title="Created"
                    value={stats.created.toString()}
                    color="blue"
                    icon={CheckCircle2}
                />
                <StatCard
                    title="Paid"
                    value={stats.paid.toString()}
                    color="green"
                    icon={DollarSign}
                />
            </div>

            {/* --- EMPLOYEE PAYSLIPS MANAGEMENT --- */}
            <div className="space-y-6 mt-6">
                {/* ACTION BAR */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Select value={filterMonth} onValueChange={setFilterMonth}>
                            <SelectTrigger className="h-10 w-[120px] bg-background">
                                <SelectValue placeholder="All Months" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Months</SelectItem>
                                {MONTHS.map(m => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="h-10 w-[100px] bg-background">
                                <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Years</SelectItem>
                                {YEARS.map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-10 w-[130px] bg-background">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Status</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Created">Created</SelectItem>
                                <SelectItem value="Draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>

                        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                            setIsCreateDialogOpen(open);
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Payslip
                                </Button>
                            </DialogTrigger>
                            <DialogContent className={`sm:max-w-4xl max-h-[90vh] overflow-y-auto ${showPreview ? "sm:max-w-3xl" : ""}`}>
                                <DialogHeader>
                                    <DialogTitle>{showPreview ? "Payslip Preview" : (editingId ? "Edit Payslip" : "Generate New Payslip")}</DialogTitle>
                                    <DialogDescription>
                                        {showPreview ? "Review the detailed payslip." : "Enter details to calculate and generate a payslip."}
                                    </DialogDescription>
                                </DialogHeader>

                                {!showPreview ? (
                                    <div className="grid gap-6 py-4">
                                        {/* 1. BASIC DETAILS */}
                                        <div className="bg-slate-50 p-4 rounded-lg border">
                                            <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" /> Basic Details
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Employee <span className="text-red-500">*</span></Label>
                                                    <Select value={formData.employee} onValueChange={(val) => handleInputChange("employee", val)}>
                                                        <SelectTrigger className="h-9 w-full bg-background">
                                                            <SelectValue placeholder="Select Employee" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {employees.map(emp => (
                                                                <SelectItem key={emp.id} value={`${emp.name} (${emp.id})`}>
                                                                    {emp.name} ({emp.id})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Month <span className="text-red-500">*</span></Label>
                                                    <Select value={formData.month} onValueChange={(val) => handleInputChange("month", val)}>
                                                        <SelectTrigger className="h-9 w-full bg-background">
                                                            <SelectValue placeholder="Select Month" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {MONTHS.map(m => (
                                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Year <span className="text-red-500">*</span></Label>
                                                    <Select value={formData.year} onValueChange={(val) => handleInputChange("year", val)}>
                                                        <SelectTrigger className="h-9 w-full bg-background">
                                                            <SelectValue placeholder="Select Year" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {YEARS.map(y => (
                                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Status <span className="text-red-500">*</span></Label>
                                                    <Select value={formData.status} onValueChange={(val) => handleInputChange("status", val)}>
                                                        <SelectTrigger className="h-9 w-full bg-background">
                                                            <SelectValue placeholder="Select Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Draft">Draft</SelectItem>
                                                            <SelectItem value="Created">Created</SelectItem>
                                                            <SelectItem value="Paid">Paid</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Salary Structure</Label>
                                                    <Select value={(formData as any).selectedStructure || ""} onValueChange={(val) => handleInputChange("selectedStructure", val)}>
                                                        <SelectTrigger className="h-9 w-full bg-background">
                                                            <SelectValue placeholder="Auto (Based on Package)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="default_auto_option">Auto (Based on Package)</SelectItem>
                                                            {salaryStructures.map(struct => (
                                                                <SelectItem key={struct._id} value={struct._id}>
                                                                    {struct.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. ATTENDANCE */}
                                        <div className="p-4 rounded-lg border bg-white">
                                            <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" /> Attendance & Pay Period
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                                                    <Input type="date" className="h-9" value={formData.startDate} onChange={(e) => handleInputChange("startDate", e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">End Date</Label>
                                                    <Input type="date" className="h-9" value={formData.endDate} onChange={(e) => handleInputChange("endDate", e.target.value)} />
                                                </div>
                                                <div className="space-y-1 md:col-start-1">
                                                    <Label className="text-xs text-muted-foreground">Total Working Days</Label>
                                                    <Input type="number" className="h-9" value={formData.totalWorkingDays} onChange={(e) => handleInputChange("totalWorkingDays", parseFloat(e.target.value))} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Paid Days</Label>
                                                    <Input type="number" className="h-9 bg-slate-50" value={formData.paidDays} readOnly />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Leaves Taken</Label>
                                                    <Input
                                                        type="number"
                                                        className="h-9 border-amber-200 focus-visible:ring-amber-500/20"
                                                        value={formData.leavesTaken}
                                                        onChange={(e) => handleInputChange("leavesTaken", parseFloat(e.target.value))}
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. EARNINGS */}
                                        <div className="p-4 rounded-lg border bg-white">
                                            <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                                <Banknote className="h-4 w-4" /> Earnings
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Basic Salary</Label>
                                                    <Input type="number" className="h-9" placeholder="0.00" value={formData.basicSalary} onChange={(e) => handleInputChange("basicSalary", parseFloat(e.target.value))} />
                                                </div>
                                                {/* Keeping it simple as requested - only Basic Salary */}
                                            </div>
                                        </div>

                                        {/* 4. DEDUCTIONS */}
                                        <div className="p-4 rounded-lg border bg-white">
                                            <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" /> Deductions
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Provident Fund (PF)</Label>
                                                    <Input type="number" className="h-9" placeholder="0.00" value={formData.pf} onChange={(e) => handleInputChange("pf", parseFloat(e.target.value))} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">ESI</Label>
                                                    <Input type="number" className="h-9" placeholder="0.00" value={formData.esi} onChange={(e) => handleInputChange("esi", parseFloat(e.target.value))} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Professional Tax (PT)</Label>
                                                    <Input type="number" className="h-9" placeholder="0.00" value={formData.pt} onChange={(e) => handleInputChange("pt", parseFloat(e.target.value))} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Leave Deduction (Auto)</Label>
                                                    <Input type="number" className="h-9 bg-slate-50 text-red-600 font-medium" value={formData.leaveDeduction} readOnly />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">TDS</Label>
                                                    <Input type="number" className="h-9" placeholder="0.00" value={formData.tds} onChange={(e) => handleInputChange("tds", parseFloat(e.target.value))} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5. SUMMARY (READ ONLY) */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-md text-emerald-900">
                                                <p className="text-xs opacity-70 uppercase tracking-wider font-semibold">Gross Earnings</p>
                                                <p className="text-xl font-bold">₹ {grossEarnings.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-red-50 border border-red-100 p-3 rounded-md text-red-900">
                                                <p className="text-xs opacity-70 uppercase tracking-wider font-semibold">Total Deductions</p>
                                                <p className="text-xl font-bold">₹ {totalDeductions.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-slate-900 text-white p-3 rounded-md shadow-lg">
                                                <p className="text-xs opacity-70 uppercase tracking-wider font-semibold">Net Pay</p>
                                                <p className="text-xl font-bold">₹ {netPay.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // PREVIEW MODE
                                    <div className="py-6 px-8 border rounded-lg bg-white shadow-sm space-y-6">
                                        <div className="flex justify-between items-center border-b pb-4">
                                            <img src={icsLogo} alt="ICS Logo" className="h-16 w-auto object-contain" />
                                            <div className="text-right">
                                                <h2 className="text-2xl font-bold tracking-tight text-emerald-950">PAYSLIP</h2>
                                                <p className="text-muted-foreground uppercase text-xs tracking-[0.2em] mt-1">{formData.month} {formData.year}</p>
                                                {formData.status === 'Draft' && <Badge variant="outline" className="mt-2 text-amber-600 border-amber-300 bg-amber-50">DRAFT PREVIEW</Badge>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 text-sm">
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase">Employee Details</p>
                                                <p className="font-bold text-lg mt-1">{formData.employee.split('(')[0]}</p>
                                                <p className="text-slate-600">{formData.employee.split('(')[1].replace(')', '')}</p>
                                                <p className="text-slate-600 mt-2">Designation: Software Engineer</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground text-xs uppercase">Pay Period</p>
                                                <p className="font-medium mt-1">{formData.startDate || "-"} to {formData.endDate || "-"}</p>
                                                <div className="flex gap-4 mt-2">
                                                    <div className="bg-slate-50 px-2 py-1 rounded border text-xs">
                                                        <span className="text-slate-500">Working Days:</span> <span className="font-semibold">{formData.totalWorkingDays}</span>
                                                    </div>
                                                    <div className="bg-slate-50 px-2 py-1 rounded border text-xs">
                                                        <span className="text-slate-500">Paid Days:</span> <span className="font-semibold text-emerald-600">{formData.paidDays}</span>
                                                    </div>
                                                    <div className="bg-red-50 px-2 py-1 rounded border border-red-100 text-xs">
                                                        <span className="text-red-500">Leaves:</span> <span className="font-semibold text-red-700">{formData.leavesTaken}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-px bg-slate-200 border rounded-lg overflow-hidden mt-4">
                                            <div className="bg-white p-4">
                                                <h4 className="font-bold text-emerald-700 mb-4 border-b pb-2">Earnings</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>Basic Salary</span>
                                                        <span className="font-medium">₹ {formData.basicSalary.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 border-t font-bold text-base">
                                                        <span>Gross Earnings</span>
                                                        <span>₹ {grossEarnings.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white p-4">
                                                <h4 className="font-bold text-red-700 mb-4 border-b pb-2">Deductions</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>Provident Fund</span>
                                                        <span className="font-medium">₹ {(formData.pf || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>ESI</span>
                                                        <span className="font-medium">₹ {(formData.esi || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Professional Tax</span>
                                                        <span className="font-medium">₹ {(formData.pt || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>TDS</span>
                                                        <span className="font-medium">₹ {(formData.tds || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-red-600 font-medium bg-red-50 p-1 rounded">
                                                        <span>Leave Deduction ({formData.leavesTaken || 0} days)</span>
                                                        <span>₹ {(formData.leaveDeduction || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 border-t font-bold text-base">
                                                        <span>Total Deductions</span>
                                                        <span>₹ {totalDeductions.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-end gap-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Pay</p>
                                            <p className="text-3xl font-bold text-emerald-700">₹ {netPay.toLocaleString()}</p>
                                            <p className="text-xs text-slate-500 italic mt-1">{numberToWords(netPay)}</p>
                                        </div>
                                    </div>
                                )}

                                <DialogFooter className="gap-2 sm:gap-0">
                                    {!showPreview ? (
                                        <>
                                            <div className="mr-auto">
                                                <Button variant="outline" onClick={() => setShowPreview(true)} className="flex gap-2">
                                                    <Eye className="h-4 w-4" /> Preview
                                                </Button>
                                            </div>
                                            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                                            <Button onClick={handleCreate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                                {loading ? "Processing..." : (editingId ? "Update Payslip" : "Save & Generate")}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outline" onClick={() => setShowPreview(false)} className="mr-auto">Back to Edit</Button>
                                            <Button variant="outline" onClick={() => handleDownload({ ...formData, id: "preview", empId: "", name: formData.employee.split('(')[0].trim(), generatedOn: "", netPay: 0 } as any)} className="gap-2">
                                                <Download className="h-4 w-4" /> Download PDF
                                            </Button>
                                            <Button onClick={handleCreate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                                {loading ? "Processing..." : (editingId ? "Update" : "Confirm & Generate")}
                                            </Button>
                                        </>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card className="shadow-md border-none">
                    <CardHeader className="bg-emerald-50/50 border-b">
                        <CardTitle className="text-emerald-800">Generated Payslips</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b bg-slate-50">
                                    <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Employee</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Period</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Leaves</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Lea. Ded.</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Net Pay</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Generated On</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {tableLoading ? (
                                        <tr>
                                            <td colSpan={8} className="h-24 text-center">
                                                <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                    Loading payslips...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredEmployeePayslips.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="h-24 text-center text-muted-foreground">
                                                No payslips found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployeePayslips.map((slip) => (
                                            <tr key={slip.id} className="border-b transition-colors hover:bg-slate-50/50 group">
                                                <td className="p-4 align-middle font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage className="object-cover" src={slip.profileImage || slip.avatar || `https://ui-avatars.com/api/?name=${slip.name}&background=random`} />
                                                            <AvatarFallback>{slip.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{slip.name}</span>
                                                            <span className="text-xs text-muted-foreground">{slip.empId}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {slip.month} {slip.year}
                                                </td>
                                                <td className="p-4 align-middle px-4">
                                                    <span className={cn(slip.leavesTaken && slip.leavesTaken > 0 ? "text-red-600 font-medium" : "text-muted-foreground")}>
                                                        {slip.leavesTaken || 0}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle px-4">
                                                    <span className={cn(slip.leaveDeduction && slip.leaveDeduction > 0 ? "text-red-600 font-medium" : "text-muted-foreground")}>
                                                        ₹ {(slip.leaveDeduction || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle px-4 font-semibold text-slate-700">
                                                    ₹ {slip.netPay.toLocaleString()}
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {new Date(slip.generatedOn).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant="outline"
                                                        className={cn(
                                                            "font-normal",
                                                            slip.status === "Paid" && "bg-green-100 text-green-700 border-green-200",
                                                            slip.status === "Created" && "bg-blue-100 text-blue-700 border-blue-200",
                                                            slip.status === "Draft" && "bg-amber-100 text-amber-700 border-amber-200"
                                                        )}
                                                    >
                                                        {slip.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex justify-end gap-1 items-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                                            title="View"
                                                            onClick={() => handleView(slip)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Edit"
                                                            onClick={() => handleEdit(slip)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>

                                                        <div className="w-px h-4 bg-slate-300 mx-1"></div>

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className={cn(
                                                                "h-8 w-8",
                                                                slip.status === "Draft" && "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
                                                                slip.status === "Created" && "text-amber-600 hover:text-emerald-700 hover:bg-emerald-50",
                                                                slip.status === "Paid" && "text-emerald-600 bg-emerald-50 cursor-default hover:bg-emerald-50"
                                                            )}
                                                            onClick={() => advanceStatus(slip.id, slip.status)}
                                                            disabled={slip.status === "Paid"}
                                                            title={
                                                                slip.status === "Draft" ? "Finalize & Create" :
                                                                    slip.status === "Created" ? "Mark as Paid" : "Paid"
                                                            }
                                                        >
                                                            {slip.status === "Draft" && <FileCheck className="h-4 w-4" />}
                                                            {slip.status === "Created" && <DollarSign className="h-4 w-4" />}
                                                            {slip.status === "Paid" && <CheckCircle2 className="h-4 w-4" />}
                                                        </Button>

                                                        {slip.status !== "Draft" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 ml-1"
                                                                title="Download PDF"
                                                                onClick={() => handleDownload(slip)}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        <Button variant="ghost" size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1"
                                                            title="Delete"
                                                            onClick={() => deletePayslip(slip.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )))}
                                </tbody>
                            </table>
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

            {/* HIDDEN PDF TEMPLATE */}
            {pdfData && (
                <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                    <div id="payslip-pdf-content" className="w-[800px] p-8 bg-white text-slate-900 border" style={{ fontFamily: "sans-serif" }}>
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-slate-300 pb-6 mb-6">
                            <img src={icsLogo} alt="ICS Logo" className="h-20 w-auto object-contain" />
                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-emerald-950">PAYSLIP</h2>
                                <p className="text-slate-500 uppercase text-sm tracking-[0.2em] mt-1">{pdfData.month} {pdfData.year}</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-8 text-sm mb-6">
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Employee Details</p>
                                <p className="font-bold text-xl text-slate-900">{pdfData.name}</p>
                                <p className="text-slate-600 font-medium">{pdfData.empId}</p>
                                <p className="text-slate-600 mt-2">Designation: Software Engineer</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Pay Period</p>
                                <p className="font-medium text-slate-900">{pdfData.startDate || "-"} to {pdfData.endDate || "-"}</p>
                                <div className="mt-2 space-y-1">
                                    <p className="text-slate-600">Paid Days: <span className="font-semibold text-slate-900">{pdfData.paidDays || 30}</span></p>
                                    <p className="text-slate-600">Leaves Taken: <span className="font-semibold text-red-600">{pdfData.leavesTaken || 0}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                            <div className="grid grid-cols-2 divide-x divide-slate-300">
                                {/* Earnings */}
                                <div className="p-0">
                                    <div className="bg-emerald-50/50 p-3 border-b border-slate-300 font-bold text-emerald-800 uppercase text-xs tracking-wider">Earnings</div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Basic Salary</span>
                                            <span className="font-semibold">₹ {(pdfData.basicSalary || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-3 border-t border-slate-100 font-bold text-slate-900">
                                            <span>Gross Earnings</span>
                                            <span>₹ {(pdfData.basicSalary || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Deductions */}
                                <div className="p-0">
                                    <div className="bg-red-50/50 p-3 border-b border-slate-300 font-bold text-red-800 uppercase text-xs tracking-wider">Deductions</div>
                                    <div className="p-4 space-y-3">
                                        {['pf', 'esi', 'pt', 'tds'].map(field => (
                                            <div key={field} className="flex justify-between text-sm">
                                                <span className="text-slate-600 uppercase">{field}</span>
                                                <span className="font-medium">₹ {(pdfData[field] || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Leave Deduction</span>
                                            <span className="font-medium">₹ {(pdfData.leaveDeduction || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-3 border-t border-slate-100 font-bold text-slate-900">
                                            <span>Total Deductions</span>
                                            <span>₹ {((pdfData.pf || 0) + (pdfData.esi || 0) + (pdfData.pt || 0) + (pdfData.tds || 0) + (pdfData.leaveDeduction || 0)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Net Pay */}
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex flex-col items-end">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Net Pay</p>
                            <p className="text-4xl font-bold text-emerald-700">₹ {pdfData.netPay.toLocaleString()}</p>
                            <p className="text-sm text-slate-500 italic mt-2">{numberToWords(pdfData.netPay)}</p>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 text-center text-xs text-slate-400">
                            <p>This is a computer-generated document and does not require a signature.</p>
                            <p className="mt-1">Generated on {pdfData.generatedOn}</p>
                        </div>
                    </div>
                </div>
            )}
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
