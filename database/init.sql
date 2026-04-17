DROP TABLE IF EXISTS queries;
DROP TABLE IF EXISTS documents;

CREATE TABLE IF NOT EXISTS queries (
    id SERIAL PRIMARY KEY,
    query_id INT NOT NULL,
    query TEXT NOT NULL,
    ground_truth JSONB,
    json_data JSONB,
    language VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    doc_id INT NOT NULL,
    domain VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    jsonl JSONB
);
