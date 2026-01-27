import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase } from "lucide-react";

export default function Projects() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">Manage ongoing and upcoming projects.</p>
                </div>
                <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" /> New Project
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">HRMS Development</CardTitle>
                                <Badge>In Progress</Badge>
                            </div>
                            <CardDescription>Internal Tool</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Building a comprehensive HRMS system with React and Python.
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <span>Team Size: 8</span>
                                </div>
                                <div className="pt-2">
                                    <div className="text-xs flex justify-between mb-1">
                                        <span>Progress</span>
                                        <span>65%</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 w-[65%]"></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
