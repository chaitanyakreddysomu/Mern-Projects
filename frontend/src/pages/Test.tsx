import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Test() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleDemoLogin = (role: "EMPLOYEE" | "HR" | "ADMIN") => {
        login(role);
        navigate("/");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">Test Access</CardTitle>
                    <CardDescription>Select a mock role to login directly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        className="w-full h-14 text-lg justify-start gap-4"
                        variant="outline"
                        onClick={() => handleDemoLogin("EMPLOYEE")}
                    >
                        <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-900">
                            <User className="h-6 w-6 text-blue-600 dark:text-blue-200" />
                        </div>
                        Login as Employee
                    </Button>

                    <Button
                        className="w-full h-14 text-lg justify-start gap-4"
                        variant="outline"
                        onClick={() => handleDemoLogin("HR")}
                    >
                        <div className="bg-purple-100 p-2 rounded-full dark:bg-purple-900">
                            <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-200" />
                        </div>
                        Login as HR
                    </Button>

                    <Button
                        className="w-full h-14 text-lg justify-start gap-4"
                        variant="outline"
                        onClick={() => handleDemoLogin("ADMIN")}
                    >
                        <div className="bg-red-100 p-2 rounded-full dark:bg-red-900">
                            <Shield className="h-6 w-6 text-red-600 dark:text-red-200" />
                        </div>
                        Login as Admin
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
