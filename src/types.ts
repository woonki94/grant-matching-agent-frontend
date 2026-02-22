export interface FacultyInput {
    id: string;
    email: string;
    osuUrl: string;
    cvFile?: File;
}

export interface Grant {
    opportunity_id: string;
    title: string;
    agency: string;
    score: number;
    llm_score?: number;
    domain_score?: number;
    matched_terms?: string[];
    why_good_match?: string[];
    suggested_pitch?: string;
}

export interface GroupMatchMember {
    faculty_id: number;
    faculty_name: string;
    faculty_email: string;
}

export interface GroupMatchRole {
    faculty_id: number;
    role: string;
    why: string;
}

export interface GroupMatchStrength {
    faculty_id: number;
    bullets: string[];
}

export interface GroupMatchResult {
    grant_id: string;
    grant_title: string;
    agency_name?: string;
    team_members: GroupMatchMember[];
    justification: {
        one_paragraph: string;
        member_roles: GroupMatchRole[];
        coverage: {
            strong: string[];
            partial: string[];
            missing: string[];
        };
        member_strengths: GroupMatchStrength[];
        why_not_working: string[];
        recommendation: string;
    };
}

export interface Attachment {
    name: string;
    size: number;
    type: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    attachments?: Attachment[];
    results?: Grant[];
    groupResults?: GroupMatchResult[];
}

export type StreamEvent =
    | { type: 'step_update'; payload: { message: string; node?: string } }
    | { type: 'request_info'; payload: { type: string; message: string; emails_missing_osu_url?: string[]; orchestrator?: any } }
    | { type: 'message'; payload: { message: string; type?: string; results?: Grant[]; groupResults?: GroupMatchResult[]; orchestrator?: any; query?: string; detail?: string } };
