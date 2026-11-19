import { Link } from 'react-router-dom';
import { Server, Database, Cpu, Layout, ArrowRight } from 'lucide-react';

export default function ArchitecturePage() {
    return (
        <div className="page-container">
            <section className="page-header-block">
                <div className="hero-pill">Engineering & System Design</div>
                <h1 className="page-title">End-to-End RAG Pipeline Architecture</h1>
                <p className="hero-subtitle">
                    Designed for deterministic retrieval, relational data integrity, and verifiable UI
                    traceability without heavy external vector-DB overhead.
                </p>
            </section>

            {/* ASCII / Visual Data Flow */}
            <section className="content-section">
                <div className="arch-diagram">
                    <pre>{`[React 3-Pane Workspace] ──(POST /api/documents/upload)──▶ [Express + Multer + pdf-parse]
          │                                                           │
          │                                               800-Char Overlapping Chunks
          │                                                           ▼
          │                                               [Gemini Embedding API]
          │                                                           │
          │                                                           ▼
          │                                            [PostgreSQL: documents & chunks]
          │                                                           │
          └──(POST /api/chat)──▶ [Cosine Similarity Top-K] ◀──────────┘
                                           │
                                           ▼
                            [Grounded Gemini QA + Retry Fallback]
                                           │
                                           ▼
                            [Clickable [Source X] DOM Highlight]`}</pre>
                </div>
            </section>

            {/* Stack Breakdown */}
            <section className="content-section">
                <h2 className="section-heading">Core Architectural Decisions</h2>
                <div className="cards-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Layout size={20} color="#38bdf8" />
                        </div>
                        <h3>Frontend (React + Vite)</h3>
                        <p>
                            3-pane split layout separating the Knowledge Base manager, full-text Source Viewer,
                            and Research Assistant. Citations parse regex tokens into interactive buttons tied to{' '}
                            <code>scrollIntoView</code> refs.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Server size={20} color="#38bdf8" />
                        </div>
                        <h3>Backend API (Node.js + Express)</h3>
                        <p>
                            REST endpoints handle multipart file uploads, sliding-window text chunking, cosine
                            similarity scoring, and resilient LLM orchestration with timeout guards and fallback
                            models.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Database size={20} color="#38bdf8" />
                        </div>
                        <h3>Relational Vector Store (PostgreSQL)</h3>
                        <p>
                            Normalized <code>documents</code> and <code>document_chunks</code> schema with{' '}
                            <code>ON DELETE CASCADE</code> ensures zero orphaned vectors when documents are
                            removed from the library.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Cpu size={20} color="#38bdf8" />
                        </div>
                        <h3>AI Grounding Layer (Google Gemini)</h3>
                        <p>
                            Uses <code>gemini-embedding-001</code> for semantic representations and{' '}
                            <code>gemini-3.5-flash-lite</code> with strict system rules forbidding claims outside
                            retrieved chunks.
                        </p>
                    </div>
                </div>
            </section>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <Link to="/workspace" className="btn-primary">
                    Test the Pipeline in Workspace <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}