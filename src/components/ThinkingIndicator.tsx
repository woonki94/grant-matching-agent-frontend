import React, { useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ThinkingIndicatorProps {
    logs: string[];
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ logs }) => {
    // Scroll to bottom when logs update
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="w-full max-w-2xl mx-auto my-4 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <div className="w-4 h-4 text-green-600 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <span className="font-medium text-slate-700 text-sm">Reasoning Process</span>
            </div>

            <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {logs.map((log, index) => {
                    // All logs in the list are technically "past" or "current".
                    // The last one is the current one happening.
                    const isCurrent = index === logs.length - 1;

                    return (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center gap-3 text-sm transition-all duration-300",
                                isCurrent && "opacity-100 transform scale-[1.01]"
                            )}
                        >
                            <div className={cn(
                                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border",
                                isCurrent ? "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-100" :
                                    "bg-green-100 border-green-200 text-green-600"
                            )}>
                                {isCurrent ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Check className="w-3.5 h-3.5" />
                                )}
                            </div>

                            <span className={cn(
                                "font-medium",
                                isCurrent ? "text-slate-900" :
                                    "text-slate-600"
                            )}>
                                {log}
                            </span>

                            {isCurrent && (
                                <span className="ml-auto text-xs text-slate-400 animate-pulse">
                                    Processing...
                                </span>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};
