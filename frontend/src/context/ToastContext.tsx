import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 5s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case "success": return <CheckCircle2 className="h-5 w-5" />;
            case "error": return <AlertCircle className="h-5 w-5" />;
            case "warning": return <AlertTriangle className="h-5 w-5" />;
            default: return <Info className="h-5 w-5" />;
        }
    };

    const getStyles = (type: ToastType) => {
        switch (type) {
            case "success": return "bg-white border-green-500 text-green-700";
            case "error": return "bg-white border-red-500 text-red-700";
            case "warning": return "bg-white border-amber-500 text-amber-700";
            default: return "bg-white border-blue-500 text-blue-700";
        }
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto flex items-start gap-3 px-4 py-4 rounded-lg shadow-lg border-l-4 min-w-[320px] max-w-[400px] 
              animate-in slide-in-from-right-full duration-300
              ${getStyles(toast.type)}
            `}
                    >
                        <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
                        <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
