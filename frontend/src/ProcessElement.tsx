import type { StreamEvent, Score, EvaluationData } from './types'
import { useEffect, useRef, useState } from 'react'
import { RobotIcon } from './assets/RobotIcon'
import EvaluationResult from './EvaluationResult'

interface ProcessElementProps {
	queryId?: number | '';
	events: StreamEvent[];
	isLoading: boolean;
	finalAnswer: string;
	finalReferences: string[];
}

export default function ProcessElement({ events, isLoading, finalAnswer, finalReferences, queryId }: ProcessElementProps) {
	const executionLogRef = useRef<HTMLDivElement>(null);
	const [isExpanded] = useState(true);
	const [groundTruth, setGroundTruth] = useState<EvaluationData | null>(null);
	const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

	useEffect(() => {
		if (executionLogRef.current) {
			executionLogRef.current.scrollTo({
				top: executionLogRef.current.scrollHeight,
				behavior: 'smooth'
			});
		}
	}, [events]);

	const handleEvaluation = async (queryId: number) => {
		setIsEvaluating(true);
		try {
			const res = await fetch('http://localhost:8000/rag/evaluate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query_id: queryId, answer: finalAnswer, retrieved_refs: finalReferences })
			})
			if (res.ok) {
				const data = await res.json()
				setGroundTruth(data)
			}
		} catch (error) {
			console.error("Evaluation error:", error)
		} finally {
			setIsEvaluating(false)
		}
	}

	if (groundTruth) {
		return <EvaluationResult data={groundTruth} predictionAnswer={finalAnswer} predictionReferences={finalReferences} />
	}

	return (
		<div className="w-full flex flex-col font-['Inter',sans-serif]">
			{/* Execution Log */}
			<div className="w-full mb-8">
				<div className="w-full flex justify-between items-center mb-4">
					<p className="font-bold text-[#c73636] text-[16px] tracking-[-0.32px] flex items-center gap-2 leading-[normal]">
						Execution Log
						{isLoading && <span className="flex h-2 w-2 relative ml-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
					</p>
				</div>
				<div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
					<div className="overflow-hidden">
						<div id="execution-log" ref={executionLogRef} className="bg-[#e6e6e6] border border-[#9a9a9a] rounded-[6px] w-full h-[140px] overflow-y-auto p-[18px] py-5 flex flex-col gap-[14px]">
							{events.length === 0 && !isLoading ? (
								<p className="text-[12px] text-center mt-6">Waiting to start...</p>
							) : events.map((ev, i) => (
								<div key={i} className="flex flex-col pb-2">
									<div className="flex justify-between items-center mb-1">
										<p className="font-semibold text-[12px] text-black shrink-0 tracking-[-0.28px] leading-[normal]">
											{ev.step.toUpperCase().replace(/_/g, ' ')}
										</p>
										<p className="text-[12px] font-semibold text-black tracking-[-0.22px] leading-[normal]">{ev.time}</p>
									</div>
									{ev.details && typeof ev.details === 'string' && (
										<p className="font-normal text-[12px] text-black whitespace-pre-wrap tracking-[-0.24px] leading-[normal]">
											{ev.details}
										</p>
									)}
									{ev.details && Array.isArray(ev.details) && (
										<div className="mt-2 grid gap-3">
											{ev.details.map((doc, idx) => (
												<div key={idx} className="font-normal text-[12px] text-black whitespace-pre-wrap tracking-[-0.24px] leading-[normal]">
													<span className="font-bold opacity-80">{doc.title}: </span>
													{doc.content}
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Answer */}
			<div className="w-full mb-9">
				<p className="font-bold text-[#c73636] text-[16px] tracking-[-0.32px] mb-4 leading-[normal]">Answer</p>
				<div className="flex items-center gap-[23px] w-full">
					<div className="w-[41px] h-[41px] shrink-0 text-[32px] leading-[normal] hidden sm:flex items-center justify-center">
						<RobotIcon className="w-full h-full text-blue-500" />
					</div>
					<div className="bg-[#fafafa] border border-[#9a9a9a] rounded-[6px] w-full flex-1 min-h-[123px] px-[22px] py-[18px]">
						<p className="text-[13px] text-black whitespace-pre-wrap tracking-[-0.26px] leading-[normal]">
							{finalAnswer || (isLoading ? <span className="animate-pulse">Analyzing query...</span> : "")}
						</p>
					</div>
				</div>
			</div>

			{/* Retrieved References */}
			<div className="w-full mb-8">
				<p className="font-semibold text-[13px] tracking-[-0.26px] mb-[6px] leading-[normal]">Retrieved References</p>
				<div className="bg-[#fafafa] border border-[#9a9a9a] rounded-[6px] w-full p-5 flex flex-col gap-[14px] h-[145px] overflow-y-auto">
					{finalReferences.length === 0 && !isLoading ? (
						<p className="text-[#5e5e5e] text-[12px] text-center mt-6">No references loaded.</p>
					) : finalReferences.map((ref, i) => (
						<p key={i} className="text-[14px] text-black tracking-[-0.28px] leading-[normal]">
							{`> ${ref}`}
						</p>
					))}
					{isLoading && finalReferences.length === 0 && (
						<p className="text-black text-[14px] tracking-[-0.28px] leading-[normal] animate-pulse">{`> Retrieving documents...`}</p>
					)}
				</div>
			</div>

			{finalAnswer && queryId && <div className="flex justify-center w-full">
				<button
					onClick={() => handleEvaluation(queryId as number)}
					disabled={isEvaluating}
					className={`bg-[#c73636] shadow-[0px_0px_4px_rgba(0,0,0,0.25)] rounded-[6px] px-[20px] py-[10px] flex items-center justify-center transition-all ${isEvaluating ? 'bg-gray-400 opacity-80 shadow-none cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
				>
					<span className="text-white text-[13px] font-bold leading-[normal]">Evaluate</span>
				</button>
			</div>}
		</div>
	)
}
