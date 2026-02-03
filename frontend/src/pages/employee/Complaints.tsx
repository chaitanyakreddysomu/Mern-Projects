import { useState, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MessageSquare, AlertCircle, CheckCircle, Clock, MessageSquareWarning, Sparkles, Wand2, Loader2 } from "lucide-react";
// import { MOCK_COMPLAINTS } from "@/data/mock";
import * as React from "react"
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

const TextareaSimple = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
TextareaSimple.displayName = "Textarea"

export default function Complaints() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [complaints, setComplaints] = useState<any[]>([]);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchComplaints = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/employee/complaints', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setComplaints(data);
            }
        } catch (error) {
            console.error("Failed to fetch complaints", error);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleSubmit = async () => {
        if (!subject || !description) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/employee/complaints', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subject, description })
            });
            if (res.ok) {
                setIsDialogOpen(false);
                setSubject("");
                setDescription("");
                fetchComplaints();
            }
        } catch (error) {
            console.error("Failed to submit complaint", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="h-10 w-10 bg-destructive rounded-lg flex items-center justify-center shadow-lg shadow-destructive/30">
                            <MessageSquareWarning className="h-6 w-6 text-white" />
                        </div>

                        Complaints & Grievances
                    </h1>
                    {/* <p className="text-muted-foreground mt-1 ml-14">Report issues or raise grievances directly to HR.</p> */}
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-destructive text-white shadow-lg shadow-destructive/30 hover:bg-destructive/90 hover:scale-105 active:scale-95 transition-all duration-300">

                            <PlusCircle className="mr-2 h-4 w-4" /> Raise Complaint
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-5 w-5" />
                                New Grievance
                            </DialogTitle>
                            <DialogDescription>
                                Please provide detailed information to help us resolve your issue efficiently.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">

                            {/* AI GENERATION SECTION */}
                            <div className="space-y-2 p-4 bg-orange-50/50 rounded-lg border border-dashed border-orange-200">
                                <Label className="text-orange-700 flex items-center gap-2 font-medium">
                                    <Sparkles className="h-4 w-4 text-orange-500" />
                                    AI Complaint Assistant
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. AC is not working in the meeting room since yesterday..."
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        className="bg-white border-orange-200 focus-visible:ring-orange-500"
                                    />
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            if (!aiPrompt) return;
                                            setIsGenerating(true);
                                            try {
                                                const token = localStorage.getItem('token');
                                                if (!token) {
                                                    alert("Authentication token not found. Please log in again.");
                                                    setIsGenerating(false);
                                                    return;
                                                }

                                                const res = await apiFetch('/api/ai/generate-complaint', {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${token}` },
                                                    body: JSON.stringify({ complaint: aiPrompt })
                                                });

                                                const data = await res.json();

                                                if (res.ok) {
                                                    setSubject(data.subject);
                                                    setDescription(data.description);
                                                } else {
                                                    if (data.message === "Invalid Token" || data.message === "Access Denied") {
                                                        alert("Your session has expired or is invalid. Please log out and log in again.");
                                                    } else {
                                                        alert(`Failed to generate: ${data.message}`);
                                                    }
                                                }
                                            } catch (e) {
                                                console.error("AI Request Failed", e);
                                                alert("Something went wrong. Please check console.");
                                            } finally {
                                                setIsGenerating(false);
                                            }
                                        }}
                                        disabled={isGenerating || !aiPrompt}
                                        className="bg-orange-600 text-white shrink-0 hover:bg-orange-700"
                                    >
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                        {isGenerating ? "Generating..." : "Auto-Fill"}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Briefly describe the issue. AI will generate a formal subject and detailed description.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base">Subject</Label>
                                <Input
                                    placeholder="Short summary of the issue"
                                    className="h-11"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-base">Detailed Description</Label>
                                <TextareaSimple
                                    placeholder="Please describe the incident, including dates, times, and any relevant details..."
                                    className="min-h-[200px] resize-none leading-relaxed"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Your complaint will be handled with strict confidentiality by the HR department.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                className="px-8 shadow-sm"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? "Submitting..." : "Submit Complaint"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {complaints.length === 0 ? (
                    <Card className="text-center py-16 border-dashed border-2 bg-muted/10">
                        <CardContent>
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">No complaints filed</h3>
                            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">You haven't raised any complaints yet. If you have any issues, please let us know.</p>
                        </CardContent>
                    </Card>
                ) : (
                    complaints.map(complaint => {
                        const status = complaint.status;

                        // Define styles based on status
                        let statusStyles = {
                            card: "bg-red-50/50 border-l-red-500 shadow-red-500/10 hover:shadow-red-500/20",
                            text: "text-red-700",
                            bg: "bg-red-100/50 text-red-800",
                            badge: "bg-red-600 hover:bg-red-700",
                            icon: <AlertCircle className="h-5 w-5" />
                        };

                        if (status === "Investigating") {
                            statusStyles = {
                                card: "bg-orange-50/50 border-l-orange-500 shadow-orange-500/10 hover:shadow-orange-500/20",
                                text: "text-orange-700",
                                bg: "bg-orange-100/50 text-orange-800",
                                badge: "bg-orange-600 hover:bg-orange-700",
                                icon: <Clock className="h-5 w-5" />
                            };
                        } else if (status === "Resolved") {
                            statusStyles = {
                                card: "bg-green-50/50 border-l-green-500 shadow-green-500/10 hover:shadow-green-500/20",
                                text: "text-green-700",
                                bg: "bg-green-100/50 text-green-800",
                                badge: "bg-green-600 hover:bg-green-700",
                                icon: <CheckCircle className="h-5 w-5" />
                            };
                        }

                        return (
                            <Card
                                key={complaint._id || complaint.id}
                                className={cn(
                                    "group hover:-translate-y-1 transition-all duration-300 border-l-4 shadow-lg",
                                    statusStyles.card
                                )}
                            >
                                <CardHeader className="pb-3 md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="space-y-3 flex-1">
                                        <CardTitle className={cn(
                                            "text-lg font-bold flex items-center gap-2",
                                            statusStyles.text
                                        )}>
                                            {statusStyles.icon}
                                            {complaint.subject}
                                        </CardTitle>

                                        <div className={cn(
                                            "p-3 rounded-md text-sm font-medium",
                                            statusStyles.bg
                                        )}>
                                            <p className="leading-relaxed mb-2 max-h-20 overflow-y-auto whitespace-pre-wrap scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-200">{complaint.description}</p>
                                            <div className={cn(
                                                "flex items-center gap-2 text-xs opacity-80",
                                                statusStyles.text
                                            )}>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(complaint.date), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={cn("uppercase text-[10px] tracking-wider px-2 py-0.5 h-6 shrink-0", statusStyles.badge)}>
                                        {complaint.status}
                                    </Badge>
                                </CardHeader>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
