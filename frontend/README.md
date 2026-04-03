# Then Interactive Demonstration RAG Page
The pipelines in the Retrieve-Augemented Generation System can be really complicated, the route may different by each request. Therefore, to better demonstrate the progress, I build this Demonstration Page that will show the exact progress such as data retrieval, ranking and re-ranking, and prompts to the LLM.

## The Implementation
### Code Stack
- React / TypeScript / Vite
- FastAPI

### Page Structure
The page is divided into two main parts:
1. The left side is the input area where the user can enter their query and select the language.
2. The right side is the output area where the user can see the progress of the RAG pipeline and the final answer.

1. App.tsx - The main page that handles the overall logic and state management.
2. RAGPlayground.tsx - Let the user to test the RAG pipeline with their own queries (without evaluation).
3. PresetQueries.tsx - User can select from pre-built preset queries to test the RAG pipeline and run the evaluation.
