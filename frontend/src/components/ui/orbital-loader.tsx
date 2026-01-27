
import React from "react";
import { cn } from "@/lib/utils";

interface OrbitalLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    color?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

export const OrbitalLoader = ({
    className,
    color = "#ec4899", // pink-600 default (matches admin requests theme)
    size = "md",
    ...props
}: OrbitalLoaderProps) => {

    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24"
    };

    return (
        <div
            className={cn("relative flex items-center justify-center", sizeClasses[size], className)}
            {...props}
        >
            {/* Center Dot */}
            <div
                className="absolute w-[15%] h-[15%] rounded-full animate-pulse"
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            />

            {/* Outer Orbit */}
            <div className="absolute w-full h-full animate-[spin_3s_linear_infinite]">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[12%] h-[12%] rounded-full blur-[1px]"
                    style={{ backgroundColor: color }}
                />
            </div>

            {/* Inner Orbit (Reverse) */}
            <div className="absolute w-[60%] h-[60%] animate-[spin_2s_linear_infinite_reverse]">
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[18%] h-[18%] rounded-full blur-[0.5px]"
                    style={{ backgroundColor: color }}
                />
            </div>

            {/* Rings */}
            <div
                className="absolute w-full h-full rounded-full border opacity-10"
                style={{ borderColor: color }}
            />
            <div
                className="absolute w-[60%] h-[60%] rounded-full border opacity-10"
                style={{ borderColor: color }}
            />
        </div>
    );
};
