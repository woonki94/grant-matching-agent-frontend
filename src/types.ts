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
    grant_explanation?: string;
    score: number;
    llm_score?: number;
    domain_score?: number;
    matched_terms?: string[];
    fit_label?: 'mismatch' | 'bad' | 'good' | 'great' | 'fantastic';
    why_match?: {
        summary: string;
        alignment_points: string[];
        risk_gaps: string[];
    };
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

// ── Faculty profile types ─────────────────────────────────────────────────────

export interface FacultyKeywordSpecialization {
    t: string;
    w: number;
}

export interface FacultyKeywords {
    domain: string[];
    specialization: FacultyKeywordSpecialization[];
}

export interface FacultyAttachedFile {
    id: number;
    additional_info_id: number;
    source_url: string;
    detected_type: string;
    content_char_count: number;
}

export interface FacultyPublication {
    id: number;
    title: string;
    year: number;
}

export interface FacultyProfile {
    faculty_id: number;
    name: string;
    email: string;
    position: string;
    organizations: string[];
    all_keywords: {
        research: FacultyKeywords;
        application: FacultyKeywords;
    };
    basic_info: {
        faculty_name: string;
        email: string;
        position: string;
        organizations: string[];
    };
    data_from: {
        info_source_url: string;
        attached_files: FacultyAttachedFile[];
        publication_titles: FacultyPublication[];
        publication_fetched_upto_year?: number;
    };
}

// ── Faculty PATCH types ───────────────────────────────────────────────────────

/** Source-info update (basic_info + data_from). Keywords are regenerated. */
export interface FacultySourcePatch {
    email: string;
    basic_info?: {
        faculty_name?: string;
        position?: string;
        organizations?: string[];
    };
    data_from?: {
        info_source_url?: string;
        publications?: {
            set_fetch_year_range?: { from: number; to: number };
            delete?: number; // single ID
        };
        attached_files?: {
            add?: { source_url: string }[];
            update?: { id: number; source_url: string }[];
            delete?: number[];
        };
    };
}

/** Direct keyword override. No source-info changes allowed. */
export interface FacultyKeywordsPatch {
    email: string;
    all_keywords: {
        research: FacultyKeywords;
        application: FacultyKeywords;
    };
    keyword_source?: string;
}

export type KeywordUpdateMode =
    | 'regenerated_from_sources'
    | 'frontend_override'
    | 'regeneration_failed'
    | 'none';

export interface FacultyPatchResponse {
    ok: boolean;
    faculty: FacultyProfile;
    updated_keywords: {
        research: FacultyKeywords;
        application: FacultyKeywords;
    };
    keyword_update_mode: KeywordUpdateMode;
    source_change_detail?: Record<string, number>;
}

// ── Stream event union ────────────────────────────────────────────────────────

export type StreamEvent =
    | { type: 'step_update'; payload: { message: string; node?: string } }
    | { type: 'request_info'; payload: { type: string; message: string; emails_missing_osu_url?: string[]; orchestrator?: any } }
    | { type: 'message'; payload: { message: string; type?: string; results?: Grant[]; groupResults?: GroupMatchResult[]; collaboratorsResult?: CollaboratorsResult; formTeamResult?: FormTeamResult; orchestrator?: any; query?: string; detail?: string } };
