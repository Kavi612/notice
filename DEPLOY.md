# Deployment Guide

This guide details the steps to connect the Vercel-hosted frontend with the deployed Express backend.

---

### Step 1: Deploy the Backend
Deploy the Node.js Express backend (`backend/`) to your hosting platform of choice (e.g. Render, Railway, AWS ECS, or Fly.io).

Configure the environment variables in your backend hosting service:
- `PORT`: Server port (e.g., `5000` or assigned by platform)
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:password@host:5432/notice_board`)
- `CORS_ORIGIN`: Your deployed Vercel frontend URL (e.g., `https://your-frontend.vercel.app`), or a comma-separated list including local dev if needed (`https://your-frontend.vercel.app,http://localhost:5173`)
- `COGNITO_REGION`: AWS region (e.g., `ap-south-1`)
- `COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `COGNITO_CLIENT_ID`: Cognito App Client ID

---

### Step 2: Verify Backend Health
Once deployed, verify that the backend is up and running by opening:
```bash
curl https://<backend-url>/health
```
Expected response:
```json
{"status":"ok"}
```

---

### Step 3: Configure Frontend on Vercel & Redeploy
Because Vite bakes `import.meta.env` values into static bundles at build time, setting the environment variable requires a rebuild/redeploy:

1. In your **Vercel Project Settings** &rarr; **Environment Variables**:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://<backend-url>` (your deployed backend URL, without a trailing slash)
2. Trigger a **Redeploy** on Vercel (or push a new commit) to rebuild the static assets with the baked API base URL.

---

### Step 4: Verify in Production
1. Open your Vercel deployment URL (`https://your-frontend.vercel.app`).
2. Log in with the Principal credentials.
3. Open the **Principal Dashboard** (`/principal`).
4. Verify that notices load cleanly as JSON data with no `"Unexpected token '<'"` HTML parsing errors.
