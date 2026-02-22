import type { FacultyInput, StreamEvent, Grant, GroupMatchResult } from '../types';

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
    const nextAction = data.next_action
        || data.result?.next_action
        || data.orchestrator?.result?.next_action;

    const isGroupResult = nextAction && nextAction.startsWith('return_group');

    if (isGroupResult) {
        const groupMatches = data.matches
            || data.result?.matches
            || data.orchestrator?.result?.matches
            || data.results;
        return { groupResults: Array.isArray(groupMatches) ? groupMatches : undefined };
    }

    const matches = data.result?.recommendation?.recommendations
        || data.orchestrator?.result?.recommendation?.recommendations
        || data.recommendation?.recommendations
        || data.matches
        || data.result?.matches
        || data.orchestrator?.result?.matches;

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

export function streamChat(
    params: ChatParams,
    onEvent: (event: StreamEvent) => void
): () => void {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
        try {
            const fd = buildFormData(params);

            const response = await fetch(API_URL, {
                method: 'POST',
                body: fd,
                signal,
            });

            if (!response.ok) {
                onEvent({
                    type: 'message',
                    payload: { message: `Server error: ${response.status}`, type: 'error' },
                });
                return;
            }

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let currentEventType: string | null = null;

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) { currentEventType = null; continue; }

                    if (trimmed.startsWith('event:')) {
                        currentEventType = trimmed.substring(6).trim();
                    } else if (trimmed.startsWith('data:') && currentEventType) {
                        try {
                            const data = JSON.parse(trimmed.substring(5).trim());
                            const parsed = parseResults(data);
                            onEvent({
                                type: currentEventType as any,
                                payload: { ...data, ...parsed },
                            });
                        } catch {
                            // malformed SSE data — skip
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                onEvent({
                    type: 'message',
                    payload: { message: `Connection error: ${err.message}`, type: 'error' },
                });
            }
        }
    })();

    return () => controller.abort();
}
