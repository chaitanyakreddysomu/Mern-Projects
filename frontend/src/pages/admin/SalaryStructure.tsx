
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Banknote, Percent, Calculator } from "lucide-react";

interface SalaryComponent {
    label: string;
    type: "Percentage" | "Fixed";
    value: number;
    baseComponent: "Gross" | "Basic";
}

interface SalaryStructure {
    _id: string;
    name: string;
    minSalary: number;
    maxSalary: number;
    earnings: SalaryComponent[];
    deductions: SalaryComponent[];
}

export default function SalaryStructurePage() {
    const [structures, setStructures] = useState<SalaryStructure[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Omit<SalaryStructure, "_id">>({
        name: "",
        minSalary: 0,
        maxSalary: 0,
        earnings: [
            { label: "Basic Salary", type: "Percentage", value: 50, baseComponent: "Gross" },
            { label: "HRA", type: "Percentage", value: 20, baseComponent: "Basic" }
        ],
        deductions: [
            { label: "PF", type: "Percentage", value: 12, baseComponent: "Basic" }
        ]
    });

    useEffect(() => {
        fetchStructures();
    }, []);

    const fetchStructures = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/salary-structures', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStructures(data);
            }
        } catch (error) {
            console.error("Fetch Error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = editingId
                ? `/api/admin/salary-structures/${editingId}`
                : '/api/admin/salary-structures';

            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchStructures();
                setIsDialogOpen(false);
                resetForm();
            } else {
                alert("Failed to save structure");
            }
        } catch (error) {
            console.error("Save Error", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this structure?")) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/admin/salary-structures/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStructures(prev => prev.filter(s => s._id !== id));
        } catch (error) {
            console.error("Delete Error", error);
        }
    };

    const handleEdit = (structure: SalaryStructure) => {
        setEditingId(structure._id);
        setFormData({
            name: structure.name,
            minSalary: structure.minSalary,
            maxSalary: structure.maxSalary,
            earnings: structure.earnings,
            deductions: structure.deductions
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: "",
            minSalary: 0,
            maxSalary: 0,
            earnings: [
                { label: "Basic Salary", type: "Percentage", value: 50, baseComponent: "Gross" }
            ],
            deductions: [
                { label: "PF", type: "Percentage", value: 12, baseComponent: "Basic" },
                { label: "ESI", type: "Percentage", value: 0.75, baseComponent: "Gross" },
                { label: "PT", type: "Fixed", value: 200, baseComponent: "Gross" },
                { label: "TDS", type: "Percentage", value: 10, baseComponent: "Gross" }
            ]
        });
    };

    const addComponent = (type: 'earnings' | 'deductions') => {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], { label: "", type: "Percentage", value: 0, baseComponent: "Gross" }]
        }));
    };

    const updateComponent = (
        section: 'earnings' | 'deductions',
        index: number,
        field: keyof SalaryComponent,
        value: any
    ) => {
        const updated = [...formData[section]];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, [section]: updated }));
    };

    const removeComponent = (section: 'earnings' | 'deductions', index: number) => {
        const updated = formData[section].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [section]: updated }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-600/30">
                            <Calculator className="h-6 w-6 text-white" />
                        </div>
                        Salary Structures
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-14">Define salary rules based on annual packages.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Structure
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-r-transparent mb-2"></div>
                    <p className="text-muted-foreground">Loading salary structures...</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {structures.map(structure => (
                        <Card key={structure._id} className="border hover:shadow-md transition-all">
                            <CardHeader className="bg-slate-50 border-b pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-800">{structure.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                                            ₹ {(structure.minSalary / 100000).toFixed(1)}L - ₹ {(structure.maxSalary / 100000).toFixed(1)}L / Year
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(structure)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(structure._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Earnings</h4>
                                    <div className="space-y-1">
                                        {structure.earnings.map((e, i) => (
                                            <div key={i} className="flex justify-between text-sm border-b border-dashed pb-1 last:border-0">
                                                <span className="text-slate-600">{e.label}</span>
                                                <span className="font-mono text-xs bg-slate-100 px-1 rounded">
                                                    {e.value}{e.type === 'Percentage' ? '%' : ''} of {e.baseComponent}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Deductions</h4>
                                    <div className="space-y-1">
                                        {structure.deductions.map((d, i) => (
                                            <div key={i} className="flex justify-between text-sm border-b border-dashed pb-1 last:border-0">
                                                <span className="text-slate-600">{d.label}</span>
                                                <span className="font-mono text-xs bg-slate-100 px-1 rounded">
                                                    {d.value}{d.type === 'Percentage' ? '%' : ''} of {d.baseComponent}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Structure" : "Create Salary Structure"}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                            <div className="space-y-2">
                                <Label>Structure Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Senior Level" />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Annual Package</Label>
                                <Input type="number" value={formData.minSalary} onChange={e => setFormData({ ...formData, minSalary: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Annual Package</Label>
                                <Input type="number" value={formData.maxSalary} onChange={e => setFormData({ ...formData, maxSalary: parseFloat(e.target.value) })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Earnings Section */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-emerald-50 p-3 border-b flex justify-between items-center">
                                    <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                                        <Banknote className="h-4 w-4" /> Earnings components
                                    </h3>
                                    <Button size="sm" variant="outline" onClick={() => addComponent('earnings')} className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                                        + Add
                                    </Button>
                                </div>
                                <div className="p-4 space-y-3 bg-white">
                                    {formData.earnings.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs">Label</Label>
                                                <Input className="h-8" value={item.label} onChange={e => updateComponent('earnings', index, 'label', e.target.value)} placeholder="Basic, HRA..." />
                                            </div>
                                            <div className="w-24 space-y-1">
                                                <Label className="text-xs">Type</Label>
                                                <Select value={item.type} onValueChange={v => updateComponent('earnings', index, 'type', v)}>
                                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Percentage">%</SelectItem>
                                                        <SelectItem value="Fixed">Fixed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-20 space-y-1">
                                                <Label className="text-xs">Value</Label>
                                                <Input className="h-8" type="number" value={item.value} onChange={e => updateComponent('earnings', index, 'value', parseFloat(e.target.value))} />
                                            </div>
                                            <div className="w-24 space-y-1">
                                                <Label className="text-xs">Base</Label>
                                                <Select value={item.baseComponent} onValueChange={v => updateComponent('earnings', index, 'baseComponent', v)}>
                                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Gross">Gross</SelectItem>
                                                        <SelectItem value="Basic">Basic</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeComponent('earnings', index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-red-50 p-3 border-b flex justify-between items-center">
                                    <h3 className="font-semibold text-red-800 flex items-center gap-2">
                                        <Percent className="h-4 w-4" /> Deduction components
                                    </h3>
                                    <Button size="sm" variant="outline" onClick={() => addComponent('deductions')} className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100">
                                        + Add
                                    </Button>
                                </div>
                                <div className="p-4 space-y-3 bg-white">
                                    {formData.deductions.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs">Label</Label>
                                                <Input className="h-8" value={item.label} onChange={e => updateComponent('deductions', index, 'label', e.target.value)} placeholder="PF, Tax..." />
                                            </div>
                                            <div className="w-24 space-y-1">
                                                <Label className="text-xs">Type</Label>
                                                <Select value={item.type} onValueChange={v => updateComponent('deductions', index, 'type', v)}>
                                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Percentage">%</SelectItem>
                                                        <SelectItem value="Fixed">Fixed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-20 space-y-1">
                                                <Label className="text-xs">Value</Label>
                                                <Input className="h-8" type="number" value={item.value} onChange={e => updateComponent('deductions', index, 'value', parseFloat(e.target.value))} />
                                            </div>
                                            <div className="w-24 space-y-1">
                                                <Label className="text-xs">Base</Label>
                                                <Select value={item.baseComponent} onValueChange={v => updateComponent('deductions', index, 'baseComponent', v)}>
                                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Gross">Gross</SelectItem>
                                                        <SelectItem value="Basic">Basic</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeComponent('deductions', index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Structure</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
