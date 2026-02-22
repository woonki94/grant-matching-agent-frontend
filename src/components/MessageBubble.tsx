import React, { useState } from 'react';
import { User, Bot, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Message, GroupMatchResult } from '../types';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Collapsible group match card
const GroupMatchCard: React.FC<{ match: GroupMatchResult }> = ({ match }) => {
    const [expanded, setExpanded] = useState(false);
    const j = match.justification;

    return (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col gap-3 hover:border-indigo-400 transition-colors">
            {/* Header: Grant title + agency + team names */}
            <div className="flex justify-between items-start gap-3">
                <div>
                    <h4 className="font-semibold text-indigo-900 leading-tight text-base">
                        <a
                            href={`https://simpler.grants.gov/opportunity/${match.grant_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                        >
                            {match.grant_title}
                        </a>
                    </h4>
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">{match.agency_name || 'N/A'}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {match.team_members.map((m) => (
                            <span key={m.faculty_id} className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                                {m.faculty_name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grant description */}
            <p className="text-xs text-slate-600 leading-relaxed">{j.one_paragraph}</p>

            {/* Team roles */}
            <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">Team Roles:</div>
                {j.member_roles.map((mr) => (
                    <div key={mr.faculty_id} className="p-2 bg-white rounded border border-indigo-100">
                        <div className="text-xs font-semibold text-indigo-800">{match.team_members.find(m => m.faculty_id === mr.faculty_id)?.faculty_name} — {mr.role}</div>
                        <p className="text-xs text-slate-600 mt-1">{mr.why}</p>
                    </div>
                ))}
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="text-xs font-semibold text-amber-800 mb-1">📋 Recommendation:</div>
                <p className="text-xs text-amber-700 leading-relaxed">{j.recommendation}</p>
            </div>

            {/* Expand/collapse for details */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium self-start transition-colors"
            >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Show less' : 'Show coverage & strengths'}
            </button>

            {expanded && (
                <div className="space-y-3 border-t border-indigo-200 pt-3">
                    {/* Coverage */}
                    <div className="space-y-2">
                        {j.coverage.strong.length > 0 && (
                            <div>
                                <div className="text-xs font-semibold text-green-700">✅ Strong Coverage:</div>
                                <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5 mt-1">
                                    {j.coverage.strong.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                        {j.coverage.partial.length > 0 && (
                            <div>
                                <div className="text-xs font-semibold text-yellow-700">⚠️ Partial Coverage:</div>
                                <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5 mt-1">
                                    {j.coverage.partial.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                        {j.coverage.missing.length > 0 && (
                            <div>
                                <div className="text-xs font-semibold text-red-700">❌ Missing:</div>
                                <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5 mt-1">
                                    {j.coverage.missing.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Member strengths */}
                    <div>
                        <div className="text-xs font-semibold text-slate-700 mb-1">Member Strengths:</div>
                        {j.member_strengths.map((ms) => (
                            <div key={ms.faculty_id} className="mb-2">
                                <div className="text-xs font-semibold text-indigo-700">
                                    {match.team_members.find(m => m.faculty_id === ms.faculty_id)?.faculty_name}
                                </div>
                                <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5 mt-0.5">
                                    {ms.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Why not working */}
                    {j.why_not_working.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-red-700">⚠️ Potential Challenges:</div>
                            <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5 mt-1">
                                {j.why_not_working.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={cn("flex w-full gap-4 p-6", isUser ? "bg-white" : "bg-slate-50 flex-row-reverse")}>
            <div className="flex-shrink-0 flex flex-col items-center">
                <div className={cn(
                    "w-8 h-8 rounded-sm flex items-center justify-center",
                    isUser ? "bg-transparent" : "bg-green-500"
                )}>
                    {isUser ? (
                        <User className="w-6 h-6 text-slate-400" />
                    ) : (
                        <Bot className="w-5 h-5 text-white" />
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-hidden">
                <div className={cn("prose prose-slate max-w-none leading-7 text-slate-800 break-words", !isUser && "text-right")}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {message.attachments.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg border border-slate-200 w-fit max-w-xs">
                                <div className="bg-red-500 rounded p-1.5 text-white">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* One-to-one matching results */}
                {message.results && message.results.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                        <div className="text-sm font-semibold text-slate-600 mb-1">Grant Opportunities</div>
                        {message.results.map((result, index) => (
                            <div key={index} className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col gap-1 group hover:border-blue-300 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-blue-900 leading-tight">
                                            <a
                                                href={`https://simpler.grants.gov/opportunity/${result.opportunity_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                {result.title}
                                            </a>
                                        </h4>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">{result.agency || 'N/A'}</span>
                                    </div>
                                    <span className="text-xs text-blue-600 font-medium bg-green-100 px-2 py-1 rounded-full flex-shrink-0">
                                        {result.llm_score !== undefined
                                            ? `${(result.llm_score * 100).toFixed(0)}% LLM Score`
                                            : `${(result.score * 100).toFixed(0)}% Match`
                                        }
                                    </span>
                                </div>

                                {result.why_good_match && result.why_good_match.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="text-xs font-semibold text-slate-700">Why this is a good match:</div>
                                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                                            {result.why_good_match.map((reason, idx) => (
                                                <li key={idx} className="leading-relaxed">{reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {result.suggested_pitch && (
                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                        <div className="text-xs font-semibold text-green-800 mb-1">💡 Suggested Pitch:</div>
                                        <p className="text-xs text-green-700 leading-relaxed">{result.suggested_pitch}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Group matching results */}
                {message.groupResults && message.groupResults.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3">
                        <div className="text-sm font-semibold text-slate-600 mb-1">Group Matching Results</div>
                        {message.groupResults.map((gm, index) => (
                            <GroupMatchCard key={index} match={gm} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
