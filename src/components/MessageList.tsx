import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';

interface MessageListProps {
    messages: Message[];
    isThinking?: boolean;
    thinkingLogs?: string[];
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    isThinking,
    thinkingLogs = []
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking, thinkingLogs]);

    return (
        <div className="flex-1 overflow-y-auto w-full">
            <div className="flex flex-col min-h-full">
                <div className="flex-1 flex flex-col">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                            <h1 className="text-4xl font-semibold mb-8 text-slate-800">GrantFetcher Chat</h1>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))
                    )}

                    {isThinking && (
                        <ThinkingIndicator
                            logs={thinkingLogs}
                        />
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
};
