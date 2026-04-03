import { useState, useEffect } from 'react'
import type { Query, StreamEvent } from './types'
import ProcessElement from './ProcessElement'
import PageLayout from './PageLayout'
import { RobotIcon } from './assets/RobotIcon'

export default function DefaultQueries({ props }: { props: { language: string } }) {
	const { language = 'en' } = props
	const [queryCount, setQueryCount] = useState<number>(0)
	const [queryId, setQueryId] = useState<number | ''>('')
	const [query, setQuery] = useState<Query | null>(null)

	const [events, setEvents] = useState<StreamEvent[]>([]);
	const [finalAnswer, setFinalAnswer] = useState('');
	const [finalReferences, setFinalReferences] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchQueriesCount = async () => {
		try {
			const response = await fetch('http://localhost:8000/rag/defaultQueriesCount/')
			const data = await response.json()
			setQueryCount(data.total)
		} catch {
			console.error('Error get the list of default queries.')
		}
	}
	useEffect(() => {
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
									setFinalAnswer((event.answer as string) || '')
									break;
								case 'answer_end':
									if (event.references) setFinalReferences(event.references);
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

	const leftContent = (
		<div className="w-full relative flex flex-col pt-2 animate-leftIn">
			<h2 className="text-[16px] font-bold tracking-[-0.3px] mb-2 leading-[normal]">Use Default Queries</h2>
			<p className="text-[14px] font-medium leading-[normal] mb-6 whitespace-pre-wrap">
				Use the queries from the dataset to test the RAG system result and evaluation. 🪄
			</p>

			<div className="flex items-center gap-2 mb-[28px] relative">
				<p className="text-[13px] font-medium tracking-[-0.6px]">Query ID</p>
				<input
					type="number"
					value={queryId}
					min={1}
					max={queryCount || 100}
					disabled={isLoading}
					onChange={handleSelectChange}
					className="bg-[#fafafa] border border-[#9a9a9a] rounded-[6px] h-[36px] w-[127px] px-3 focus:outline-none focus:border-black text-[14px]"
				/>
				<button
					onClick={handleRandomChange}
					disabled={isLoading}
					className="text-[#c73636] text-[13px] font-bold underline decoration-solid cursor-pointer hover:opacity-80 disabled:opacity-50 transition-opacity ml-[14px]"
				>
					Random
				</button>
			</div>

			{query && (
				<div className="animate-fadeIn">
					<div className="bg-[#e6e6e6] border border-[#9a9a9a] rounded-[6px] h-[123px] w-full p-4 overflow-y-auto text-[14px] text-black font-normal leading-[normal] whitespace-pre-wrap mb-[20px]">
						{query?.query || "\u00A0"}
					</div>
					<div className="flex justify-end w-full">
						<button
							onClick={() => handleSearch(query?.query || '')}
							disabled={isLoading || !query?.query}
							className={`bg-[#c73636] shadow-[0px_0px_4px_rgba(0,0,0,0.25)] rounded-[6px] px-[20px] py-[10px] flex items-center justify-center transition-all ${isLoading || !query?.query ? 'bg-gray-400 opacity-80 shadow-none' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
						>
							<span className="text-white text-[13px] font-bold leading-[normal]">Generate</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);

	const rightContent = (
		<div className="p-8 pt-16 pb-32 max-w-[800px] mx-auto flex flex-col items-center">
			{(events.length === 0 && !finalAnswer) ? (
				<div className="flex flex-col items-center justify-center mt-[35vh]">
					<RobotIcon className="w-[60px] h-[60px] mx-auto mb-4 text-blue-500" />
					<p className="text-[16px] font-medium text-center">Ready for the query 🧙</p>
				</div>
			) : (
				<ProcessElement
					queryId={queryId}
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
