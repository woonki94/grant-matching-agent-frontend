import type { FacultyInput, StreamEvent, Grant, GroupMatchResult, CollaboratorsResult, FormTeamResult, FacultyProfile, FacultySourcePatch, FacultyKeywordsPatch, FacultyPatchResponse } from '../types';

const API_URL = '/api/chat';

export interface SingleFacultyParams {
    mode: 'single';
    email: string;
    osuUrl: string;
    cvFile?: File;
    message: string;
    threadId: string;
}

export interface GroupParams {
    mode: 'group';
    faculty: FacultyInput[];
    message: string;
    threadId: string;
}

export type ChatParams = SingleFacultyParams | GroupParams;

function buildFormData(params: ChatParams): FormData {
    const fd = new FormData();
    fd.append('message', params.message);
    fd.append('thread_id', params.threadId);

    if (params.mode === 'single') {
        fd.append('email', params.email);
        fd.append('osu_url', params.osuUrl);
        if (params.cvFile) {
            fd.append('cv', params.cvFile);
        }
    } else {
        // Group mode: send emails as JSON array
        const emails = params.faculty.map(f => f.email);
        fd.append('emails', JSON.stringify(emails));

        // OSU URL pairs (all faculty)
        for (const f of params.faculty) {
            fd.append('osu_url_email', f.email);
            fd.append('osu_url_value', f.osuUrl);
        }

        // CV pairs (only faculty with CV files, zipped by order)
        for (const f of params.faculty.filter(f => f.cvFile)) {
            fd.append('cv_email', f.email);
            fd.append('cv_file', f.cvFile!);
        }
    }

    return fd;
}

function parseResults(data: any): { results?: Grant[]; groupResults?: GroupMatchResult[] } {
    console.log("Raw incoming data from backend:", data);

    const nextAction = data.next_action
        || data.result?.next_action
        || data.orchestrator?.result?.next_action;

    const isGroupResult = nextAction && nextAction.startsWith('return_group');

    if (isGroupResult) {
        const groupMatches = data.matches
            || data.result?.matches
            || data.orchestrator?.result?.matches
            || data.results;
        console.log("Parsed group matches:", groupMatches);
        return { groupResults: Array.isArray(groupMatches) ? groupMatches : undefined };
    }

    const matches = data.results
        || data.orchestrator?.result?.recommendation?.recommendations
        || data.result?.recommendation?.recommendations
        || data.recommendation?.recommendations
        || data.orchestrator?.result?.matches
        || data.result?.matches
        || data.matches;

    console.log("Parsed single matches:", matches);

    if (Array.isArray(matches)) {
        return {
            results: matches.map((m: any) => ({
                ...m,
                score: m.llm_score || m.score || 0,
            })),
        };
    }

    return {};
}

// ── Generic SSE stream helper ─────────────────────────────────────────────────

function streamSSE(
    url: string,
    body: FormData,
    onEvent: (type: string, payload: any) => void,
    signal: AbortSignal,
) {
    (async () => {
        try {
            const response = await fetch(url, { method: 'POST', body, signal });
            if (!response.ok) {
                onEvent('message', { message: `Server error: ${response.status}`, type: 'error' });
                return;
            }
            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let currentType: string | null = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const t = line.trim();
                    if (!t) { currentType = null; continue; }
                    if (t.startsWith('event:')) {
                        currentType = t.substring(6).trim();
                    } else if (t.startsWith('data:') && currentType) {
                        try {
                            const data = JSON.parse(t.substring(5).trim());
                            onEvent(currentType, data);
                        } catch { /* skip malformed */ }
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                onEvent('message', { message: `Connection error: ${err.message}`, type: 'error' });
            }
        }
    })();
}

// ── Collaborator-finding helpers ──────────────────────────────────────────────

function buildTeamFormData(
    faculty: FacultyInput[],
    extra: Record<string, string | number>,
): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(extra)) fd.append(k, String(v));

    const emails = faculty.map(f => f.email);
    if (emails.length > 0) {
        fd.append('emails', JSON.stringify(emails));
        for (const f of faculty) {
            fd.append('osu_url_email', f.email);
            fd.append('osu_url_value', f.osuUrl);
        }
        for (const f of faculty.filter(f => f.cvFile)) {
            fd.append('cv_email', f.email);
            fd.append('cv_file', f.cvFile!);
        }
    }

    return fd;
}

export interface FindCollaboratorsParams {
    grantLink?: string;
    grantTitle?: string;
    faculty: FacultyInput[];
    additionalCount: number;
    message?: string;
}

export function streamFindCollaborators(
    params: FindCollaboratorsParams,
    onEvent: (event: StreamEvent) => void,
): () => void {
    const controller = new AbortController();
    const fd = buildTeamFormData(params.faculty, {
        ...(params.grantLink ? { grant_link: params.grantLink } : {}),
        ...(params.grantTitle ? { grant_title: params.grantTitle } : {}),
        additional_count: params.additionalCount,
        ...(params.message ? { message: params.message } : {}),
    });
    streamSSE('/api/team/find-collaborators', fd, (type, data) => {
        if (type === 'message' && data.result?.next_action === 'return_collaborators') {
            onEvent({ type: 'message', payload: { ...data, collaboratorsResult: data.result as CollaboratorsResult } });
        } else {
            onEvent({ type: type as any, payload: data });
        }
    }, controller.signal);
    return () => controller.abort();
}

export interface FormTeamParams {
    grantLink?: string;
    grantTitle?: string;
    faculty: FacultyInput[];
    teamSize: number;
    message?: string;
}

export function streamFormTeam(
    params: FormTeamParams,
    onEvent: (event: StreamEvent) => void,
): () => void {
    const controller = new AbortController();
    const fd = buildTeamFormData(params.faculty, {
        ...(params.grantLink ? { grant_link: params.grantLink } : {}),
        ...(params.grantTitle ? { grant_title: params.grantTitle } : {}),
        team_size: params.teamSize,
        ...(params.message ? { message: params.message } : {}),
    });
    streamSSE('/api/team/form-team', fd, (type, data) => {
        if (type === 'message' && data.result?.next_action === 'return_team') {
            onEvent({ type: 'message', payload: { ...data, formTeamResult: data.result as FormTeamResult } });
        } else {
            onEvent({ type: type as any, payload: data });
        }
    }, controller.signal);
    return () => controller.abort();
}

// ── Send justification email ─────────────────────────────────────────────────

export interface SendEmailParams {
    recipient_emails: string[];
    title: string;
    content: string;
}

export async function sendJustificationEmail(
    params: SendEmailParams,
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch('/api/notifications/email-justification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            const err = await response.text();
            return { success: false, message: `Server error ${response.status}: ${err}` };
        }
        const data = await response.json();
        return { success: true, message: data.message || 'Email sent successfully.' };
    } catch (err: any) {
        return { success: false, message: `Network error: ${err.message}` };
    }
}

// ─────────────────────────────────────────────────────────────────────────────

export function streamChat(
    params: ChatParams,
    onEvent: (event: StreamEvent) => void
): () => void {
    const controller = new AbortController();
    const fd = buildFormData(params);

    streamSSE(API_URL, fd, (type, data) => {
        const parsed = parseResults(data);
        onEvent({ type: type as any, payload: { ...data, ...parsed } });
    }, controller.signal);

    return () => controller.abort();
}

// ── Faculty profile lookup ────────────────────────────────────────────────────

export async function fetchFacultyByEmail(email: string): Promise<FacultyProfile> {
    const response = await fetch('/api/faculty/by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Server error ${response.status}`);
    }
    const data = await response.json();
    if (!data.ok || !data.faculty) {
        throw new Error(data.message || 'Faculty not found.');
    }
    return data.faculty as FacultyProfile;
}

// ── Faculty PATCH helpers ─────────────────────────────────────────────────────

async function patchFaculty(body: FacultySourcePatch | FacultyKeywordsPatch): Promise<FacultyPatchResponse> {
    const response = await fetch('/api/faculty/by-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        let msg = `Server error ${response.status}`;
        try { const t = await response.text(); if (t) msg = t; } catch { /* ignore */ }
        throw new Error(msg);
    }
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || 'Update failed.');
    return data as FacultyPatchResponse;
}

/** Update source info (basic_info / data_from). Keywords are regenerated by backend. */
export function patchFacultySource(patch: FacultySourcePatch): Promise<FacultyPatchResponse> {
    return patchFaculty(patch);
}

/** Directly override keywords. Must NOT include basic_info / data_from. */
export function patchFacultyKeywords(patch: FacultyKeywordsPatch): Promise<FacultyPatchResponse> {
    return patchFaculty(patch);
}

