import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Paperclip, FileText, X, Users } from 'lucide-react';
import { streamChat } from '../lib/api';
import { ThinkingIndicator } from '../components/ThinkingIndicator';
import { SendEmailButton } from '../components/SendEmailButton';
import { formatGrantContent } from '../lib/formatEmail';
import type { Grant, StreamEvent } from '../types';

export const FindGrantPage: React.FC = () => {
    const navigate = useNavigate();
    const threadId = useRef(`thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const abortRef = useRef<(() => void) | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [email, setEmail] = useState('');
    const [osuUrl, setOsuUrl] = useState('');
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [thinkingLogs, setThinkingLogs] = useState<string[]>([]);
    const [results, setResults] = useState<Grant[]>([]);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const validate = (): string | null => {
        if (!email.trim()) return 'Email is required.';
        if (!osuUrl.trim()) return 'OSU Profile URL is required.';
        return null;
    };

    const handleSubmit = () => {
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setError(null);
        setInfoMessage(null);
        setResults([]);
        setThinkingLogs([]);
        setIsLoading(true);
        setSubmitted(true);

        if (abortRef.current) abortRef.current();

        const abort = streamChat(
            {
                mode: 'single',
                email: email.trim().toLowerCase(),
                osuUrl: osuUrl.trim(),
                cvFile: cvFile || undefined,
                message: message.trim() || 'Find the best matching grants for my research profile.',
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
                    } else if (event.payload.results?.length) {
                        setResults(event.payload.results);
                    } else {
                        setInfoMessage(event.payload.message);
                    }
                }
            }
        );

        abortRef.current = abort;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file?.type === 'application/pdf') setCvFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTeamBuilder = (grantTitle: string) => {
        navigate('/team-builder/form-team', { state: { grantTitle } });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="h-5 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-green-600" />
                    <h1 className="text-base font-semibold text-slate-800">Find me a Grant</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-5">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Your Details</h2>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="afern@oregonstate.edu"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-400"
                        />
                    </div>

                    {/* OSU URL */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            OSU Profile URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={osuUrl}
                            onChange={e => setOsuUrl(e.target.value)}
                            placeholder="https://engineering.oregonstate.edu/people/afern"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-400"
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
                        {cvFile ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="bg-red-500 rounded p-1 text-white flex-shrink-0">
                                    <FileText className="w-3 h-3" />
                                </div>
                                <span className="text-xs text-slate-700 truncate flex-1">{cvFile.name}</span>
                                <button onClick={() => setCvFile(null)} className="text-slate-400 hover:text-red-500 transition-colors">
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

                    {/* Optional message */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            What are you looking for? <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="e.g. I'm looking for NSF grants in machine learning and robotics..."
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    {/* Validation error */}
                    {error && !submitted && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        {isLoading ? 'Searching...' : 'Find Matching Grants'}
                    </button>
                </div>

                {/* Results Section */}
                {submitted && (
                    <div className="space-y-4">
                        {/* Thinking Indicator */}
                        {isLoading && (
                            <ThinkingIndicator logs={thinkingLogs} />
                        )}

                        {/* Error */}
                        {error && submitted && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Info / request_info message */}
                        {infoMessage && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
                                {infoMessage}
                            </div>
                        )}

                        {/* Grant Results */}
                        {results.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-600">
                                    {results.length} Grant{results.length > 1 ? 's' : ''} Found
                                </h3>
                                {results.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm hover:border-blue-300 transition-colors space-y-3"
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-blue-900 leading-snug">
                                                    <a
                                                        href={`https://simpler.grants.gov/opportunity/${result.opportunity_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline"
                                                    >
                                                        {result.title}
                                                    </a>
                                                </h4>
                                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded mt-1.5 inline-block">
                                                    {result.agency || 'N/A'}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0">
                                                {result.llm_score !== undefined
                                                    ? `${(result.llm_score * 100).toFixed(0)}% match`
                                                    : `${(result.score * 100).toFixed(0)}% match`
                                                }
                                            </span>
                                        </div>

                                        {result.why_match && (
                                            <div className="space-y-3">
                                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                                    {result.why_match.summary}
                                                </p>

                                                {result.why_match.alignment_points && result.why_match.alignment_points.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-green-700 mb-1">✅ Alignment Points:</p>
                                                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                                                            {result.why_match.alignment_points.map((point, i) => (
                                                                <li key={i} className="leading-relaxed">{point}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {result.why_match.risk_gaps && result.why_match.risk_gaps.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-yellow-700 mb-1">⚠️ Risk Gaps:</p>
                                                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                                                            {result.why_match.risk_gaps.map((risk, i) => (
                                                                <li key={i} className="leading-relaxed">{risk}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {result.suggested_pitch && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <p className="text-xs font-semibold text-green-800 mb-1">Suggested Pitch:</p>
                                                <p className="text-xs text-green-700 leading-relaxed">{result.suggested_pitch}</p>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="pt-2 border-t border-slate-100 flex items-center gap-4">
                                            <button
                                                onClick={() => handleTeamBuilder(result.title)}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                            >
                                                <Users className="w-3.5 h-3.5" />
                                                Find a team for this grant
                                            </button>
                                            <SendEmailButton
                                                emails={[email.trim().toLowerCase()]}
                                                title={result.title}
                                                content={formatGrantContent(result)}
                                                mode="single"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
