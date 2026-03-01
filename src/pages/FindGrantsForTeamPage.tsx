import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Plus, UserPlus, ExternalLink } from 'lucide-react';
import { streamChat } from '../lib/api';
import { FacultyInputRow } from '../components/FacultyInputRow';
import { ThinkingIndicator } from '../components/ThinkingIndicator';
import { SendEmailButton } from '../components/SendEmailButton';
import { formatGroupContent } from '../lib/formatEmail';
import type { FacultyInput, Grant, GroupMatchResult, StreamEvent } from '../types';

function makeFaculty(): FacultyInput {
    return { id: `${Date.now()}-${Math.random()}`, email: '', osuUrl: '', cvFile: undefined };
}

export const FindGrantsForTeamPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const prefillGrant = (location.state as any)?.grantTitle as string | undefined;

    const threadId = useRef(`thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const abortRef = useRef<(() => void) | null>(null);

    const [faculty, setFaculty] = useState<FacultyInput[]>([makeFaculty(), makeFaculty()]);
    const [message, setMessage] = useState(
        prefillGrant ? `Find a matching team for the grant: "${prefillGrant}"` : ''
    );

    const [isLoading, setIsLoading] = useState(false);
    const [thinkingLogs, setThinkingLogs] = useState<string[]>([]);
    const [groupResults, setGroupResults] = useState<GroupMatchResult[]>([]);
    const [singleResults, setSingleResults] = useState<Grant[]>([]);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const updateFaculty = (index: number, updated: FacultyInput) => {
        setFaculty(prev => prev.map((f, i) => i === index ? updated : f));
    };

    const removeFaculty = (index: number) => {
        setFaculty(prev => prev.filter((_, i) => i !== index));
    };

    const addFaculty = () => setFaculty(prev => [...prev, makeFaculty()]);

    const validate = (): string | null => {
        if (faculty.length < 2) return 'A team requires at least two faculty members.';
        for (let i = 0; i < faculty.length; i++) {
            if (!faculty[i].email.trim()) return `Email is required for Faculty ${i + 1}.`;
            if (!faculty[i].osuUrl.trim()) return `OSU Profile URL is required for Faculty ${i + 1}.`;
        }
        return null;
    };

    const handleSubmit = () => {
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setError(null);
        setInfoMessage(null);
        setGroupResults([]);
        setSingleResults([]);
        setThinkingLogs([]);
        setIsLoading(true);
        setSubmitted(true);

        if (abortRef.current) abortRef.current();

        const abort = streamChat(
            {
                mode: 'group',
                faculty: faculty.map(f => ({
                    ...f,
                    email: f.email.trim().toLowerCase(),
                    osuUrl: f.osuUrl.trim(),
                })),
                // Always include team/group signals so the orchestrator routes to group matching
                message: message.trim()
                    || `Find the best matching grants for a research team of ${faculty.length} faculty member${faculty.length > 1 ? 's' : ''}.`,
                threadId: threadId.current,
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
                        setError(event.payload.detail || event.payload.message);
                    } else if (event.payload.groupResults?.length) {
                        // Ideal path: backend returned group matching results
                        setGroupResults(event.payload.groupResults);
                    } else if (event.payload.results?.length) {
                        // Fallback: orchestrator routed to one-to-one (e.g. single faculty)
                        setSingleResults(event.payload.results);
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
            {/* Top Bar */}
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
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h1 className="text-base font-semibold text-slate-800">Find Grants for Your Team</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
                {/* Pre-fill banner */}
                {prefillGrant && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 text-sm text-indigo-800">
                        Building a team for: <span className="font-semibold">{prefillGrant}</span>
                    </div>
                )}

                {/* Faculty Section */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Faculty Members</h2>

                    {faculty.map((f, idx) => (
                        <FacultyInputRow
                            key={f.id}
                            faculty={f}
                            index={idx}
                            onChange={updated => updateFaculty(idx, updated)}
                            onRemove={() => removeFaculty(idx)}
                            canRemove={faculty.length > 2}
                        />
                    ))}

                    <button
                        onClick={addFaculty}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-600 border-2 border-dashed border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-colors w-full justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        {faculty.length === 0 ? 'Add Faculty Member' : 'Add Another Faculty Member'}
                    </button>
                </div>

                {/* Optional Message */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                        What are you looking for? <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="e.g. Find NSF grants that match this team's expertise in AI and robotics..."
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 resize-none"
                    />

                    {error && !submitted && (
                        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        {isLoading ? 'Finding matches...' : 'Find Matching Grants'}
                    </button>
                </div>

                {/* Results Section */}
                {submitted && (
                    <div className="space-y-4">
                        {isLoading && <ThinkingIndicator logs={thinkingLogs} />}

                        {error && submitted && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {infoMessage && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
                                {infoMessage}
                            </div>
                        )}

                        {/* One-to-one results fallback (single faculty or unexpected routing) */}
                        {singleResults.length > 0 && groupResults.length === 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-600">
                                    {singleResults.length} Grant{singleResults.length > 1 ? 's' : ''} Found
                                </h3>
                                {singleResults.map((result, idx) => (
                                    <div key={idx} className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm space-y-3">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-blue-900 leading-snug">
                                                    <a href={`https://simpler.grants.gov/opportunity/${result.opportunity_id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {result.title}
                                                    </a>
                                                </h4>
                                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1.5 inline-block">{result.agency || 'N/A'}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0">
                                                {result.llm_score !== undefined ? `${(result.llm_score * 100).toFixed(0)}% match` : `${(result.score * 100).toFixed(0)}% match`}
                                            </span>
                                        </div>
                                        <div className="flex justify-end pt-1">
                                            <button
                                                onClick={() => navigate('/team-builder/find-collaborators', {
                                                    state: {
                                                        grantLink: `https://simpler.grants.gov/opportunity/${result.opportunity_id}`,
                                                        grantTitle: result.title ?? '',
                                                        prefillFaculty: faculty.map(f => ({
                                                            email: f.email.trim().toLowerCase(),
                                                            osuUrl: f.osuUrl.trim(),
                                                        })),
                                                    },
                                                })}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <UserPlus className="w-3.5 h-3.5" />
                                                Find Additional Collaborators
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Group matching results */}
                        {groupResults.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-slate-600">
                                    {groupResults.length} Team Match{groupResults.length > 1 ? 'es' : ''} Found
                                </h3>
                                {groupResults.map((gm, idx) => {
                                    const j = gm.justification;
                                    const grantLink = `https://simpler.grants.gov/opportunity/${gm.grant_id}`;
                                    return (
                                        <div key={idx} className="bg-white border border-emerald-200 rounded-2xl shadow-sm overflow-hidden">
                                            {/* ── Header ── */}
                                            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2 min-w-0">
                                                        <span className="text-emerald-600 text-lg mt-0.5">✦</span>
                                                        <div className="space-y-1.5 min-w-0">
                                                            <h4 className="text-base font-bold text-slate-900 leading-snug">
                                                                {gm.grant_title}
                                                            </h4>
                                                            <a
                                                                href={grantLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 hover:underline"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                View Grant
                                                            </a>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {gm.team_members.map(m => (
                                                                    <span key={m.faculty_id} className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                                                                        {m.faculty_name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                        {gm.team_score !== undefined && (
                                                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                                                                {(gm.team_score * 100).toFixed(0)}% team fit
                                                            </span>
                                                        )}
                                                        {gm.agency_name && (
                                                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                                                {gm.agency_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-6 py-5 space-y-6 divide-y divide-slate-100">

                                                {/* ── What This Grant Is About ── */}
                                                {j.one_paragraph && (
                                                    <section className="space-y-2">
                                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                            What This Grant Is About
                                                        </h3>
                                                        <p className="text-sm text-slate-700 leading-relaxed">
                                                            {j.one_paragraph}
                                                        </p>
                                                    </section>
                                                )}

                                                {/* ── Faculty Roles ── */}
                                                {j.member_roles.length > 0 && (
                                                    <section className="pt-5 space-y-2">
                                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                            Faculty Roles
                                                        </h3>
                                                        <ul className="space-y-1.5">
                                                            {j.member_roles.map((r, i) => {
                                                                const m = gm.team_members.find(tm => tm.faculty_id === r.faculty_id);
                                                                return (
                                                                    <li key={i} className="text-sm text-slate-700 flex flex-wrap gap-x-1.5">
                                                                        <span className="font-semibold text-slate-900">
                                                                            {m?.faculty_name ?? `Faculty #${r.faculty_id}`}
                                                                        </span>
                                                                        {m?.faculty_email && (
                                                                            <span className="text-slate-400">({m.faculty_email})</span>
                                                                        )}
                                                                        <span className="text-slate-500">—</span>
                                                                        <span className="text-emerald-700 font-semibold">{r.role}</span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </section>
                                                )}

                                                {/* ── Per-member strengths ── */}
                                                {j.member_strengths.length > 0 && (
                                                    <section className="pt-5 space-y-5">
                                                        {j.member_strengths.map((ms, i) => {
                                                            const m = gm.team_members.find(tm => tm.faculty_id === ms.faculty_id);
                                                            const name = m?.faculty_name ?? `Faculty #${ms.faculty_id}`;
                                                            return (
                                                                <div key={i} className="space-y-2">
                                                                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                                                                        What {name} Can Do for This Grant
                                                                    </h3>
                                                                    <ul className="space-y-1.5">
                                                                        {ms.bullets.map((b, bi) => (
                                                                            <li key={bi} className="flex gap-2 text-sm text-slate-700">
                                                                                <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                                                                                <span>{b}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            );
                                                        })}
                                                    </section>
                                                )}

                                                {/* ── Coverage ── */}
                                                {(j.coverage.strong.length > 0 || j.coverage.partial.length > 0) && (
                                                    <section className="pt-5 space-y-3">
                                                        {j.coverage.strong.length > 0 && (
                                                            <div className="space-y-1.5">
                                                                <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">
                                                                    Strong Coverage
                                                                </p>
                                                                <ul className="space-y-1">
                                                                    {j.coverage.strong.map((s, i) => (
                                                                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                                                                            <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                                                                            <span>{s}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {j.coverage.partial.length > 0 && (
                                                            <div className="space-y-1.5">
                                                                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">
                                                                    Partial Coverage
                                                                </p>
                                                                <ul className="space-y-1">
                                                                    {j.coverage.partial.map((s, i) => (
                                                                        <li key={i} className="flex gap-2 text-sm text-slate-600">
                                                                            <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                                                                            <span>{s}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </section>
                                                )}

                                                {/* ── Why This Might Not Work ── */}
                                                {(j.why_not_working.length > 0 || j.coverage.missing.length > 0) && (
                                                    <section className="pt-5 space-y-3">
                                                        <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">
                                                            Why This Might Not Work
                                                        </h3>
                                                        {j.why_not_working.length > 0 && (
                                                            <div className="space-y-1.5">
                                                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                                                    Critical Gaps
                                                                </p>
                                                                <ul className="space-y-1.5">
                                                                    {j.why_not_working.map((w, i) => (
                                                                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                                                                            <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                                                                            <span>{w}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {j.coverage.missing.length > 0 && (
                                                            <div className="space-y-1.5">
                                                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                                                    Missing Topics
                                                                </p>
                                                                <ul className="space-y-1">
                                                                    {j.coverage.missing.map((m, i) => (
                                                                        <li key={i} className="flex gap-2 text-sm text-slate-600">
                                                                            <span className="text-red-400 mt-0.5 flex-shrink-0">–</span>
                                                                            <span>{m}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </section>
                                                )}

                                                {/* ── Recommended Action ── */}
                                                {j.recommendation && (
                                                    <section className="pt-5 space-y-2">
                                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                            Recommended Action
                                                        </h3>
                                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                                            <p className="text-sm text-slate-700 leading-relaxed">
                                                                {j.recommendation}
                                                            </p>
                                                        </div>
                                                    </section>
                                                )}

                                                {/* ── Actions row ── */}
                                                <div className="pt-5 flex items-center gap-4">
                                                    <SendEmailButton
                                                        emails={gm.team_members.map(m => m.faculty_email)}
                                                        labels={gm.team_members.map(m => m.faculty_name)}
                                                        title={gm.grant_title}
                                                        content={formatGroupContent(gm)}
                                                        mode="group"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
