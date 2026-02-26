import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex flex-col items-center justify-center px-4">
            {/* Header */}
            <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full mb-5">
                    Oregon State University · AI Grant Matching
                </div>
                <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-4">
                    Grant<span className="text-green-600">Matcher</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
                    AI-powered grant discovery tailored to your research profile and team expertise.
                </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                {/* Find me a Grant */}
                <button
                    onClick={() => navigate('/find-grant')}
                    className="group relative flex flex-col items-start p-8 bg-white rounded-2xl border-2 border-slate-100 shadow-sm hover:border-green-400 hover:shadow-lg transition-all duration-200 text-left"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-200 transition-colors">
                        <Search className="w-6 h-6 text-green-700" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Find me a Grant</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Discover funding opportunities that align with your individual research profile and expertise.
                    </p>
                    <div className="mt-6 text-sm font-semibold text-green-600 group-hover:text-green-700 flex items-center gap-1">
                        Get started →
                    </div>
                </button>

                {/* Team Builder */}
                <button
                    onClick={() => navigate('/team-builder')}
                    className="group relative flex flex-col items-start p-8 bg-white rounded-2xl border-2 border-slate-100 shadow-sm hover:border-indigo-400 hover:shadow-lg transition-all duration-200 text-left"
                >
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-200 transition-colors">
                        <Users className="w-6 h-6 text-indigo-700" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Team Builder</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Find grants that match a multi-faculty team's collective expertise and research strengths.
                    </p>
                    <div className="mt-6 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
                        Build a team →
                    </div>
                </button>
            </div>

            <p className="mt-12 text-xs text-slate-400">
                GrantMatcher may make mistakes. Always verify grant details independently.
            </p>
        </div>
    );
};
