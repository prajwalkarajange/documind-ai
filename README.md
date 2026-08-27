# 🧠📄 DocuMind AI

### AI-Powered Document Intelligence & Retrieval-Augmented Generation Platform

> **Upload. Understand. Ask. Get Context-Aware Answers.**

DocuMind AI is a full-stack AI-powered document intelligence platform that enables users to upload documents and interact with them using natural language.

The platform uses a **Retrieval-Augmented Generation (RAG)** architecture to retrieve relevant information from uploaded documents and generate accurate, context-aware answers using **Google Gemini AI**.

---

## 🚀 Live Demo

🌐 **Frontend Application:**  
https://documind-ai-ten-bay.vercel.app/

🔗 **Backend API:**  
https://documind-ai-5qb5.onrender.com/

❤️ **Backend Health Check:**  
https://documind-ai-5qb5.onrender.com/api/health

> ⚠️ The backend is hosted on Render and may take a short time to wake up after inactivity.

---

# 📌 About the Project

Traditional AI chatbots often send an entire document directly to an AI model. This approach can be inefficient, expensive, and may provide irrelevant context.

**DocuMind AI solves this problem using Retrieval-Augmented Generation (RAG).**

Instead of sending the complete document for every user question, the application:

1. Extracts document content.
2. Splits the content into meaningful chunks.
3. Generates vector embeddings.
4. Stores embeddings in PostgreSQL using pgvector.
5. Performs semantic similarity search.
6. Retrieves the most relevant document context.
7. Sends only relevant context to the Gemini AI model.
8. Generates a context-aware answer.

This architecture provides a more efficient and intelligent way to interact with documents.

---

# ✨ Features

- 🔐 Secure User Authentication
- 👥 User Account Management
- 📄 Document Upload
- 🗂️ Document Management
- 🧠 AI-Powered Document Analysis
- 💬 Chat with Uploaded Documents
- 🔍 Semantic Search
- 📊 Retrieval-Augmented Generation (RAG)
- 🧩 Intelligent Document Chunking
- 🧠 Vector Embeddings
- 🗃️ Vector Similarity Search using pgvector
- 🔐 Role-Based Access Control
- 🛡️ Protected Backend APIs
- ☁️ Cloud File Storage
- 🚀 Production Deployment
- 📱 Responsive Modern UI
- ⚡ Backend Wake-Up Detection
- 🔄 Retry Connection Handling

---

# 🧠 RAG Architecture

DocuMind AI follows a Retrieval-Augmented Generation pipeline.

```text
                📄 User Uploads Document
                           │
                           ▼
                ┌─────────────────────┐
                │ Document Processing │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │  Text Extraction    │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │   Text Chunking     │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Gemini Embeddings   │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ PostgreSQL +        │
                │ pgvector Storage    │
                └─────────────────────┘
                           │
                           │
                ───────────┼───────────
                           │
                           ▼
                   ❓ User Question
                           │
                           ▼
                ┌─────────────────────┐
                │ Query Embedding     │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Vector Similarity   │
                │ Search              │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Relevant Document   │
                │ Context             │
                └─────────────────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Google Gemini AI    │
                └─────────────────────┘
                           │
                           ▼
                  💬 Context-Aware Answer
