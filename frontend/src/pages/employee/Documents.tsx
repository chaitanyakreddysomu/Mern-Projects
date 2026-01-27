import { useState, useEffect, useRef } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/context/ToastContext";
import {
    Eye,
    Download,
    Upload,
    CheckCircle2,
    Clock,
    XCircle,
    FileText,
    CreditCard,
    IdCard,
    BookOpen,
    GraduationCap,
    Image as ImageIcon,
    Briefcase,
    FileBadge,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ======================
   TYPES
   ====================== */
interface DocItem {
    id: string;
    name: string;
    // status: "Verified" | "Rejected" | "Review"; // REMOVED: Now from DB
    // uploaded: boolean; // REMOVED: Now checked dynamically
}

/* ======================
   ICON + COLOR CONFIG
   ====================== */
const DOC_UI: Record<
    string,
    { icon: any; iconBg: string; iconColor: string }
> = {
    aadhaar: { icon: IdCard, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    pan: { icon: CreditCard, iconBg: "bg-green-100", iconColor: "text-green-600" },
    passport: { icon: FileBadge, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },

    "10th": { icon: BookOpen, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    "12th": { icon: BookOpen, iconBg: "bg-fuchsia-100", iconColor: "text-fuchsia-600" },
    degree: { icon: GraduationCap, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },

    photo: { icon: ImageIcon, iconBg: "bg-pink-100", iconColor: "text-pink-600" },
    resume: { icon: FileText, iconBg: "bg-slate-100", iconColor: "text-slate-700" },
    offer: { icon: Briefcase, iconBg: "bg-amber-100", iconColor: "text-amber-700" },

    training: { icon: Briefcase, iconBg: "bg-yellow-100", iconColor: "text-yellow-700" },
};

/* ======================
   DATA TEMPLATE
   ====================== */
const DOCUMENTS: Record<
    "Government" | "Educational" | "Personal" | "Experience",
    DocItem[]
> = {
    Government: [
        { id: "aadhaar", name: "Aadhaar Card" },
        { id: "pan", name: "PAN Card" },
        { id: "passport", name: "Passport" },
    ],
    Educational: [
        { id: "10th", name: "10th Certificate" },
        { id: "12th", name: "12th Certificate" },
        { id: "degree", name: "Degree Certificate" },
    ],
    Personal: [
        { id: "photo", name: "Photo" },
        { id: "offer", name: "Offer Letter" },
        { id: "resume", name: "Resume" },
    ],
    Experience: [
        { id: "training", name: "Training Certificates" },
    ],
};

const TABS = ["Government", "Educational", "Personal", "Experience"] as const;

/* ======================
   COMPONENT
   ====================== */
export default function Documents() {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Government");
    const [userDocs, setUserDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/employee/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserDocs(data.documents || []);
            }
        } catch (error) {
            console.error("Fetch docs error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUploadClick = (docId: string) => {
        setUploadingDocId(docId);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !uploadingDocId) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('document', file);
        formData.append('docId', uploadingDocId);

        // Find doc name from TEMPLATE
        let docName = "";
        Object.values(DOCUMENTS).flat().forEach(d => {
            if (d.id === uploadingDocId) docName = d.name;
        });
        formData.append('name', docName);
        formData.append('category', activeTab);

        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/employee/documents/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                addToast("Document uploaded successfully", "success");
                // Refresh list or update local state
                setUserDocs(prev => {
                    const existingIdx = prev.findIndex(d => d.docId === uploadingDocId);
                    if (existingIdx > -1) {
                        const newDocs = [...prev];
                        newDocs[existingIdx] = data.document;
                        return newDocs;
                    }
                    return [...prev, data.document];
                });
            } else {
                const err = await res.json();
                addToast(err.message || "Upload failed", "error");
            }
        } catch (error) {
            console.error("Upload error", error);
            addToast("Upload failed", "error");
        } finally {
            setIsUploading(false);
            setUploadingDocId(null);
        }
    };

    const handlePreview = async (path: string) => {
        try {
            const token = localStorage.getItem('token');
            // Using encodeURIComponent to safely pass the path
            const res = await fetch(`/api/employee/documents/preview?path=${encodeURIComponent(path)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                window.open(data.url, '_blank');
            } else {
                addToast("Failed to get preview URL", "error");
            }
        } catch (error) {
            console.error("Preview error", error);
            addToast("Preview failed", "error");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HIDDEN INPUT */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />

            {/* HEADER */}
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <FileText className="h-6 w-6 text-white" />
                </div>
                My Documents
            </h1>

            {/* FULL WIDTH SEGMENTED TABS */}
            <div className="relative grid grid-cols-4 w-full bg-white rounded-xl border border-yellow-600 shadow-lg shadow-yellow-600/30 p-1 select-none">
                <span
                    className={cn(
                        "absolute inset-1 w-[calc(25%-0.25rem)] rounded-lg bg-yellow-600 transition-transform duration-300 ease-in-out",
                        activeTab === "Government" && "translate-x-0",
                        activeTab === "Educational" && "translate-x-full",
                        activeTab === "Personal" && "translate-x-[200%]",
                        activeTab === "Experience" && "translate-x-[300%]"
                    )}
                />

                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "relative z-10 w-full py-2 text-sm font-semibold rounded-lg transition-colors",
                            activeTab === tab ? "text-white" : "text-slate-800"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {DOCUMENTS[activeTab].map((doc) => {
                        const userDoc = userDocs.find(d => d.docId === doc.id);
                        return (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                userDoc={userDoc}
                                onUpload={() => handleUploadClick(doc.id)}
                                onPreview={handlePreview}
                                isUploading={isUploading && uploadingDocId === doc.id}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ======================
   DOCUMENT CARD
   ====================== */
function DocumentCard({
    doc,
    userDoc,
    onUpload,
    onPreview,
    isUploading
}: {
    doc: DocItem;
    userDoc: any;
    onUpload: () => void; // Trigger upload
    onPreview: (path: string) => void;
    isUploading: boolean;
}) {
    const ui = DOC_UI[doc.id] ?? {
        icon: FileText,
        iconBg: "bg-slate-100",
        iconColor: "text-slate-600",
    };

    const Icon = ui.icon;
    const isUploaded = !!userDoc;
    const status = userDoc?.status;

    return (
        <Card className="shadow-md border border-yellow-400 hover:shadow-yellow-400/30 bg-white flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            ui.iconBg,
                            ui.iconColor
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                        {doc.name}
                    </CardTitle>
                </div>

                {isUploaded ? (
                    <Badge
                        className={cn(
                            "text-xs gap-1",
                            status === "Verified" &&
                            "bg-green-100 text-green-700",
                            status === "Review" &&
                            "bg-yellow-100 text-yellow-700",
                            status === "Rejected" &&
                            "bg-red-100 text-red-700"
                        )}
                    >
                        {status === "Verified" && <CheckCircle2 className="h-3 w-3" />}
                        {status === "Review" && <Clock className="h-3 w-3" />}
                        {status === "Rejected" && <XCircle className="h-3 w-3" />}
                        {status || "Uploaded"}
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="text-xs">
                        Not Uploaded
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-end">
                {isUploaded ? (
                    <div className="space-y-3">
                        {status === "Rejected" && userDoc.rejectionReason && (
                            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-100 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold block mb-0.5">Rejection Reason:</span>
                                    {userDoc.rejectionReason}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-all shadow-sm hover:shadow"
                                onClick={() => onPreview(userDoc.path)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition-all shadow-sm hover:shadow"
                                onClick={onUpload} // Allow re-upload
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Update
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center cursor-pointer hover:bg-purple-50 transition-colors group"
                        onClick={onUpload}
                    >
                        {isUploading ? (
                            <div className="h-10 w-10 flex items-center justify-center mx-auto mb-3">
                                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                            </div>
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="h-5 w-5" />
                            </div>
                        )}
                        <p className="text-sm font-medium">{isUploading ? "Uploading..." : "Click to upload"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PDF, Images (Max 10MB)
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
