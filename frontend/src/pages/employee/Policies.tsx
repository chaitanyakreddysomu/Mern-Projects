import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Coffee, ShieldCheck, Home, BookOpen, FileText, AlertCircle, Briefcase, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const ICON_MAP: Record<string, LucideIcon> = {
    'Clock': Clock,
    'Coffee': Coffee,
    'ShieldCheck': ShieldCheck,
    'Home': Home,
    'BookOpen': BookOpen,
    'FileText': FileText,
    'AlertCircle': AlertCircle,
    'Briefcase': Briefcase
};

interface PolicyItem {
    label: string;
    value: string;
}

interface Policy {
    _id: string;
    title: string;
    iconName: string;
    items: PolicyItem[];
}

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

export default function Policies() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolicies = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/employee/policies', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPolicies(data);
                }
            } catch (error) {
                console.error("Failed to fetch policies", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPolicies();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading policies...</div>;
    }

    if (policies.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/30">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        Company Policies
                    </h1>
                </div>
                <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/5">
                    <h2 className="text-xl font-semibold mb-2">No Policies Found</h2>
                    <p className="text-muted-foreground">Company policies have not been published yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/30">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    Company Policies
                </h1>

            </div>

            {/* Policies Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {policies.map((policy, index) => {
                    const Icon = ICON_MAP[policy.iconName] || BookOpen;
                    const color = COLOR_STYLES[index % COLOR_STYLES.length];

                    return (
                        <Card
                            key={policy._id}
                            className={cn(
                                "group border-l-4 shadow-lg transition-all duration-300 hover:-translate-y-1",
                                color.card
                            )}
                        >
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
                })}
            </div>
        </div>
    );
}
