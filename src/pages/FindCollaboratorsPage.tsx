import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { streamFindCollaborators } from '../lib/api';
import { FacultyInputRow } from '../components/FacultyInputRow';
import { ThinkingIndicator } from '../components/ThinkingIndicator';
import type { FacultyInput, FacultySuggestion, StreamEvent } from '../types';

function makeFaculty(): FacultyInput {
    return { id: `${Date.now()}-${Math.random()}`, email: '', osuUrl: '', cvFile: undefined };
}

// ── Grant helper panel ────────────────────────────────────────────────────────

const GrantHelperPanel: React.FC = () => {
    const [open, setOpen] = useState(true);
    return (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 font-semibold text-slate-700"
            >
                <span>Accepted grant formats</span>
                {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {open && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-slate-200">
                    <p className="mt-2 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Grant URL (simpler.grants.gov)</p>
                    <code className="block bg-white border border-slate-200 rounded px-2 py-1 font-mono text-[11px]">
                        https://simpler.grants.gov/opportunity/12345
                    </code>
                    <p className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Grant Title / Keyword</p>
                    <code className="block bg-white border border-slate-200 rounded px-2 py-1 font-mono text-[11px]">
                        NSF Program on Quantum Computing 2026
                    </code>
                </div>
            )}
        </div>
    );
};

// ── Collaborator card ─────────────────────────────────────────────────────────

const CollaboratorCard: React.FC<{ faculty: FacultySuggestion; rank: number }> = ({ faculty, rank }) => {
    const [expanded, setExpanded] = useState(false);
    const pct = Math.round((faculty.llm_score ?? faculty.domain_score) * 100);
    const hasDetails = !!(
        faculty.research_domains?.length ||
        faculty.application_domains?.length ||
        faculty.covered?.length ||
        faculty.missing?.length
    );

    return (
        <div className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm hover:border-emerald-300 transition-colors space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        {rank}
                    </span>
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm leading-snug truncate">
                            {faculty.name ?? faculty.email}
                        </p>
                        {faculty.name && (
                            <p className="text-xs text-slate-500">{faculty.email}</p>
                        )}
                        {faculty.position && (
                            <p className="text-xs text-slate-500 mt-0.5">{faculty.position}</p>
                        )}
                    </div>
                </div>
                <span className="flex-shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    {pct}% match
                </span>
            </div>

            {/* LLM one-line reason */}
            {faculty.reason && (
                <p className="text-xs text-slate-600 italic leading-relaxed">{faculty.reason}</p>
            )}

            {/* Expertise tags */}
            {faculty.expertise && faculty.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {faculty.expertise.slice(0, 4).map((e, i) => (
                        <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                    {faculty.expertise.length > 4 && (
                        <span className="text-[11px] text-slate-400">+{faculty.expertise.length - 4} more</span>
                    )}
                </div>
            )}

            {/* Covered / Missing chips */}
            {(faculty.covered?.length || faculty.missing?.length) && (
                <div className="flex flex-wrap gap-1.5">
                    {(faculty.covered || []).slice(0, 3).map((c, i) => (
                        <span key={i} className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            ✓ {c}
                        </span>
                    ))}
                    {(faculty.missing || []).slice(0, 2).map((m, i) => (
                        <span key={i} className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            ✗ {m}
                        </span>
                    ))}
                </div>
            )}

            {hasDetails && (
                <>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                        {expanded ? '▲ Hide details' : '▼ Show research areas'}
                    </button>
                    {expanded && (
                        <div className="space-y-2.5 border-t border-emerald-100 pt-3">
                            {faculty.research_domains && faculty.research_domains.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Research Domains</p>
                                    <p className="text-xs text-slate-700 mt-1">{faculty.research_domains.join(' · ')}</p>
                                </div>
                            )}
                            {faculty.application_domains && faculty.application_domains.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Application Domains</p>
                                    <p className="text-xs text-slate-700 mt-1">{faculty.application_domains.join(' · ')}</p>
                                </div>
                            )}
                            {faculty.covered && faculty.covered.length > 3 && (
                                <div>
                                    <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">All Covered Topics</p>
                                    <p className="text-xs text-slate-700 mt-1">{faculty.covered.join(', ')}</p>
                                </div>
                            )}
                            {faculty.missing && faculty.missing.length > 2 && (
                                <div>
                                    <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">All Missing Topics</p>
                                    <p className="text-xs text-slate-700 mt-1">{faculty.missing.join(', ')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const FindCollaboratorsPage: React.FC = () => {
    const navigate = useNavigate();
    const abortRef = useRef<(() => void) | null>(null);

    const [grantLink, setGrantLink]   = useState('');
    const [grantTitle, setGrantTitle] = useState('');
    const [additionalCount, setAdditionalCount] = useState(3);
    const [faculty, setFaculty] = useState<FacultyInput[]>([makeFaculty()]);
    const [message, setMessage] = useState('');

    const [isLoading, setIsLoading]     = useState(false);
    const [thinkingLogs, setThinkingLogs] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<FacultySuggestion[]>([]);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [error, setError]             = useState<string | null>(null);
    const [submitted, setSubmitted]     = useState(false);

    const updateFaculty = (i: number, upd: FacultyInput) =>
        setFaculty(prev => prev.map((f, idx) => idx === i ? upd : f));
    const removeFaculty = (i: number) =>
        setFaculty(prev => prev.filter((_, idx) => idx !== i));
    const addFaculty = () => setFaculty(prev => [...prev, makeFaculty()]);

    const validate = (): string | null => {
        if (!grantLink.trim() && !grantTitle.trim())
            return 'Please provide a grant URL or title.';
        if (faculty.length < 1)
            return 'Add at least one existing team member.';
        for (let i = 0; i < faculty.length; i++) {
            if (!faculty[i].email.trim())  return `Email is required for member ${i + 1}.`;
            if (!faculty[i].osuUrl.trim()) return `OSU Profile URL is required for member ${i + 1}.`;
        }
        if (additionalCount < 1 || additionalCount > 20)
            return 'Number of collaborators must be between 1 and 20.';
        return null;
    };

    const handleSubmit = () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError(null); setInfoMessage(null); setSuggestions([]);
        setThinkingLogs([]); setIsLoading(true); setSubmitted(true);
        if (abortRef.current) abortRef.current();

        const abort = streamFindCollaborators(
            {
                grantLink:  grantLink.trim()  || undefined,
                grantTitle: grantTitle.trim() || undefined,
                faculty: faculty.map(f => ({ ...f, email: f.email.trim().toLowerCase(), osuUrl: f.osuUrl.trim() })),
                additionalCount,
                message: message.trim() || undefined,
            },
            (event: StreamEvent) => {
                if (event.type === 'step_update') {
                    setThinkingLogs(prev => [...prev, event.payload.message]);
                } else if (event.type === 'request_info') {
                    setIsLoading(false);
                    setInfoMessage(event.payload.message);
                } else if (event.type === 'message') {
                    setIsLoading(false);
                    if (event.payload.type === 'error') {
                        setError(event.payload.message);
                    } else if (event.payload.collaboratorsResult) {
                        setSuggestions(event.payload.collaboratorsResult.suggested_collaborators);
                        if (!event.payload.collaboratorsResult.suggested_collaborators.length) {
                            setInfoMessage('No collaborators found in the faculty database matching this grant.');
                        }
                    } else {
                        setInfoMessage(event.payload.message);
                    }
                }
            }
        );
        abortRef.current = abort;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate('/team-builder')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="h-5 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <h1 className="text-base font-semibold text-slate-800">Find Additional Collaborators</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
                {/* Grant Input */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Grant Details</h2>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Grant URL <span className="text-slate-400 font-normal">(simpler.grants.gov)</span>
                        </label>
                        <input
                            type="url"
                            value={grantLink}
                            onChange={e => setGrantLink(e.target.value)}
                            placeholder="https://simpler.grants.gov/opportunity/12345"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs text-slate-400 font-semibold">OR</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Grant Title / Keywords</label>
                        <input
                            type="text"
                            value={grantTitle}
                            onChange={e => setGrantTitle(e.target.value)}
                            placeholder="NSF Program on Quantum Computing 2026"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
                        />
                        <GrantHelperPanel />
                    </div>
                </div>

                {/* Existing Team */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                            Existing Team Members <span className="text-red-500">*</span>
                        </h2>
                    </div>

                    {faculty.map((f, idx) => (
                        <FacultyInputRow
                            key={f.id}
                            faculty={f}
                            index={idx}
                            onChange={upd => updateFaculty(idx, upd)}
                            onRemove={() => removeFaculty(idx)}
                            canRemove={faculty.length > 1}
                        />
                    ))}

                    <button
                        onClick={addFaculty}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-600 border-2 border-dashed border-emerald-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-colors w-full justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        {faculty.length === 0 ? 'Add Team Member' : 'Add Another Team Member'}
                    </button>
                </div>

                {/* Count + Message + Submit */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Number of additional collaborators needed <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={additionalCount}
                            onChange={e => setAdditionalCount(Number(e.target.value))}
                            className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Additional context <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="e.g. Need someone with expertise in bioinformatics and ML..."
                            rows={2}
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        {isLoading ? 'Searching for collaborators...' : `Find ${additionalCount} Collaborator${additionalCount > 1 ? 's' : ''}`}
                    </button>
                </div>

                {/* Results */}
                {submitted && (
                    <div className="space-y-4">
                        {isLoading && <ThinkingIndicator logs={thinkingLogs} />}

                        {infoMessage && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
                                {infoMessage}
                            </div>
                        )}

                        {suggestions.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    {suggestions.length} Suggested Collaborator{suggestions.length > 1 ? 's' : ''}
                                </h3>
                                {suggestions.map((s, i) => (
                                    <CollaboratorCard key={s.faculty_id} faculty={s} rank={i + 1} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
