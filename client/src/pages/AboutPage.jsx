import { Link } from 'react-router-dom';
import { GitBranch, ExternalLink, ArrowRight, Code2 } from 'lucide-react';

export default function AboutPage() {
    const stack = [
        'React.js (Vite)',
        'React Router',
        'Node.js',
        'Express',
        'PostgreSQL',
        'Google Gemini API',
        'Cosine Vector Search',
        'Multer & pdf-parse',
    ];

    return (
        <div className="page-container">
            <section className="page-header-block">
                <div className="hero-pill">Project Overview</div>
                <h1 className="page-title">About DocuCite AI</h1>
                <p className="hero-subtitle">
                    Built to bridge the trust gap in generative AI by making every synthesized answer
                    auditable down to the exact paragraph in its source document.
                </p>
            </section>

            <section className="content-section">
                <div className="about-card">
                    <h3>Why Citation Traceability Matters</h3>
                    <p>
                        Standard chat interfaces generate fluent answers without showing where facts came
                        from—or worse, fabricate details when context is missing. DocuCite AI enforces strict
                        retrieval grounding: if an answer is not supported by your uploaded files, the assistant
                        explicitly refuses to speculate.
                    </p>

                    <h3 style={{ marginTop: '24px' }}>Technology Stack</h3>
                    <div className="tech-badges">
                        {stack.map((item) => (
                            <span key={item} className="tech-badge">
                                <Code2 size={13} color="#38bdf8" /> {item}
                            </span>
                        ))}
                    </div>

                    <div className="about-links">
                        <a
                            href="https://github.com/Saigoud17/docucite-ai"
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary"
                        >
                            <GitBranch size={16} /> View Source on GitHub <ExternalLink size={14} />
                        </a>
                        <Link to="/workspace" className="btn-primary">
                            Launch Workspace <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}