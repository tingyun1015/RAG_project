import { useState, useEffect } from 'react'
import type { Query, StreamEvent, Score } from './types'
import ProcessElement from './ProcessElement'

export default function PresetQueries() {
    const [defaultQueries, setDefaultQueries] = useState<Query[]>([])
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [finalAnswer, setFinalAnswer] = useState('');
    const [finalReferences, setFinalReferences] = useState<string[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchQueries = async () => {
            try {
                const response = await fetch('http://localhost:8000/rag/list')
                const data = await response.json()
                setDefaultQueries(data.result)
            } catch (e) {
                console.error('Error get the list of default queries.')
            }
        }

        fetchQueries()
    }, [])

    const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!e.target.value) return
        const queryId = e.target.value;
        const res = await fetch('http://localhost:8000/rag/defaultQuery/' + queryId)
        const data = await res.json()
        // console.log(data) // data is { query_id: ..., query: ... }

        handleSearch(data.query)
    }

    const handleSearch = async (queryText: string) => {
        if (!queryText.trim()) return;

        setIsLoading(true);
        setEvents([]);
        setFinalAnswer('');
        setFinalReferences([]);
        setScores([]);

        try {
            const response = await fetch('http://localhost:8000/rag/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: queryText })
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
                                case 'answer':
                                    setFinalAnswer(event.answer)
                                    break;
                                case 'answer_end':
                                    if (event.references) setFinalReferences(event.references);
                                    break;
                                case 'evaluation':
                                    if (event.answer) setScores(event.answer);
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
                buffer = lines[lines.length - 1];
            }
        } catch (error) {
            console.error('Stream error:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="w-full max-w-2xl mx-auto flex justify-center">
                <div className="relative w-full">
                    <select
                        onChange={handleSelectChange}
                        disabled={isLoading}
                        className="w-full xl:w-[600px] px-5 py-4 border-2 focus:outline-none appearance-none cursor-pointer"
                    >
                        <option key={0} value={0}>Select a preset query...</option>
                        {defaultQueries.map(item => (
                            <option key={item.query_id} value={item.query_id}>{item.query}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6">
                        <svg className="fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>

                </div>
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
