# AWS Configuration Log — Notice Portal

Keep this updated after every console step. This is your record of everything that exists in your AWS account for this project — resource names, IDs, regions, and key settings. Fill in the [ ] blanks as you go.

**Account region for this project:** [ap-south-1 ]
**AWS Account ID:** [322337309239 ]

---

## 1. IAM

**IAM User (for CLI/console daily use, not root):**
- Username: [ kavii-notice-portal-dev]
- Policy attached: [ Administration access]
- Access Key ID created: [ Yes ]

---

## 2. Cognito

**User Pool**
- User Pool name: [ notice-portal-user-pool]
- User Pool ID: [ ap-south-1_a2KkiKxyL]
- Region: [ Asia Pacific (Mumbai)]
- Sign-in method: [ ]

**Groups**
- [ *] ADMIN
- [ *] FACULTY
- [ *] STUDENT

**App Client**
- App Client name: [ ]
- App Client ID: [ ]

---

## 3. DynamoDB Tables

### Users
- Table name: [ Users]
- Partition key: [	userId ]
- GSIs: [ - ]

### Notices
- Table name: [ Notices]
- Partition key: [noticeId ]
- GSIs: [- status-publishAt-index (status / publishAt)
         - authorId-createdAt-index (authorId / createdAt)
         - department-targetYear-index (department / targetYear) ]

### Attachments
- Table name: [Attachments ]
- Partition key: [	attachmentId ]

### Acknowledgements
- Table name: [Acknowledgements ]
- Partition key: [acknowledgementId ]
- GSIs: [	noticeId-index ]

### Notifications
- Table name: [Notifications ]
- Partition key: [	notificationId ]
- GSIs: [	userId-createdAt-index ]

---

## 4. S3 Buckets

### Documents bucket
- Bucket name: [notice-portal-documents-kavii  ]
- Public access: Blocked
- Purpose: uploaded PDFs/images for OCR

### Visuals bucket
- Bucket name: [notice-portal-visuals-kavii ]
- Public access: Blocked
- Purpose: AI-generated notice images

---

## 5. Lambda Functions
Lambda Functions
| Function name  | Purpose                        | Runtime      | Trigger                             |
| healthCheck    | Test/verify chain              | Node.js 20.x | GET /health (API GW)                |
| createNotice   | Create a new notice            | Node.js 20.x | POST /notices (API GW)              |
| getNotice      | Fetch one notice by ID         | Node.js 20.x | GET /notices/{id} (API GW)          |
| listNotices    | Fetch all notices              | Node.js 20.x | GET /notices (API GW)               |
| updateNotice   | Update an existing notice      | Node.js 20.x | PUT /notices/{id} (API GW)          |
| deleteNotice   | Delete a notice                | Node.js 20.x | DELETE /notices/{id} (API GW)       |
| getUploadUrl   | Generate secure S3 upload link | Node.js 20.x | POST /documents/upload-url (API GW) |
Lambda Functions
| extractText | BLOCKED — Textract needs account verification (SubscriptionRequiredException). Skipped for now. |
---

## 6. API Gateway

- API name: [notice-portal-api]
- API type (REST/HTTP): [HTTP API]
- API endpoint URL: [https://j9evvf520h.execute-api.ap-south-1.amazonaws.com] 

### Routes
API Gateway Routes
| Method | Path                        | Lambda function    |
| GET    | /health                     | healthCheck01      |
| POST   | /notices                    | createNotice       |
| GET    | /notices/{id}               | getNotice          |
| PUT    | /notices/{id}               | updateNotice       |
| DELETE | /notices/{id}               | deleteNotice       |
| GET    | /notices                    | listNotices        |
| POST   | /documents/upload-url       | getUploadUrl       |
| POST   | /notices/generate-from-text | generateFromText   |

Notes: create-notice-api (duplicate API, ID xxe0jrw8w6) was created accidentally
and deleted on [today's date]. Only notice-portal-api (j9evvf520h) is in use.
---

## 7. Secrets Manager
- Secret name: notice-portal/groq-api-key
- Key: GROQ_API_KEY
- Purpose: stores Groq API key securely for Lambda access
- Status: Created
---

## 8. SES / SNS

- SES verified email/domain: [ ]
- SES sandbox mode: [ Yes/No ]
- SNS topic name (if used): [ ]

---

## 9. CloudFront (later, for hosting frontend)

- Distribution ID: [ ]
- Domain: [ ]

---

## 10. Notes / gotchas
- Textract inaccessible due to account-level restriction (billing/verification issue,
  root account also affected). IAM user cannot view billing at all by default —
  this is normal AWS behavior, not a permissions misconfiguration.
- Decision: proceeding without OCR/document-upload path for now. Text-input path
  (Groq generation from typed text) is the primary feature anyway.

