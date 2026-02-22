import { useState } from 'react'
import ProcessElement from './ProcessElement'
import type { Score, StreamEvent } from './types'

export default function RAGPlayground() {
    const [query, setQuery] = useState('');
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [finalAnswer, setFinalAnswer] = useState('');
    const [finalReferences, setFinalReferences] = useState<string[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setEvents([]);
        setFinalAnswer('');
        setFinalReferences([]);
        setScores([]);

        try {
            // Note: In docker-compose, frontend talks to backend via localhost if browser is outside, 
            // or proxy. Here we assume generic localhost access.
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

                // Process all complete lines
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
                                case 'evaluation':
                                    if (event.answer) {
                                        setScores(event.answer);
                                    }
                                    break;
                                case 'complete':
                                    setIsLoading(false);
                                    break;
                                default:
                                    setEvents(prev => [...prev, event]);
                                    break;
                            }
                        } catch (e) {
                            console.error('Error parsing JSON:', line, e);
                        }
                    }
                }
                // Keep the last partial line in buffer
                buffer = lines[lines.length - 1];
            }
        } catch (error) {
            console.error('Stream error:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <p>Ask any question you want to test the RAG system result, you can evaluation the result by yourself. 😉</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    rows={2}
                    className="w-full px-5 py-4 rounded-sm border-1 focus:outline-none"
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className={`px-6 py-2 font-semibold rounded-sm border w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'}`}
                >
                    Ask
                </button>
            </div>

            <ProcessElement
                events={events}
                isLoading={isLoading}
                finalAnswer={finalAnswer}
                finalReferences={finalReferences}
                scores={scores}
            />
        </div>
    )
}
