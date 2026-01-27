import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Clock,
    Coffee,
    ShieldCheck,
    Home,
    BookOpen,
    PlusCircle,
    Edit,
    Trash2,
    X,
    Briefcase,
    AlertCircle,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface PolicyItem {
    label: string;
    value: string;
}

interface Policy {
    id: string; // Front-end uses 'id' (mapped from _id)
    title: string;
    iconName: string;
    items: PolicyItem[];
}

// --- ICON MAP ---
const ICON_MAP: Record<string, any> = {
    Clock,
    Coffee,
    ShieldCheck,
    Home,
    BookOpen,
    Briefcase,
    AlertCircle
};

const COLOR_STYLES = [
    {
        card: "bg-blue-50/60 border-l-blue-500 shadow-blue-500/15",
        icon: "bg-blue-600 text-white",
        title: "text-blue-700",
        content: "bg-blue-100/60 text-blue-900",
    },
    {
        card: "bg-green-50/60 border-l-green-500 shadow-green-500/15",
        icon: "bg-green-600 text-white",
        title: "text-green-700",
        content: "bg-green-100/60 text-green-900",
    },
    {
        card: "bg-purple-50/60 border-l-purple-500 shadow-purple-500/15",
        icon: "bg-purple-600 text-white",
        title: "text-purple-700",
        content: "bg-purple-100/60 text-purple-900",
    },
    {
        card: "bg-orange-50/60 border-l-orange-500 shadow-orange-500/15",
        icon: "bg-orange-600 text-white",
        title: "text-orange-700",
        content: "bg-orange-100/60 text-orange-900",
    },
    {
        card: "bg-teal-50/60 border-l-teal-500 shadow-teal-500/15",
        icon: "bg-teal-600 text-white",
        title: "text-teal-700",
        content: "bg-teal-100/60 text-teal-900",
    },
];

export default function AdminPolicies() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [iconName, setIconName] = useState("BookOpen");
    const [formItems, setFormItems] = useState<PolicyItem[]>([{ label: "", value: "" }]);

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/admin/policies', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map _id to id for frontend compatibility
                const mapped = data.map((p: any) => ({ ...p, id: p._id }));
                setPolicies(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch policies", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleOpenDialog = (policy?: Policy) => {
        if (policy) {
            setEditingPolicy(policy);
            setTitle(policy.title);
            setIconName(policy.iconName);
            setFormItems(policy.items.map(i => ({ ...i }))); // Deep copy
        } else {
            setEditingPolicy(null);
            setTitle("");
            setIconName("BookOpen");
            setFormItems([{ label: "", value: "" }]);
        }
        setIsDialogOpen(true);
    };

    const handleAddItem = () => {
        setFormItems([...formItems, { label: "", value: "" }]);
    };

    const handleRemoveItem = (index: number) => {
        setFormItems(formItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: 'label' | 'value', text: string) => {
        const newItems = [...formItems];
        newItems[index][field] = text;
        setFormItems(newItems);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const payload = {
            title,
            iconName,
            items: formItems.filter(item => item.label.trim() !== "" || item.value.trim() !== "")
        };

        try {
            let res;
            if (editingPolicy) {
                res = await fetch(`http://localhost:5000/api/admin/policies/${editingPolicy.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('http://localhost:5000/api/admin/policies', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                fetchPolicies();
                setIsDialogOpen(false);
            } else {
                alert("Failed to save policy");
            }
        } catch (error) {
            console.error("Save error", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this policy?")) {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`http://localhost:5000/api/admin/policies/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    fetchPolicies();
                } else {
                    alert("Failed to delete policy");
                }
            } catch (error) {
                console.error("Delete error", error);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/30">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    Company Policies (Admin)
                </h1>
                <Button onClick={() => handleOpenDialog()} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Policy
                </Button>
            </div>

            {/* Policies Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {loading ? (
                    <div className="col-span-2 flex justify-center py-10">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                            <p>Loading policies...</p>
                        </div>
                    </div>
                ) : policies.length === 0 ? (
                    <div className="col-span-2 text-center py-10 text-muted-foreground">No policies found. Click "Add Policy" to create one.</div>
                ) : (
                    policies.map((policy, index) => {
                        const Icon = ICON_MAP[policy.iconName] || BookOpen;
                        const color = COLOR_STYLES[index % COLOR_STYLES.length];

                        return (
                            <Card
                                key={policy.id}
                                className={cn(
                                    "group border-l-4 shadow-lg transition-all duration-300 hover:-translate-y-1 relative",
                                    color.card
                                )}
                            >
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm" onClick={() => handleOpenDialog(policy)}>
                                        <Edit className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-8 w-8 shadow-sm" onClick={() => handleDelete(policy.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div
                                        className={cn(
                                            "h-12 w-12 rounded-lg flex items-center justify-center shadow-md transition-transform group-hover:scale-110",
                                            color.icon
                                        )}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    <CardTitle
                                        className={cn("text-xl font-bold", color.title)}
                                    >
                                        {policy.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="pt-2">
                                    <div
                                        className={cn(
                                            "p-4 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4",
                                            color.content
                                        )}
                                    >
                                        {policy.items.map((item, i) => (
                                            <div key={i}>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.label}
                                                </p>
                                                <p className="font-semibold">
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }))}
            </div>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPolicy ? "Edit Policy" : "Add New Policy"}</DialogTitle>
                        <DialogDescription>
                            Configure the policy details and items.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Policy Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Work Timings"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon</Label>
                            <select
                                id="icon"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={iconName}
                                onChange={(e) => setIconName(e.target.value)}
                            >
                                {Object.keys(ICON_MAP).map(key => (
                                    <option key={key} value={key}>{key}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Policy Items (Key-Value Pairs)</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-7 text-xs">
                                    <PlusCircle className="mr-1 h-3 w-3" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                                {formItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <div className="grid gap-1 flex-1">
                                            <Input
                                                placeholder="Label (e.g. Start Time)"
                                                value={item.label}
                                                onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                                                className="h-8 text-xs bg-white"
                                            />
                                            <Input
                                                placeholder="Value (e.g. 9:00 AM)"
                                                value={item.value}
                                                onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                                                className="h-8 text-xs bg-white font-medium"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 mt-4"
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={formItems.length === 1}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">Save Policy</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
