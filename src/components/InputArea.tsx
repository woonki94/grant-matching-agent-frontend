import React, { useRef, useState, type ChangeEvent, type KeyboardEvent, useEffect } from 'react';
import { Paperclip, Send, X, FileText } from 'lucide-react';

interface InputAreaProps {
    onSendMessage: (text: string, files: File[]) => void;
    isLoading: boolean;
    externalFiles?: File[];
    onClearExternalFiles?: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
    onSendMessage,
    isLoading,
    externalFiles = [],
    onClearExternalFiles
}) => {
    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync external files (dragged and dropped)
    useEffect(() => {
        if (externalFiles.length > 0) {
            setFiles(prev => [...prev, ...externalFiles]);
            if (onClearExternalFiles) onClearExternalFiles();
        }
    }, [externalFiles, onClearExternalFiles]);

    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
            setFiles(prev => [...prev, ...newFiles]);
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        if ((!text.trim() && files.length === 0) || isLoading) return;
        onSendMessage(text, files);
        setText('');
        setFiles([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* File Previews */}
            {files.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {files.map((file, index) => (
                        <div key={index} className="relative group flex flex-shrink-0 items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md shadow-sm">
                            <div className="bg-red-500 rounded p-1 text-white">
                                <FileText className="w-3 h-3" />
                            </div>
                            <span className="text-xs text-slate-700 max-w-[120px] truncate">{file.name}</span>
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-1 -right-1 bg-slate-200 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-300"
                            >
                                <X className="w-3 h-3 text-slate-600" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex items-end w-full p-3 bg-white border border-slate-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="application/pdf"
                    multiple
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Attach PDF"
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message..."
                    className="flex-1 max-h-[200px] py-2 bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-800 placeholder:text-slate-400 leading-6"
                    rows={1}
                    style={{ minHeight: '44px' }}
                />

                <button
                    onClick={handleSend}
                    disabled={(!text.trim() && files.length === 0) || isLoading}
                    className="p-2 ml-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
                GrantFetcher can make mistakes. Consider checking important information.
            </p>
        </div>
    );
};
