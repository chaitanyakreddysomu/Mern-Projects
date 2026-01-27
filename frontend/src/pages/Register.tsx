import { useState } from "react";
import { apiFetch } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, User, Mail, Phone, Building, Briefcase, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Register() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        role: "EMPLOYEE",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    department: formData.department,
                    designation: formData.designation,
                    role: formData.role.toUpperCase(),
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration successful! Please login.");
                navigate("/login");
            } else {
                alert(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
            <Card className="w-full max-w-[600px] shadow-sm border border-gray-100 bg-white">
                <CardContent className="p-8">
                    {/* TABS */}
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
                        <Link to="/login" className="w-1/2 flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            Sign In
                        </Link>
                        <div className="w-1/2 flex items-center justify-center bg-white shadow-sm rounded-md py-2 text-sm font-semibold text-gray-900 cursor-default">
                            Sign Up
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">New Employee Registration</h2>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* FULL NAME */}
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-gray-700 font-medium text-sm">Full Name *</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="name"
                                    className="pl-10 h-11 bg-white border-gray-200"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* EMAIL */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    placeholder="yourname@gmail.com"
                                    type="email"
                                    className="pl-10 h-11 bg-white border-gray-200"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* PHONE */}
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-gray-700 font-medium text-sm">Phone *</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="phone"
                                    placeholder="9876543210"
                                    type="tel"
                                    className="pl-10 h-11 bg-white border-gray-200"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* DEPARTMENT */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium text-sm">Department *</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                                <select
                                    id="department"
                                    className="pl-10 h-11 bg-white border border-gray-200 w-full appearance-none rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>Select Department</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="HR">HR</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                            </div>
                        </div>

                        {/* DESIGNATION */}
                        <div className="space-y-1.5">
                            <Label htmlFor="designation" className="text-gray-700 font-medium text-sm">Designation *</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="designation"
                                    className="pl-10 h-11 bg-white border-gray-200"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* ROLE */}
                        <div className="space-y-1.5">
                            <Label className="text-gray-700 font-medium text-sm">Role *</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                                <select
                                    id="role"
                                    className="pl-10 h-11 bg-white border border-gray-200 w-full appearance-none rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="HR">HR</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        {/* PASSWORD */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-gray-700 font-medium text-sm">Password *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="pl-10 pr-10 h-11 bg-white border-gray-200"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-gray-400"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-sm">Confirm Password *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="pl-10 pr-10 h-11 bg-white border-gray-200"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3.5 text-gray-400"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold" type="submit" disabled={isLoading}>
                                {isLoading ? "Signing Up..." : "Sign Up"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-11 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                                onClick={() => navigate("/login")}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* COPYRIGHT */}
            <div className="mt-8 text-center text-xs text-gray-500 font-medium">
                © Inner Circle Softech PVT LTD 2025
            </div>
        </div>
    );
}
