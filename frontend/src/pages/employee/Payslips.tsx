import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard, Banknote, Calendar, Eye, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import icsLogo from "@/assets/ics_logo.jpeg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Payslip {
    _id: string;
    id?: string;
    month: string;
    year: string;
    netPay: number;
    status: "Draft" | "Created" | "Paid";
    generatedOn: string;
    basicSalary: number;
    pf: number;
    esi: number;
    pt: number;
    tds: number;
    leavesTaken: number;
    totalWorkingDays: number;
    paidDays: number;
    leaveDeduction: number;
    name?: string; // Optional if not populated in list but backend sends it
    empId?: string;
    startDate?: string;
    endDate?: string;
}

export default function Payslips() {
    const [year, setYear] = useState("2025");
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [pdfData, setPdfData] = useState<Payslip | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null); // To get user name/id if not in payslip object

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/employee/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const fetchPayslips = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/employee/payslips?year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPayslips(data);
            }
        } catch (error) {
            console.error("Failed to fetch payslips", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
        fetchPayslips();
    }, [year]);

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

    const handleDownload = async (slip: Payslip) => {
        // Enhance slip with profile info if missing
        const fullSlip = {
            ...slip,
            name: slip.name || userProfile?.name || 'Employee',
            empId: slip.empId || userProfile?.id || 'ID'
        };

        setPdfData(fullSlip);
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
                    pdf.save(`Payslip_${fullSlip.month}_${fullSlip.year}.pdf`);
                } catch (e) {
                    console.error("PDF Gen Error:", e);
                }
                setPdfData(null);
            }
        }, 100);
    };

    // Calculate totals
    const totalNetPay = payslips
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.netPay, 0);

    const totalDeductions = payslips
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + (p.pf + p.esi + p.pt + p.tds + (p.leaveDeduction || 0)), 0);

    const averageNet = payslips.filter(p => p.status === 'Paid').length > 0
        ? totalNetPay / payslips.filter(p => p.status === 'Paid').length
        : 0;


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-600/30">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                    Payslips
                </h1>

                <Select value={year} onValueChange={(val) => setYear(val)}>
                    <SelectTrigger className="w-[110px] bg-white border border-green-600 text-green-700 font-semibold rounded-md shadow-sm">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
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
                        <div className="text-3xl font-bold text-green-800">₹ {totalNetPay.toLocaleString('en-IN')}</div>
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
                        <div className="text-3xl font-bold text-red-700">₹ {totalDeductions.toLocaleString('en-IN')}</div>
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
                        <div className="text-3xl font-bold text-blue-800">₹ {Math.round(averageNet).toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">Monthly In-Hand</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payslip History */}
            <Card className="border-none shadow-lg">
                <CardHeader className="bg-green-50/60 border-b border-green-600/20">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <Calendar className="h-5 w-5" />
                        Payslip History
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                    {loading ? (
                        <p className="text-center text-muted-foreground py-8">Loading payslips...</p>
                    ) : payslips.filter(p => p.status !== 'Draft').length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No payslips found for {year}.</p>
                    ) : (
                        payslips
                            .filter(slip => slip.status !== 'Draft')
                            .map((slip) => {
                                const isPaid = slip.status === "Paid";
                                const isCreated = slip.status === "Created";

                                const fullSlip = {
                                    ...slip,
                                    name: slip.name || userProfile?.name || 'Employee',
                                    empId: slip.empId || userProfile?.id || 'ID'
                                };

                                return (
                                    <div
                                        key={slip._id || slip.id}
                                        className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] items-center gap-4 p-4 rounded-xl bg-white border border-green-600/20 shadow-sm hover:shadow-md transition-all"
                                    >
                                        {/* Left */}
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={cn(
                                                    "h-14 w-14 rounded-lg flex items-center justify-center text-white shadow-md",
                                                    isPaid ? "bg-green-600" : isCreated ? "bg-blue-600" : "bg-orange-600"
                                                )}
                                            >
                                                <Calendar className="h-6 w-6" />
                                            </div>

                                            <div>
                                                <h3 className="text-base font-semibold flex items-center gap-2">
                                                    {slip.month} {slip.year}
                                                    <Badge
                                                        className={cn(
                                                            "text-[10px] px-2 h-5",
                                                            isPaid
                                                                ? "bg-green-100 text-green-700"
                                                                : isCreated
                                                                    ? "bg-blue-100 text-blue-700"
                                                                    : "bg-orange-100 text-orange-700"
                                                        )}
                                                    >
                                                        {slip.status}
                                                    </Badge>
                                                </h3>

                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    {isPaid
                                                        ? `Paid on ${slip.generatedOn ? format(parseISO(slip.generatedOn), 'dd MMM yyyy') : '-'}`
                                                        : "Generated, pending disbursement"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div
                                            className={cn(
                                                "flex items-center justify-center gap-2 font-semibold",
                                                isPaid ? "text-green-700" : isCreated ? "text-blue-700" : "text-orange-700"
                                            )}
                                        >
                                            <Banknote className="h-4 w-4" />
                                            <span className="text-lg">₹ {slip.netPay.toLocaleString('en-IN')}</span>
                                        </div>

                                        {/* Action */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className={cn(
                                                        "text-white shadow-md active:scale-95 transition-transform gap-2",
                                                        isPaid
                                                            ? "bg-green-600 shadow-green-600/30"
                                                            : isCreated
                                                                ? "bg-blue-600 shadow-blue-600/30"
                                                                : "bg-orange-600 shadow-orange-600/30"
                                                    )}
                                                    onClick={() => setSelectedPayslip(fullSlip)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden">
                                                {/* PREVIEW LIKE ADMIN */}
                                                <div className="py-6 px-8 bg-white space-y-6 max-h-[90vh] overflow-y-auto">
                                                    <div className="flex justify-between items-center border-b pb-4">
                                                        <img src={icsLogo} alt="ICS Logo" className="h-16 w-auto object-contain" />
                                                        <div className="text-right">
                                                            <h2 className="text-2xl font-bold tracking-tight text-emerald-950">PAYSLIP</h2>
                                                            <p className="text-muted-foreground uppercase text-xs tracking-[0.2em] mt-1">{fullSlip.month} {fullSlip.year}</p>
                                                            {fullSlip.status === 'Draft' && <Badge variant="outline" className="mt-2 text-amber-600 border-amber-300 bg-amber-50">DRAFT PREVIEW</Badge>}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-8 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground text-xs uppercase">Employee Details</p>
                                                            <p className="font-bold text-lg mt-1">{fullSlip.name}</p>
                                                            <p className="text-slate-600">{fullSlip.empId}</p>
                                                            <p className="text-slate-600 mt-2">Designation: Software Engineer</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-muted-foreground text-xs uppercase">Pay Period</p>
                                                            <p className="font-medium mt-1">{fullSlip.startDate || "-"} to {fullSlip.endDate || "-"}</p>
                                                            <div className="flex gap-4 mt-2 justify-end">
                                                                <div className="bg-slate-50 px-2 py-1 rounded border text-xs">
                                                                    <span className="text-slate-500">Working Days:</span> <span className="font-semibold">{fullSlip.totalWorkingDays || 30}</span>
                                                                </div>
                                                                <div className="bg-slate-50 px-2 py-1 rounded border text-xs">
                                                                    <span className="text-slate-500">Paid Days:</span> <span className="font-semibold text-emerald-600">{fullSlip.paidDays || 30}</span>
                                                                </div>
                                                                <div className="bg-red-50 px-2 py-1 rounded border border-red-100 text-xs">
                                                                    <span className="text-red-500">Leaves:</span> <span className="font-semibold text-red-700">{fullSlip.leavesTaken || 0}</span>
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
                                                                    <span className="font-medium">₹ {(fullSlip.basicSalary || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between pt-2 border-t font-bold text-base">
                                                                    <span>Gross Earnings</span>
                                                                    <span>₹ {(fullSlip.basicSalary || 0).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white p-4">
                                                            <h4 className="font-bold text-red-700 mb-4 border-b pb-2">Deductions</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span>Provident Fund</span>
                                                                    <span className="font-medium">₹ {(fullSlip.pf || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>ESI</span>
                                                                    <span className="font-medium">₹ {(fullSlip.esi || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Professional Tax</span>
                                                                    <span className="font-medium">₹ {(fullSlip.pt || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>TDS</span>
                                                                    <span className="font-medium">₹ {(fullSlip.tds || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between text-red-600 font-medium bg-red-50 p-1 rounded">
                                                                    <span>Leave Deduction ({fullSlip.leavesTaken || 0} days)</span>
                                                                    <span>₹ {(fullSlip.leaveDeduction || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between pt-2 border-t font-bold text-base">
                                                                    <span>Total Deductions</span>
                                                                    <span>₹ {((fullSlip.pf || 0) + (fullSlip.esi || 0) + (fullSlip.pt || 0) + (fullSlip.tds || 0) + (fullSlip.leaveDeduction || 0)).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-end gap-1">
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Pay</p>
                                                        <p className="text-3xl font-bold text-emerald-700">₹ {fullSlip.netPay.toLocaleString()}</p>
                                                        <p className="text-xs text-slate-500 italic mt-1">{numberToWords(fullSlip.netPay)}</p>
                                                    </div>

                                                    <div className="flex justify-end pt-4 border-t">
                                                        {isPaid && (
                                                            <Button variant="outline" onClick={() => handleDownload(fullSlip)} className="gap-2">
                                                                <Download className="h-4 w-4" /> Download PDF
                                                            </Button>
                                                        )}
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
                                                <span className="font-medium">₹ {(pdfData[field as keyof Payslip] as number || 0).toLocaleString()}</span>
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
