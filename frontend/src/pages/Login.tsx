import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Phone, Building, Briefcase, CheckCircle2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import icsLogo from "../assets/ics_logo.jpeg";

export function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState<"login" | "register">("login");
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // Login State
    const [showPassword, setShowPassword] = useState(false);
    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });

    // Register State
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Clear messages when switching views
    const handleSetView = (newView: "login" | "register") => {
        setView(newView);
        setErrorMsg(null);
        setSuccessMsg(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                login(data.user.role || "EMPLOYEE", data.user);
                navigate("/");
            } else {
                setErrorMsg(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMsg("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            login("EMPLOYEE");
            navigate("/");
        }, 1000);
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.confirmPassword) {
            setErrorMsg("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.fullname,
                    email: data.email,
                    phone: data.phone,
                    department: data.department,
                    designation: data.designation,
                    role: data.role.toString().toUpperCase(),
                    password: data.password
                })
            });

            const result = await res.json();

            if (res.ok) {
                setSuccessMsg("Registration successful! Please sign in.");
                handleSetView("login");
            } else {
                setErrorMsg(result.message || "Registration failed");
            }
        } catch (error) {
            console.error("Register Error:", error);
            setErrorMsg("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden w-full font-sans bg-gray-50">
            {/* Left Panel - Fixed */}
            <div className="hidden lg:flex w-[45%] h-full bg-gradient-to-br from-blue-600 to-indigo-800 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm mb-8 shadow-2xl">
                        <img
                            src={icsLogo}
                            alt="ICS Logo"
                            className="w-24 h-24 object-contain rounded-lg"
                        />
                    </div>

                    <h1 className="text-3xl font-bold mb-4 tracking-tight">
                        Inner Circle Softech PVT LTD
                    </h1>

                    <p className="text-lg text-blue-100 mb-10 font-medium">
                        Human Resource Management System
                    </p>

                    <div className="space-y-4 text-left w-full pl-4">
                        <div className="flex items-center gap-3 text-blue-50">
                            <span className="bg-blue-500/30 p-1.5 rounded-full">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </span>
                            <span className="text-base font-medium">Streamlined Employee Management</span>
                        </div>
                        <div className="flex items-center gap-3 text-blue-50">
                            <span className="bg-blue-500/30 p-1.5 rounded-full">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </span>
                            <span className="text-base font-medium">Real-time Attendance Tracking</span>
                        </div>
                        <div className="flex items-center gap-3 text-blue-50">
                            <span className="bg-blue-500/30 p-1.5 rounded-full">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </span>
                            <span className="text-base font-medium">Comprehensive HR Analytics</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Scrollable */}
            <div className="flex-1 h-full overflow-y-auto bg-gray-50">
                <div className="min-h-full flex flex-col justify-center items-center p-6 md:p-12 relative animate-in fade-in duration-500">
                    <Card className={`w-full shadow-lg border border-blue-100 bg-white transition-all duration-300 ${view === "register" ? "max-w-[600px]" : "max-w-[500px]"}`}>
                        <CardContent className="p-8 md:p-10">
                            {/* Tab Switcher */}
                            <div className="flex bg-gray-100/80 p-1.5 rounded-xl mb-8 w-full max-w-sm mx-auto">
                                <button
                                    onClick={() => handleSetView("login")}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${view === "login"
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => handleSetView("register")}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${view === "register"
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Sign Up
                                </button>
                            </div>

                            {/* MESSAGES */}
                            {errorMsg && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-red-500 rotate-45" /> {errorMsg}
                                </div>
                            )}
                            {successMsg && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" /> {successMsg}
                                </div>
                            )}

                            {view === "login" ? (
                                /* LOGIN FORM */
                                <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">Email</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input
                                                id="email"
                                                placeholder="youremail@gmail.com"
                                                className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                value={loginData.email}
                                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">Password</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••••••"
                                                className="pl-10 pr-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <Button
                                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all rounded-lg"
                                            type="submit"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Signing In..." : (
                                                <span className="flex items-center gap-2">
                                                    Sign In <ArrowRight className="h-4 w-4" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                /* REGISTER FORM */
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="mb-6 text-center">
                                        <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
                                        <p className="text-sm text-muted-foreground">Enter your details to register</p>
                                    </div>

                                    <form onSubmit={handleRegister} className="space-y-4">
                                        {/* Simplified two-column grid for register form */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="fullname" className="text-gray-700 font-medium text-sm">Full Name *</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                                <Input id="fullname" name="fullname" placeholder="Your Full Name" className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" required />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email *</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                                <Input id="email" name="email" placeholder="yourname@gmail.com" type="email" className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" required />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="phone" className="text-gray-700 font-medium text-sm">Phone *</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                                    <Input id="phone" name="phone" placeholder="9876543210" type="tel" className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" required />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="designation" className="text-gray-700 font-medium text-sm">Designation *</Label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                                    <Input id="designation" name="designation" placeholder="Software Engineer" className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" required />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-gray-700 font-medium text-sm">Department *</Label>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                                                    <div className="pl-0">
                                                        <select
                                                            name="department"
                                                            className="appearance-none pl-10 h-11 w-full bg-gray-50/50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                                            required
                                                        >
                                                            <option value="" disabled selected>Department</option>
                                                            <option value="Engineering">Engineering</option>
                                                            <option value="HR">HR</option>
                                                            <option value="Sales">Sales</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-gray-700 font-medium text-sm">Role *</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                                                    <select
                                                        name="role"
                                                        className="appearance-none pl-10 h-11 w-full bg-gray-50/50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                                        required
                                                    >
                                                        <option value="EMPLOYEE">Employee</option>
                                                        <option value="HR">HR</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="reg-password" className="text-gray-700 font-medium text-sm">Password *</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="reg-password"
                                                    name="password"
                                                    type={showRegisterPassword ? "text" : "password"}
                                                    placeholder="••••••••••••"
                                                    className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="confirm-password" className="text-gray-700 font-medium text-sm">Confirm Password *</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="confirm-password"
                                                    name="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••••••"
                                                    className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <Button className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20" type="submit" disabled={isLoading}>
                                                {isLoading ? "Signing Up..." : "Create Account"}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-gray-400 font-medium pb-4">
                        © Inner Circle Softech PVT LTD 2025
                    </div>
                </div>
            </div>

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent className="sm:max-w-[400px] p-6">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <DialogTitle className="text-lg font-bold text-gray-900">Forgot Password?</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <div className="mb-4">
                            <Lock className="h-16 w-16 text-gray-300" strokeWidth={1.5} />
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-2">Contact Admin</h3>

                        <div className="space-y-3 mb-6">
                            <p className="text-gray-500 text-sm px-4 leading-relaxed">
                                To reset your password, please contact your system administrator.
                            </p>
                            <p className="text-gray-500 text-sm">
                                They will help you recover your account access.
                            </p>
                        </div>

                        <DialogClose asChild>
                            <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 rounded-lg">
                                Got it
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
