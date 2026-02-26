import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lightbulb, Plus, ChevronDown, ChevronUp, Star, ExternalLink } from 'lucide-react';
import { streamFormTeam } from '../lib/api';
import { FacultyInputRow } from '../components/FacultyInputRow';
import { ThinkingIndicator } from '../components/ThinkingIndicator';
import type { FacultyInput, FacultySuggestion, StreamEvent, GroupJustification } from '../types';

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

// ── Group Justification Panel ─────────────────────────────────────────────────

interface JustificationPanelProps {
    justification: GroupJustification;
    allMembers: FacultySuggestion[];
    opportunityId: string;
    opportunityTitle: string | null;
}

const GroupJustificationPanel: React.FC<JustificationPanelProps> = ({
    justification,
    allMembers,
    opportunityId,
    opportunityTitle,
}) => {
    const memberMap = new Map(allMembers.map(m => [m.faculty_id, m]));
    const grantLink = opportunityId
        ? `https://simpler.grants.gov/opportunity/${opportunityId}`
        : null;

    return (
        <div className="bg-white border border-violet-200 rounded-2xl shadow-sm overflow-hidden">
            {/* ── Header ── */}
            <div className="bg-violet-50 border-b border-violet-200 px-6 py-5">
                <div className="flex items-start gap-2">
                    <span className="text-violet-600 text-lg mt-0.5">✦</span>
                    <div className="space-y-1 min-w-0">
                        <h2 className="text-base font-bold text-slate-900 leading-snug">
                            {opportunityTitle ?? 'Team Analysis'}
                        </h2>
                        {grantLink && (
                            <a
                                href={grantLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 hover:underline"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View Grant
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-6 py-5 space-y-6 divide-y divide-slate-100">

                {/* ── What This Grant Is About ── */}
                {justification.one_paragraph && (
                    <section className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            What This Grant Is About
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {justification.one_paragraph}
                        </p>
                    </section>
                )}

                {/* ── Faculty Roles ── */}
                {justification.member_roles.length > 0 && (
                    <section className="pt-5 space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Faculty Roles
                        </h3>
                        <ul className="space-y-1.5">
                            {justification.member_roles.map((r, i) => {
                                const m = memberMap.get(r.faculty_id);
                                return (
                                    <li key={i} className="text-sm text-slate-700 flex flex-wrap gap-x-1.5">
                                        <span className="font-semibold text-slate-900">
                                            {m?.name ?? `Faculty #${r.faculty_id}`}
                                        </span>
                                        {m?.email && (
                                            <span className="text-slate-400">({m.email})</span>
                                        )}
                                        <span className="text-slate-500">—</span>
                                        <span className="text-violet-700 font-semibold">{r.role}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}

                {/* ── Per-member strengths ── */}
                {justification.member_strengths.length > 0 && (
                    <section className="pt-5 space-y-5">
                        {justification.member_strengths.map((ms, i) => {
                            const m = memberMap.get(ms.faculty_id);
                            const name = m?.name ?? `Faculty #${ms.faculty_id}`;
                            return (
                                <div key={i} className="space-y-2">
                                    <h3 className="text-xs font-bold text-violet-700 uppercase tracking-widest">
                                        What {name} Can Do for This Grant
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {ms.bullets.map((b, j) => (
                                            <li key={j} className="flex gap-2 text-sm text-slate-700">
                                                <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </section>
                )}

                {/* ── Why This Might Not Work ── */}
                {(justification.why_not_working.length > 0 || justification.coverage.missing.length > 0) && (
                    <section className="pt-5 space-y-3">
                        <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">
                            Why This Might Not Work
                        </h3>

                        {justification.why_not_working.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                    Critical Gaps
                                </p>
                                <ul className="space-y-1.5">
                                    {justification.why_not_working.map((w, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                                            <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                                            <span>{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {justification.coverage.missing.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                    Missing Topics
                                </p>
                                <ul className="space-y-1">
                                    {justification.coverage.missing.map((m, i) => (
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
                {justification.recommendation && (
                    <section className="pt-5 space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Recommended Action
                        </h3>
                        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {justification.recommendation}
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

// ── Team member card ──────────────────────────────────────────────────────────

const TeamMemberCard: React.FC<{ faculty: FacultySuggestion; rank: number }> = ({ faculty, rank }) => {
    const pct = Math.round((faculty.llm_score ?? faculty.domain_score ?? 0) * 100);
    const isExisting = faculty.is_existing_member;

    return (
        <div className={`bg-white border-2 rounded-xl p-5 shadow-sm transition-colors space-y-3 ${isExisting ? 'border-violet-300' : 'border-violet-100 hover:border-violet-300'}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isExisting ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'}`}>
                        {isExisting ? <Star className="w-3.5 h-3.5" /> : rank}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 text-sm leading-snug truncate">
                                {faculty.name ?? faculty.email}
                            </p>
                            {isExisting && (
                                <span className="text-[10px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                                    Your member
                                </span>
                            )}
                        </div>
                        {faculty.name && (
                            <p className="text-xs text-slate-500">{faculty.email}</p>
                        )}
                        {faculty.position && (
                            <p className="text-xs text-slate-500 mt-0.5">{faculty.position}</p>
                        )}
                    </div>
                </div>
                {!isExisting && (
                    <span className="flex-shrink-0 text-xs font-semibold text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full">
                        {pct}% match
                    </span>
                )}
            </div>

            {/* LLM one-line reason */}
            {faculty.reason && (
                <p className="text-xs text-slate-600 italic leading-relaxed">{faculty.reason}</p>
            )}
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const FormTeamPage: React.FC = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const prefillGrant = (location.state as any)?.grantTitle as string | undefined;

    const abortRef = useRef<(() => void) | null>(null);

    const [grantLink,  setGrantLink]  = useState('');
    const [grantTitle, setGrantTitle] = useState(prefillGrant ?? '');
    const [teamSize, setTeamSize]     = useState(3);
    const [faculty, setFaculty]       = useState<FacultyInput[]>([]);
    const [showFaculty, setShowFaculty] = useState(false);
    const [message, setMessage]       = useState('');

    const [isLoading,         setIsLoading]         = useState(false);
    const [thinkingLogs,      setThinkingLogs]      = useState<string[]>([]);
    const [team,              setTeam]              = useState<FacultySuggestion[]>([]);
    const [groupJustification,setGroupJustification]= useState<GroupJustification | null>(null);
    const [infoMessage,       setInfoMessage]       = useState<string | null>(null);
    const [error,             setError]             = useState<string | null>(null);
    const [submitted,         setSubmitted]         = useState(false);
    const [oppId,             setOppId]             = useState<string>('');
    const [oppTitle,          setOppTitle]          = useState<string | null>(null);

    const updateFaculty = (i: number, upd: FacultyInput) =>
        setFaculty(prev => prev.map((f, idx) => idx === i ? upd : f));
    const removeFaculty = (i: number) =>
        setFaculty(prev => prev.filter((_, idx) => idx !== i));
    const addFaculty = () => {
        setShowFaculty(true);
        setFaculty(prev => [...prev, makeFaculty()]);
    };

    const validate = (): string | null => {
        if (!grantLink.trim() && !grantTitle.trim())
            return 'Please provide a grant URL or title.';
        if (teamSize < 1 || teamSize > 20)
            return 'Team size must be between 1 and 20.';
        for (let i = 0; i < faculty.length; i++) {
            if (!faculty[i].email.trim())  return `Email is required for member ${i + 1}.`;
            if (!faculty[i].osuUrl.trim()) return `OSU Profile URL is required for member ${i + 1}.`;
        }
        return null;
    };

    const handleSubmit = () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError(null); setInfoMessage(null); setTeam([]); setGroupJustification(null);
        setOppId(''); setOppTitle(null);
        setThinkingLogs([]); setIsLoading(true); setSubmitted(true);
        if (abortRef.current) abortRef.current();

        const abort = streamFormTeam(
            {
                grantLink:  grantLink.trim()  || undefined,
                grantTitle: grantTitle.trim() || undefined,
                faculty: faculty.map(f => ({ ...f, email: f.email.trim().toLowerCase(), osuUrl: f.osuUrl.trim() })),
                teamSize,
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
                    } else if (event.payload.formTeamResult) {
                        const res = event.payload.formTeamResult;
                        setTeam(res.suggested_team);
                        setOppId(res.opportunity_id ?? '');
                        setOppTitle(res.opportunity_title);
                        if (res.group_justification) setGroupJustification(res.group_justification);
                        if (!res.suggested_team.length) {
                            setInfoMessage('No faculty found in the database matching this grant.');
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
                    <Lightbulb className="w-4 h-4 text-violet-600" />
                    <h1 className="text-base font-semibold text-slate-800">Form a Team for a Grant</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
                {/* Pre-fill banner */}
                {prefillGrant && (
                    <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 text-sm text-violet-800">
                        Building team for: <span className="font-semibold">{prefillGrant}</span>
                    </div>
                )}

                {/* Grant Input */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Grant Details <span className="text-red-500">*</span>
                    </h2>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Grant URL <span className="text-slate-400 font-normal">(simpler.grants.gov)</span>
                        </label>
                        <input
                            type="url"
                            value={grantLink}
                            onChange={e => setGrantLink(e.target.value)}
                            placeholder="https://simpler.grants.gov/opportunity/12345"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400"
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
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400"
                        />
                        <GrantHelperPanel />
                    </div>
                </div>

                {/* Optional: existing faculty */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                Existing Team Members <span className="text-slate-400 font-normal text-xs normal-case">(optional)</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Add yourself or known team members — they will always appear in the suggested team.
                            </p>
                        </div>
                    </div>

                    {showFaculty && faculty.map((f, idx) => (
                        <FacultyInputRow
                            key={f.id}
                            faculty={f}
                            index={idx}
                            onChange={upd => updateFaculty(idx, upd)}
                            onRemove={() => removeFaculty(idx)}
                            canRemove
                        />
                    ))}

                    <button
                        onClick={addFaculty}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-violet-600 border-2 border-dashed border-violet-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors w-full justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        {faculty.length === 0 ? 'Add an Existing Member (optional)' : 'Add Another Member'}
                    </button>
                </div>

                {/* Team size + message + submit */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Desired team size <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={teamSize}
                            onChange={e => setTeamSize(Number(e.target.value))}
                            className="w-24 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-400 mt-1">Total members in the suggested team (including any existing members you added above).</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Additional context <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="e.g. Looking for a mix of ML and systems experts..."
                            rows={2}
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <Lightbulb className="w-4 h-4" />
                        {isLoading ? 'Building your team...' : `Suggest a Team of ${teamSize}`}
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

                        {team.length > 0 && (
                            <div className="space-y-5">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Suggested Team{oppTitle ? ` for "${oppTitle}"` : ''}
                                </h3>
                                <div className="space-y-3">
                                    {team.map((m, i) => (
                                        <TeamMemberCard key={m.faculty_id} faculty={m} rank={i + 1} />
                                    ))}
                                </div>
                                {groupJustification && (
                                    <GroupJustificationPanel
                                        justification={groupJustification}
                                        allMembers={team}
                                        opportunityId={oppId}
                                        opportunityTitle={oppTitle}
                                    />
                                )}
                                <p className="text-xs text-slate-400 text-center">
                                    Members marked "Your member" were provided by you. Others are suggested based on grant–research alignment.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
