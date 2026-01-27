import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, XCircle, UserPlus, Phone, Building2, Briefcase, Shield, Search } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function HREmployeeRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                search: searchTerm
            });
            const response = await apiFetch(`/api/hr/pending-requests?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchRequests();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const token = localStorage.getItem('token');
            const response = await apiFetch(`/api/hr/pending-requests/${id}?status=${action}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setRequests(prev => prev.filter(r => r._id !== id));
                setSelectedRequest(null);
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <div className="h-10 w-10 bg-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-600/30">
                        <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    Employee Registration Requests
                </h1>
                <p className="text-muted-foreground mt-1 ml-14">Approve or reject new employee account requests.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border">
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="w-full h-10 pl-10 pr-4 bg-white"
                            placeholder="Search by name, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <Card className="shadow-md border-none">
                <CardHeader className="bg-pink-50/50 border-b">
                    <CardTitle className="text-pink-800">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="pl-6 h-12">Name</TableHead>
                                    <TableHead className="h-12">Email</TableHead>
                                    <TableHead className="h-12">Phone</TableHead>
                                    <TableHead className="h-12">Department</TableHead>
                                    <TableHead className="h-12 text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Loading requests...
                                        </TableCell>
                                    </TableRow>
                                ) : requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No pending requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((request) => (
                                        <TableRow key={request._id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="pl-6 font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border">
                                                        {request.name?.charAt(0)}
                                                    </div>
                                                    {request.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{request.email}</TableCell>
                                            <TableCell>{request.phone}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{request.department}</span>
                                                    <span className="text-xs text-muted-foreground">{request.designation}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                                        onClick={() => setSelectedRequest(request)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <div className="w-px h-4 bg-slate-300 mx-1 self-center"></div>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleAction(request._id, 'approve')}
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleAction(request._id, 'reject')}
                                                        title="Reject"
                                                    >
                                                        <XCircle className="h-4 w-4" />
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

            {/* View Request Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <UserPlus className="h-5 w-5 text-pink-600" />
                            User Registration Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6 pt-2">
                            {/* Basic Info */}
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border">
                                <div className="h-12 w-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-lg">
                                    {selectedRequest.name?.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-lg">{selectedRequest.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Shield className="h-3.5 w-3.5" /> Role
                                    </Label>
                                    <Badge
                                        variant="secondary"
                                        className="font-semibold bg-blue-100 text-blue-700"
                                    >
                                        {selectedRequest.role}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5" /> Phone
                                    </Label>
                                    <p className="font-medium text-sm">{selectedRequest.phone || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Briefcase className="h-3.5 w-3.5" /> Designation
                                    </Label>
                                    <p className="font-medium text-sm">{selectedRequest.designation || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5" /> Department
                                    </Label>
                                    <p className="font-medium text-sm">{selectedRequest.department || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Label className="text-xs text-muted-foreground uppercase">Submitted Password</Label>
                                <div className="bg-slate-100 p-2 rounded text-sm font-mono mt-1 text-slate-500">
                                    ********
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 mt-6 grid grid-cols-2 w-full">
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleAction(selectedRequest._id, 'reject')}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleAction(selectedRequest._id, 'approve')}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
