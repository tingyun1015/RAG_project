import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface PageLayoutProps {
    leftContent: React.ReactNode;
    rightContent: React.ReactNode;
}

export default function PageLayout({ leftContent, rightContent }: PageLayoutProps) {
    const location = useLocation();

    return (
        <div className="grid grid-cols-12 w-full h-dvh bg-white font-['Inter',sans-serif] text-black">
            {/* Left Box (5 Columns) */}
            <div
                className="col-span-5 relative flex flex-col justify-center items-center h-full p-6 overflow-hidden max-md:min-h-screen"
                style={{ backgroundImage: "linear-gradient(218deg, rgb(255 214 168) 5%, rgb(255 180 216) 55%, rgb(167 119 217) 85%, rgb(106 92 198) 100%)" }}
            >
                {/* Fixed Top Left Attribution */}
                <p className="absolute left-6 top-6 text-[13px] font-medium z-10">
                    Dataset Reference: [<a href="https://github.com/OpenBMB/RAGEval" target="_blank" rel="noreferrer" className="text-[#006fff] underline decoration-solid [text-decoration-skip-ink:none]">RAGEval</a>]
                </p>

                {/* Central Content Column */}
                <div className="w-full max-w-[384px] z-10">
                    <div className="text-center mb-10">
                        <h1 className="text-[24px] font-extrabold tracking-tight whitespace-nowrap">
                            RAG System Demo
                        </h1>
                    </div>

                    <div className="relative w-full h-[404px]">
                        <div className="w-full flex justify-between px-[34px] z-20 mb-[40px] relative">
                            <Link to="/" className={`text-[14px] leading-[normal] tracking-[-0.56px] whitespace-pre-wrap transition-all relative pb-2 font-bold ${location.pathname === '/' ? 'text-[#e83737]' : 'text-gray-500 opacity-80'}`}>
                                Use Default Queries
                                {location.pathname === '/' && (
                                    <div className="absolute bottom-0 left-[-8px] right-[-8px] h-[2px] bg-[#e83737] animate-fadeIn" />
                                )}
                            </Link>
                            <Link to="/playground" className={`text-[14px] leading-[normal] tracking-[-0.56px] whitespace-pre-wrap text-center transition-all relative pb-2 font-bold ${location.pathname === '/playground' ? 'text-[#e83737]' : 'text-gray-500 opacity-80'}`}>
                                Write Your Own Query
                                {location.pathname === '/playground' && (
                                    <div className="absolute bottom-0 left-[-8px] right-[-8px] h-[2px] bg-[#e83737] animate-fadeIn" />
                                )}
                            </Link>
                        </div>
                        {leftContent}
                    </div>
                </div>
            </div>

            {/* Right Box (7 Columns) */}
            <div className="col-span-7 h-full w-full bg-[#fff2f2] relative overflow-y-auto">
                {rightContent}
            </div>
        </div>
    );
}
