from langchain_core.documents import Document
from langchain_community.retrievers import BM25Retriever
import jieba

class DomainRouter:
    def __init__(self, domain_docs_map, language="en"):
        """
        Args:
            domain_docs_map: Dict[str, List[str]] - Mapping from domain name to list of document contents.
            language: str - "zh" or "en"
        """
        self.language = language
        self.domains = list(domain_docs_map.keys())
        
        documents = []
        for domain, docs in domain_docs_map.items():
            # Combine all docs in the domain into one large text
            combined_text = " ".join(docs)
            documents.append(Document(page_content=combined_text, metadata={"domain": domain}))
            
        # Initialize BM25Retriever from LangChain
        # Note: LangChain's BM25Retriever might need a custom preprocess_func for Chinese if we want to be precise,
        # but for now we rely on its default tokenization or pass a simple one.
        # BM25Retriever doesn't easily accept a tokenizer in __init__ in all versions, 
        # but we can preprocess the text before passing it if needed.
        # However, to keep it simple and compatible with the previous logic:
        
        if language == "zh":
             # For Chinese, we pre-tokenize the text with spaces so BM25's default whitespace splitter works
            preprocess_func = lambda text: " ".join(jieba.cut(text))
            for doc in documents:
                doc.page_content = preprocess_func(doc.page_content)
        
        self.retriever = BM25Retriever.from_documents(documents)
        self.retriever.k = 2

    def route(self, query):
        """
        Returns the most relevant domain for the query.
        """
        query_text = query
        if self.language == "zh":
            query_text = " ".join(jieba.cut(query))
            
        results = self.retriever.invoke(query_text)
        
        if results:
            return results[0].metadata["domain"]
        return self.domains[0] # Fallback
