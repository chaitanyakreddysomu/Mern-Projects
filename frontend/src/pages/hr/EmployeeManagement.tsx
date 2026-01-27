import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Edit, ClipboardList, Users, UserCheck, UserX, Eye, Phone, Building2, Heart, AlertCircle, FileText, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/types";

export default function HREmployeeManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [projectFilter, setProjectFilter] = useState("All");
    const [roleFilter, setRoleFilter] = useState("All");

    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [viewEmployee, setViewEmployee] = useState<User | null>(null);
    const [editEmployee, setEditEmployee] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const token = localStorage.getItem('token');
                // Build query parameters based on filters
                const params = new URLSearchParams();
                if (searchTerm) params.append('search', searchTerm);
                if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
                if (projectFilter && projectFilter !== 'All') params.append('project', projectFilter);
                if (roleFilter && roleFilter !== 'All') params.append('role', roleFilter);
                const queryString = params.toString() ? `?${params.toString()}` : '';
                const res = await apiFetch(`/api/hr/employees${queryString}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllEmployees(data);
                }
            } catch (error) {
                console.error("Failed to fetch employees", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [searchTerm, statusFilter, projectFilter, roleFilter]);



    const totalEmployees = allEmployees.filter(u => u.status === "Active").length;
    const activeEmployees = allEmployees.filter(u => u.role === "EMPLOYEE" && u.status === "Active").length;
    const benchEmployees = allEmployees.filter(u => u.role === "EMPLOYEE" && u.projectStatus !== "In Project" && u.status === "Active").length;
    // Pending requests would ideally come from a different API, leaving as placeholder or 0 for now as we don't have that in user object
    const pendingRequests = 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/30">
                        <ClipboardList className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employee Management</h1>
                        {/* <p className="text-muted-foreground">Manage employee records and onboarding.</p> */}
                    </div>
                </div>
                {/* <Button className="bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-700 active:scale-95 transition-all">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Employee
                </Button> */}
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-4">
                <StatCard
                    title="Total Employees"
                    value={totalEmployees.toString()}
                    color="violet"
                    icon={Users}
                />
                <StatCard
                    title="Active Employees"
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
                    title="Requests"
                    value={pendingRequests.toString()}
                    subtitle="Pending Approvals"
                    color="blue"
                    icon={ClipboardList}
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
                        <div className="flex flex-1 w-full gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Status</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={projectFilter} onValueChange={setProjectFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="All Projects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Projects</SelectItem>
                                    <SelectItem value="In Project">In Project</SelectItem>
                                    <SelectItem value="Bench">On Bench</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Roles</SelectItem>
                                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Loading employee data...
                                        </TableCell>
                                    </TableRow>
                                ) : allEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No employees found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    allEmployees.map((employee) => (
                                        <TableRow key={employee._id} className="hover:bg-transparent">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={employee.profileImage || employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=random`} />
                                                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{employee.name}</span>
                                                        <span className="text-xs text-muted-foreground">{employee.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={employee.role === 'HR' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                                >
                                                    {employee.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{employee.department || "N/A"}</TableCell>
                                            <TableCell>
                                                <Badge variant={employee.status === "Active" ? "success" : "secondary"}>
                                                    {employee.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={employee.projectStatus === "In Project" ? "default" : "secondary"}>
                                                    {employee.projectStatus || "Bench"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        className="h-8 w-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-md shadow-violet-600/20"
                                                        onClick={() => setViewEmployee(employee)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            {/* View Employee Dialog */}
            <Dialog open={!!viewEmployee} onOpenChange={(open) => !open && setViewEmployee(null)}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 pb-4 border-b">
                            <Avatar className="h-12 w-12 border-2 border-violet-100 shadow-md">
                                <AvatarImage src={viewEmployee?.profileImage || viewEmployee?.avatar || `https://ui-avatars.com/api/?name=${viewEmployee?.name}&background=random`} />
                                <AvatarFallback className="bg-violet-600 text-white">
                                    {viewEmployee?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            {viewEmployee?.name}'s Profile
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
                                        {viewEmployee?.joiningDate ? new Date(viewEmployee.joiningDate).toLocaleDateString() : "N/A"}
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
                                        {viewEmployee?.dob ? new Date(viewEmployee.dob).toLocaleDateString() : "N/A"}
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
                                        onValueChange={(val) => setEditEmployee(prev => prev ? { ...prev, department: val } : null)}
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
                                        value={editEmployee?.joiningDate || ""}
                                        onChange={(e) => setEditEmployee(prev => prev ? { ...prev, joiningDate: e.target.value } : null)}
                                        className="bg-white"
                                    />
                                </div>

                                {/* Row 3 */}
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={editEmployee?.role}
                                        onValueChange={(val) => setEditEmployee(prev => prev ? { ...prev, role: val as any } : null)}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                            <SelectItem value="HR">HR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Project Status</Label>
                                    <Select
                                        value={editEmployee?.projectStatus || "Bench"}
                                        onValueChange={(val) => setEditEmployee(prev => prev ? { ...prev, projectStatus: val as "In Project" | "Bench" } : null)}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select Project Status" />
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
                                        onValueChange={(val) => setEditEmployee(prev => prev ? { ...prev, status: val as "Active" | "Inactive" } : null)}
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
                                        value={editEmployee?.dob || ""}
                                        onChange={(e) => setEditEmployee(prev => prev ? { ...prev, dob: e.target.value } : null)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Blood Group</Label>
                                    <Select
                                        value={editEmployee?.bloodGroup || ""}
                                        onValueChange={(val) => setEditEmployee(prev => prev ? { ...prev, bloodGroup: val } : null)}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select Blood Group" />
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

                        {/* Statutory Details (UAN) Edit - Read Only for HR */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Statutory Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
                                <div className="space-y-2">
                                    <Label>UAN Number <span className="text-xs text-muted-foreground">(Admin Edit Only)</span></Label>
                                    <Input
                                        value={editEmployee?.uan || ""}
                                        disabled
                                        className="bg-slate-100 text-muted-foreground"
                                        placeholder="UAN Number"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                        <Button variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white">Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog >
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
