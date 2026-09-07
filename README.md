# Department Notice Portal

AWS-backed academic notice system for **HOD**, **Faculty**, and **Students**.

Faculty and HOD write notices with AI help, attach a poster, publish or schedule them, and archive them later. Students sign in, read published notices, and unread counts drop after a notice is opened. HOD can also create student logins and email the password.

---

## How it works

### 1. Roles

| Role | Signs in at | Lands on | What they do |
|---|---|---|---|
| HOD | `/login/hod` | `/hod` | Create notices, manage notices, add students, archive |
| Faculty | `/login/faculty` | `/faculty` | Create, edit, publish, schedule, archive their notices |
| Student | `/login/student` | `/student` | Read published notices |

Cognito groups control access: `HOD`, `FACULTY`, `STUDENT`.

### 2. Faculty / HOD notice flow

1. Sign in.
2. Open **Create Notice**.
3. Write the details (or use **Fill with AI**).
4. Generate the notice text.
5. Edit title/body, attach a poster (JPG/PNG), optionally generate a visual PPTX.
6. **Save Draft**, **Publish** now, or **Schedule** a future time.
7. Open a published notice to **Archive**. Open an archived notice to **Unarchive** (it becomes published again).

### 3. HOD adds a student

1. Sign in as HOD.
2. Go to **Users** → **Add User**.
3. Enter name, register number, email, password, and department.
4. The app creates a Cognito student and emails the login.
5. The student signs in on **Student Sign In** with that register number and password.

SES is in sandbox, so the email only arrives if the address is verified in Amazon SES.

### 4. Student read flow

1. Sign in as student.
2. Dashboard shows published notices and an **Unread** count.
3. Opening a notice marks it read.
4. Going back to the dashboard reduces **Unread**.

### 5. What runs in AWS

```text
Browser (React)
    │
    ├─ Cognito  → login, JWT, groups
    │
    └─ API Gateway (j9evvf520h)
           │
           ├─ Lambda  → create / update / publish / archive notices
           ├─ Lambda  → AI generate notice + visual
           ├─ Lambda  → add / list students
           ├─ DynamoDB → Notices, Users
           ├─ S3 → posters and visuals
           └─ SES → student welcome email

EventBridge (every 5 min) → SCHEDULED → PUBLISHED, PUBLISHED → EXPIRED
```

API base URL:

`https://j9evvf520h.execute-api.ap-south-1.amazonaws.com`

---

## Run locally

You need **Node.js 20+**.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Local API calls go through the Vite proxy (`/notices`, `/admin`, `/documents`, `/health`) because the live API has no CORS yet.

### Test accounts

| Role | Username | Password |
|---|---|---|
| Faculty | `testfaculty1` | `test1F@123` |
| HOD | `testhod1@gmail.com` | `test1H@123` |
| Student | `teststudent1` | `test1S@123` |

---

## Deploy

The **backend is already deployed** in `ap-south-1` (API Gateway, Lambda, Cognito, DynamoDB, S3, SES). You only need to deploy the **frontend**, then point Cognito and CORS at the new website URL.

### Step 1 — Turn on API CORS (required)

A hosted frontend calls the API from another origin. Without CORS, login works but create/publish/list calls fail in the browser.

AWS Console → **API Gateway** → `notice-portal-api` (`j9evvf520h`) → **CORS**:

- Allow origins: your site URL, for example `https://xxxx.vercel.app` or `https://d123.cloudfront.net`
- Allow methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allow headers: `Content-Type, Authorization`
- Save / deploy

Or CLI (replace the origin after you have the site URL):

```bash
aws apigatewayv2 update-api --api-id j9evvf520h --region ap-south-1 --cors-configuration "AllowOrigins=https://YOUR-SITE-URL,AllowMethods=GET,POST,PUT,DELETE,OPTIONS,AllowHeaders=Content-Type,Authorization,AllowCredentials=false"
```

For a first test you can use `*` as the origin, then lock it to your real URL.

### Step 2 — Build the frontend

```bash
cd frontend
npm install
npm run build
```

This creates `frontend/dist`. That folder is what you upload.

Production builds already call:

`https://j9evvf520h.execute-api.ap-south-1.amazonaws.com`

### Step 3 — Host the frontend

Pick one.

#### Option A — Vercel or Netlify (fastest)

1. Push this project to GitHub.
2. Import the repo in Vercel or Netlify.
3. Set:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy.
5. Copy the live URL (example `https://notice-portal.vercel.app`).

React Router needs every unknown path to serve `index.html`. Vercel/Netlify do this by default for SPAs.

#### Option B — AWS S3 + CloudFront (best for an AWS resume)

1. Create an S3 bucket, for example `notice-portal-web-kavii`, in `ap-south-1`.
2. Disable **Block public access** only if you use S3 website hosting without CloudFront. Prefer CloudFront and keep the bucket private.
3. Upload the `frontend/dist` files:

```bash
cd frontend
aws s3 sync dist/ s3://notice-portal-web-kavii --delete --region ap-south-1
```

4. Create a CloudFront distribution:
   - Origin: the S3 bucket
   - Default root object: `index.html`
   - Custom error response: `403` and `404` → `/index.html` with `200` (needed for `/hod/create-notice` and other routes)
5. Copy the CloudFront URL, for example `https://d111111abcdef8.cloudfront.net`.

After each new frontend change:

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://notice-portal-web-kavii --delete --region ap-south-1
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Step 4 — Add the site URL in Cognito

AWS Console → **Cognito** → user pool `ap-south-1_a2KkiKxyL` → app client `notice-portal-web-client`:

- Allowed callback URLs: `http://localhost:5173` **and** your live site URL
- Allowed sign-out URLs: the same

Login uses username/password against Cognito directly, but keeping the callback URL updated avoids hosted-UI issues later.

### Step 5 — Point student welcome emails at the live site

AWS Console → **Lambda** → `manageUsers` → Configuration → Environment variables:

- `STUDENT_LOGIN_URL` = `https://YOUR-SITE-URL/login/student`

Save. New student emails will use the live login link instead of `localhost`.

### Step 6 — Smoke test on the live URL

1. Open the live site (not localhost).
2. HOD login → dashboard → **Create Notice** (must stay logged in).
3. Faculty login → create a draft → publish.
4. Student login → open the notice → back to dashboard → **Unread** should drop.
5. HOD → Users → add a student whose email is SES-verified.

---

## Project folders

```text
Notice AWS/
  frontend/                         React + Vite app
  notice-portal-backend/            Lambda packages (generateVisual, manageUsers)
  notice-portal-aws-config-log.md   AWS IDs and routes
  README.md                         This file
```

---

## Known limits

- Live API had no CORS until you add it in Step 1. Localhost works through the Vite proxy.
- SES sandbox can only email verified addresses.
- OCR / Textract is abandoned.
- Student unread state is stored in the browser for that student after they open a notice.

---

## AWS IDs (this project)

| Item | Value |
|---|---|
| Region | `ap-south-1` |
| API | `https://j9evvf520h.execute-api.ap-south-1.amazonaws.com` |
| User pool | `ap-south-1_a2KkiKxyL` |
| App client | `vg03lfv1edc7gq2s9ncjhrn9j` |
