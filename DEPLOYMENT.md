# Deployment Guide — DocuMind AI

This document provides step-by-step instructions to push DocuMind AI to a new GitHub repository, deploy the Spring Boot backend on Render, and deploy the React frontend on Vercel.

Follow the steps in the exact order listed below to prevent connection or CORS errors.

---

## Deployment Order Overview

```text
Create Empty GitHub Repo
          ↓
  Push Code to GitHub
          ↓
Deploy Backend on Render → Copy Render API URL
          ↓
Deploy Frontend on Vercel with VITE_API_BASE_URL → Copy Vercel URL
          ↓
Update Render ALLOWED_ORIGINS with Vercel URL → Redeploy Backend
          ↓
      Final Verification
```

---

## PART A — Push to GitHub

1. Go to your GitHub account and create a **new, empty repository**.
2. **CRITICAL**:
   * Do **NOT** initialize it with a README.
   * Do **NOT** add a `.gitignore` (we already have a complete one).
   * Do **NOT** add a license initially.
3. Copy your repository's clone URL (e.g., `https://github.com/prajwalkarajange/documind-ai.git`).
4. Open a terminal in the root of your local project workspace (`documind-ai-main`) and run:
   ```sh
   # Initialize local repository
   git init
   
   # Verify that build folders and secret .env files are correctly ignored
   git status
   
   # Add all project source files
   git add .
   
   # Create the initial commit
   git commit -m "feat: initial release of DocuMind AI monorepo"
   
   # Set branch name to main
   git branch -M main
   
   # Link remote repository URL
   git remote add origin <YOUR-COPIED-GITHUB-URL>
   
   # Push files
   git push -u origin main
   ```

---

## PART B — Backend Deployment on Render

Render will host the Java Spring Boot REST API using its native Java runtime.

1. Log in to [Render](https://render.com) and click **New > Web Service**.
2. Select your newly pushed GitHub repository.
3. Configure the following Web Service properties:
   * **Name**: `documind-backend` (or your choice)
   * **Root Directory**: `backend` *(CRITICAL: This isolates backend building)*
   * **Language**: `Java`
   * **Build Command**: `mvn clean package -DskipTests`
   * **Start Command**: `java -jar target/documind-backend-0.0.1-SNAPSHOT.jar`
   * **Instance Type**: `Free`
4. Add the following **Environment Variables** in the Service settings:
   * `SUPABASE_URL`: *Your Supabase Project URL*
   * `SUPABASE_SERVICE_ROLE_KEY`: *Your Supabase Service Role Key (Keep private)*
   * `SUPABASE_DB_URL`: `jdbc:postgresql://<host>:5432/postgres` *(Supabase connection string)*
   * `SUPABASE_DB_USERNAME`: `postgres`
   * `SUPABASE_DB_PASSWORD`: *Your Supabase database password*
   * `GEMINI_API_KEY`: *Your Google Gemini API key*
   * `JWT_SECRET`: *A secure, unique 64+ character string for token hashing*
   * `ALLOWED_ORIGINS`: `http://localhost:5173,http://localhost:8080,http://localhost:8081` *(We will update this after Vercel deployment)*
5. Click **Deploy Web Service**.
6. Once deployed, copy your Render Web Service URL (e.g., `https://documind-backend.onrender.com`).
7. Test that it is active by visiting:  
   `https://<YOUR-RENDER-SERVICE-NAME>.onrender.com/api/health`  
   It should return: `{"status": "UP"}`.

---

## PART C — Frontend Deployment on Vercel

Vercel will compile and host the React + TypeScript frontend.

1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In the project configuration:
   * **Framework Preset**: Select `Vite` (or leave as auto-detected).
   * **Root Directory**: Keep empty (root of the repository).
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist/client`
4. In the **Environment Variables** section, add the following key:
   * `VITE_API_BASE_URL` = `https://<YOUR-RENDER-SERVICE-NAME>.onrender.com/api`
5. Click **Deploy**.
6. Once deployment succeeds, copy your Vercel Project URL (e.g., `https://documind-ai.vercel.app`).

---

## PART D — Update Render CORS Settings

To allow the frontend to securely access backend APIs from Vercel without cross-origin blocks:

1. Return to your Render Dashboard and open your `documind-backend` Web Service.
2. Go to the **Environment** tab.
3. Edit the `ALLOWED_ORIGINS` variable and append your Vercel URL (comma-separated):
   * Example: `http://localhost:5173,http://localhost:8080,http://localhost:8081,https://documind-ai.vercel.app`
4. Save the changes. Render will automatically redeploy the backend with the updated CORS patterns.
5. Launch the Vercel URL in your browser and verify the full flow (registering, logging in, uploading a document, and chatting with RAG responses).
