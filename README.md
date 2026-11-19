# DocuCite AI — Multi-Document RAG & Citation Workspace

A full-stack Retrieval-Augmented Generation (RAG) workspace built with **React.js, Node.js, Express, and PostgreSQL 18**. Upload PDF, Markdown, or text documents, ask natural language questions across your knowledge base, and click inline `[Source X]` citations to smoothly scroll and highlight the exact verified passage in the document viewer.

## System Architecture

```text
[React 3-Pane UI] ──(POST /api/documents/upload)──▶ [Express + Multer + pdf-parse]
       │                                                       │
       │                                           800-char Overlapping Chunks
       │                                                       ▼
       │                                           [Gemini Embedding API]
       │                                                       │
       │                                                       ▼
       │                                        [PostgreSQL 18: documents & chunks]
       │                                                       │
       └──(POST /api/chat)──▶ [Cosine Similarity Top-K] ◀──────┘
                                       │
                                       ▼
                        [Grounded Gemini QA + Retry/Fallback]
                                       │
                                       ▼
                        [Clickable [Source X] DOM Highlight]