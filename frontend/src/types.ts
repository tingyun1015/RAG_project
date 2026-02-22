export interface Query {
    query_id: number;
    query: string;
}

export interface RetrievedDoc {
    title: string;
    content: string;
}

export const StreamEventStep = {
    Start: 'start',
    Routing: 'routing',
    Retrieval: 'retrieval',
    RetrievalResult: 'retrieval_result',
    Prompt: 'prompt',
    GenerationStart: 'generation_start',
    AnswerChunk: 'answer_chunk',
    AnswerEnd: 'answer_end',
    Evaluation: 'evaluation',
    Complete: 'complete'
} as const;

export type StreamEventStepType = typeof StreamEventStep[keyof typeof StreamEventStep];

export interface StreamEvent {
    step: StreamEventStepType | string;
    message?: string;
    details?: string | RetrievedDoc[];
    token?: string;
    references?: string[];
    answer?: any; // Consider typing this more strictly if possible (e.g., Score[])
    time?: string;
}

export interface Score {
    metrix: string;
    value: string;
}
