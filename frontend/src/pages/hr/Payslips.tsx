import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Wallet,
    CreditCard,
    Banknote,
    Calendar,
    Eye,
    PlusCircle,
    Search,
    Download,
    FileText,
    Edit,
    Trash2,
    CheckCircle2,
    DollarSign,
    FileCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { format, parseISO } from "date-fns";

// --- TYPES (Merged) ---
type PayslipStatus = "Draft" | "Created" | "Paid";

interface EmployeePayslip {
    id: string;
    _id?: string; // Handle both id and _id
    empId: string;
    name: string;
    month: string;
    year: string;
    netPay: number;
    status: PayslipStatus;
    generatedOn: string;
    profileImage?: string;
    avatar?: string;
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
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2023", "2024", "2025", "2026"];

export default function HRPayslips() {
    // --- TAB 1 STATE: EMPLOYEE PAYSLIPS (ADMIN LOGIC) ---
    const [empPayslips, setEmpPayslips] = useState<EmployeePayslip[]>([]);
    const [employeesList, setEmployeesList] = useState<any[]>([]);
    const [loadingEmp, setLoadingEmp] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterMonth, setFilterMonth] = useState("All");
    const [filterYear, setFilterYear] = useState("All");
    const [salaryStructures, setSalaryStructures] = useState<any[]>([]);

    const [adminFormData, setAdminFormData] = useState({
        employee: "",
        month: "January",
        year: "2025",
        status: "Draft" as PayslipStatus,
        startDate: "",
        endDate: "",
        totalWorkingDays: 30,
        paidDays: 30,
        leavesTaken: 0,
        leaveDeduction: 0,
        basicSalary: 0,
        pf: 0,
        esi: 0,
        pt: 0,
        tds: 0,
    });

    // --- TAB 2 STATE: MY PAYSLIPS (EMPLOYEE LOGIC) ---
    const [myYear, setMyYear] = useState("2026");
    const [myPayslips, setMyPayslips] = useState<EmployeePayslip[]>([]);
    const [loadingMy, setLoadingMy] = useState(false);
    const [selectedMyPayslip, setSelectedMyPayslip] = useState<EmployeePayslip | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    // --- SHARED STATE ---
    const [pdfData, setPdfData] = useState<any>(null);


    // ==========================================
    // TAB 1 LOGIC: EMPLOYEE PAYSLIPS MANAGEMENT
    // ==========================================

    useEffect(() => {
        // Fetch data for the management tab
        fetchEmpPayslips();
        fetchEmployees();
        fetchSalaryStructures();
    }, []);

    const fetchEmpPayslips = async () => {
        try {
            const token = localStorage.getItem('token');
            // Using Admin API as requested "Same like Admin"
            const res = await fetch('/api/admin/payslips', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmpPayslips(data.map((d: any) => ({ ...d, id: d._id })));
            }
        } catch (error) {
            console.error("Failed to fetch employee payslips", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            // Using HR specific select endpoint if available, otherwise fallback to admin or HR employee list
            // Based on hr.js, there IS an endpoint: router.get('/employees/select', auth, hrController.getAllEmployeesForSelect);
            const res = await fetch('/api/hr/employees/select', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setEmployeesList(await res.json());
            } else {
                // Fallback to admin if HR specific fails or returns empty
                const resAdmin = await fetch('/api/admin/employees?role=EMPLOYEE&status=Active', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resAdmin.ok) setEmployeesList(await resAdmin.json());
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const fetchSalaryStructures = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/salary-structures', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSalaryStructures(await res.json());
        } catch (error) {
            console.error("Fetch Structures Error", error);
        }
    };

    const fetchSalaryDetails = async (empId: string, structureId?: string) => {
        try {
            const token = localStorage.getItem('token');
            const url = `/api/admin/salary-structures/calculate/${empId}${structureId ? `?structureId=${structureId}` : ''}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

            if (res.ok) {
                const data = await res.json();
                const pf = data.deductions.find((d: any) => /PF|Provident/i.test(d.label))?.amount || 0;
                const esi = data.deductions.find((d: any) => /ESI/i.test(d.label))?.amount || 0;
                const pt = data.deductions.find((d: any) => /PT|Professional/i.test(d.label))?.amount || 0;
                const tds = data.deductions.find((d: any) => /TDS|Tax/i.test(d.label) && !/Professional/i.test(d.label))?.amount || 0;

                setAdminFormData(prev => ({
                    ...prev,
                    basicSalary: data.basicSalary,
                    pf, esi, pt, tds
                }));
            }
        } catch (error) {
            console.error("Auto-fetch salary error", error);
        }
    };

    const handleAdminInputChange = (field: string, value: any) => {
        setAdminFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'employee' || field === 'selectedStructure') {
                const empId = (field === 'employee' ? value : updated.employee)?.split('(')[1]?.replace(')', '');
                const structId = field === 'selectedStructure' ? value : (updated as any).selectedStructure;
                if (empId) fetchSalaryDetails(empId, structId);
            }
            return updated;
        });
    };

    // Auto-set Date Range
    useEffect(() => {
        const monthIndex = MONTHS.indexOf(adminFormData.month);
        const year = parseInt(adminFormData.year);
        if (monthIndex !== -1 && !isNaN(year)) {
            const firstDay = new Date(year, monthIndex, 1);
            const lastDay = new Date(year, monthIndex + 1, 0);
            const daysInMonth = lastDay.getDate();
            const formatDate = (d: Date) => d.toISOString().split('T')[0];

            setAdminFormData(prev => ({
                ...prev,
                startDate: formatDate(firstDay),
                endDate: formatDate(lastDay),
                totalWorkingDays: daysInMonth,
                paidDays: daysInMonth - (prev.leavesTaken || 0),
            }));
        }
    }, [adminFormData.month, adminFormData.year, adminFormData.employee]);

    // Auto-calculate Paid Days & Deductions
    useEffect(() => {
        const leaves = adminFormData.leavesTaken || 0;
        const totalDays = adminFormData.totalWorkingDays || 30;
        const basic = adminFormData.basicSalary || 0;
        const calculatedPaidDays = Math.max(0, totalDays - leaves);
        const calculatedDeduction = totalDays > 0 ? Math.round((basic / totalDays) * leaves) : 0;

        setAdminFormData(prev => {
            if (prev.paidDays === calculatedPaidDays && prev.leaveDeduction === calculatedDeduction) return prev;
            return { ...prev, paidDays: calculatedPaidDays, leaveDeduction: calculatedDeduction };
        });
    }, [adminFormData.leavesTaken, adminFormData.totalWorkingDays, adminFormData.basicSalary]);

    // Admin Calculations
    const adminGrossEarnings = adminFormData.basicSalary;
    const adminTotalDeductions = (adminFormData.pf || 0) + (adminFormData.esi || 0) + (adminFormData.pt || 0) + (adminFormData.tds || 0) + (adminFormData.leaveDeduction || 0);
    const adminNetPay = adminGrossEarnings - adminTotalDeductions;

    const handleCreatePayslip = async () => {
        setLoadingEmp(true);
        const slipData = {
            empId: adminFormData.employee.split('(')[1].replace(')', ''),
            name: adminFormData.employee.split('(')[0].trim(),
            month: adminFormData.month,
            year: adminFormData.year,
            netPay: adminNetPay,
            status: adminFormData.status,
            basicSalary: adminFormData.basicSalary,
            pf: adminFormData.pf,
            esi: adminFormData.esi,
            pt: adminFormData.pt,
            tds: adminFormData.tds,
            leavesTaken: adminFormData.leavesTaken,
            leaveDeduction: adminFormData.leaveDeduction,
            totalWorkingDays: adminFormData.totalWorkingDays,
            paidDays: adminFormData.paidDays,
            startDate: adminFormData.startDate,
            endDate: adminFormData.endDate
        };

        try {
            const token = localStorage.getItem('token');
            let res;
            if (editingId) {
                res = await fetch(`/api/admin/payslips/${editingId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(slipData)
                });
            } else {
                res = await fetch(`/api/admin/payslips`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(slipData)
                });
            }

            if (res.ok) {
                await fetchEmpPayslips();
                resetAdminForm();
            } else {
                alert("Failed to save payslip");
            }
        } catch (error) {
            console.error("Save error", error);
            alert("Error saving payslip");
        } finally {
            setLoadingEmp(false);
        }
    };

    const resetAdminForm = () => {
        setIsCreateDialogOpen(false);
        setEditingId(null);
        setShowPreview(false);
        setAdminFormData(prev => ({
            ...prev,
            employee: "",
            basicSalary: 0, pf: 0, esi: 0, pt: 0, tds: 0, leavesTaken: 0, leaveDeduction: 0,
            status: "Draft"
        }));
    };

    const handleEditPayslip = (slip: EmployeePayslip) => {
        setEditingId(slip.id);
        const fullName = `${slip.name} (${slip.empId})`;
        setAdminFormData(prev => ({
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
    };

    const handleViewPayslip = (slip: EmployeePayslip) => {
        handleEditPayslip(slip);
        setShowPreview(true);
    };

    const advanceStatus = async (id: string, currentStatus: PayslipStatus) => {
        let newStatus: PayslipStatus = currentStatus;
        if (currentStatus === "Draft") newStatus = "Created";
        else if (currentStatus === "Created") newStatus = "Paid";

        if (newStatus !== currentStatus) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/admin/payslips/${id}`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    setEmpPayslips(empPayslips.map(p => p.id === id ? { ...p, status: newStatus } : p));
                }
            } catch (e) { console.error("Update status erro", e); }
        }
    };

    const deletePayslip = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payslip?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/payslips/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setEmpPayslips(empPayslips.filter(p => p.id !== id));
            } else { alert("Failed to delete"); }
        } catch (error) { console.error("Delete error", error); }
    };

    const filteredEmployeePayslips = empPayslips.filter(slip => {
        const matchStatus = filterStatus === "All" || slip.status === filterStatus;
        const matchMonth = filterMonth === "All" || slip.month === filterMonth;
        const matchYear = filterYear === "All" || slip.year === filterYear;
        return matchStatus && matchMonth && matchYear;
    }).sort((a, b) => new Date(b.generatedOn).getTime() - new Date(a.generatedOn).getTime());


    // ==========================================
    // TAB 2 LOGIC: MY PAYSLIPS (EMPLOYEE LOGIC)
    // ==========================================

    useEffect(() => {
        fetchUserProfile();
        fetchMyPayslips();
    }, [myYear]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/employee/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUserProfile(await res.json());
        } catch (error) { console.error("Failed to fetch profile", error); }
    };

    const fetchMyPayslips = async () => {
        setLoadingMy(true);
        try {
            const token = localStorage.getItem('token');
            // Using HR API for personal payslips
            const res = await fetch(`/api/hr/payslips?year=${myYear}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyPayslips(data.map((d: any) => ({ ...d, id: d._id || d.id })));
            }
        } catch (error) { console.error("Failed to fetch my payslips", error); }
        finally { setLoadingMy(false); }
    };

    // My Payslips Totals
    const myTotalNetPay = myPayslips.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.netPay, 0);
    const myTotalDeductions = myPayslips.filter(p => p.status === 'Paid').reduce((sum, p) => sum + ((p.pf || 0) + (p.esi || 0) + (p.pt || 0) + (p.tds || 0) + (p.leaveDeduction || 0)), 0);
    const myAverageNet = myPayslips.filter(p => p.status === 'Paid').length > 0 ? myTotalNetPay / myPayslips.filter(p => p.status === 'Paid').length : 0;


    // ==========================================
    // SHARED / UTILS
    // ==========================================

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

    const handleDownloadPDF = async (slip: EmployeePayslip) => {
        setPdfData({ ...slip, name: slip.name || userProfile?.name, empId: slip.empId || userProfile?.id });
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
                } catch (e) { console.error("PDF Error", e); }
                setPdfData(null);
            }
        }, 100);
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

            <Tabs defaultValue="employee-payslips" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-slate-100">
                    <TabsTrigger value="employee-payslips">Employee Payslips</TabsTrigger>
                    <TabsTrigger value="my-payslips">My Payslips</TabsTrigger>
                </TabsList>

                {/* --- TAB 1: EMPLOYEE PAYSLIPS (Admin View) --- */}
                <TabsContent value="employee-payslips" className="space-y-6 mt-6">
                    {/* Action Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="w-full h-10 pl-10"
                                placeholder="Search employees..."
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Month" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Months</SelectItem>
                                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filterYear} onValueChange={setFilterYear}>
                                <SelectTrigger className="w-[100px]"><SelectValue placeholder="Year" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Years</SelectItem>
                                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Status</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Created">Created</SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>

                            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                                setIsCreateDialogOpen(open);
                                if (!open) resetAdminForm();
                            }}>
                                <DialogTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Create Payslip
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className={`max-h-[90vh] bg-white ${showPreview ? "sm:max-w-3xl h-[90vh] sm:h-[600px] p-0 overflow-hidden" : "sm:max-w-4xl overflow-y-auto"}`}>
                                    <DialogHeader>
                                        <DialogTitle>{showPreview ? "Payslip Preview" : (editingId ? "Edit Payslip" : "Generate New Payslip")}</DialogTitle>
                                        <DialogDescription>{showPreview ? "Review the detailed payslip." : "Enter details to calculate and generate a payslip."}</DialogDescription>
                                    </DialogHeader>

                                    {!showPreview ? (
                                        <div className="grid gap-6 py-4">
                                            {/* Basic Details */}
                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" /> Basic Details
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Employee <span className="text-red-500">*</span></Label>
                                                        <Select value={adminFormData.employee} onValueChange={(val) => handleAdminInputChange("employee", val)}>
                                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select Employee" /></SelectTrigger>
                                                            <SelectContent>
                                                                {employeesList.map(emp => (
                                                                    <SelectItem key={emp.id} value={`${emp.name} (${emp.id})`}>{emp.name} ({emp.id})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Month <span className="text-red-500">*</span></Label>
                                                        <Select value={adminFormData.month} onValueChange={(val) => handleAdminInputChange("month", val)}>
                                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select Month" /></SelectTrigger>
                                                            <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Year <span className="text-red-500">*</span></Label>
                                                        <Select value={adminFormData.year} onValueChange={(val) => handleAdminInputChange("year", val)}>
                                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select Year" /></SelectTrigger>
                                                            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Status <span className="text-red-500">*</span></Label>
                                                        <Select value={adminFormData.status} onValueChange={(val) => handleAdminInputChange("status", val)}>
                                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select Status" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Draft">Draft</SelectItem>
                                                                <SelectItem value="Created">Created</SelectItem>
                                                                <SelectItem value="Paid">Paid</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Structure (Auto)</Label>
                                                        <Select value={(adminFormData as any).selectedStructure || ""} onValueChange={(val) => handleAdminInputChange("selectedStructure", val)}>
                                                            <SelectTrigger className="h-9"><SelectValue placeholder="Load from Structure" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="default_auto_option">Auto</SelectItem>
                                                                {salaryStructures.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Attendance & Earnings & Deductions Blocks - SIMPLIFIED FOR BREVITY BUT FUNCTIONAL */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 rounded-lg border bg-white space-y-3">
                                                    <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-2"><Calendar className="h-4 w-4" /> Attendance</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="date" className="h-8" value={adminFormData.startDate} onChange={e => handleAdminInputChange("startDate", e.target.value)} /></div>
                                                        <div className="space-y-1"><Label className="text-xs">End Date</Label><Input type="date" className="h-8" value={adminFormData.endDate} onChange={e => handleAdminInputChange("endDate", e.target.value)} /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Total Days</Label><Input type="number" className="h-8" value={adminFormData.totalWorkingDays} onChange={e => handleAdminInputChange("totalWorkingDays", parseFloat(e.target.value))} /></div>
                                                        <div className="space-y-1"><Label className="text-xs">Leaves</Label><Input type="number" className="h-8" value={adminFormData.leavesTaken} onChange={e => handleAdminInputChange("leavesTaken", parseFloat(e.target.value))} /></div>
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-lg border bg-white space-y-3">
                                                    <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-2"><Banknote className="h-4 w-4" /> Earnings</h4>
                                                    <div className="space-y-1"><Label className="text-xs">Basic Salary</Label><Input type="number" className="h-8" value={adminFormData.basicSalary} onChange={e => handleAdminInputChange("basicSalary", parseFloat(e.target.value))} /></div>
                                                </div>
                                                <div className="p-4 rounded-lg border bg-white space-y-3 md:col-span-2">
                                                    <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Deductions</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                        <div className="space-y-1"><Label className="text-xs">PF</Label><Input type="number" className="h-8" value={adminFormData.pf} onChange={e => handleAdminInputChange("pf", parseFloat(e.target.value))} /></div>
                                                        <div className="space-y-1"><Label className="text-xs">ESI</Label><Input type="number" className="h-8" value={adminFormData.esi} onChange={e => handleAdminInputChange("esi", parseFloat(e.target.value))} /></div>
                                                        <div className="space-y-1"><Label className="text-xs">PT</Label><Input type="number" className="h-8" value={adminFormData.pt} onChange={e => handleAdminInputChange("pt", parseFloat(e.target.value))} /></div>
                                                        <div className="space-y-1"><Label className="text-xs">TDS</Label><Input type="number" className="h-8" value={adminFormData.tds} onChange={e => handleAdminInputChange("tds", parseFloat(e.target.value))} /></div>
                                                        <div className="space-y-1"><Label className="text-xs text-red-600">Leave Ded.</Label><Input type="number" className="h-8 bg-slate-50" value={adminFormData.leaveDeduction} readOnly /></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            <div className="flex gap-4 p-4 bg-emerald-50 rounded-lg justify-end items-center">
                                                <div className="text-right"><p className="text-xs uppercase text-muted-foreground">Get Pay</p><p className="text-2xl font-bold text-emerald-800">₹ {adminNetPay.toLocaleString()}</p></div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Preview
                                        <div className="h-full overflow-y-auto px-8 py-6 bg-white rounded-lg shadow-sm space-y-6">
                                            <div className="flex justify-between items-center border-b pb-4">
                                                <img src={icsLogo} alt="ICS Logo" className="h-16 w-auto object-contain" />
                                                <div className="text-right">
                                                    <h2 className="text-2xl font-bold tracking-tight text-emerald-950">PAYSLIP</h2>
                                                    <p className="text-muted-foreground uppercase text-xs tracking-[0.2em] mt-1">{adminFormData.month} {adminFormData.year}</p>
                                                    {adminFormData.status === 'Draft' && <Badge variant="outline" className="mt-2 text-amber-600 border-amber-300 bg-amber-50">DRAFT PREVIEW</Badge>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground text-xs uppercase">Employee Details</p>
                                                    <p className="font-bold text-lg mt-1">{adminFormData.employee.split('(')[0]}</p>
                                                    <p className="text-slate-600">{adminFormData.employee.split('(')[1]?.replace(')', '')}</p>
                                                    <p className="text-slate-600 mt-2">Designation: Software Engineer</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-muted-foreground text-xs uppercase">Pay Period</p>
                                                    <p className="font-medium mt-1">{adminFormData.startDate || "-"} to {adminFormData.endDate || "-"}</p>
                                                    <div className="flex gap-4 mt-2 justify-end">
                                                        <div className="bg-slate-50 px-2 py-1 rounded border text-xs">
                                                            <span className="text-slate-500">Working Days:</span> <span className="font-semibold">{adminFormData.totalWorkingDays}</span>
                                                        </div>
                                                        <div className="bg-slate-50 px-2 py-1 rounded border text-xs">
                                                            <span className="text-slate-500">Paid Days:</span> <span className="font-semibold text-emerald-600">{adminFormData.paidDays}</span>
                                                        </div>
                                                        <div className="bg-red-50 px-2 py-1 rounded border border-red-100 text-xs">
                                                            <span className="text-red-500">Leaves:</span> <span className="font-semibold text-red-700">{adminFormData.leavesTaken}</span>
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
                                                            <span className="font-medium">₹ {adminFormData.basicSalary.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between pt-2 border-t font-bold text-base">
                                                            <span>Gross Earnings</span>
                                                            <span>₹ {adminGrossEarnings.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4">
                                                    <h4 className="font-bold text-red-700 mb-4 border-b pb-2">Deductions</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span>Provident Fund</span>
                                                            <span className="font-medium">₹ {(adminFormData.pf || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>ESI</span>
                                                            <span className="font-medium">₹ {(adminFormData.esi || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Professional Tax</span>
                                                            <span className="font-medium">₹ {(adminFormData.pt || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>TDS</span>
                                                            <span className="font-medium">₹ {(adminFormData.tds || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-red-600 font-medium bg-red-50 p-1 rounded">
                                                            <span>Leave Deduction ({adminFormData.leavesTaken || 0} days)</span>
                                                            <span>₹ {(adminFormData.leaveDeduction || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between pt-2 border-t font-bold text-base">
                                                            <span>Total Deductions</span>
                                                            <span>₹ {adminTotalDeductions.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-end gap-1">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Pay</p>
                                                <p className="text-3xl font-bold text-emerald-700">₹ {adminNetPay.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500 italic mt-1">{numberToWords(adminNetPay)}</p>
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
                                                <Button variant="ghost" onClick={resetAdminForm}>Cancel</Button>
                                                <Button onClick={handleCreatePayslip} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                                    {editingId ? "Update Payslip" : "Save & Generate"}
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="outline" onClick={() => setShowPreview(false)} className="mr-auto">Back to Edit</Button>
                                                {/* HR might want to download draft too, consistent with Admin */}
                                                <Button variant="outline" onClick={() => handleDownloadPDF({ ...adminFormData, id: "preview", empId: adminFormData.employee.split('(')[1]?.replace(')', '') || "", name: adminFormData.employee.split('(')[0] } as any)} className="gap-2">
                                                    <Download className="h-4 w-4" /> Download PDF
                                                </Button>
                                                <Button onClick={handleCreatePayslip} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                                    {editingId ? "Update" : "Confirm & Generate"}
                                                </Button>
                                            </>
                                        )}
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Payslips Table */}
                    <Card>
                        <CardHeader className="py-3 bg-slate-50"><CardTitle className="text-base text-slate-700">All Payslips</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-3">Employee</th>
                                        <th className="px-4 py-3">Period</th>
                                        <th className="px-4 py-3">Net Pay</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredEmployeePayslips.map(slip => (
                                        <tr key={slip.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={slip.profileImage || slip.avatar || `https://ui-avatars.com/api/?name=${slip.name}&background=random`} />
                                                        <AvatarFallback>{slip.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{slip.name}</div>
                                                        <div className="text-xs text-muted-foreground">{slip.empId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{slip.month} {slip.year}</td>
                                            <td className="px-4 py-3 font-medium">₹ {slip.netPay.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cn(
                                                    slip.status === "Paid" && "text-green-700 bg-green-50 border-green-200",
                                                    slip.status === "Created" && "text-blue-700 bg-blue-50 border-blue-200",
                                                    slip.status === "Draft" && "text-amber-700 bg-amber-50 border-amber-200"
                                                )}>{slip.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => handleViewPayslip(slip)}><Eye className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEditPayslip(slip)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deletePayslip(slip.id)}><Trash2 className="h-4 w-4" /></Button>
                                                {slip.status !== "Paid" && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => advanceStatus(slip.id, slip.status)} title="Advance Status">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => handleDownloadPDF(slip)}><Download className="h-4 w-4" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 2: MY PAYSLIPS (Employee View) --- */}
                <TabsContent value="my-payslips" className="space-y-6 mt-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            My Payslips History
                        </h2>

                        <Select value={myYear} onValueChange={setMyYear}>
                            <SelectTrigger className="w-[110px] bg-white border border-green-600 text-green-700 font-semibold rounded-md shadow-sm">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="border-l-4 border-l-green-600 bg-green-50/60 shadow-lg">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                                    <Wallet className="h-4 w-4 text-white" />
                                </div>
                                <CardTitle className="text-base font-semibold text-green-700">
                                    Total Net Pay (YTD)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-800">₹ {myTotalNetPay.toLocaleString('en-IN')}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-red-600 bg-red-50/60 shadow-lg">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center">
                                    <CreditCard className="h-4 w-4 text-white" />
                                </div>
                                <CardTitle className="text-base font-semibold text-red-700">
                                    Total Deductions (YTD)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-700">₹ {myTotalDeductions.toLocaleString('en-IN')}</div>
                                <p className="text-xs text-muted-foreground">PF + Tax + Leaves</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-600 bg-blue-50/60 shadow-lg">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Banknote className="h-4 w-4 text-white" />
                                </div>
                                <CardTitle className="text-base font-semibold text-blue-700">
                                    Net Pay Average
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-800">₹ {Math.round(myAverageNet).toLocaleString('en-IN')}</div>
                                <p className="text-xs text-muted-foreground">Monthly In-Hand</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payslip History List */}
                    <Card className="border-none shadow-lg">
                        <CardHeader className="bg-green-50/60 border-b border-green-600/20">
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <Calendar className="h-5 w-5" />
                                Payslip History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {myPayslips.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No payslips found for {myYear}.</p>
                            ) : (
                                myPayslips.map(slip => {
                                    const isPaid = slip.status === "Paid";
                                    const isCreated = slip.status === "Created";

                                    return (
                                        <div key={slip.id} className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] items-center gap-4 p-4 rounded-xl bg-white border border-green-600/20 shadow-sm hover:shadow-md transition-all">
                                            {/* Left Info */}
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-14 w-14 rounded-lg flex items-center justify-center text-white shadow-md",
                                                    isPaid ? "bg-green-600" : isCreated ? "bg-blue-600" : "bg-orange-600"
                                                )}>
                                                    <Calendar className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                                        {slip.month} {slip.year}
                                                        <Badge className={cn(
                                                            "text-[10px] px-2 h-5",
                                                            isPaid ? "bg-green-100 text-green-700" : isCreated ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                                        )}>
                                                            {slip.status}
                                                        </Badge>
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-0.5">
                                                        {isPaid ? `Paid on ${slip.generatedOn ? format(parseISO(slip.generatedOn), 'dd MMM yyyy') : '-'}` : slip.status}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className={cn(
                                                "flex items-center justify-center gap-2 font-semibold",
                                                isPaid ? "text-green-700" : isCreated ? "text-blue-700" : "text-orange-700"
                                            )}>
                                                <Banknote className="h-4 w-4" />
                                                <span className="text-lg">₹ {slip.netPay.toLocaleString('en-IN')}</span>
                                            </div>

                                            {/* Action */}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" className={cn(
                                                        "text-white shadow-md active:scale-95 transition-transform gap-2",
                                                        isPaid ? "bg-green-600 shadow-green-600/30" : isCreated ? "bg-blue-600 shadow-blue-600/30" : "bg-orange-600 shadow-orange-600/30"
                                                    )}>
                                                        <Eye className="h-4 w-4" /> View
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden h-[90vh] sm:h-[600px]">
                                                    <div className="py-6 px-8 bg-white space-y-6 h-full overflow-y-auto">
                                                        <div className="flex justify-between items-center border-b pb-4">
                                                            <img src={icsLogo} alt="ICS Logo" className="h-16 w-auto object-contain" />
                                                            <div className="text-right">
                                                                <h2 className="text-2xl font-bold tracking-tight text-emerald-950">PAYSLIP</h2>
                                                                <p className="text-muted-foreground uppercase text-xs tracking-[0.2em] mt-1">{slip.month} {slip.year}</p>
                                                                {slip.status === 'Draft' && <Badge variant="outline" className="mt-2 text-amber-600 border-amber-300 bg-amber-50">DRAFT PREVIEW</Badge>}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-8 text-sm">
                                                            <div>
                                                                <p className="text-muted-foreground text-xs uppercase">Employee Details</p>
                                                                <p className="font-bold text-lg mt-1">{slip.name || userProfile?.name}</p>
                                                                <p className="text-slate-600">{slip.empId || userProfile?.id}</p>
                                                                <p className="text-slate-600 mt-2">Designation: Software Engineer</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-muted-foreground text-xs uppercase">Pay Period</p>
                                                                <p className="font-medium mt-1">{slip.startDate || "-"} to {slip.endDate || "-"}</p>
                                                                <div className="flex gap-4 mt-2 justify-end">
                                                                    <div className="bg-slate-50 px-2 py-1 rounded border text-xs">
                                                                        <span className="text-slate-500">Working Days:</span> <span className="font-semibold">{slip.totalWorkingDays || 30}</span>
                                                                    </div>
                                                                    <div className="bg-slate-50 px-2 py-1 rounded border text-xs">
                                                                        <span className="text-slate-500">Paid Days:</span> <span className="font-semibold text-emerald-600">{slip.paidDays || 30}</span>
                                                                    </div>
                                                                    <div className="bg-red-50 px-2 py-1 rounded border border-red-100 text-xs">
                                                                        <span className="text-red-500">Leaves:</span> <span className="font-semibold text-red-700">{slip.leavesTaken || 0}</span>
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
                                                                        <span className="font-medium">₹ {(slip.basicSalary || 0).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between pt-2 border-t font-bold text-base">
                                                                        <span>Gross Earnings</span>
                                                                        <span>₹ {(slip.basicSalary || 0).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="bg-white p-4">
                                                                <h4 className="font-bold text-red-700 mb-4 border-b pb-2">Deductions</h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span>Provident Fund</span>
                                                                        <span className="font-medium">₹ {(slip.pf || 0).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span>ESI</span>
                                                                        <span className="font-medium">₹ {(slip.esi || 0).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span>Professional Tax</span>
                                                                        <span className="font-medium">₹ {(slip.pt || 0).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span>TDS</span>
                                                                        <span className="font-medium">₹ {(slip.tds || 0).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-red-600 font-medium bg-red-50 p-1 rounded">
                                                                        <span>Leave Deduction ({slip.leavesTaken || 0} days)</span>
                                                                        <span>₹ {(slip.leaveDeduction || 0).toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex justify-between pt-2 border-t font-bold text-base">
                                                                        <span>Total Deductions</span>
                                                                        <span>₹ {((slip.pf || 0) + (slip.esi || 0) + (slip.pt || 0) + (slip.tds || 0) + (slip.leaveDeduction || 0)).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-end gap-1">
                                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Pay</p>
                                                            <p className="text-3xl font-bold text-emerald-700">₹ {slip.netPay.toLocaleString()}</p>
                                                            <p className="text-xs text-slate-500 italic mt-1">{numberToWords(slip.netPay)}</p>
                                                        </div>

                                                        <div className="flex justify-end pt-4 border-t">
                                                            <Button variant="outline" onClick={() => handleDownloadPDF(slip)} className="gap-2">
                                                                <Download className="h-4 w-4" /> Download PDF
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Hidden PDF Template (Shared) */}
            {pdfData && (
                <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                    <div id="payslip-pdf-content" className="w-[800px] p-8 bg-white text-slate-900 border" style={{ fontFamily: "sans-serif" }}>
                        <div className="flex justify-between items-center border-b border-slate-300 pb-6 mb-6">
                            <img src={icsLogo} alt="ICS Logo" className="h-20 w-auto object-contain" />
                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-emerald-950">PAYSLIP</h2>
                                <p className="text-slate-500 uppercase text-sm tracking-[0.2em] mt-1">{pdfData.month} {pdfData.year}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 text-sm mb-6">
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Employee Details</p>
                                <p className="font-bold text-xl text-slate-900">{pdfData.name}</p>
                                <p className="text-slate-600 font-medium">{pdfData.empId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Pay Period</p>
                                <p className="font-medium text-slate-900">{pdfData.startDate || "-"} to {pdfData.endDate || "-"}</p>
                            </div>
                        </div>
                        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                            <div className="grid grid-cols-2 divide-x divide-slate-300">
                                <div className="p-4 space-y-3">
                                    <div className="font-bold text-emerald-800 uppercase text-xs">Earnings</div>
                                    <div className="flex justify-between text-sm"><span>Basic</span><span>₹ {(pdfData.basicSalary || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm pt-2 border-t font-bold"><span>Total Earnings</span><span>₹ {(pdfData.basicSalary || 0).toLocaleString()}</span></div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="font-bold text-red-800 uppercase text-xs">Deductions</div>
                                    <div className="flex justify-between text-sm"><span>PF</span><span>₹ {(pdfData.pf || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span>TDS</span><span>₹ {(pdfData.tds || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm pt-2 border-t font-bold"><span>Total Deductions</span><span>₹ {((pdfData.pf || 0) + (pdfData.esi || 0) + (pdfData.pt || 0) + (pdfData.tds || 0) + (pdfData.leaveDeduction || 0)).toLocaleString()}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex flex-col items-end">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Net Pay</p>
                            <p className="text-4xl font-bold text-emerald-700">₹ {pdfData.netPay.toLocaleString()}</p>
                            <p className="text-sm text-slate-500 italic mt-2">{numberToWords(pdfData.netPay)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
