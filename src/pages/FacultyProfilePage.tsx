import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Search, ExternalLink, BookOpen, Tag, Globe,
    Pencil, X, Plus, Trash2, Save, Lock, Check,
} from 'lucide-react';
import { fetchFacultyByEmail, patchFacultySource, patchFacultyKeywords } from '../lib/api';
import type {
    FacultyProfile, FacultyKeywords,
    KeywordUpdateMode,
} from '../types';

// ── Inline helper components ──────────────────────────────────────────────────

/** Small save-status banner */
const SaveBanner: React.FC<{
    message: string | null;
    mode: 'success' | 'error' | 'info';
    onDismiss: () => void;
}> = ({ message, mode, onDismiss }) => {
    if (!message) return null;
    const bg =
        mode === 'success' ? 'bg-green-50 border-green-200 text-green-800'
            : mode === 'error' ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-amber-50 border-amber-200 text-amber-800';
    return (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${bg}`}>
            <span>{message}</span>
            <button onClick={onDismiss} className="ml-3 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
        </div>
    );
};

/** Section header with edit toggle */
const SectionHeader: React.FC<{
    icon: React.ReactNode;
    label: string;
    count?: number;
    editing: boolean;
    saving: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
}> = ({ icon, label, count, editing, saving, onEdit, onCancel, onSave }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {label}{count !== undefined ? ` (${count})` : ''}
            </h3>
        </div>
        {editing ? (
            <div className="flex items-center gap-2">
                <button onClick={onCancel} disabled={saving} className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors">Cancel</button>
                <button onClick={onSave} disabled={saving} className="flex items-center gap-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Save className="w-3 h-3" />{saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        ) : (
            <button onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors">
                <Pencil className="w-3 h-3" />Edit
            </button>
        )}
    </div>
);

// ── Keyword display (read-only) ───────────────────────────────────────────────

const KeywordSectionReadonly: React.FC<{ title: string; keywords: FacultyKeywords; accent: string }> = ({
    title, keywords, accent,
}) => {
    const sorted = [...keywords.specialization].sort((a, b) => b.w - a.w);
    const barColor = accent === 'teal' ? 'bg-teal-500' : accent === 'violet' ? 'bg-violet-500' : 'bg-slate-500';
    const pillBg = accent === 'teal'
        ? 'bg-teal-50 text-teal-800 border-teal-200'
        : accent === 'violet' ? 'bg-violet-50 text-violet-800 border-violet-200' : 'bg-slate-50 text-slate-800 border-slate-200';

    return (
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
            <div className="flex flex-wrap gap-1.5">
                {keywords.domain.map((d) => (
                    <span key={d} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pillBg}`}>{d}</span>
                ))}
            </div>
            <div className="space-y-0 divide-y divide-slate-100">
                {sorted.map((s) => (
                    <div key={s.t} className="flex items-center gap-3 py-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700">{s.t}</p>
                        </div>
                        <div className="w-24 flex items-center gap-2 flex-shrink-0">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.round(s.w * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 w-7 text-right">{(s.w * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Keyword edit (inline) ─────────────────────────────────────────────────────

const KeywordSectionEditable: React.FC<{
    title: string;
    keywords: FacultyKeywords;
    accent: string;
    onChange: (updated: FacultyKeywords) => void;
}> = ({ title, keywords, accent, onChange }) => {
    const pillBg = accent === 'teal'
        ? 'bg-teal-50 text-teal-800 border-teal-200'
        : accent === 'violet' ? 'bg-violet-50 text-violet-800 border-violet-200' : 'bg-slate-50 text-slate-800 border-slate-200';
    const [newDomain, setNewDomain] = useState('');
    const [newSpecText, setNewSpecText] = useState('');
    const [newSpecWeight, setNewSpecWeight] = useState(0.8);

    const addDomain = () => {
        const v = newDomain.trim();
        if (!v || keywords.domain.includes(v)) return;
        onChange({ ...keywords, domain: [...keywords.domain, v] });
        setNewDomain('');
    };
    const removeDomain = (d: string) => onChange({ ...keywords, domain: keywords.domain.filter(x => x !== d) });

    const updateSpec = (idx: number, field: 't' | 'w', value: string | number) => {
        const specs = [...keywords.specialization];
        specs[idx] = { ...specs[idx], [field]: value };
        onChange({ ...keywords, specialization: specs });
    };
    const removeSpec = (idx: number) => onChange({ ...keywords, specialization: keywords.specialization.filter((_, i) => i !== idx) });
    const addSpec = () => {
        const v = newSpecText.trim();
        if (!v) return;
        onChange({ ...keywords, specialization: [...keywords.specialization, { t: v, w: newSpecWeight }] });
        setNewSpecText('');
        setNewSpecWeight(0.8);
    };

    return (
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>

            {/* Domain pills (editable) */}
            <div className="flex flex-wrap items-center gap-1.5">
                {keywords.domain.map((d) => (
                    <span key={d} className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${pillBg}`}>
                        {d}
                        <button onClick={() => removeDomain(d)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                ))}
                <div className="flex items-center gap-1">
                    <input
                        type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addDomain()}
                        placeholder="Add domain" className="text-xs border border-slate-300 rounded-lg px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button onClick={addDomain} className="text-teal-600 hover:text-teal-800"><Plus className="w-3.5 h-3.5" /></button>
                </div>
            </div>

            {/* Specializations (editable) */}
            <div className="space-y-2">
                {keywords.specialization.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <input
                            type="text" value={s.t}
                            onChange={e => updateSpec(idx, 't', e.target.value)}
                            className="flex-1 text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <input
                            type="range" min={0} max={1} step={0.01} value={s.w}
                            onChange={e => updateSpec(idx, 'w', parseFloat(e.target.value))}
                            className="w-20 accent-teal-600"
                        />
                        <span className="text-[10px] font-semibold text-slate-500 w-7 text-right">{(s.w * 100).toFixed(0)}%</span>
                        <button onClick={() => removeSpec(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                ))}

                {/* Add new specialization */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <input
                        type="text" value={newSpecText} onChange={e => setNewSpecText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSpec()}
                        placeholder="New specialization" className="flex-1 text-sm border border-dashed border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <input
                        type="range" min={0} max={1} step={0.01} value={newSpecWeight}
                        onChange={e => setNewSpecWeight(parseFloat(e.target.value))}
                        className="w-20 accent-teal-600"
                    />
                    <span className="text-[10px] font-semibold text-slate-500 w-7 text-right">{(newSpecWeight * 100).toFixed(0)}%</span>
                    <button onClick={addSpec} className="text-teal-600 hover:text-teal-800"><Plus className="w-3.5 h-3.5" /></button>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── Page ──────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export const FacultyProfilePage: React.FC = () => {
    const navigate = useNavigate();

    // ── lookup state
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [faculty, setFaculty] = useState<FacultyProfile | null>(null);

    // ── save banner
    const [banner, setBanner] = useState<{ msg: string; mode: 'success' | 'error' | 'info' } | null>(null);

    // ── edit states (each section independent)
    const [editingBasicInfo, setEditingBasicInfo] = useState(false);
    const [editingPubs, setEditingPubs] = useState(false);
    const [editingFiles, setEditingFiles] = useState(false);
    const [editingKeywords, setEditingKeywords] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingSource, setSavingSource] = useState(false); // true while a source PATCH is running (keywords regenerating)

    // ── draft state for basic info
    const [draftName, setDraftName] = useState('');
    const [draftPosition, setDraftPosition] = useState('');
    const [draftOrgs, setDraftOrgs] = useState<string[]>([]);
    const [draftSourceUrl, setDraftSourceUrl] = useState('');
    const [newOrgValue, setNewOrgValue] = useState('');

    // ── draft state for publications
    const [draftYearFrom, setDraftYearFrom] = useState<number | ''>('');
    const [draftYearTo, setDraftYearTo] = useState<number | ''>('');

    // ── draft state for attached files
    const [draftNewFileUrl, setDraftNewFileUrl] = useState('');
    const [editingFileId, setEditingFileId] = useState<number | null>(null);
    const [editingFileUrl, setEditingFileUrl] = useState('');

    // ── draft state for keywords
    const [draftResearch, setDraftResearch] = useState<FacultyKeywords>({ domain: [], specialization: [] });
    const [draftApplication, setDraftApplication] = useState<FacultyKeywords>({ domain: [], specialization: [] });

    // ── lookup ────────────────────────────────────────────────────────────────

    const handleLookup = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) { setError('Please enter an email address.'); return; }
        setError(null); setFaculty(null); setBanner(null);
        setIsLoading(true);
        try {
            const result = await fetchFacultyByEmail(trimmed);
            setFaculty(result);
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally { setIsLoading(false); }
    };

    // ── Helper: apply PATCH response to state ─────────────────────────────────

    const applyPatchResponse = (resp: any, mode: KeywordUpdateMode) => {
        setFaculty(resp.faculty);
        const modeLabel =
            mode === 'regenerated_from_sources' ? 'Keywords regenerated from updated sources.'
                : mode === 'frontend_override' ? 'Keywords updated (direct override).'
                    : mode === 'regeneration_failed' ? 'Source saved but keyword regeneration failed.'
                        : 'Saved.';
        setBanner({ msg: modeLabel, mode: mode === 'regeneration_failed' ? 'info' : 'success' });
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── Basic Info editing ─────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const startEditBasicInfo = () => {
        if (!faculty) return;
        setDraftName(faculty.basic_info?.faculty_name || faculty.name || '');
        setDraftPosition(faculty.basic_info?.position || faculty.position || '');
        setDraftOrgs([...(faculty.basic_info?.organizations || faculty.organizations || [])]);
        setDraftSourceUrl(faculty.data_from?.info_source_url || '');
        setNewOrgValue('');
        setEditingBasicInfo(true);
    };

    const cancelEditBasicInfo = () => { setEditingBasicInfo(false); };

    const saveBasicInfo = async () => {
        if (!faculty) return;
        setSaving(true); setSavingSource(true); setBanner(null);
        try {
            const resp = await patchFacultySource({
                email: faculty.email,
                basic_info: { faculty_name: draftName, position: draftPosition, organizations: draftOrgs },
                data_from: { info_source_url: draftSourceUrl },
            });
            applyPatchResponse(resp, resp.keyword_update_mode);
            setEditingBasicInfo(false);
        } catch (err: any) {
            setBanner({ msg: err.message, mode: 'error' });
        } finally { setSaving(false); setSavingSource(false); }
    };

    const addOrg = () => {
        const v = newOrgValue.trim();
        if (v && !draftOrgs.includes(v)) { setDraftOrgs([...draftOrgs, v]); setNewOrgValue(''); }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── Publications editing ──────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const startEditPubs = () => {
        if (!faculty) return;
        setDraftYearFrom('');
        setDraftYearTo('');
        setEditingPubs(true);
    };

    const cancelEditPubs = () => { setEditingPubs(false); };

    const deletePub = async (pubId: number) => {
        if (!faculty) return;
        setSaving(true); setSavingSource(true); setBanner(null);
        try {
            const resp = await patchFacultySource({
                email: faculty.email,
                data_from: { publications: { delete: pubId } },
            });
            applyPatchResponse(resp, resp.keyword_update_mode);
        } catch (err: any) {
            setBanner({ msg: err.message, mode: 'error' });
        } finally { setSaving(false); setSavingSource(false); }
    };

    const saveFetchYearRange = async () => {
        if (!faculty || draftYearFrom === '' || draftYearTo === '') return;
        setSaving(true); setSavingSource(true); setBanner(null);
        try {
            const resp = await patchFacultySource({
                email: faculty.email,
                data_from: { publications: { set_fetch_year_range: { from: Number(draftYearFrom), to: Number(draftYearTo) } } },
            });
            applyPatchResponse(resp, resp.keyword_update_mode);
            setEditingPubs(false);
        } catch (err: any) {
            setBanner({ msg: err.message, mode: 'error' });
        } finally { setSaving(false); setSavingSource(false); }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── Attached Files editing ────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const startEditFiles = () => {
        setDraftNewFileUrl('');
        setEditingFileId(null);
        setEditingFiles(true);
    };

    const cancelEditFiles = () => { setEditingFiles(false); setEditingFileId(null); };

    const addFile = async () => {
        if (!faculty || !draftNewFileUrl.trim()) return;
        setSaving(true); setSavingSource(true); setBanner(null);
        try {
            const resp = await patchFacultySource({
                email: faculty.email,
                data_from: { attached_files: { add: [{ source_url: draftNewFileUrl.trim() }] } },
            });
            applyPatchResponse(resp, resp.keyword_update_mode);
            setDraftNewFileUrl('');
        } catch (err: any) {
            setBanner({ msg: err.message, mode: 'error' });
        } finally { setSaving(false); setSavingSource(false); }
    };

    const deleteFile = async (fileId: number) => {
        if (!faculty) return;
        setSaving(true); setSavingSource(true); setBanner(null);
        try {
            const resp = await patchFacultySource({
                email: faculty.email,
                data_from: { attached_files: { delete: [fileId] } },
            });
            applyPatchResponse(resp, resp.keyword_update_mode);
        } catch (err: any) {
            setBanner({ msg: err.message, mode: 'error' });
        } finally { setSaving(false); setSavingSource(false); }
    };

    const startEditFile = (fileId: number, currentUrl: string) => {
        setEditingFileId(fileId);
        setEditingFileUrl(currentUrl);
    };

    const saveEditFile = async () => {
        if (!faculty || editingFileId === null) return;
        setSaving(true); setSavingSource(true); setBanner(null);
        try {
            const resp = await patchFacultySource({
                email: faculty.email,
                data_from: { attached_files: { update: [{ id: editingFileId, source_url: editingFileUrl.trim() }] } },
            });
            applyPatchResponse(resp, resp.keyword_update_mode);
            setEditingFileId(null);
        } catch (err: any) {
            setBanner({ msg: err.message, mode: 'error' });
        } finally { setSaving(false); setSavingSource(false); }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── Keywords editing ─────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    const startEditKeywords = () => {
        if (!faculty?.all_keywords) return;
        setDraftResearch({
            domain: [...faculty.all_keywords.research.domain],
            specialization: faculty.all_keywords.research.specialization.map(s => ({ ...s })),
        });
        setDraftApplication({
            domain: [...faculty.all_keywords.application.domain],
            specialization: faculty.all_keywords.application.specialization.map(s => ({ ...s })),
        });
        setEditingKeywords(true);
    };

    const cancelEditKeywords = () => { setEditingKeywords(false); };

    const saveKeywords = async () => {
        if (!faculty) return;
        setSaving(true); setBanner(null);
        try {
            const resp = await patchFacultyKeywords({
                email: faculty.email,
                all_keywords: { research: draftResearch, application: draftApplication },
                keyword_source: 'frontend_edit',
            });
            applyPatchResponse(resp, resp.keyword_update_mode);
            setEditingKeywords(false);
        } catch (err: any) {
            setBanner({ msg: err.message, mode: 'error' });
        } finally { setSaving(false); }
    };

    // ════════════════════════════════════════════════════════════════════════════
    // ── Derived data ─────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    // Group publications by year (deduplicated)
    type PubEntry = { id: number; title: string };
    const pubsByYear: Record<number, PubEntry[]> = {};
    if (faculty?.data_from?.publication_titles) {
        const seen = new Set<string>();
        for (const p of faculty.data_from.publication_titles) {
            if (seen.has(p.title)) continue;
            seen.add(p.title);
            (pubsByYear[p.year] ??= []).push({ id: p.id, title: p.title });
        }
    }
    const sortedYears = Object.keys(pubsByYear).map(Number).sort((a, b) => b - a);

    // ════════════════════════════════════════════════════════════════════════════
    // ── Render ────────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" />Back
                </button>
                <div className="h-5 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" />
                    <h1 className="text-base font-semibold text-slate-800">Faculty Profile</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
                {/* ── Email Lookup ── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-5">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Look Up Faculty</h2>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Faculty Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email" value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLookup()}
                            placeholder="alan.fern@oregonstate.edu"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
                        />
                    </div>
                    {error && !faculty && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}
                    <button onClick={handleLookup} disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
                        <Search className="w-4 h-4" />{isLoading ? 'Looking up…' : 'Look Up'}
                    </button>
                </div>

                {isLoading && (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                    </div>
                )}
                {error && !isLoading && !faculty && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">{error}</div>
                )}

                {/* ── Save banner ── */}
                {banner && <SaveBanner message={banner.msg} mode={banner.mode} onDismiss={() => setBanner(null)} />}

                {/* Regenerating keywords alert */}
                {savingSource && (
                    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 animate-pulse">
                        <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
                        <p className="text-sm font-medium text-indigo-800">
                            Saving changes and regenerating keywords — this may take a moment…
                        </p>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* ── Results ── */}
                {faculty && (
                    <div className="space-y-6">

                        {/* ── Basic Info ── */}
                        <div className="bg-white border border-teal-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-teal-50 border-b border-teal-200 px-6 py-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                        {(faculty.basic_info?.faculty_name || faculty.name || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {editingBasicInfo ? (
                                            <div className="space-y-2">
                                                <input value={draftName} onChange={e => setDraftName(e.target.value)}
                                                    className="w-full text-lg font-bold border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                                <input value={draftPosition} onChange={e => setDraftPosition(e.target.value)}
                                                    placeholder="Position"
                                                    className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                            </div>
                                        ) : (
                                            <>
                                                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                                                    {faculty.basic_info?.faculty_name || faculty.name}
                                                </h2>
                                                <p className="text-sm text-slate-600">{faculty.basic_info?.position || faculty.position}</p>
                                            </>
                                        )}
                                    </div>
                                    {!editingBasicInfo ? (
                                        <button onClick={startEditBasicInfo} className="text-teal-600 hover:text-teal-800 flex-shrink-0">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button onClick={cancelEditBasicInfo} disabled={saving} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
                                            <button onClick={saveBasicInfo} disabled={saving} className="text-teal-600 hover:text-teal-800"><Check className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-5 space-y-3">
                                {/* Email (immutable) */}
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-400 font-medium w-20 flex-shrink-0">Email</span>
                                    <div className="flex items-center gap-1.5">
                                        <Lock className="w-3 h-3 text-slate-300" />
                                        <span className="text-slate-500">{faculty.basic_info?.email || faculty.email}</span>
                                    </div>
                                </div>

                                {/* Organizations */}
                                <div className="flex items-start gap-2 text-sm">
                                    <span className="text-slate-400 font-medium w-20 flex-shrink-0 pt-0.5">Orgs</span>
                                    {editingBasicInfo ? (
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {draftOrgs.map(org => (
                                                    <span key={org} className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded flex items-center gap-1">
                                                        {org}
                                                        <button onClick={() => setDraftOrgs(draftOrgs.filter(o => o !== org))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input type="text" value={newOrgValue} onChange={e => setNewOrgValue(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addOrg()}
                                                    placeholder="Add organization" className="text-xs border border-slate-300 rounded-lg px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                                <button onClick={addOrg} className="text-teal-600 hover:text-teal-800"><Plus className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {(faculty.basic_info?.organizations || faculty.organizations)?.map(org => (
                                                <span key={org} className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">{org}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Source URL */}
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-400 font-medium w-20 flex-shrink-0">Source</span>
                                    {editingBasicInfo ? (
                                        <input type="url" value={draftSourceUrl} onChange={e => setDraftSourceUrl(e.target.value)}
                                            placeholder="https://..." className="flex-1 text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                    ) : faculty.data_from?.info_source_url ? (
                                        <a href={faculty.data_from.info_source_url} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-teal-700 hover:underline">
                                            <ExternalLink className="w-3 h-3" />Profile page
                                        </a>
                                    ) : <span className="text-slate-400">—</span>}
                                </div>
                            </div>
                        </div>

                        {/* ── Publications ── */}
                        {sortedYears.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                                <SectionHeader
                                    icon={<BookOpen className="w-4 h-4 text-slate-500" />}
                                    label="Publications"
                                    count={Object.values(pubsByYear).flat().length}
                                    editing={editingPubs} saving={saving}
                                    onEdit={startEditPubs} onCancel={cancelEditPubs} onSave={saveFetchYearRange}
                                />

                                {editingPubs && (
                                    <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3 space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">Fetch year range</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={draftYearFrom} onChange={e => setDraftYearFrom(e.target.value ? Number(e.target.value) : '')}
                                                placeholder="From" className="w-24 text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                            <span className="text-xs text-slate-400">to</span>
                                            <input type="number" value={draftYearTo} onChange={e => setDraftYearTo(e.target.value ? Number(e.target.value) : '')}
                                                placeholder="To" className="w-24 text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                            <span className="text-xs text-slate-400">
                                                Current: {faculty.data_from?.publication_fetched_upto_year ?? '—'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                                    {sortedYears.map(year => (
                                        <div key={year}>
                                            <p className="text-xs font-bold text-teal-700 mb-1.5">{year}</p>
                                            <ul className="space-y-0 divide-y divide-slate-100">
                                                {pubsByYear[year].map(pub => (
                                                    <li key={pub.id} className="flex items-start gap-2 group py-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
                                                        <span className="flex-1 text-sm text-slate-700 leading-relaxed">
                                                            {pub.title}
                                                        </span>
                                                        {editingPubs && (
                                                            <button onClick={() => deletePub(pub.id)} disabled={saving}
                                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 flex-shrink-0 mt-0.5 transition-opacity">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Attached Files / Sources ── */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
                            <SectionHeader
                                icon={<Globe className="w-4 h-4 text-slate-500" />}
                                label="Source Links"
                                count={faculty.data_from?.attached_files?.length}
                                editing={editingFiles} saving={saving}
                                onEdit={startEditFiles} onCancel={cancelEditFiles}
                                onSave={() => setEditingFiles(false)}
                            />

                            <ul className="space-y-2">
                                {faculty.data_from?.attached_files?.map(af => (
                                    <li key={af.id ?? af.additional_info_id} className="flex items-center gap-2 text-sm group">
                                        <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                        {editingFileId === (af.id ?? af.additional_info_id) ? (
                                            <>
                                                <input type="url" value={editingFileUrl} onChange={e => setEditingFileUrl(e.target.value)}
                                                    className="flex-1 text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                                <button onClick={saveEditFile} disabled={saving} className="text-teal-600 hover:text-teal-800"><Check className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setEditingFileId(null)} className="text-slate-400 hover:text-slate-700"><X className="w-3.5 h-3.5" /></button>
                                            </>
                                        ) : (
                                            <>
                                                <a href={af.source_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-teal-700 hover:underline truncate flex-1">{af.source_url}</a>
                                                <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                    {af.detected_type} · {(af.content_char_count / 1000).toFixed(1)}k chars
                                                </span>
                                                {editingFiles && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditFile(af.id ?? af.additional_info_id, af.source_url)}
                                                            className="text-slate-400 hover:text-teal-600"><Pencil className="w-3 h-3" /></button>
                                                        <button onClick={() => deleteFile(af.id ?? af.additional_info_id)} disabled={saving}
                                                            className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {/* Add new file */}
                            {editingFiles && (
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    <input type="url" value={draftNewFileUrl} onChange={e => setDraftNewFileUrl(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addFile()}
                                        placeholder="https://example.com/page-or-cv.pdf"
                                        className="flex-1 text-sm border border-dashed border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                                    <button onClick={addFile} disabled={saving || !draftNewFileUrl.trim()}
                                        className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 disabled:opacity-40">
                                        <Plus className="w-3.5 h-3.5" />Add
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Keywords ── */}
                        {faculty.all_keywords && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                                <SectionHeader
                                    icon={<Tag className="w-4 h-4 text-slate-500" />}
                                    label="Keywords"
                                    editing={editingKeywords} saving={saving}
                                    onEdit={startEditKeywords} onCancel={cancelEditKeywords} onSave={saveKeywords}
                                />

                                {editingKeywords ? (
                                    <>
                                        <KeywordSectionEditable
                                            title="Research" keywords={draftResearch} accent="teal"
                                            onChange={setDraftResearch}
                                        />
                                        <div className="border-t border-slate-100 pt-5">
                                            <KeywordSectionEditable
                                                title="Application" keywords={draftApplication} accent="violet"
                                                onChange={setDraftApplication}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {faculty.all_keywords.research && (
                                            <KeywordSectionReadonly title="Research" keywords={faculty.all_keywords.research} accent="teal" />
                                        )}
                                        {faculty.all_keywords.application && (
                                            <div className="border-t border-slate-100 pt-5">
                                                <KeywordSectionReadonly title="Application" keywords={faculty.all_keywords.application} accent="violet" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
