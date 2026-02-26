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
    team_score?: number;
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

// ── Collaborator / team-formation types ──────────────────────────────────────

export interface FacultySuggestion {
    faculty_id: number;
    name: string | null;
    email: string | null;
    position?: string | null;
    expertise?: string[];
    research_domains?: string[];
    application_domains?: string[];
    domain_score: number;
    llm_score?: number;
    reason?: string;
    covered?: string[];
    missing?: string[];
    is_existing_member?: boolean;
    team_score?: number;
}

export interface GroupJustification {
    one_paragraph: string;
    member_roles: { faculty_id: number; role: string; why: string }[];
    coverage: { strong: string[]; partial: string[]; missing: string[] };
    member_strengths: { faculty_id: number; bullets: string[] }[];
    why_not_working: string[];
    recommendation: string;
}

export interface CollaboratorsResult {
    next_action: 'return_collaborators';
    opportunity_id: string;
    opportunity_title: string | null;
    additional_count: number;
    team_score?: number;
    suggested_collaborators: FacultySuggestion[];
    existing_team_details?: FacultySuggestion[];
    group_justification?: GroupJustification | null;
}

export interface FormTeamResult {
    next_action: 'return_team';
    opportunity_id: string;
    opportunity_title: string | null;
    team_size: number;
    team_score?: number;
    suggested_team: FacultySuggestion[];
    group_justification?: GroupJustification | null;
}

// ── Stream event union ────────────────────────────────────────────────────────

export type StreamEvent =
    | { type: 'step_update'; payload: { message: string; node?: string } }
    | { type: 'request_info'; payload: { type: string; message: string; emails_missing_osu_url?: string[]; orchestrator?: any } }
    | { type: 'message'; payload: { message: string; type?: string; results?: Grant[]; groupResults?: GroupMatchResult[]; collaboratorsResult?: CollaboratorsResult; formTeamResult?: FormTeamResult; orchestrator?: any; query?: string; detail?: string } };
