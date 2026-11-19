import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';
import { pool, initDB } from './db.js';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

// Split document text into overlapping chunks (~800 chars)
function chunkText(text, chunkSize = 800, overlap = 150) {
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
        const end = Math.min(start + chunkSize, cleanText.length);
        chunks.push(cleanText.slice(start, end).trim());
        if (end === cleanText.length) break;
        start += chunkSize - overlap;
    }
    return chunks.filter((c) => c.length > 20);
}

// Helper: Timeout wrapper so API calls never hang forever
function withTimeout(promise, ms = 15000, label = 'API request') {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
        ),
    ]);
}

// Generate vector embedding using Gemini
async function getEmbedding(text) {
    const response = await withTimeout(
        ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: text,
        }),
        15000,
        'Embedding'
    );
    return response.embeddings[0].values;
}

// Cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// Resilient generation with fast retry & fallback
async function generateAnswerWithRetry(prompt) {
    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let lastErr;

    for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`🤖 Calling ${model} (attempt ${attempt})...`);
                return await withTimeout(
                    ai.models.generateContent({
                        model,
                        contents: prompt,
                    }),
                    30000,
                    model
                );
            } catch (err) {
                lastErr = err;
                console.warn(`⚠️ ${model} attempt ${attempt} failed:`, err.message);
                if (err.status === 503 || err.message?.includes('503')) {
                    await new Promise((r) => setTimeout(r, 1500));
                } else {
                    break;
                }
            }
        }
    }
    throw lastErr;
}

// 1. GET all uploaded documents
app.get('/api/documents', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, title, file_type, chunk_count, created_at FROM documents ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET single document with full text & chunks
app.get('/api/documents/:id', async (req, res) => {
    try {
        const docRes = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
        if (docRes.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

        const chunksRes = await pool.query(
            'SELECT id, chunk_index, content FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index ASC',
            [req.params.id]
        );
        res.json({ ...docRes.rows[0], chunks: chunksRes.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. POST upload & index a document
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const { originalname, mimetype, buffer } = req.file;
        let extractedText = '';

        if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
            const parser = new PDFParse({ data: buffer });
            const pdfData = await parser.getText();
            extractedText = pdfData.text;
        } else {
            extractedText = buffer.toString('utf-8');
        }

        if (!extractedText.trim()) {
            return res.status(400).json({ error: 'Could not extract text from file' });
        }

        const chunks = chunkText(extractedText);

        const docInsert = await pool.query(
            'INSERT INTO documents (title, file_type, full_text, chunk_count) VALUES ($1, $2, $3, $4) RETURNING id, title, file_type, chunk_count, created_at',
            [originalname, mimetype, extractedText, chunks.length]
        );
        const document = docInsert.rows[0];

        for (let i = 0; i < chunks.length; i++) {
            const embedding = await getEmbedding(chunks[i]);
            await pool.query(
                'INSERT INTO document_chunks (document_id, chunk_index, content, embedding) VALUES ($1, $2, $3, $4)',
                [document.id, i + 1, chunks[i], embedding]
            );
        }

        res.status(201).json(document);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE a document
app.delete('/api/documents/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. POST ask a question with inline citations
app.post('/api/chat', async (req, res) => {
    try {
        const { question, documentId } = req.body;
        console.log('📩 Incoming question:', question);
        if (!question) return res.status(400).json({ error: 'Question is required' });

        console.log('1️⃣ Generating query embedding...');
        const queryEmbedding = await getEmbedding(question);

        console.log('2️⃣ Fetching chunks from PostgreSQL...');
        const sql = documentId
            ? `SELECT dc.id, dc.document_id, dc.chunk_index, dc.content, dc.embedding, d.title
         FROM document_chunks dc JOIN documents d ON dc.document_id = d.id
         WHERE dc.document_id = $1`
            : `SELECT dc.id, dc.document_id, dc.chunk_index, dc.content, dc.embedding, d.title
         FROM document_chunks dc JOIN documents d ON dc.document_id = d.id`;

        const params = documentId ? [documentId] : [];
        const { rows } = await pool.query(sql, params);

        if (rows.length === 0) {
            return res.json({
                answer: 'No documents indexed yet. Please upload a PDF, TXT, or Markdown file first.',
                citations: [],
            });
        }

        console.log(`3️⃣ Ranking ${rows.length} chunks via cosine similarity...`);
        const topChunks = rows
            .map((row) => ({
                id: row.id,
                documentId: row.document_id,
                documentTitle: row.title,
                chunkIndex: row.chunk_index,
                content: row.content,
                score: cosineSimilarity(queryEmbedding, row.embedding),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);

        const contextBlock = topChunks
            .map(
                (c, idx) =>
                    `[Source ${idx + 1}] (Document: "${c.documentTitle}", Section #${c.chunkIndex}):\n${c.content}`
            )
            .join('\n\n---\n\n');

        const prompt = `You are DocuCite AI, a precise research assistant. Answer the user's question using ONLY the provided document excerpts below.
Whenever you state a fact from an excerpt, cite it inline using exact tags like [Source 1], [Source 2], etc.
If the answer cannot be found in the excerpts, say so clearly without guessing.

EXCERPTS:
${contextBlock}

USER QUESTION:
${question}`;

        console.log('4️⃣ Generating cited answer...');
        const aiResponse = await generateAnswerWithRetry(prompt);
        console.log('✅ Answer generated!');

        res.json({
            answer: aiResponse.text,
            citations: topChunks.map((c, idx) => ({
                sourceNumber: idx + 1,
                chunkId: c.id,
                documentId: c.documentId,
                documentTitle: c.documentTitle,
                chunkIndex: c.chunkIndex,
                excerpt: c.content,
                similarity: Number((c.score * 100).toFixed(1)),
            })),
        });
    } catch (err) {
        console.error('❌ Chat error:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to initialize database:', err);
    });