import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { streamChat } from '../lib/api';
import { ThinkingIndicator } from '../components/ThinkingIndicator';
import { SendEmailButton } from '../components/SendEmailButton';
import { MissingFacultyModal } from '../components/MissingFacultyModal';
import { formatGrantContent } from '../lib/formatEmail';
import type { Grant, StreamEvent } from '../types';

function renderHighlighted(text: string): React.ReactNode {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
            : part
    );
}

export const FindGrantPage: React.FC = () => {
    const navigate = useNavigate();
    const threadId = useRef(`thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const abortRef = useRef<(() => void) | null>(null);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [thinkingLogs, setThinkingLogs] = useState<string[]>([]);
    const [results, setResults] = useState<Grant[]>([]);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [missingEmails, setMissingEmails] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);

    const validate = (): string | null => {
        if (!email.trim()) return 'Email is required.';
        return null;
    };

    const handleSubmit = () => {
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setError(null);
        setInfoMessage(null);
        setResults([]);
        setMissingEmails([]);
        setThinkingLogs([]);
        setElapsedSeconds(null);
        setIsLoading(true);
        setSubmitted(true);

        if (abortRef.current) abortRef.current();

        const abort = streamChat(
            {
                mode: 'single',
                email: email.trim().toLowerCase(),
                osuUrl: '',
                message: message.trim() || 'Find the best matching grants for my research profile.',
                threadId: threadId.current,
            },
            (event: StreamEvent) => {
                if (event.type === 'step_update') {
                    setThinkingLogs(prev => [...prev, event.payload.message]);
                } else if (event.type === 'request_info') {
                    setIsLoading(false);
                    if (event.payload.type === 'email_not_in_db' || event.payload.type === 'emails_not_in_db') {
                        setMissingEmails(event.payload.emails_missing_in_db || []);
                        return;
                    }
                    setInfoMessage(event.payload.message);
                } else if (event.type === 'message') {
                    setIsLoading(false);
                    if (event.payload.type === 'error') {
                        setError(event.payload.detail || event.payload.message);

                    } else if (event.payload.results?.length) {
                        setResults(event.payload.results);
                        if (event.payload.elapsed_seconds != null) {
                            setElapsedSeconds(event.payload.elapsed_seconds);
                        }
                    } else {
                        setInfoMessage(event.payload.message);
                    }
                }
            }
        );

        abortRef.current = abort;
    };

    const handleTeamBuilder = (grantTitle: string) => {
        navigate('/team-builder/form-team', { state: { grantTitle } });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <MissingFacultyModal 
                isOpen={missingEmails.length > 0} 
                missingEmails={missingEmails} 
                onClose={() => setMissingEmails([])} 
            />

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
                            placeholder="alan.fern@oregonstate.edu"
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-slate-400"
                        />
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
                                <div className="flex items-baseline justify-between gap-3">
                                    <h3 className="text-sm font-semibold text-slate-600">
                                        {results.length} Grant{results.length > 1 ? 's' : ''} Found
                                    </h3>
                                    {elapsedSeconds != null && (
                                        <span className="text-xs text-slate-400">
                                            Response generated in {elapsedSeconds.toFixed(2)}s
                                        </span>
                                    )}
                                </div>
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

                                        {result.grant_brief && (
                                            <p className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-blue-200 pl-2">
                                                {result.grant_brief}
                                            </p>
                                        )}

                                        {result.why_match && (
                                            <div className="space-y-2">
                                                {result.why_match.summary && (
                                                    <p className="text-xs text-slate-700 leading-relaxed">
                                                        {renderHighlighted(result.why_match.summary)}
                                                    </p>
                                                )}

                                                {result.why_match.alignment_points && result.why_match.alignment_points.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-green-700 mb-1">✅ Why it fits:</p>
                                                        <ul className="text-xs text-slate-600 space-y-1 list-none pl-3">
                                                            {result.why_match.alignment_points.map((point, i) => (
                                                                <li key={i} className="leading-relaxed before:content-['•'] before:mr-1.5 before:text-green-500">
                                                                    {renderHighlighted(point)}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {result.why_match.risk_gaps && result.why_match.risk_gaps.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ Gaps to address:</p>
                                                        <ul className="text-xs text-slate-600 space-y-1 list-none pl-3">
                                                            {result.why_match.risk_gaps.map((risk, i) => (
                                                                <li key={i} className="leading-relaxed before:content-['•'] before:mr-1.5 before:text-amber-500">
                                                                    {renderHighlighted(risk)}
                                                                </li>
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
