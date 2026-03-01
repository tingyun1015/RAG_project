from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="RAG Project API", version="1.0.0")

# CORS Configuration
# Allow requests from the frontend (which will likely be on port 5173 or similar)
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import asyncio
import json
import os
import psycopg2
import sys
from fastapi.responses import StreamingResponse

sys.path.append(os.path.join(os.path.dirname(__file__), 'rageval', 'evaluation'))
from metrics import get_metric

DB_URL = os.environ.get("POSTGRES_URL", "postgresql://postgres:postgres@database:5432/rag_db")

def get_db_connection():
    return psycopg2.connect(DB_URL)

from My_RAG.router import router

def rag_process(question: str):
    query = {}
    query["query"] = {"content": question}
    
    gen = router(query)
    
    while True:
        try:
            step_payload = next(gen)
            if step_payload:
                yield json.dumps(step_payload) + "\n"
        except StopIteration as e:
            answer, return_chunks = e.value
            break

    # 4. Final Answer & References
    yield json.dumps({"step": "answer", "message": "Done", "answer": answer}) + "\n"
    
    refs = [chunk.get("page_content") if isinstance(chunk, dict) else str(chunk) for chunk in return_chunks]
    yield json.dumps({"step": "answer_end", "message": "Done", "references": refs}) + "\n"
    yield json.dumps({"step": "complete", "message": "Done", "answer": "End"}) + "\n"

class QueryRequest(BaseModel):
    question: str
    language: str = "en" # "en" or "zh"
class EvaluationRequest(BaseModel):
    query_id: int
    answer: str
    retrieved_refs: list[str]

@app.post("/rag/evaluate")
async def evaluate_rag(request: EvaluationRequest):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT query, ground_truth, language FROM queries WHERE query_id = %s;", (request.query_id,))
            row = cursor.fetchone()
            if not row:
                return {"error": "Query not found"}
            db_query, db_ground_truth_json, language = row
    finally:
        conn.close()
    
    if isinstance(db_ground_truth_json, str):
        db_ground_truth = json.loads(db_ground_truth_json)
    else:
        db_ground_truth = db_ground_truth_json

    item = {
        "query": {"content": db_query},
        "prediction": {"content": request.answer, "references": request.retrieved_refs},
        "ground_truth": db_ground_truth
    }
    
    def run_evaluations():
        evaluators = []
        for name in ["rouge-l", "words_precision", "words_recall", "sentences_precision", "sentences_recall"]:
            evaluators.append(get_metric(name)())
        
        kp_metric = get_metric("keypoint_metrics")(use_openai=True, model='granite4:3b', version='v1')
        
        results = {}
        for evaluator in evaluators:
            res = evaluator(item, db_ground_truth, None, language=language)
            results[evaluator.name] = res
            
        if "keypoints" in db_ground_truth and db_ground_truth["keypoints"]:
            kp_res = kp_metric(item, db_ground_truth, None, language=language)
            results.update(kp_res)
        else:
            results["completeness"] = 0.0
            results["hallucination"] = 0.0
            results["irrelevance"] = 0.0
            
        return results

    eval_results = await asyncio.to_thread(run_evaluations)
    
    wp = eval_results.get("Words_Precision", 0.0)
    wr = eval_results.get("Words_Recall", 0.0)
    wf1 = (2 * wp * wr) / (wp + wr) if (wp + wr) > 0 else 0.0
    
    sp = eval_results.get("Sentences_Precision", 0.0)
    sr = eval_results.get("Sentences_Recall", 0.0)
    sf1 = (2 * sp * sr) / (sp + sr) if (sp + sr) > 0 else 0.0

    scores = [
        {"metrix": "Sentence Precision", "value": sp},
        {"metrix": "Sentence Recall", "value": sr},
        {"metrix": "Sentence F1", "value": sf1},
        {"metrix": "Word Recall", "value": wr},
        {"metrix": "Word Precision", "value": wp},
        {"metrix": "Word F1", "value": wf1},
        {"metrix": "ROUGELScore", "value": eval_results.get('ROUGELScore', 0.0)},
        {"metrix": "Completeness", "value": eval_results.get('completeness', 0.0)},
        {"metrix": "Hallucination", "value": eval_results.get('hallucination', 0.0)},
        {"metrix": "Irrelevance", "value": eval_results.get('irrelevance', 0.0)}
    ]
    
    return {
        "ground_truth": db_ground_truth.get("content", ""),
        "ground_truth_refs": db_ground_truth.get("references", []),
        "scores": scores
    }


@app.post("/rag/stream")
async def stream_rag(request: QueryRequest):
    return StreamingResponse(rag_process(request.question), media_type="application/x-ndjson")

@app.get("/rag/defaultQueriesCount")
async def get_default_queries_count():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM queries")
            total = cursor.fetchone()[0]
        return {"total": total}
    finally:
        conn.close()

@app.get("/rag/defaultQuery/{query_id}")
async def get_default_query(query_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT query_id, query FROM queries WHERE query_id = %s;", (query_id,))
            row = cursor.fetchone()
            if row:
                return {"query_id": row[0], "query": row[1]}
            return {"query_id": query_id, "query": "Query not found in database."}
    finally:
        conn.close()
