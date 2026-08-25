# DocuMind AI — Local Development Setup Guide

This document describes the steps required to set up and run the DocuMind AI project locally.

## Architectural Overview

The application consists of three main components:
1. **React Frontend**: Developed using TypeScript, TanStack Start, and TanStack Query. Runs on `http://localhost:5173`.
2. **Spring Boot Backend**: Developed using Java 17, Maven, Spring Security (JWT), and Flyway. Runs on `http://localhost:8080`.
3. **Supabase Database & Storage**: PostgreSQL with pgvector (768 dimensions) and a private `documents` bucket.
4. **Google Gemini API**: Used for RAG text embedding generation (`text-embedding-004`) and question answering (`gemini-2.5-flash`).

---

## Part 1: Supabase Manual Setup

Follow these steps to set up your Supabase project:

### STEP 1: Create a Supabase Project
1. Log in or sign up at [Supabase](https://supabase.com/).
2. Click **New project** and select your organization.
3. Choose a project name, database password, and region.
4. Click **Create new project** and wait for provisioning to complete.

### STEP 2: Enable PostgreSQL Extensions
1. In your Supabase dashboard, go to **Database** (left sidebar) -> **Extensions**.
2. Search for `vector` (pgvector).
3. Toggle it **ON** to enable the vector extension in the `public` schema.

### STEP 3: Create a Storage Bucket
1. Go to **Storage** (left sidebar) -> **New bucket**.
2. Set the Bucket Name to **`documents`**.
3. Toggle the **Public bucket** switch to **OFF** (this bucket must remain private).
4. Click **Create bucket**.
5. *Note: RLS policies are not required on the bucket itself because the Spring Boot backend interacts with storage using the bypass-all `service_role` key, verifying ownership at the Java application level.*

---

## Part 2: Obtain API Keys and Credentials

### 1. Supabase Credentials
Go to **Project Settings** (gear icon on bottom left) -> **API**:
* **`SUPABASE_URL`**: Found under "Project URL".
* **`SUPABASE_SERVICE_ROLE_KEY`**: Found under "Project API keys" -> `service_role` (click **Reveal** to show).
  > [!CAUTION]
  > The `service_role` key bypasses all Row Level Security (RLS). Keep it strictly secret. **NEVER expose this key to browser code.**

### 2. Supabase PostgreSQL Connection
Go to **Project Settings** -> **Database**:
* **Connection String**: Choose **URI** format.
* **`SUPABASE_DB_URL`**: Use the JDBC format: `jdbc:postgresql://db.[your-project-ref].supabase.co:5432/postgres` (replace with your host).
* **`SUPABASE_DB_USERNAME`**: `postgres`
* **`SUPABASE_DB_PASSWORD`**: The password you chose during project creation.

### 3. Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Log in with your Google account.
3. Click **Get API key** and create a new API key.
4. Copy the generated key.

---

## Part 3: Local Environment Variables Configuration

### 1. Frontend Configuration
Create a file named `.env.local` in the **root** folder:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```
> [!IMPORTANT]
> The frontend **MUST NOT** contain `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_DB_PASSWORD`.

### 2. Backend Configuration
Create a file named `.env` in the **`backend/`** folder:
```env
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-revealed-service-role-key]
SUPABASE_DB_URL=jdbc:postgresql://db.[your-project-ref].supabase.co:5432/postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=[your-database-password]
GEMINI_API_KEY=[your-gemini-api-key]
JWT_SECRET=[generate-a-secure-string-at-least-64-characters-long]
```

---

## Part 4: How to Run the Application

### 1. Database Migrations
On startup, the Spring Boot backend will automatically execute Flyway migrations located in `backend/src/main/resources/db/migration/` to initialize your database schema, indexes, and pgvector search functions.

### 2. Run the Backend
Navigate to the `backend/` directory and run:
```bash
mvn spring-boot:run
```
The API will start on `http://localhost:8080`.

### 3. Run the Frontend
Navigate to the root directory and run:
```bash
npm run dev
```
The client dashboard will be available at `http://localhost:5173`.
