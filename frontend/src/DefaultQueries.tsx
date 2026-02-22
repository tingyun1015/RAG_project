import { useState, useEffect } from 'react'
import type { Query, StreamEvent, Score } from './types'
import ProcessElement from './ProcessElement'

export default function DefaultQueries({ props }: { props: { language: string } }) {
	const { language = 'en' } = props
	const [queryCount, setQueryCount] = useState<number>(0)
	const [queryId, setQueryId] = useState<number | ''>('')
	const [query, setQuery] = useState<Query | null>(null)

	const [events, setEvents] = useState<StreamEvent[]>([]);
	const [finalAnswer, setFinalAnswer] = useState('');
	const [finalReferences, setFinalReferences] = useState<string[]>([]);
	const [scores, setScores] = useState<Score[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchQueriesCount = async () => {
		try {
			const response = await fetch('http://localhost:8000/rag/defaultQueriesCount/')
			const data = await response.json()
			setQueryCount(data.total)
		} catch (e) {
			console.error('Error get the list of default queries.')
		}
	}
	useEffect(() => {
		fetchQueriesCount()
	}, [language])

	const handleSelectChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (!val) {
			setQueryId('');
			setQuery(null);
			return;
		}
		const newId = parseInt(val)
		setQueryId(newId)

		const res = await fetch('http://localhost:8000/rag/defaultQuery/' + newId)
		const data = await res.json()
		setQuery(data)
	}

	const handleRandomChange = async () => {
		// max: queryCount
		const num = Math.floor(Math.random() * queryCount) + 1
		console.log("Random number generated:", num)
		setQueryId(num)

		const res = await fetch('http://localhost:8000/rag/defaultQuery/' + num)
		const data = await res.json()
		setQuery(data)
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
			<p>Use the queries from the dataset to test the RAG system result and evaluation. 🪄</p>
			<div className="m-0 flex flex-row gap-4 items-center">
				<div className="flex py-2">
					<div className="px-4 py-2">Query ID:</div>
					<input
						value={queryId}
						max={queryCount}
						disabled={isLoading}
						onChange={handleSelectChange}
						className="outline-none appearance-none w-24 border-b-1 focus:border-blue-500 text-center"
					/>
				</div>
				<button
					onClick={handleRandomChange}
					disabled={isLoading}
					className={`px-6 py-2 text-sm font-semibold rounded-sm border w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'}`}
				>
					Random
				</button>
			</div>
			<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
				<textarea
					value={query?.query}
					placeholder="Select a default query..."
					disabled
					rows={2}
					className="w-full px-5 py-4 rounded-sm border-1 focus:outline-none"
				/>
				<button
					onClick={() => handleSearch(query?.query || '')}
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
