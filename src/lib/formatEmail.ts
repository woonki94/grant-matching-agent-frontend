import type { Grant, GroupMatchResult } from '../types';

/** Build a readable text summary from a single Grant result (what's shown on screen). */
export function formatGrantContent(result: Grant): string {
    const lines: string[] = [];

    lines.push(`Agency: ${result.agency || 'N/A'}`);

    const score = result.llm_score !== undefined
        ? `${(result.llm_score * 100).toFixed(0)}% match`
        : `${(result.score * 100).toFixed(0)}% match`;
    lines.push(`Score: ${score}`);

    if (result.why_match) {
        lines.push('');
        lines.push(result.why_match.summary);

        if (result.why_match.alignment_points?.length) {
            lines.push('');
            lines.push('Alignment Points:');
            result.why_match.alignment_points.forEach(p => lines.push(`  • ${p}`));
        }

        if (result.why_match.risk_gaps?.length) {
            lines.push('');
            lines.push('Risk Gaps:');
            result.why_match.risk_gaps.forEach(r => lines.push(`  • ${r}`));
        }
    }

    if (result.suggested_pitch) {
        lines.push('');
        lines.push(`Suggested Pitch: ${result.suggested_pitch}`);
    }

    return lines.join('\n');
}

/** Build a readable text summary from a GroupMatchResult (what's shown on screen). */
export function formatGroupContent(gm: GroupMatchResult): string {
    const lines: string[] = [];
    const j = gm.justification;

    lines.push(`Agency: ${gm.agency_name || 'N/A'}`);

    if (gm.team_score !== undefined) {
        lines.push(`Team Fit: ${(gm.team_score * 100).toFixed(0)}%`);
    }

    lines.push(`Team: ${gm.team_members.map(m => m.faculty_name).join(', ')}`);

    lines.push('');
    lines.push(j.one_paragraph);

    lines.push('');
    lines.push('Team Roles:');
    j.member_roles.forEach(mr => {
        const name = gm.team_members.find(m => m.faculty_id === mr.faculty_id)?.faculty_name || '';
        lines.push(`  ${name} — ${mr.role}: ${mr.why}`);
    });

    lines.push('');
    lines.push(`Recommendation: ${j.recommendation}`);

    if (j.coverage.strong.length) {
        lines.push('');
        lines.push('Strong Coverage:');
        j.coverage.strong.forEach(s => lines.push(`  • ${s}`));
    }
    if (j.coverage.partial.length) {
        lines.push('Partial Coverage:');
        j.coverage.partial.forEach(s => lines.push(`  • ${s}`));
    }
    if (j.coverage.missing.length) {
        lines.push('Missing:');
        j.coverage.missing.forEach(s => lines.push(`  • ${s}`));
    }

    if (j.member_strengths.length) {
        lines.push('');
        lines.push('Member Strengths:');
        j.member_strengths.forEach(ms => {
            const name = gm.team_members.find(m => m.faculty_id === ms.faculty_id)?.faculty_name || '';
            lines.push(`  ${name}:`);
            ms.bullets.forEach(b => lines.push(`    • ${b}`));
        });
    }

    if (j.why_not_working.length) {
        lines.push('');
        lines.push('Potential Challenges:');
        j.why_not_working.forEach(w => lines.push(`  • ${w}`));
    }

    return lines.join('\n');
}
