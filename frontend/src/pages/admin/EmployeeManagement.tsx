import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Search, Edit, ClipboardList, Users, UserCheck, UserX, Eye, EyeOff, Phone, Building2, Heart, AlertCircle, FileText, ShieldCheck, Loader2, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/types";

import { useNavigate } from "react-router-dom";


export default function AdminEmployeeManagement() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Active");
    const [projectFilter, setProjectFilter] = useState("All");
    const [roleFilter, setRoleFilter] = useState("All");
    const [isFilterLoading, setIsFilterLoading] = useState(false);

    const [allEmployees, setAllEmployees] = useState<User[]>([]);
    const [viewEmployee, setViewEmployee] = useState<User | null>(null);
    const [editEmployee, setEditEmployee] = useState<User | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Pagination & Stats State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [stats, setStats] = useState({
        activeStaff: 0,
        onBench: 0,
        activeHR: 0,
        activeAdmin: 0
    });

    useEffect(() => {
        const fetchEmployees = async () => {
            // Only show full page loader if we don't have stats yet (first load)
            if (stats.activeStaff === 0 && isInitialLoading) {
                // Already true
            } else {
                setIsTableLoading(true);
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                // Construct URL with query parameters
                const params = new URLSearchParams();
                params.append('page', currentPage.toString());
                params.append('limit', '10');
                if (searchTerm) params.append('search', searchTerm);

                // Always send status parameter to ensure explicit filtering (All vs Active default)
                params.append('status', statusFilter);

                if (projectFilter !== 'All') params.append('projectStatus', projectFilter);
                if (roleFilter !== 'All') params.append('role', roleFilter);

                const response = await apiFetch(`/api/admin/employees?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.pagination) {
                        setAllEmployees(data.employees || []);
                        setTotalPages(data.pagination.pages);
                        setTotalRecords(data.pagination.total);
                        if (data.pagination.stats) {
                            setStats(data.pagination.stats);
                        }
                    } else {
                        // Fallback for older API structure
                        setAllEmployees(Array.isArray(data) ? data : []);
                    }
                } else if (response.status === 401 || response.status === 400) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                } else {
                    console.error("Failed to fetch employees:", response.statusText);
                }
            } catch (error) {
                console.error("Failed to fetch employees", error);
            } finally {
                setIsInitialLoading(false);
                setIsTableLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchEmployees();
        }, 300); // 300ms debounce for search

        return () => clearTimeout(timer);
    }, [navigate, currentPage, searchTerm, statusFilter, projectFilter, roleFilter]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, projectFilter, roleFilter]);

    // Use employees directly from state since backend handles filtering
    const employees = allEmployees;

    // Note: These stats come from backend pagination metadata
    const activeEmployees = stats.activeStaff;
    const benchEmployees = stats.onBench;

    const handleFilterChange = (setter: (value: string) => void, value: string) => {
        setIsFilterLoading(true);
        setter(value);
        setTimeout(() => {
            setIsFilterLoading(false);
        }, 500); // Small delay for UX
    };

    const handleUpdateEmployee = async () => {
        if (!editEmployee) return;

        try {
            // setIsLoading(true); // Don't trigger full page reload on update
            const token = localStorage.getItem('token');
            const response = await apiFetch(`/api/admin/employees/${editEmployee.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editEmployee)
            });

            if (response.ok) {
                const { user } = await response.json();
                setAllEmployees(prev => prev.map(emp => emp.id === user.id ? user : emp));
                setEditEmployee(null);
            } else {
                const errorData = await response.json();
                console.error("Failed to update employee:", errorData.message);
                alert(`Failed to update: ${errorData.message}`);
            }
        } catch (error) {
            console.error("Error updating employee:", error);
        } finally {
            // No loading state needed for update specifically in this context
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ... Header and Stats ... */}
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/30">
                        <ClipboardList className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employee Management</h1>
                    </div>
                </div>
                {/* <Button className="bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-700 active:scale-95 transition-all">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Employee
                </Button> */}
            </div>


            {isInitialLoading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-600 border-r-transparent mb-2"></div>
                    <p className="text-muted-foreground">Loading employees...</p>
                </div>
            ) : (
                <>
                    {/* Stats Overview */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Staff"
                            value={totalRecords.toString()}
                            color="violet"
                            icon={Users}
                        />
                        <StatCard
                            title="Active Users"
                            value={activeEmployees.toString()}
                            color="green"
                            icon={UserCheck}
                        />
                        <StatCard
                            title="On Bench"
                            value={benchEmployees.toString()}
                            color="orange"
                            icon={UserX}
                        />
                        <StatCard
                            title="HR Team"
                            value={`${stats.activeHR} / ${stats.activeAdmin}`}
                            subtitle="HRs / Admins"
                            color="blue"
                            icon={ShieldCheck}
                        />
                    </div>

                    <Card className="border-1 border-blue-200 border">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full md:max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search employees..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                                    <Select
                                        value={roleFilter}
                                        onValueChange={(val) => handleFilterChange(setRoleFilter, val)}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Roles</SelectItem>
                                            <SelectItem value="EMPLOYEE">Employees</SelectItem>
                                            <SelectItem value="HR">HR Team</SelectItem>
                                            <SelectItem value="ADMIN">Admins</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={statusFilter}
                                        onValueChange={(val) => handleFilterChange(setStatusFilter, val)}
                                    >
                                        <SelectTrigger className="w-[110px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Status</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={projectFilter}
                                        onValueChange={(val) => handleFilterChange(setProjectFilter, val)}
                                    >
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Projects</SelectItem>
                                            <SelectItem value="In Project">In Project</SelectItem>
                                            <SelectItem value="Bench">On Bench</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto min-h-[400px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="pl-6 font-semibold text-slate-700">Name</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Department</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Project</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-700 pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isTableLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                                                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                                                        <p>Updating...</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : isFilterLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    <div className="flex justify-center items-center h-full">
                                                        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : employees.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                    No employees found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            employees.map((employee) => (
                                                <TableRow key={employee.id} className="hover:bg-slate-50/50">
                                                    <TableCell className="pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9 border border-indigo-100">
                                                                <AvatarImage className="object-cover" src={employee.profileImage || employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=random`} alt={employee.name} />
                                                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-900">{employee.name}</span>
                                                                <span className="text-xs text-muted-foreground">{employee.email}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            employee.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                employee.role === 'HR' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    'bg-slate-50 text-slate-700 border-slate-200'
                                                        }>
                                                            {employee.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-600">{employee.department}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            employee.status === "Active" ? "bg-green-100 text-green-700 border-green-200" :
                                                                employee.status === "Pending" ? "bg-orange-100 text-orange-700 border-orange-200" :
                                                                    employee.status === "Inactive" || employee.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200" :
                                                                        "bg-slate-100 text-slate-700 border-slate-200"
                                                        }>
                                                            {employee.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`text-sm ${employee.projectStatus === 'In Project' ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                                                            {employee.projectStatus || "Bench"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                                                onClick={() => setViewEmployee(employee)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                                                onClick={() => setEditEmployee(employee)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
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
                                        disabled={currentPage === 1 || isTableLoading}
                                        className="h-8"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage >= totalPages || isTableLoading}
                                        className="h-8"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* View Employee Dialog */}
                    <Dialog open={!!viewEmployee} onOpenChange={(open) => !open && setViewEmployee(null)}>
                        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-4 pb-4 border-b">
                                    <Avatar className="h-12 w-12 border-2 border-violet-100 shadow-md">
                                        <AvatarImage className="object-cover" src={viewEmployee?.profileImage || viewEmployee?.avatar || `https://ui-avatars.com/api/?name=${viewEmployee?.name}&background=random`} alt={viewEmployee?.name} />
                                        <AvatarFallback className="text-lg bg-violet-100 text-violet-700">
                                            {viewEmployee?.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span>{viewEmployee?.name}</span>
                                        <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">{viewEmployee?.role} Profile</span>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                {/* Company Details */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-violet-600">
                                        <Building2 className="h-4 w-4" /> Company Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border">
                                        {/* Row 1 */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Employee ID</Label>
                                            <p className="font-medium text-sm">{viewEmployee?.id}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Full Name</Label>
                                            <p className="font-medium text-sm">{viewEmployee?.name}</p>
                                        </div>
                                        <div className="overflow-hidden">
                                            <Label className="text-xs text-muted-foreground uppercase">Email</Label>
                                            <p className="font-medium text-sm truncate" title={viewEmployee?.email}>{viewEmployee?.email}</p>
                                        </div>

                                        {/* Row 2 */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Department</Label>
                                            <p className="font-medium text-sm">{viewEmployee?.department}</p>
                                        </div>
                                        <div className="overflow-hidden">
                                            <Label className="text-xs text-muted-foreground uppercase">Designation</Label>
                                            <p className="font-medium text-sm truncate" title={viewEmployee?.designation}>
                                                {viewEmployee?.designation || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Joining Date</Label>
                                            <p className="font-medium text-sm">
                                                {viewEmployee?.joiningDate
                                                    ? (viewEmployee.joiningDate.toString().includes('T') ? viewEmployee.joiningDate.toString().split('T')[0] : viewEmployee.joiningDate)
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Annual Package</Label>
                                            <p className="font-medium text-sm text-emerald-600">
                                                {viewEmployee?.package ? `₹ ${viewEmployee.package.toLocaleString()}` : "N/A"}
                                            </p>
                                        </div>

                                        {/* Row 3 */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Role</Label>
                                            <p className="font-medium text-sm text-slate-700">{viewEmployee?.role}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Project Status</Label>
                                            <p className="font-medium text-sm text-slate-700">{viewEmployee?.projectStatus || "Bench"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                                            <p className={`font-medium text-sm ${viewEmployee?.status === 'Active' ? 'text-green-600' : 'text-slate-600'}`}>
                                                {viewEmployee?.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-green-600">
                                        <Phone className="h-4 w-4" /> Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Phone Number</Label>
                                            <p className="font-medium text-sm">{viewEmployee?.phone || "N/A"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Address</Label>
                                            <p className="font-medium text-sm">{viewEmployee?.address || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Details */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-orange-600">
                                        <Heart className="h-4 w-4" /> Personal Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Date of Birth</Label>
                                            <p className="font-medium text-sm">
                                                {viewEmployee?.dob
                                                    ? (viewEmployee.dob.toString().includes('T') ? viewEmployee.dob.toString().split('T')[0] : viewEmployee.dob)
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Blood Group</Label>
                                            <p className="font-medium text-sm">{viewEmployee?.bloodGroup || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-red-600">
                                        <AlertCircle className="h-4 w-4" /> Emergency Contact
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Name</Label>
                                            <p className="font-medium text-sm">{viewEmployee?.emergencyContact?.name || "N/A"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Phone</Label>
                                            <p className="font-medium text-sm">{viewEmployee?.emergencyContact?.phone || "N/A"}</p>

                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Statutory Details (UAN) */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-600">
                                    <FileText className="h-4 w-4" /> Statutory Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">UAN Number</Label>
                                        <p className="font-medium text-sm">{viewEmployee?.uan || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Employee Dialog */}
                    <Dialog open={!!editEmployee} onOpenChange={(open) => !open && setEditEmployee(null)}>
                        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-3 pb-4 border-b">
                                    <div className="h-10 w-10 bg-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-200">
                                        <Edit className="h-6 w-6" />
                                    </div>
                                    Edit Employee Details
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                {/* Company Details Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-violet-600 flex items-center gap-2">
                                        <Building2 className="h-4 w-4" /> Company Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg bg-slate-50">
                                        {/* Row 1 */}
                                        <div className="space-y-2">
                                            <Label>Employee ID</Label>
                                            <Input
                                                value={editEmployee?.id}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, id: e.target.value } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input
                                                value={editEmployee?.name}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                value={editEmployee?.email}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, email: e.target.value } : null)}
                                                className="bg-white"
                                            />
                                        </div>

                                        {/* Row 2 */}
                                        <div className="space-y-2">
                                            <Label>Department</Label>
                                            <Select
                                                value={editEmployee?.department}
                                                onValueChange={(value) => setEditEmployee(prev => prev ? { ...prev, department: value } : null)}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Engineering">Engineering</SelectItem>
                                                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                                                    <SelectItem value="Sales">Sales</SelectItem>
                                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                                    <SelectItem value="IT">IT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Designation</Label>
                                            <Input
                                                value={editEmployee?.designation || ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, designation: e.target.value } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Joining Date</Label>
                                            <Input
                                                type="date"
                                                value={editEmployee?.joiningDate ? (editEmployee.joiningDate.toString().includes('T') ? editEmployee.joiningDate.toString().split('T')[0] : editEmployee.joiningDate) : ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, joiningDate: e.target.value } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Annual Package (₹)</Label>
                                            <Input
                                                type="number"
                                                value={editEmployee?.package || ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, package: parseFloat(e.target.value) } : null)}
                                                className="bg-white"
                                                placeholder="e.g. 1200000"
                                            />
                                        </div>

                                        {/* Row 3 */}
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Select
                                                value={editEmployee?.role}
                                                onValueChange={(value) => setEditEmployee(prev => prev ? { ...prev, role: value as any } : null)}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                                    <SelectItem value="HR">HR</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Project Status</Label>
                                            <Select
                                                value={editEmployee?.projectStatus || "Bench"}
                                                onValueChange={(value) => setEditEmployee(prev => prev ? { ...prev, projectStatus: value as "In Project" | "Bench" } : null)}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="In Project">In Project</SelectItem>
                                                    <SelectItem value="Bench">Bench</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select
                                                value={editEmployee?.status}
                                                onValueChange={(value) => setEditEmployee(prev => prev ? { ...prev, status: value as "Active" | "Inactive" } : null)}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Reset Password</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter new password to reset"
                                                    value={editEmployee?.password || ""}
                                                    onChange={(e) => setEditEmployee(prev => prev ? { ...prev, password: e.target.value } : null)}
                                                    className="bg-white border-red-200 focus-visible:ring-red-500 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input
                                                value={editEmployee?.phone || ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <Input
                                                value={editEmployee?.address || ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, address: e.target.value } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                                        <Heart className="h-4 w-4" /> Personal Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
                                        <div className="space-y-2">
                                            <Label>Date of Birth</Label>
                                            <Input
                                                type="date"
                                                value={editEmployee?.dob ? (editEmployee.dob.toString().includes('T') ? editEmployee.dob.toString().split('T')[0] : editEmployee.dob) : ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, dob: e.target.value } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Blood Group</Label>
                                            <Select
                                                value={editEmployee?.bloodGroup || ""}
                                                onValueChange={(value) => setEditEmployee(prev => prev ? { ...prev, bloodGroup: value } : null)}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A+">A+</SelectItem>
                                                    <SelectItem value="A-">A-</SelectItem>
                                                    <SelectItem value="B+">B+</SelectItem>
                                                    <SelectItem value="B-">B-</SelectItem>
                                                    <SelectItem value="AB+">AB+</SelectItem>
                                                    <SelectItem value="AB-">AB-</SelectItem>
                                                    <SelectItem value="O+">O+</SelectItem>
                                                    <SelectItem value="O-">O-</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" /> Emergency Contact
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={editEmployee?.emergencyContact?.name || ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? {
                                                    ...prev,
                                                    emergencyContact: { phone: "", ...prev.emergencyContact, name: e.target.value }
                                                } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input
                                                value={editEmployee?.emergencyContact?.phone || ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? {
                                                    ...prev,
                                                    emergencyContact: { name: "", ...prev.emergencyContact, phone: e.target.value }
                                                } : null)}
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Statutory Details (UAN) Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Statutory Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
                                        <div className="space-y-2">
                                            <Label>UAN Number</Label>
                                            <Input
                                                value={editEmployee?.uan || ""}
                                                onChange={(e) => setEditEmployee(prev => prev ? { ...prev, uan: e.target.value } : null)}
                                                className="bg-white"
                                                placeholder="Enter UAN Number"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                                <Button variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
                                <Button
                                    className="bg-violet-600 hover:bg-violet-700 text-white"
                                    onClick={handleUpdateEmployee}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog >
                </>
            )
            }
        </div >
    );
}

/* ======================
   COMPONENTS
   ====================== */

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
    color: "violet" | "green" | "orange" | "blue";
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
    };

    const currentStyle = styles[color];

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
