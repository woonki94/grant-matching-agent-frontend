import React from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MissingFacultyModalProps {
    isOpen: boolean;
    missingEmails: string[];
    onClose: () => void;
}

export const MissingFacultyModal: React.FC<MissingFacultyModalProps> = ({
    isOpen,
    missingEmails,
    onClose,
}) => {
    const navigate = useNavigate();

    if (!isOpen || missingEmails.length === 0) return null;

    const handleRegister = () => {
        navigate('/faculty-profile', { state: { tab: 'new', prefillEmails: missingEmails } });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="w-6 h-6" />
                        <h2 className="text-lg font-semibold text-slate-800">Faculty Not Found</h2>
                    </div>
                    
                    <p className="text-sm text-slate-600 leading-relaxed">
                        The following faculty email{missingEmails.length > 1 ? 's were' : ' was'} not found in the database. 
                        We need their reference profile data before we can find matching grants.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <ul className="space-y-1">
                            {missingEmails.map((email, i) => (
                                <li key={i} className="text-sm font-medium text-slate-700 font-mono">
                                    {email}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 pt-2">
                        Would you like to register {missingEmails.length > 1 ? 'them' : 'this faculty'} now?
                    </p>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        No, cancel
                    </button>
                    <button
                        onClick={handleRegister}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                    >
                        <UserPlus className="w-4 h-4" />
                        Yes, register {missingEmails.length > 1 ? 'them' : 'now'}
                    </button>
                </div>
            </div>
        </div>
    );
};
