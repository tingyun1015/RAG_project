from ollama import Client
import os
from My_RAG.generator import load_ollama_config

def extract_keywords(document):
    ollama_config = load_ollama_config()
    client = Client(host=ollama_config["host"])
    prompt = f"""Analyze the following content and extract the most important keywords that capture its main topics. 
    
    Content: {document}
    
    Instructions:
    1. Identify the key subjects, entities, and themes.
    2. Return ONLY a comma-separated list of keywords.
    3. Do not include any introductory or concluding text.
    4. If there are no keywords, return "".
    
    Keywords:"""
    response = client.generate(model=ollama_config["model"], prompt=prompt, stream=False)
    content = response.get("response", "").strip()
    return content

def summarize_text(document):
    ollama_config = load_ollama_config()
    client = Client(host=ollama_config["host"])
    prompt = f"""Analyze the following content and provide a concise summary.

Content: {document}

Summary:"""
    response = client.generate(model=ollama_config["model"], prompt=prompt, stream=False)
    content = response.get("response", "").strip()
    return content

def extract_search_terms(query):
    ollama_config = load_ollama_config()
    client = Client(host=ollama_config["host"])
    prompt = f"""Identify the most specific search terms in the following query. 
    Extract names, roles, companies, dates, key events, specific actions, and significant noun phrases.
    Return ONLY a comma-separated list of terms. 
    Do not include generic words like "who", "what", "when", "where".
    IMPORTANT: Separate month and year into different terms (e.g. "October 2021" -> "October", "2021").
    
    Query: {query}
    
    Search Terms:"""
    response = client.generate(model=ollama_config["model"], prompt=prompt, stream=False)
    content = response.get("response", "").strip()
    return content
    
    
class DomainRouter:
    def __init__(self, language="en"):
        self.ollama_config = load_ollama_config()
        self.client = Client(host=self.ollama_config["host"])
        self.language = language

    def route(self, query):
        prompt = f"""Analyze the following query and determine which domain it belongs to: "Law", "Medical", "Finance", or "Other". 

    Query: {query}

    Domain:"""
        response = self.client.generate(model=self.ollama_config["model"], prompt=prompt, stream=False)
        content = response.get("response", "").strip()
        return content
