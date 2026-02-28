import type { EvaluationData } from './types'

// Info Icon component representing the info circle in Figma
const InfoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
)

interface EvaluationResultProps {
    data: EvaluationData;
    predictionAnswer: string;
    predictionReferences: string[];
}

export default function EvaluationResult({ data, predictionAnswer, predictionReferences }: EvaluationResultProps) {
    const scores = data.scores
    const gtAnswer = data.ground_truth
    const gtRefs = data.ground_truth_refs

    return (
        <div className="w-full flex flex-col font-['Inter',sans-serif] animate-fadeIn">
            {/* Evaluations Section */}
            <div className="w-full mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="font-bold text-[#c73636] text-[16px] tracking-[-0.32px] leading-[normal]">Evaluations</h2>
                    <InfoIcon className="text-[#c73636] w-[18px] h-[18px]" />
                </div>
                {/* Score Grid layout approximating the Figma 3-column split */}
                <div className="flex flex-wrap gap-[10px] w-full">
                    {scores.map((score, idx) => (
                        <div
                            key={idx}
                            className={`bg-[#fafafa] border border-[#9a9a9a] flex flex-col items-center justify-center p-[18px] rounded-[6px] gap-1 px-2 sm:px-[26px] ${idx < 6 ? 'w-[calc(33.333%-7px)]' : 'w-[calc(25%-7.5px)]'
                                } flex-auto`}
                        >
                            <p className="font-medium text-[#24221f] text-[14px] leading-[normal] tracking-[-0.28px]">
                                {Number(score.value).toFixed(5)}
                            </p>
                            <p className="font-bold text-[#24221f] text-[12px] leading-[normal] tracking-[-0.24px] text-center">
                                {score.metrix}
                            </p>
                        </div>
                    ))}
                    {scores.length === 0 && (
                        <p className="text-[14px] text-gray-500">No scores available</p>
                    )}
                </div>
            </div>

            {/* Ground Truths Section */}
            <div className="w-full mb-8">
                <p className="font-semibold text-[#24221f] text-[13px] tracking-[-0.26px] mb-[6px] leading-[normal]">Ground Truths</p>
                <div className="bg-[#e6e6e6] border border-[#9a9a9a] rounded-[6px] w-full px-[28px] py-[22px] flex flex-col gap-[8px]">
                    <p className="font-normal text-black text-[14px] leading-[normal] tracking-[-0.28px]">
                        <span className="font-semibold">Prediction Answer:</span> {predictionAnswer}
                    </p>
                    <p className="font-normal text-black text-[14px] leading-[normal] tracking-[-0.28px]">
                        <span className="font-semibold">Ground Truth Answer:</span> {gtAnswer}
                    </p>
                </div>
            </div>

            {/* Retrieved References */}
            <div className="w-full mb-8">
                <p className="font-semibold text-[#24221f] text-[13px] tracking-[-0.26px] mb-[6px] leading-[normal]">Retrieved References</p>
                <div className="bg-[#e6e6e6] border border-[#9a9a9a] rounded-[6px] w-full px-[20px] py-[18px] flex flex-col gap-[14px] h-[145px] overflow-y-auto">
                    {predictionReferences.length === 0 ? (
                        <p className="text-[#5e5e5e] text-[12px] text-center mt-6">No references loaded.</p>
                    ) : predictionReferences.map((ref, i) => (
                        <p key={i} className="text-[14px] text-black tracking-[-0.28px] leading-[normal]">
                            {`> ${ref}`}
                        </p>
                    ))}
                </div>
            </div>

            {/* Ground Truth Retrieved References */}
            <div className="w-full mb-[60px]">
                <p className="font-semibold text-[#24221f] text-[13px] tracking-[-0.26px] mb-[6px] leading-[normal]">Ground Truth Retrieved References</p>
                <div className="bg-[#e6e6e6] border border-[#9a9a9a] rounded-[6px] w-full px-[20px] py-[18px] flex flex-col gap-[14px] h-[145px] overflow-y-auto">
                    {gtRefs.length === 0 ? (
                        <p className="text-[#5e5e5e] text-[12px] text-center mt-6">No ground truth references loaded.</p>
                    ) : gtRefs.map((ref, i) => (
                        <p key={i} className="text-[14px] text-black tracking-[-0.28px] leading-[normal]">
                            {`> ${ref}`}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    )
}