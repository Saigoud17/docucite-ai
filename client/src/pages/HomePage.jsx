import { Link } from 'react-router-dom';
import {
    ArrowRight,
    ShieldCheck,
    FileSearch,
    Database,
    Layers,
    Cpu,
    CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="page-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-pill">Full-Stack Retrieval-Augmented Generation</div>
                <h1 className="hero-title">
                    Verifiable AI Answers Backed by <span>Clickable Source Citations</span>
                </h1>
                <p className="hero-subtitle">
                    Upload technical specs, research papers, or documentation. DocuCite AI indexes your
                    files into semantic vector chunks in PostgreSQL and grounds every answer with inline{' '}
                    <code>[Source X]</code> links that scroll directly to the exact highlighted paragraph.
                </p>

                <div className="hero-actions">
                    <Link to="/workspace" className="btn-primary">
                        Open RAG Workspace <ArrowRight size={16} />
                    </Link>
                    <Link to="/architecture" className="btn-secondary">
                        Explore Architecture
                    </Link>
                </div>

                <div className="hero-stats">
                    <div className="stat-card">
                        <strong>800 chars</strong>
                        <span>Overlapping Semantic Chunks</span>
                    </div>
                    <div className="stat-card">
                        <strong>Cosine Top-K</strong>
                        <span>Deterministic Vector Ranking</span>
                    </div>
                    <div className="stat-card">
                        <strong>Zero Hallucination</strong>
                        <span>Strict Context Grounding</span>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="content-section">
                <h2 className="section-heading">How DocuCite AI Works</h2>
                <div className="cards-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Layers size={20} color="#38bdf8" />
                        </div>
                        <h3>1. Parse & Overlap Chunking</h3>
                        <p>
                            Extracts clean text from PDF, Markdown, and TXT files via Multer and{' '}
                            <code>pdf-parse</code>, splitting content into 800-character blocks with a
                            150-character overlap to preserve sentence boundaries.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <Database size={20} color="#38bdf8" />
                        </div>
                        <h3>2. Vector Indexing in PostgreSQL</h3>
                        <p>
                            Generates dense embeddings using <code>gemini-embedding-001</code> and persists
                            document metadata alongside <code>DOUBLE PRECISION[]</code> vectors in relational
                            PostgreSQL tables.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <FileSearch size={20} color="#38bdf8" />
                        </div>
                        <h3>3. Cited QA & DOM Deep-Linking</h3>
                        <p>
                            Ranks top matching sections via cosine similarity, enforces grounded generation with{' '}
                            <code>[Source X]</code> tags, and maps clicks directly to React DOM refs for instant
                            passage highlighting.
                        </p>
                    </div>
                </div>
            </section>

            {/* Sample Prompts Preview */}
            <section className="content-section">
                <div className="callout-box">
                    <div>
                        <h3>Ready to Test Anti-Hallucination Grounding?</h3>
                        <p>
                            Try asking both quantitative questions found inside your uploaded document and
                            out-of-scope questions to verify strict source adherence.
                        </p>
                        <ul className="checklist">
                            <li>
                                <CheckCircle2 size={15} color="#38bdf8" /> Multi-document cross-search across all
                                indexed files
                            </li>
                            <li>
                                <CheckCircle2 size={15} color="#38bdf8" /> Similarity confidence scores displayed per
                                source badge
                            </li>
                            <li>
                                <CheckCircle2 size={15} color="#38bdf8" /> Automatic LLM timeout & model fallback
                                resilience
                            </li>
                        </ul>
                    </div>
                    <Link to="/workspace" className="btn-primary">
                        Try Live Demo <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    );
}