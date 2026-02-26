import React, { useState, useRef } from 'react';
import { X, Paperclip, FileText, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { FacultyInput } from '../types';

interface FacultyInputRowProps {
    faculty: FacultyInput;
    index: number;
    onChange: (updated: FacultyInput) => void;
    onRemove: () => void;
    canRemove: boolean;
}

const SAMPLE_FORMAT = `Email (required):
  afern@oregonstate.edu

OSU Profile URL (required):
  https://engineering.oregonstate.edu/people/afern

CV or Resume (optional — PDF file):
  Upload your CV PDF using the button above`;

export const FacultyInputRow: React.FC<FacultyInputRowProps> = ({
    faculty,
    index,
    onChange,
    onRemove,
    canRemove,
}) => {
    // Helper panel is expanded by default only on the first card
    const [helperExpanded, setHelperExpanded] = useState(index === 0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isFirst = index === 0;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            onChange({ ...faculty, cvFile: file });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeCv = () => onChange({ ...faculty, cvFile: undefined });

    return (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">
                    Faculty {index + 1}
                </span>
                {canRemove && (
                    <button
                        onClick={onRemove}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove faculty"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="p-5 space-y-4">
                {/* Helper panel — only on first card */}
                {isFirst && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 overflow-hidden">
                        <button
                            onClick={() => setHelperExpanded(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Sample input format
                            </div>
                            {helperExpanded
                                ? <ChevronUp className="w-4 h-4" />
                                : <ChevronDown className="w-4 h-4" />
                            }
                        </button>
                        {helperExpanded && (
                            <pre className="px-4 pb-4 text-xs text-blue-700 font-mono leading-relaxed whitespace-pre bg-blue-50">
                                {SAMPLE_FORMAT}
                            </pre>
                        )}
                    </div>
                )}

                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={faculty.email}
                        onChange={e => onChange({ ...faculty, email: e.target.value })}
                        placeholder="afern@oregonstate.edu"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-400"
                    />
                </div>

                {/* OSU Profile URL */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                        OSU Profile URL <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="url"
                        value={faculty.osuUrl}
                        onChange={e => onChange({ ...faculty, osuUrl: e.target.value })}
                        placeholder="https://engineering.oregonstate.edu/people/afern"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-400"
                    />
                </div>

                {/* CV Upload */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                        CV / Resume <span className="text-slate-400 font-normal">(optional · PDF only)</span>
                    </label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                    />
                    {faculty.cvFile ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="bg-red-500 rounded p-1 text-white flex-shrink-0">
                                <FileText className="w-3 h-3" />
                            </div>
                            <span className="text-xs text-slate-700 truncate flex-1">{faculty.cvFile.name}</span>
                            <button
                                onClick={removeCv}
                                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg hover:border-green-400 hover:text-green-600 transition-colors w-full"
                        >
                            <Paperclip className="w-4 h-4" />
                            Attach PDF
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
