import type { StreamEvent, Score } from './types'
import { useEffect, useRef, useState } from 'react'

interface ProcessElementProps {
	events: StreamEvent[];
	isLoading: boolean;
	finalAnswer: string;
	finalReferences: string[];
	scores: Score[];
}

export default function ProcessElement({ events, isLoading, finalAnswer, finalReferences, scores }: ProcessElementProps) {
	const executionLogRef = useRef<HTMLDivElement>(null);
	const [isExpanded, setIsExpanded] = useState(true);

	useEffect(() => {
		if (executionLogRef.current) {
			executionLogRef.current.scrollTo({
				top: executionLogRef.current.scrollHeight,
				behavior: 'smooth'
			});
		}
	}, [events]);

	useEffect(() => {
		if (events.length === 0) return;
		if (isLoading) setIsExpanded(true);
		if (!isLoading) setIsExpanded(false);
	}, [events, isLoading]);

	return (
		<div className="w-full space-y-8">
			<div>
				<div className="flex items-center justify-between py-4">
					<h3 className="font-bold flex items-center gap-2">
						<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
						Execution Log
						{isLoading && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
					</h3>
					{isExpanded && <button onClick={() => setIsExpanded(false)} className="text-gray-600 hover:text-gray-800">Show less</button>}
					{!isExpanded && <button onClick={() => setIsExpanded(true)} className="text-gray-600 hover:text-gray-800">Show more</button>}
				</div>
				<div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
					<div className="overflow-hidden">
						<div id="execution-log" ref={executionLogRef} className="bg-gray-300 h-[200px] overflow-y-auto scrolling-touch rounded-sm border-1 border-gray-400">
							{events.map((ev, idx) => (
								<div key={idx} className="pb-4 last:border-0 p-6 -mx-2">
									<div className="flex items-center gap-3 mb-2">
										<span className="tabular-nums">{ev.time}</span>
										<span className="px-2.5 py-1 font-bold uppercase tracking-wider">
											{ev.step.replace('_', ' ')}
										</span>
									</div>
									{ev.details && typeof ev.details === 'string' && (
										<div className="mt-3 p-4 whitespace-pre-wrap leading-relaxed">
											{ev.details}
										</div>
									)}
									{ev.details && Array.isArray(ev.details) && (
										<div className="mt-3 grid gap-3">
											{ev.details.map((doc, i) => (
												<div key={i} className="p-4 leading-relaxed">
													<b className="mb-1 block">{doc.title}</b>
													<span>{doc.content}</span>
												</div>
											))}
										</div>
									)}
								</div>
							))}
							{events.length === 0 && !isLoading && <div className="text-center py-10 italic">Waiting for events...</div>}
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				<div className="lg:col-span-8 flex flex-col space-y-4">
					<h3 className="font-bold flex items-center gap-3">
						<div className="p-2 shrink-0">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
						</div>
						Final Answer
					</h3>
					<div className="p-8 min-h-[100px] leading-loose whitespace-pre-wrap">
						{finalAnswer || (isLoading ? <span className="animate-pulse font-bold">|</span> : <span className="italic block text-center mt-20">The AI's response will appear here once computing is done...</span>)}
					</div>
					<div className="flex flex-col space-y-4">
						<h3 className="font-bold flex items-center gap-3">
							<div className="p-2 shrink-0">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
							</div>
							Retrieved Content
						</h3>
						<div className="p-5 overflow-y-auto max-h-[300px] space-y-3">
							{(finalReferences.length === 0 && !isLoading) && <span className="italic block text-center py-8">No references retrieved.</span>}
							{isLoading ? <span className="text-center block py-8">
								<svg className="animate-spin h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
							</span> : finalReferences.map((el, index) => (
								<div key={index} className="p-3 leading-relaxed break-words cursor-default">
									{el}
								</div>
							))}
						</div>
					</div>
				</div>
				<div className="lg:col-span-4 flex flex-col space-y-8">
					<div className="flex flex-col space-y-4">
						<h3 className="font-bold flex items-center gap-3">
							<div className="p-2 shrink-0">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
							</div>
							Evaluations
						</h3>
						<div className="p-5 space-y-3">
							{(scores.length === 0 && !isLoading) && <span className="italic block text-center py-6">No evaluation scores.</span>}
							{isLoading ? <span className="text-center block py-6">-</span> : scores.map((el, index) => (
								<div key={index} className="flex justify-between items-center p-1">
									<span className="font-semibold text-sm">{el.metrix}</span>
									<span className="font-mono font-semibold text-sm">{el.value}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
