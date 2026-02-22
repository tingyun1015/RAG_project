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

class QueryRequest(BaseModel):
    question: str
    language: str = "en" # "en" or "zh"

import asyncio
import json
import os
import psycopg2
from fastapi.responses import StreamingResponse

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

    # 5. Score
    # Mock score
    scores = [
        {"metrix": "Sentence Precision", "value": "1.00000"},
        {"metrix": "Sentence Recall", "value": "1.00000"},
        {"metrix": "Sentence F1", "value": "1.00000"},
        {"metrix": "Word Recall", "value": "1.00000"},
        {"metrix": "Word Precision", "value": "1.00000"},
        {"metrix": "Word F1", "value": "1.00000"},
        {"metrix": "ROUGELScore", "value": "1.00000"},
        {"metrix": "Completeness", "value": "1.00000"},
        {"metrix": "Hallucination", "value": "1.00000"},
        {"metrix": "Irrelevance", "value": "1.00000"}
    ]
    yield json.dumps({"step": "evaluation", "message": "Evaluate", "answer": scores}) + "\n"
    import time
    time.sleep(1)

    yield json.dumps({"step": "complete", "message": "Done", "answer": "End"}) + "\n"



@app.post("/rag/stream")
async def stream_rag(request: QueryRequest):
    return StreamingResponse(rag_process(request.question), media_type="application/x-ndjson")

@app.get("/rag/list")
async def query_rag():
    return {
        "result": [{
            "query_id": 1,
            "query": 'When did Green Fields Agriculture Ltd. appoint a new CEO?'
        }, {
            "query_id": 2,
            "query": 'Compare the major asset acquisitions by CleanCo Housekeeping Services in 2018 and Retail Emporium in 2020. Which company acquired assets earlier?'
        }]
    }
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

@app.post("/rag/evaluate")
async def eval_rag(request: QueryRequest):
    return {
        "Ground Truth Answer": "the final answer",
        "Ground Truth Refs": [],
        "Scores": scores
    }
