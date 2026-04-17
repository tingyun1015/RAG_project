import os
import json
import psycopg2
from psycopg2.extras import execute_values

DB_URL = os.environ.get("POSTGRES_URL", "postgresql://postgres:postgres@localhost:5433/rag_db")

def ingest_data():
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()

    # 1. Ingest queries
    query_file = os.path.join(os.path.dirname(__file__), "../dragonball_dataset/dragonball_queries.jsonl")
    if os.path.exists(query_file):
        print(f"Ingesting queries from {query_file}...")
        with open(query_file, 'r', encoding='utf-8') as f:
            query_records = []
            for line in f:
                data = json.loads(line)
                query_id = data.get("query", {}).get("query_id")
                query_text = data.get("query", {}).get("content", "")
                ground_truth = json.dumps(data.get("ground_truth", {}))
                json_data = json.dumps(data)
                language = data.get("language", "en")
                query_records.append((query_id, query_text, ground_truth, json_data, language))
            
            insert_query = "INSERT INTO queries (query_id, query, ground_truth, json_data, language) VALUES %s"
            # Clear existing data just in case
            cursor.execute("TRUNCATE TABLE queries RESTART IDENTITY")
            execute_values(cursor, insert_query, query_records)
            print(f"Inserted {len(query_records)} queries.")
    else:
        print(f"Query file not found at {query_file}")

    # 2. Ingest documents
    doc_file = os.path.join(os.path.dirname(__file__), "../dragonball_dataset/dragonball_docs.jsonl")
    if os.path.exists(doc_file):
        print(f"Ingesting documents from {doc_file}...")
        mapping = {
            "Finance": "company_name",
            "Law": "court_name",
            "Medical": "hospital_patient_name"
        }
        with open(doc_file, 'r', encoding='utf-8') as f:
            doc_records = []
            for line in f:
                data = json.loads(line)
                doc_id = data.get("doc_id")
                domain = data.get("domain")
                language = data.get("language", "en")
                name = data.get(mapping[domain], "test")
                content = data.get("content", "")
                jsonl = json.dumps(data)
                doc_records.append((doc_id, domain, language, name, content, jsonl))
            
            insert_doc = "INSERT INTO documents (doc_id, domain, language, name, content, jsonl) VALUES %s"
            # Clear existing data just in case
            cursor.execute("TRUNCATE TABLE documents RESTART IDENTITY")
            execute_values(cursor, insert_doc, doc_records)
            print(f"Inserted {len(doc_records)} documents.")
    else:
        print(f"Document file not found at {doc_file}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Ingestion complete.")

if __name__ == "__main__":
    ingest_data()
