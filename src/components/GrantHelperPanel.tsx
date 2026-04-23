import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const GrantHelperPanel: React.FC<{ defaultOpen?: boolean; hideKeyword?: boolean }> = ({ defaultOpen = true, hideKeyword = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
                <span>Accepted grant formats</span>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {open && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-slate-200 pt-2">
                    <p className="mt-2 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Grant URL (simpler.grants.gov)</p>
                    <code className="block bg-white border border-slate-200 rounded px-2 py-1 font-mono text-[11px]">
                        https://simpler.grants.gov/opportunity/12345
                    </code>
                    <p className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">{hideKeyword ? 'Grant Title' : 'Grant Title / Keyword'}</p>
                    <code className="block bg-white border border-slate-200 rounded px-2 py-1 font-mono text-[11px]">
                        NSF Program on Quantum Computing 2026
                    </code>
                </div>
            )}
        </div>
    );
};
