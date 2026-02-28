import { useState } from 'react'
import ProcessElement from './ProcessElement'
import PageLayout from './PageLayout'
import type { Score, StreamEvent } from './types'
import { RobotIcon } from './assets/RobotIcon'

export default function RAGPlayground() {
    const [query, setQuery] = useState('');
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [finalAnswer, setFinalAnswer] = useState('');
    const [finalReferences, setFinalReferences] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setEvents([]);
        setFinalAnswer('');
        setFinalReferences([]);

        try {
            const response = await fetch('http://localhost:8000/rag/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: query })
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        try {
                            const event: StreamEvent = JSON.parse(line);
                            event.time = new Date().toLocaleTimeString();
                            switch (event.step) {
                                case 'answer_chunk':
                                    setFinalAnswer(prev => prev + event.token);
                                    break;
                                case 'answer_end':
                                    if (event.references) {
                                        setFinalReferences(event.references);
                                    }
                                    break;
                                case 'complete':
                                    setIsLoading(false);
                                    break;
                                default:
                                    setEvents(prev => [...prev, event]);
                                    break;
                            }
                        } catch {
                            console.error('Error parsing JSON:', line);
                        }
                    }
                }
                buffer = lines[lines.length - 1];
            }
        } catch (error) {
            console.error('Stream error:', error);
            setIsLoading(false);
        }
    };

    const leftContent = (
        <div className="w-full relative flex flex-col pt-2 animate-rightIn">
            <h2 className="text-[15px] font-bold tracking-[-0.3px] mb-2 leading-[normal]">Write Your Own Query</h2>
            <p className="text-[13px] font-medium leading-[normal] mb-[32px] whitespace-pre-wrap">
                Ask any question you want to test the RAG system result, you can evaluation the result by yourself. 😉
            </p>

            <div className="mb-[20px] relative">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSearch();
                        }
                    }}
                    rows={4}
                    className="bg-[#fafafa] border border-[#9a9a9a] rounded-[6px] h-[123px] w-full p-4 overflow-y-auto text-[13px] text-black font-normal leading-[normal] tracking-[-0.24px] focus:outline-none focus:border-black resize-none shadow-sm"
                />
            </div>

            <div className="flex justify-end w-full">
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                    className={`bg-[#c73636] shadow-[0px_0px_4px_rgba(0,0,0,0.25)] rounded-[6px] px-[20px] py-[10px] flex items-center justify-center transition-all ${isLoading || !query.trim() ? 'bg-gray-400 opacity-80 shadow-none' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
                >
                    <span className="text-white text-[13px] font-bold leading-[normal]">Generate</span>
                </button>
            </div>
        </div>
    );

    const rightContent = (
        <div className="p-8 pt-16 pb-32 max-w-[800px] mx-auto flex flex-col items-center">
            {(events.length === 0 && !finalAnswer) ? (
                <div className="flex flex-col items-center justify-center mt-[35vh]">
                    <RobotIcon className="w-[60px] h-[60px] mx-auto mb-4 text-blue-500" />
                    <p className="text-[16px] font-medium text-center">Ready for your creative question... 🧙</p>
                </div>
            ) : (
                <ProcessElement
                    events={events}
                    isLoading={isLoading}
                    finalAnswer={finalAnswer}
                    finalReferences={finalReferences}
                />
            )}
        </div>
    );

    return <PageLayout leftContent={leftContent} rightContent={rightContent} />;
}
