import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    FileText,
    Upload,
    Trash2,
    Send,
    BookOpen,
    Loader2,
} from 'lucide-react';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API = `${BACKEND_URL}/api`;

export default function WorkspacePage() {
    const [documents, setDocuments] = useState([]);
    const [activeDoc, setActiveDoc] = useState(null);
    const [highlightedChunkId, setHighlightedChunkId] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Upload a PDF, TXT, or Markdown document on the left, then ask any question. Click any [Source] badge to jump straight to the exact highlighted paragraph.',
            citations: [],
        },
    ]);
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);

    const fileInputRef = useRef(null);
    const chunkRefs = useRef({});
    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchDocuments() {
        try {
            const { data } = await axios.get(`${API}/documents`);
            setDocuments(data);
            if (data.length > 0 && !activeDoc) {
                selectDocument(data[0].id);
            }
        } catch (err) {
            console.error('Error loading documents:', err);
        }
    }

    async function selectDocument(docId, targetChunkId = null) {
        try {
            const { data } = await axios.get(`${API}/documents/${docId}`);
            setActiveDoc(data);
            if (targetChunkId) {
                setHighlightedChunkId(targetChunkId);
                setTimeout(() => {
                    chunkRefs.current[targetChunkId]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }, 120);
            } else {
                setHighlightedChunkId(null);
            }
        } catch (err) {
            console.error('Error fetching document:', err);
        }
    }

    async function handleFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const { data } = await axios.post(`${API}/documents/upload`, formData);
            await fetchDocuments();
            await selectDocument(data.id);
        } catch (err) {
            alert(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    async function handleDeleteDoc(e, docId) {
        e.stopPropagation();
        try {
            await axios.delete(`${API}/documents/${docId}`);
            const updated = documents.filter((d) => d.id !== docId);
            setDocuments(updated);
            if (activeDoc?.id === docId) {
                setActiveDoc(
                    updated[0] ? (await axios.get(`${API}/documents/${updated[0].id}`)).data : null
                );
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    }

    async function handleAsk(e) {
        e.preventDefault();
        if (!question.trim() || asking) return;

        const userQuestion = question.trim();
        setQuestion('');
        setMessages((prev) => [...prev, { role: 'user', text: userQuestion }]);
        setAsking(true);

        try {
            const { data } = await axios.post(`${API}/chat`, {
                question: userQuestion,
                documentId: null,
            });

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: data.answer,
                    citations: data.citations || [],
                },
            ]);
        } catch (err) {
            const serverMsg = err.response?.data?.error || err.message;
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: `Backend error: ${serverMsg}`,
                    citations: [],
                },
            ]);
        } finally {
            setAsking(false);
        }
    }

    function renderAnswerWithCitations(text, citations) {
        const parts = text.split(/(\[Source \d+\])/g);
        return parts.map((part, index) => {
            const match = part.match(/\[Source (\d+)\]/);
            if (match) {
                const sourceNum = Number(match[1]);
                const citedObj = citations.find((c) => c.sourceNumber === sourceNum);
                if (citedObj) {
                    return (
                        <button
                            key={index}
                            className="citation-tag"
                            title={`Jump to ${citedObj.documentTitle} (Section #${citedObj.chunkIndex})`}
                            onClick={() => selectDocument(citedObj.documentId, citedObj.chunkId)}
                        >
                            {part}
                        </button>
                    );
                }
            }
            return <span key={index}>{part}</span>;
        });
    }

    return (
        <main className="workspace">
            {/* Pane 1: Document Library */}
            <section className="pane">
                <div className="pane-header">
                    <span>Knowledge Base ({documents.length})</span>
                </div>

                <div
                    className="upload-box"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.md"
                        hidden
                        onChange={handleFileUpload}
                    />
                    {uploading ? (
                        <>
                            <Loader2 size={22} className="spin" color="#38bdf8" />
                            <p>Indexing & Embedding...</p>
                        </>
                    ) : (
                        <>
                            <Upload size={22} color="#38bdf8" />
                            <p>Upload Document</p>
                            <span>Supports PDF, TXT, Markdown</span>
                        </>
                    )}
                </div>

                <div className="doc-list">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className={`doc-item ${activeDoc?.id === doc.id ? 'active' : ''}`}
                            onClick={() => selectDocument(doc.id)}
                        >
                            <div className="doc-meta">
                                <div className="doc-title">{doc.title}</div>
                                <div className="doc-sub">{doc.chunk_count} indexed sections</div>
                            </div>
                            <button
                                className="icon-btn"
                                title="Delete document"
                                onClick={(e) => handleDeleteDoc(e, doc.id)}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pane 2: Interactive Source Reader */}
            <section className="pane">
                <div className="pane-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={15} />
                        {activeDoc ? activeDoc.title : 'Source Viewer'}
                    </span>
                </div>

                <div className="viewer-body">
                    {activeDoc ? (
                        activeDoc.chunks.map((chunk) => (
                            <div
                                key={chunk.id}
                                ref={(el) => (chunkRefs.current[chunk.id] = el)}
                                className={`chunk-block ${highlightedChunkId === chunk.id ? 'highlighted' : ''}`}
                            >
                                <div className="chunk-label">Section #{chunk.chunk_index}</div>
                                <div>{chunk.content}</div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <FileText size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <p>
                                Select or upload a document to inspect its indexed sections and highlighted
                                citations.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Pane 3: AI Research Chat */}
            <section className="pane">
                <div className="pane-header">
                    <span>Grounded AI Research Assistant</span>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`msg ${msg.role}`}>
                            <div>
                                {msg.role === 'assistant'
                                    ? renderAnswerWithCitations(msg.text, msg.citations)
                                    : msg.text}
                            </div>

                            {msg.citations?.length > 0 && (
                                <div className="citations-drawer">
                                    {msg.citations.map((c) => (
                                        <button
                                            key={c.sourceNumber}
                                            className="citation-pill"
                                            onClick={() => selectDocument(c.documentId, c.chunkId)}
                                        >
                                            <strong>[Source {c.sourceNumber}]</strong>
                                            <span>
                                                {c.documentTitle} · #{c.chunkIndex} ({c.similarity}%)
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {asking && (
                        <div className="msg assistant" style={{ color: '#94a3b8' }}>
                            Searching vector embeddings & verifying citations...
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <form className="chat-input-bar" onSubmit={handleAsk}>
                    <input
                        type="text"
                        placeholder="Ask a question across your uploaded documents..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                    <button type="submit" className="send-btn" disabled={asking || !question.trim()}>
                        <Send size={15} />
                        Ask
                    </button>
                </form>
            </section>
        </main>
    );
}