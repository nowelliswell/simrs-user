import { useState, useRef, useEffect } from 'react';
import AiAssistantService from '../utils/AiAssistantService';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

function AiChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Halo! 👋 Saya **SIMRS AI Assistant**. Saya bisa membantu Anda:\n\n• Mencari pegawai\n• Melihat detail akses user\n• Melihat daftar group\n• Menjawab pertanyaan seputar sistem\n\nSilakan ketik pertanyaan Anda!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const sendMessage = async () => {
        const msg = input.trim();
        if (!msg || loading) return;

        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await AiAssistantService.sendMessage(msg);
            setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Gagal menghubungi AI. Pastikan server backend berjalan dan coba lagi.' }]);
        } finally {
            setLoading(false);
        }
    };

    // Simple markdown renderer: bold, inline code, bullets, and tables
    const renderMarkdown = (text: string) => {
        const lines = text.split('\n');
        const elements: JSX.Element[] = [];
        let tableRows: string[][] = [];
        let inTable = false;

        const flushTable = (keyPrefix: number) => {
            if (tableRows.length === 0) return;
            const header = tableRows[0];
            const dataRows = tableRows.slice(1).filter(r => !r.every(c => /^:?-+:?$/.test(c.trim())));
            
            elements.push(
                <div key={`table-${keyPrefix}`} className="overflow-x-auto my-2 rounded border border-gray-200">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
                            <tr>
                                {header.map((col, idx) => (
                                    <th key={idx} className="px-2 py-1.5 border-r last:border-r-0" dangerouslySetInnerHTML={{ __html: col.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {dataRows.map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="px-2 py-1 border-r last:border-r-0 text-gray-700" dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            tableRows = [];
            inTable = false;
        };

        lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                inTable = true;
                const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
                tableRows.push(cells);
            } else {
                if (inTable) {
                    flushTable(i);
                }
                if (trimmed === '') {
                    elements.push(<div key={`space-${i}`} className="h-1.5" />);
                } else {
                    let html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-200 px-1 rounded text-xs">$1</code>');
                    if (html.startsWith('• ') || html.startsWith('- ') || html.startsWith('* ')) {
                        html = `<span class="ml-2 font-medium">•</span> ${html.slice(2)}`;
                    }
                    elements.push(<p key={`p-${i}`} className="mb-0.5" dangerouslySetInnerHTML={{ __html: html }} />);
                }
            }
        });

        if (inTable) {
            flushTable(lines.length);
        }

        return elements;
    };

    return (
        <>
            {/* Floating Chat Panel */}
            {open && (
                <div className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[9999] animate-[slideUp_0.25s_ease-out]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">✨</div>
                            <div>
                                <div className="font-bold text-sm">SIMRS AI Assistant</div>
                                <div className="text-[10px] text-violet-200">Powered by Gemini</div>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-lg p-1 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: 'calc(70vh - 120px)' }}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-violet-600 text-white rounded-br-md'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                }`}>
                                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t flex-shrink-0">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder="Ketik pertanyaan..."
                                disabled={loading}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent disabled:opacity-50"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                className="bg-violet-600 text-white px-3 py-2 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`fixed bottom-4 right-4 sm:right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-[9999] transition-all duration-300 hover:scale-110 active:scale-95 ${
                    open 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                }`}
            >
                {open ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <span className="text-2xl">✨</span>
                )}
            </button>

            {/* Keyframe for slide up animation */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}

export default AiChatWidget;
