CREATE TABLE IF NOT EXISTS queries (
    id SERIAL PRIMARY KEY,
    query_id INT NOT NULL,
    query TEXT NOT NULL,
    json_data JSONB,
    language VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    doc_id INT NOT NULL,
    document TEXT NOT NULL,
    language VARCHAR(50) NOT NULL
);
