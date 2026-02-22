import type { StreamEvent } from '../types';

// Real Backend URL (port 5000 based on user's code, but let's stick to /api/chat proxy in vite.config.ts)
// Verify vite.config.ts proxy setup if needed, usually it proxies /api to backend
const API_URL = '/api/chat';

export function streamChat(
    text: string,
    files: File[],
    threadId: string,
    onEvent: (event: StreamEvent) => void
): () => void {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
        try {
            console.log("Starting stream to:", API_URL);

            // Prepare Request Body
            const payload = {
                message: text,
                thread_id: threadId,
                uploaded_faculty_info: files.length > 0
                // Add other fields if needed for future iterations
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal
            });

            if (!response.ok) {
                console.error("Server returned error:", response.status);
                onEvent({
                    type: 'message',
                    payload: { message: `Error: Server returned status ${response.status}` }
                });
                return;
            }

            if (!response.body) {
                console.error("Response body is empty");
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process buffer for SSE events
                const lines = buffer.split('\n');
                // Keep the last partial line in the buffer (if it doesn't end with \n)
                buffer = lines.pop() || '';

                let currentEventType: string | null = null;

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) {
                        currentEventType = null;
                        continue;
                    }

                    if (trimmedLine.startsWith('event:')) {
                        currentEventType = trimmedLine.substring(6).trim();
                    } else if (trimmedLine.startsWith('data:')) {
                        const dataStr = trimmedLine.substring(5).trim();
                        if (!currentEventType) {
                            // Some backends might send data without event name (default 'message')
                            // But our python backend is explicit.
                            console.warn("Received data without event type, skipping:", dataStr);
                            continue;
                        }

                        try {
                            const data = JSON.parse(dataStr);
                            // Debugging
                            console.log("Frontend received SSE data:", data);

                            // Detect the next_action to determine result type
                            const nextAction = data.next_action
                                || data.result?.next_action
                                || data.orchestrator?.result?.next_action;

                            const isGroupResult = nextAction && nextAction.startsWith('return_group');

                            if (isGroupResult) {
                                // Group matching results (return_group_matching_results, return_group_specific_grant_results, etc.)
                                const groupMatches = data.matches
                                    || data.result?.matches
                                    || data.orchestrator?.result?.matches
                                    || data.results;
                                if (groupMatches && Array.isArray(groupMatches)) {
                                    console.log("Found group matches:", groupMatches.length);
                                    data.groupResults = groupMatches;
                                }
                                // Clear results so one-to-one rendering doesn't trigger
                                delete data.results;
                                if (!data.message) {
                                    data.message = "Here are the group matching results:";
                                }
                            } else {
                                // One-to-one results: prefer recommendations for richer data
                                let matches = data.result?.recommendation?.recommendations
                                    || data.orchestrator?.result?.recommendation?.recommendations
                                    || data.recommendation?.recommendations
                                    || data.matches
                                    || data.result?.matches
                                    || data.orchestrator?.result?.matches
                                    || data.orchestrator?.matches;

                                if (matches && Array.isArray(matches)) {
                                    console.log("Found matches/recommendations array:", matches.length, "items");
                                    data.results = matches.map((m: any) => ({
                                        ...m,
                                        score: m.llm_score || m.score || 0
                                    }));
                                }
                            }

                            // Ensure message content exists
                            if (!data.message && (data.results?.length > 0 || data.groupResults?.length > 0)) {
                                data.message = "Here are the matched grants:";
                            }

                            onEvent({ type: currentEventType as any, payload: data });
                        } catch (e) {
                            console.error("Failed to parse SSE data:", dataStr, e);
                        }
                    }
                }
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Stream aborted");
            } else {
                console.error("Stream error:", error);
                onEvent({
                    type: 'message',
                    payload: { message: `Connection Error: ${error.message}. Ensure backend is running.` }
                });
            }
        }
    })();

    return () => {
        controller.abort();
    };
}
