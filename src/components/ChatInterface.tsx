import React, { useState, type DragEvent, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { streamChat } from '../lib/api';
import type { Message } from '../types';

interface ChatInterfaceProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, setMessages }) => {
    // const [messages, setMessages] = useState<Message[]>([]); // Lifted to App.tsx
    const [isLoading, setIsLoading] = useState(false);
    const [thinkingLogs, setThinkingLogs] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

    // Generate a thread ID for the session
    const threadIdRef = useRef<string>("");

    useEffect(() => {
        // Simple random thread ID generation
        threadIdRef.current = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Ref to hold the abort function for the current stream
    const abortStreamRef = useRef<(() => void) | null>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
            setDroppedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleSendMessage = async (text: string, files: File[]) => {
        // Combine dropped files with selected files
        const allFiles = [...files, ...droppedFiles];

        // 1. Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            attachments: allFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setThinkingLogs([]);
        setDroppedFiles([]); // Clear dropped files after sending

        // 2. Start Streaming
        if (abortStreamRef.current) abortStreamRef.current();

        const abort = streamChat(
            {
                mode: 'single',
                email: '',
                osuUrl: '',
                cvFile: allFiles[0],
                message: text,
                threadId: threadIdRef.current,
            },
            (event) => {
                switch (event.type) {
                    case 'step_update':
                        setThinkingLogs(prev => [...prev, event.payload.message]);
                        break;

                    case 'request_info':
                        // End thinking, show the request message
                        setIsLoading(false);
                        setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: event.payload.message // "Please provide..."
                        }]);
                        break;

                    case 'message':
                        // Final result
                        setIsLoading(false);
                        setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: event.payload.message,
                            results: event.payload.results,
                            groupResults: event.payload.groupResults
                        }]);
                        break;
                }
            }
        );

        abortStreamRef.current = abort;
    };

    return (
        <div
            className={`flex flex-col h-screen bg-white transition-colors ${isDragging ? 'bg-blue-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm pointer-events-none">
                    <div className="text-2xl font-semibold text-blue-600">Drop PDF files here</div>
                </div>
            )}

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto relative overflow-hidden">
                <MessageList
                    messages={messages}
                    isThinking={isLoading}
                    thinkingLogs={thinkingLogs}
                />

                <div className="w-full pb-4 bg-gradient-to-t from-white via-white to-transparent pt-10 px-4">
                    <InputArea
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        externalFiles={droppedFiles}
                        onClearExternalFiles={() => setDroppedFiles([])}
                    />
                </div>
            </main>
        </div>
    );
};
