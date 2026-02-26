import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus, Lightbulb } from 'lucide-react';

const options = [
    {
        icon: Users,
        title: 'Find Grants for Our Team',
        description:
            'You already have a research team. Provide your team members\' details and we will find the best-matching grant opportunities for the group.',
        cta: 'Find Grants',
        path: '/team-builder/find-grants',
        accent: 'indigo',
    },
    {
        icon: UserPlus,
        title: 'Find Additional Collaborators',
        description:
            'You have a grant and an existing team, but need more members. Provide the grant and your current team — we will suggest OSU faculty who complement you best.',
        cta: 'Find Collaborators',
        path: '/team-builder/find-collaborators',
        accent: 'emerald',
    },
    {
        icon: Lightbulb,
        title: 'Form a Team for a Grant',
        description:
            'You found an interesting grant and want to assemble the right team. Provide the grant details — we will suggest top OSU faculty who match the grant\'s requirements.',
        cta: 'Form a Team',
        path: '/team-builder/form-team',
        accent: 'violet',
    },
];

const accentStyles: Record<string, { card: string; icon: string; button: string }> = {
    indigo: {
        card: 'border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-100',
        icon: 'bg-indigo-100 text-indigo-600',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    emerald: {
        card: 'border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100',
        icon: 'bg-emerald-100 text-emerald-600',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    violet: {
        card: 'border-violet-100 hover:border-violet-300 hover:shadow-violet-100',
        icon: 'bg-violet-100 text-violet-600',
        button: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
};

export const TeamBuilderLandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
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
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h1 className="text-base font-semibold text-slate-800">Team Builder</h1>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-14 space-y-10">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">What would you like to do?</h2>
                    <p className="text-slate-500 text-sm">Choose a scenario to get started.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
                    {options.map((opt) => {
                        const Icon = opt.icon;
                        const styles = accentStyles[opt.accent];
                        return (
                            <div
                                key={opt.path}
                                className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col gap-4 cursor-pointer ${styles.card}`}
                                onClick={() => navigate(opt.path)}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.icon}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <h3 className="font-semibold text-slate-900 leading-snug">{opt.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{opt.description}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(opt.path); }}
                                    className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${styles.button}`}
                                >
                                    {opt.cta}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
