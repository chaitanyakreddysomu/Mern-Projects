import { useState, useRef, useEffect } from "react";
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
    Loader2
} from "lucide-react";

export default function AdminProfile() {
    const { user: authUser, login } = useAuth(); // Added login
    const { addToast } = useToast(); // Added
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<any>(authUser || {});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // Added
    const [imageTimestamp, setImageTimestamp] = useState(Date.now());

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/admin/profile', { // Relative
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFormData(data);
                } else {
                    addToast("Failed to fetch profile", "error");
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (authUser) fetchProfile();
    }, [authUser, addToast]);

    const handleSave = async () => {
        setIsLoading(true);

        // Filter out read-only fields
        const payload = {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            dob: formData.dob,
            bloodGroup: formData.bloodGroup,
            emergencyContact: formData.emergencyContact
        };

        try {
            const token = localStorage.getItem('token');
            let uploadSuccess = true;

            // 1. Upload Image (if selected)
            if (selectedFile) {
                const imageFormData = new FormData();
                imageFormData.append('image', selectedFile);

                const imgRes = await fetch('/api/admin/profile-image', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: imageFormData
                });

                if (!imgRes.ok) {
                    uploadSuccess = false;
                    addToast("Failed to upload image", "error");
                }
            }

            if (!uploadSuccess && selectedFile) {
                setIsLoading(false);
                return;
            }

            // 2. Update Profile Data
            const response = await fetch('/api/admin/profile/edit', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setFormData({ ...formData, ...updatedUser.user });

                // Append timestamp to bust browser cache for the new image
                const userForContext = {
                    ...updatedUser.user,
                    profileImage: updatedUser.user.profileImage
                        ? `${updatedUser.user.profileImage}?t=${Date.now()}`
                        : updatedUser.user.profileImage
                };

                login(updatedUser.user.role, userForContext); // Update context
                setIsEditing(false);
                setSelectedFile(null);
                setPreviewImage(null);
                setImageTimestamp(Date.now());
                addToast("Profile updated successfully!", "success");
            } else {
                const err = await response.json();
                addToast(err.message || "Failed to update profile", "error");
            }
        } catch (error) {
            console.error("Error updating profile", error);
            addToast("Error updating profile", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (section: string, field: string, value: string) => {
        if (section === "root") {
            setFormData({ ...formData, [field]: value });
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

    if (isLoading && !formData.id) return <div className="p-10 text-center">Loading Profile...</div>;

    const displayUser = formData;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            {/* Page Title & Edit Button */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-orange-200 shadow-lg">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Profile</h1>
                </div>
                <Button
                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-blue-200 transition-all hover:scale-105"
                >
                    {isLoading ? (
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
                                    <AvatarImage src={previewImage || (displayUser.profileImage ? `${displayUser.profileImage}?t=${imageTimestamp}` : undefined) || `https://ui-avatars.com/api/?name=${displayUser.name}&background=ff4500&color=fff`} alt={displayUser.name} />
                                    <AvatarFallback className="text-2xl bg-muted">{displayUser.name?.charAt(0)}</AvatarFallback>
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
                                <h2 className="text-2xl font-bold text-foreground capitalize">{displayUser.name}</h2>
                            </div>
                            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2 text-sm">
                                <Briefcase className="h-3.5 w-3.5" />
                                {displayUser.designation}
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
                                <Input disabled value={displayUser.id || ''} className="border-blue-100 pl-3 h-11 focus-visible:ring-blue-500 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
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
                                <Input value={displayUser.email || ''} disabled className="border-blue-100 pl-10 h-11 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</Label>
                            <div className="relative">
                                <Input disabled value={displayUser.department || ''} className="border-blue-100 pl-3 h-11 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Designation</Label>
                            <div className="relative">
                                <Input disabled value={displayUser.designation || ''} className="border-blue-100 pl-3 h-11 disabled:opacity-100 disabled:text-foreground disabled:bg-background" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joining Date</Label>
                            <DatePicker
                                date={displayUser.joiningDate ? parseISO(displayUser.joiningDate) : undefined}
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

        </div>
    );
}
