import os
import json
from ollama import Client
from My_RAG.generator import load_ollama_config, load_prompts
import sys
from My_RAG.retriever import create_retriever, get_chunks_from_db
from rank_bm25 import BM25Okapi
from My_RAG.runtime_chunker import chunk_row_chunks
from My_RAG.name_router_chain import create_smaller_chunks_without_names, get_remove_names_from_text


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../db')))
from Connection import Connection
DB_PATH = "db/dataset.db"

conn = Connection(DB_PATH)

def get_contents_from_db(target_doc_ids):
    target_docs = []
    target_set = set(target_doc_ids)

    for id in target_set:
        row = conn.execute("SELECT content FROM documents WHERE doc_id = ?", (id,))
        doc_content = row.fetchone()
        if doc_content:
            content_string = doc_content[0]
            target_docs.append(content_string)
    return target_docs

def generate_answer(query, context_chunks, language="en", prompt_type="summary_chain"):
    context = "\n\n".join([chunk['page_content'] for chunk in context_chunks])
    prompts = load_prompts(type=prompt_type)
    if language not in prompts:
        print(f"Warning: Language '{language}' not found in prompts. Falling back to 'en'.")
        language = "en"

    prompt_template = prompts[language]
    prompt = prompt_template.format(query=query, context=context)
    print("prompt: ", prompt)
    ollama_config = load_ollama_config()
    client = Client(host=ollama_config["host"])
    
    response = client.generate(model=ollama_config["model"], options={
        "num_ctx": 32768,
        "temperature": 0.3,
        # "max_tokens": 256,
        "stop": ["\n\n"],
        # "top_p": 0.9,
        # "top_k": 40,
        # "frequency_penalty": 0.1,
        # "presence_penalty": 0.1,
        # "stream": True,
    }, prompt=prompt)

    print("response: ", response)
    
    return response["response"]

def summary_router_chain(query, language, prediction, doc_ids, matched_name):
    query_text = query['query']['content']
    yield {"step": "retrieval", "message": "Retrieving documents...", "details": f"Fetching full documents for summary: {matched_name}"}
    contents = get_contents_from_db(target_doc_ids=doc_ids)

    modified_query_text = get_remove_names_from_text(query_text, matched_name)
    document_chunks = [{"page_content": content} for content in contents]
    row_chunks = get_chunks_from_db(prediction, doc_ids, language)
    retriever = create_retriever(row_chunks, language)
    big_chunks = retriever.retrieve(modified_query_text, threshold=0) # retrieve as much as possible
    
    preview_docs = [{"title": f"Doc {doc_ids[0] if doc_ids else 'N/A'}", "content": c.get('page_content', '')[:100] + "..."} for c in document_chunks[:3]]
    yield {"step": "retrieval_result", "message": "Documents retrieved", "details": preview_docs}

    yield {"step": "generation_start", "message": "Generating summary...", "details": "LLM is summarizing the documents..."}
    if(big_chunks):
        raw_response = generate_answer(query_text, big_chunks, language, prompt_type="new_summary")
    else:
        raw_response = generate_answer(query_text, document_chunks, language, prompt_type="new_summary")
    
    print("raw_response: ", raw_response)
    try:
        # Clean up the response if it contains markdown code blocks
        clean_response = raw_response.replace("```json", "").replace("```", "").strip()
        result_json = json.loads(clean_response)
        answer = result_json.get("answer", '')
        if (not answer): 
            print("JSON Parse answer not found. Retry with fallback prompt")
            answer = generate_answer(query_text, document_chunks, language, prompt_type="summary")
    except json.JSONDecodeError:
        print("JSON Parse Error. Retry with fallback prompt")
        answer = generate_answer(query_text, document_chunks, language, prompt_type="summary")
    
    small_retrieved_chunks, small_chunks = create_smaller_chunks_without_names(language, big_chunks, matched_name)
    if (not small_chunks):
        return answer, big_chunks
    retriever_2 = create_retriever(small_retrieved_chunks, language)
    retrieved_small_chunks = retriever_2.retrieve(modified_query_text, top1_check=True) # retrieve for higher than the top 1 score * 0.5

    return_chunks = []
    for index, chunk in enumerate(retrieved_small_chunks):
        return_chunks.append(small_chunks[chunk['chunk_index']])
    
    print("Generated Answer:", answer)
    if (return_chunks):
        return answer, return_chunks
    else:
        return answer, []


def extract_entities(query_text, language="en"):
    prompt="""
    Read the query and extract the key **subjects (entities or topics)**.

    ### Constraints
    1. **Use the same language as the query.**
    2. **Extract exact keywords**, do not summarize.
    3. **Format:** Output the subjects separated by commas.
    4. Do not include any additional text or explanation.

    ### Input Query
    {query}

    ### Output
    """
    ollama_config = load_ollama_config()
    client = Client(host=ollama_config["host"])
    response = client.generate(model=ollama_config["model"], options={
        # "num_ctx": 32768,
        "temperature": 0.0,
        # "max_tokens": 128,
        "stop": ["\n\n"],
        # "top_p": 0.9,
        # "top_k": 40,
        # "frequency_penalty": 0.1,
        # "presence_penalty": 0.1,
        # "stream": True,
    }, prompt=prompt)
    return response["response"]