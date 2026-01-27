import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext"; // Added
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DatePicker from "@/components/modern-ui/date-picker";
import { parseISO, format } from "date-fns";
import {
    User as UserIcon,
    Building2,
    Phone,
    Save,
    Briefcase,
    MapPin,
    Mail,
    Heart,
    AlertCircle,
    Pencil,
    Camera,
    CreditCard,
    FileText,
    Loader2,
    CheckCircle
} from "lucide-react";

export default function Profile() {
    const { user, login } = useAuth();
    const { addToast } = useToast(); // Added
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingBankDetails, setIsFetchingBankDetails] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // Added
    const [imageTimestamp, setImageTimestamp] = useState(Date.now());

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await apiFetch('/api/employee/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFormData(data);
                } else {
                    console.error("Failed to fetch profile");
                    addToast("Failed to fetch profile", "error");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [addToast]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            let uploadSuccess = true;

            // 1. Upload Image (if selected)
            if (selectedFile) {
                const imageFormData = new FormData();
                imageFormData.append('image', selectedFile);

                const imgRes = await apiFetch('/api/employee/profile-image', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: imageFormData
                });

                if (!imgRes.ok) {
                    uploadSuccess = false;
                    addToast("Failed to upload image", "error");
                }
            }

            if (!uploadSuccess && selectedFile) return;

            // 2. Update Profile Data
            const res = await apiFetch('/api/employee/profile', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const result = await res.json();
                const updatedUser = result.user || result; // Handle {message, user} or just user
                setIsEditing(false);
                setFormData(updatedUser);

                // Append timestamp to bust browser cache for the new image
                const userForContext = {
                    ...updatedUser,
                    profileImage: updatedUser.profileImage
                        ? `${updatedUser.profileImage}?t=${Date.now()}`
                        : updatedUser.profileImage
                };

                login(updatedUser.role, userForContext); // Update context
                setSelectedFile(null);
                setPreviewImage(null);
                setImageTimestamp(Date.now());
                addToast("Profile updated successfully!", "success");
            } else {
                console.error("Failed to update profile");
                addToast("Failed to update profile", "error");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            addToast("Error updating profile", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (section: string, field: string, value: string) => {
        if (section === "root") {
            setFormData({ ...formData, [field]: value });
        } else if (section === "bankDetails") {
            setFormData({
                ...formData,
                bankDetails: { ...(formData.bankDetails || {}), [field]: value }
            });
        } else if (section === "emergencyContact") {
            setFormData({
                ...formData,
                emergencyContact: { ...(formData.emergencyContact || {}), [field]: value }
            });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file); // Store file
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDateChange = (field: string, date: Date | undefined) => {
        const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
        setFormData({ ...formData, [field]: formattedDate });
    };

    const handleIFSCChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.toUpperCase();

        // Update state immediately for user feedback
        handleInputChange('bankDetails', 'ifsc', value);

        if (value.length === 11) {
            setIsFetchingBankDetails(true);
            try {
                const response = await fetch(`https://ifsc.razorpay.com/${value}`);
                if (response.ok) {
                    const data = await response.json();
                    setFormData((prev: any) => ({
                        ...prev,
                        bankDetails: {
                            ...prev.bankDetails,
                            ifsc: value,
                            bankName: data.BANK,
                            branch: data.BRANCH
                        }
                    }));
                } else {
                    console.error("Invalid IFSC Code");
                }
            } catch (error) {
                console.error("Error fetching IFSC details:", error);
            } finally {
                setIsFetchingBankDetails(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            {/* Page Title & Edit Button */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-orange-200 shadow-lg">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
                </div>
                <Button
                    onClick={() => {
                        if (isEditing) {
                            handleSave();
                        } else {
                            setIsEditing(true);
                        }
                    }}
                    disabled={isSaving}
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-blue-200 transition-all hover:scale-105"
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                        <>
                            {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                            {isEditing ? "Save Profile" : "Edit Profile"}
                        </>
                    )}
                </Button>
            </div>

            {/* Main Profile Header Card */}
            <Card className="border border-orange-500 shadow-xl bg-white overflow-hidden ring-1 ring-black/5 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Left Side: Profile Image */}
                        <div className="relative group shrink-0">
                            <div className="h-24 w-24 rounded-full border-2 border-orange-500 shadow-2xl shadow-blue-100 p-1 bg-white overflow-hidden group-hover:scale-105 transition-transform duration-300 relative">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={previewImage || (formData.profileImage ? `${formData.profileImage}?t=${imageTimestamp}` : undefined) || `https://ui-avatars.com/api/?name=${formData.name}&background=ff4500&color=fff`} alt={formData.name} />
                                    <AvatarFallback className="text-2xl bg-muted">{formData.name ? formData.name.charAt(0) : 'U'}</AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <div
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="h-6 w-6 text-white" />
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>

                        {/* Right Side: Name and Details */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center md:items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-foreground">{formData.name}</h2>
                            </div>
                            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2 text-sm">
                                <Briefcase className="h-3.5 w-3.5" />
                                {formData.designation}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Company Details Section - Blue Theme */}
            <Card className="border-2 border-blue-100 shadow-lg shadow-blue-50/50 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-blue-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">Company Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee ID</Label>
                            <div className="relative">
                                <Input disabled value={formData.id || ''} className="border-blue-100 pl-3 h-11 focus-visible:ring-blue-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                            <div className="relative">
                                <Input value={formData.name || ''} onChange={(e) => handleInputChange('root', 'name', e.target.value)} disabled={!isEditing} className="bg-background border-blue-100 hover:border-blue-300 pl-3 h-11 focus-visible:ring-blue-500 transition-colors disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-blue-500" />
                                <Input value={formData.email || ''} disabled className="border-blue-100 pl-10 h-11 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</Label>
                            <div className="relative">
                                <Input disabled value={formData.department || ''} className="border-blue-100 pl-3 h-11 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Designation</Label>
                            <div className="relative">
                                <Input disabled value={formData.designation || ''} className="border-blue-100 pl-3 h-11 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joining Date</Label>
                            <DatePicker
                                date={formData.joiningDate ? parseISO(formData.joiningDate) : undefined}
                                setDate={() => { }}
                                disabled={true}
                                className="h-11 border-blue-100 disabled:opacity-100 disabled:text-foreground disabled:bg-background w-full"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information - Green Theme */}
            <Card className="border-2 border-green-100 shadow-lg shadow-green-50/50 hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300 overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-green-50/50 to-transparent border-b border-green-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-200 group-hover:scale-110 transition-transform duration-300">
                            <Phone className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">Contact Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-green-600" />
                                <Input value={formData.phone || ''} onChange={(e) => handleInputChange('root', 'phone', e.target.value)} disabled={!isEditing} className="pl-10 h-11 border-green-100 focus-visible:ring-green-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-green-600" />
                                <Input value={formData.address || ''} onChange={(e) => handleInputChange('root', 'address', e.target.value)} disabled={!isEditing} className="pl-10 h-11 border-green-100 focus-visible:ring-green-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Details - Orange Theme */}
            <Card className="border-2 border-orange-100 shadow-lg shadow-orange-50/50 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-orange-50/50 to-transparent border-b border-orange-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform duration-300">
                            <Heart className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">Personal Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date of Birth</Label>
                            <DatePicker
                                date={formData.dob ? parseISO(formData.dob) : undefined}
                                setDate={(date) => handleDateChange('dob', date)}
                                disabled={!isEditing}
                                className="h-11 border-orange-100 focus-visible:ring-orange-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blood Group</Label>
                            <div className="relative">
                                <select
                                    value={formData.bloodGroup || ''}
                                    onChange={(e) => handleInputChange('root', 'bloodGroup', e.target.value)}
                                    disabled={!isEditing}
                                    className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-11 border-orange-100 focus-visible:ring-orange-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background appearance-none"
                                >
                                    <option value="" disabled>Select Blood Group</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Emergency Contact - Red Theme */}
            <Card className="border-2 border-red-100 shadow-lg shadow-red-50/50 hover:shadow-xl hover:shadow-red-100/50 transition-all duration-300 overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-red-50/50 to-transparent border-b border-red-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-destructive rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:scale-110 transition-transform duration-300">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">Emergency Contact</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Contact Name</Label>
                            <Input value={formData.emergencyContact?.name || ''} onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)} disabled={!isEditing} className="h-11 border-red-100 focus-visible:ring-red-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Contact Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-destructive" />
                                <Input value={formData.emergencyContact?.phone || ''} onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)} disabled={!isEditing} className="pl-10 h-11 border-red-100 focus-visible:ring-red-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bank Details - Purple Theme */}
            <Card className="border-2 border-purple-100 shadow-lg shadow-purple-50/50 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent border-b border-purple-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform duration-300">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">Bank Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Holder Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.bankDetails?.holderName || ""}
                                onChange={(e) => handleInputChange('bankDetails', 'holderName', e.target.value)}
                                disabled={!isEditing}
                                className="h-11 border-purple-100 focus-visible:ring-purple-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Number <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.bankDetails?.accountNumber || ""}
                                onChange={(e) => handleInputChange('bankDetails', 'accountNumber', e.target.value)}
                                disabled={!isEditing}
                                className="h-11 border-purple-100 focus-visible:ring-purple-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IFSC Code <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.bankDetails?.ifsc || ""}
                                onChange={handleIFSCChange}
                                disabled={!isEditing}
                                className="h-11 border-purple-100 focus-visible:ring-purple-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bank Name <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input
                                    value={formData.bankDetails?.bankName || ""}
                                    disabled={true}
                                    className="h-11 border-purple-100 focus-visible:ring-purple-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background pr-10"
                                />
                                <div className="absolute right-3 top-3">
                                    {isFetchingBankDetails ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    ) : formData.bankDetails?.bankName ? (
                                        <CheckCircle className="h-5 w-5 text-green-600 fill-green-100" />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch Name <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input
                                    value={formData.bankDetails?.branch || ""}
                                    disabled={true}
                                    className="h-11 border-purple-100 focus-visible:ring-purple-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background pr-10"
                                />
                                <div className="absolute right-3 top-3">
                                    {isFetchingBankDetails ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    ) : formData.bankDetails?.branch ? (
                                        <CheckCircle className="h-5 w-5 text-green-600 fill-green-100" />
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statutory Details (UAN) - Slate Theme */}
            <Card className="border-2 border-slate-200 shadow-lg shadow-slate-100 hover:shadow-xl hover:shadow-slate-200 transition-all duration-300 overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-slate-100 to-transparent border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-slate-300 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground">Statutory Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">UAN Number</Label>
                            <div className="relative">
                                <Input
                                    value={formData.uan || "Not assigned yet"}
                                    disabled
                                    className="h-11 border-slate-200 bg-slate-50 text-muted-foreground font-medium disabled:opacity-100"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-2 max-w-2xl">
                                Universal Account Number (UAN) is your permanent PF ID assigned by EPFO. It remains same throughout your career.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
