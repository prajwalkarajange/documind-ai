# DocuMind AI — Document Intelligence & RAG Platform

DocuMind AI is a production-quality, end-to-end **AI document RAG (Retrieval-Augmented Generation)** application. Users can upload PDFs, ask natural language questions, and receive grounded answers backed by **file and page-level citations**.

This monorepo contains both the **React Frontend** and the standalone **Java Spring Boot Backend**.

---

## Developer Profile

* **Developer**: Prajwal Karajange
* **Title**: Java Full Stack Developer
* **Bio**: Java Full Stack Developer focused on building scalable web applications, AI-powered solutions, and modern cloud-based applications.
* **LinkedIn**: [prajwal-karajange](https://linkedin.com/in/prajwal-karajange)
* **GitHub**: [prajwalkarajange](https://github.com/prajwalkarajange)
* **Email**: prajwalkarajange0409@gmail.com

---

## Architecture & Tech Stack

```text
       React 19 + TypeScript (Frontend SPA / SSR)
                         ↓
       Java 21 + Spring Boot REST API (Backend)
            ↓                        ↓
Supabase PostgreSQL + pgvector     Supabase Storage (Private)
            ↓
       Gemini API (Embeddings & Content Generation)
```

### Core Technologies

* **Frontend**: React 19, TypeScript, Vite, TanStack Router (file-based routing), TanStack Query, Tailwind CSS v4, Radix UI primitives, Lucide Icons, Recharts.
* **Backend**: Java 21, Spring Boot 3.3.x, Spring Security (JWT-based authentication), JPA/Hibernate.
* **Database**: PostgreSQL (Supabase-hosted) with the `pgvector` extension for vector similarity search, Flyway for migrations.
* **Storage**: Supabase Storage with private bucket controls bypassed securely via backend service-role API credentials.
* **AI Service**: Google Gemini API via REST calls utilizing `gemini-embedding-001` (768 dimensions) and `gemini-3.6-flash` (grounded answers).

---

## Local Setup

### 1. Prerequisites
* **Java**: JDK 21 or later
* **Maven**: 3.8+ or wrapper
* **Node.js**: v18 or later

### 2. Backend Setup
1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Create your environment configuration file:
   ```sh
   cp .env.example .env
   ```
3. Fill in your credentials inside `backend/.env` (Supabase connection details, Gemini API Key, and JWT Secret).
4. Run the Spring Boot application:
   ```sh
   # On Windows (PowerShell):
   $envFile = Get-Content .env; foreach ($line in $envFile) { if ($line -and -not $line.StartsWith('#')) { $parts = $line.Split('=', 2); if ($parts.Length -eq 2) { [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim()) } } }; mvn spring-boot:run
   
   # On macOS/Linux:
   export $(grep -v '^#' .env | xargs) && mvn spring-boot:run
   ```

### 3. Frontend Setup
1. In the root directory, install dependencies:
   ```sh
   npm install
   ```
2. Create your local environment file:
   ```sh
   cp .env.example .env.local
   ```
3. Verify that `VITE_API_BASE_URL` is set to `http://localhost:8080/api`.
4. Start the Vite development server:
   ```sh
   npm run dev
   ```

---

## RAG Flow & Grounding Rules

1. **PDF Ingest**: PDFs are uploaded to private Supabase Storage. Text is extracted via Apache PDFBox, chunked into sentence-boundary character windows, embedded via `gemini-embedding-001` to exactly 768 dimensions, and saved in `document_chunks`.
2. **Retrieval**: Questions are embedded and matched against chunks in pgvector using cosine distance (`match_document_chunks` function).
3. **Grounding Prompt**: The LLM (`gemini-3.6-flash`) is prompted to answer **ONLY** using the retrieved chunk context. If facts are absent, it returns exactly: `"I couldn't find enough information about this in the uploaded document."`
4. **Citations**: Page numbers and filenames are stored with message nodes and displayed inline as citations.

---

## REST API Contracts

All endpoints require a `Authorization: Bearer <JWT>` header (except public endpoints).

### Public Endpoints
* `POST /api/auth/register` — Register a new account.
* `POST /api/auth/login` — Login to receive a JWT token.
* `GET /api/health` — Public status check endpoint.

### Authenticated User Endpoints
* `GET /api/auth/me` — Fetch current user context.
* `POST /api/auth/logout` — Logout user.
* `GET /api/profile` — Fetch profile metadata.
* `PUT /api/profile` — Update user name.
* `POST /api/documents/upload` — Upload PDF binary.
* `GET /api/documents` — Fetch user's documents.
* `GET /api/documents/{id}` — Fetch specific document.
* `GET /api/documents/{id}/status` — Poll document processing state.
* `DELETE /api/documents/{id}` — Delete document and associated chunks/files.
* `POST /api/chat` — Post grounded question.
* `GET /api/chat/history` — Get chat session summaries.
* `GET /api/chat/{sessionId}` — Get full chat conversation logs.
* `DELETE /api/chat/{sessionId}` — Remove chat session.

### Admin-Only Endpoints
* `GET /api/admin/stats` — Fetch dashboard system usage.
* `GET /api/admin/users` — List registered users, roles, and doc counts.
* `PUT /api/admin/users/{id}/role` — Edit user role (`USER`, `ADMIN`).
* `PUT /api/admin/users/{id}/status` — Enable/disable user accounts.
* `DELETE /api/admin/users/{id}` — Delete user profile and files.
* `GET /api/admin/documents` — View system-wide uploaded documents.
* `DELETE /api/admin/documents/{id}` — Admin override delete document.
* `POST /api/admin/documents/{id}/retry` — Retry failed document extraction jobs.
* `GET /api/admin/system/health` — Fetch full system connection health matrix.
