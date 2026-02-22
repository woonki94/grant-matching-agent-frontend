import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import type { Message } from './types';

function App() {
  const [sessions, setSessions] = useState<{ id: string; title: string; messages: Message[] }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleNewChat = () => {
    if (messages.length > 0) {
      const newSession = {
        id: Date.now().toString(),
        title: messages[0].content.slice(0, 30) || "New Chat",
        messages: [...messages],
      };
      setSessions((prev) => [newSession, ...prev]);
    }
    setMessages([]);
  };

  const loadSession = (sessionMessages: Message[]) => {
    setMessages(sessionMessages);
  };

  return (
    <div className="h-screen w-full flex bg-white">
      {/* Sidebar Placeholder */}
      <div className="w-[260px] bg-slate-900 hidden md:flex flex-col text-slate-300 p-3">
        <div
          onClick={handleNewChat}
          className="p-3 mb-4 rounded-md border border-slate-700 hover:bg-slate-800 cursor-pointer transition-colors text-sm flex gap-2 items-center"
        >
          <span>+ New chat</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 mb-2 px-3">History</div>
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => loadSession(session.messages)}
              className="px-3 py-2 hover:bg-slate-800 rounded-md cursor-pointer text-sm truncate"
            >
              {session.title}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-600 italic">No previous chats</div>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-green-400 to-blue-500"></div>
            <div className="text-sm font-medium text-white">User Name</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full relative">
        <ChatInterface messages={messages} setMessages={setMessages} />
      </div>
    </div>
  );
}

export default App;
