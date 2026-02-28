import React, { useState } from 'react';
import { Mail, Loader2, Check, X } from 'lucide-react';
import { sendJustificationEmail } from '../lib/api';

interface SendEmailButtonProps {
    emails: string[];
    title: string;
    content: string;
    mode: 'single' | 'group';
    /** Optional label overrides for team-member checkboxes (same order as emails) */
    labels?: string[];
}

type Status = 'idle' | 'selecting' | 'sending' | 'success' | 'error';

export const SendEmailButton: React.FC<SendEmailButtonProps> = ({
    emails,
    title,
    content,
    mode,
    labels,
}) => {
    const [status, setStatus] = useState<Status>('idle');
    const [selected, setSelected] = useState<Set<string>>(new Set(emails));
    const [feedback, setFeedback] = useState('');
    const [selectorError, setSelectorError] = useState('');

    const doSend = async (recipients: string[]) => {
        if (recipients.length === 0) {
            setSelectorError('Select at least one recipient.');
            return;
        }

        setSelectorError('');
        setStatus('sending');
        const res = await sendJustificationEmail({
            recipient_emails: recipients,
            title,
            content,
        });

        if (res.success) {
            setFeedback('Email sent!');
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } else {
            setFeedback(res.message);
            setStatus('error');
            setTimeout(() => setStatus(mode === 'group' ? 'selecting' : 'idle'), 3000);
        }
    };

    const handleClick = () => {
        if (mode === 'single') {
            doSend(emails.slice(0, 1));
        } else {
            setSelected(new Set(emails));
            setSelectorError('');
            setStatus('selecting');
        }
    };

    const toggleEmail = (email: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(email) ? next.delete(email) : next.add(email);
            return next;
        });
    };

    if (status === 'sending') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 px-3 py-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending…
            </span>
        );
    }

    if (status === 'success') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 px-3 py-1.5">
                <Check className="w-3.5 h-3.5" />
                {feedback}
            </span>
        );
    }

    if (status === 'error') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 px-3 py-1.5">
                <X className="w-3.5 h-3.5" />
                {feedback}
            </span>
        );
    }

    // ── Group selector panel ──────────────────────────────────────────────────
    if (status === 'selecting' && mode === 'group') {
        return (
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-slate-700">Select recipients:</p>
                {emails.map((email, i) => (
                    <label key={email} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selected.has(email)}
                            onChange={() => toggleEmail(email)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">
                            {labels?.[i] ? `${labels[i]} — ` : ''}
                            {email}
                        </span>
                    </label>
                ))}

                {selectorError && (
                    <p className="text-xs text-red-600">{selectorError}</p>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => doSend(Array.from(selected))}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Mail className="w-3 h-3" />
                        Send to {selected.size} selected
                    </button>
                    <button
                        onClick={() => setStatus('idle')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1.5 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // ── Default idle button ───────────────────────────────────────────────────
    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
        >
            <Mail className="w-3.5 h-3.5" />
            Send Email
        </button>
    );
};

