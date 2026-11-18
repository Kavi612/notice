# Manual AWS Lambda Code Upload & Configuration Guide

This guide provides the exact steps to manually upload the updated Node.js 24.x notice handlers to the existing AWS Lambda functions in the `ap-south-1` region, configure route authorization in API Gateway (`j9evvf520h`), and perform rollback if needed.

---

## 1. Five Notice Lambda Functions Code Upload

All zip files are located in `notice-portal-backend/dist/`. Each archive contains `index.mjs` at the root exporting `handler` from `./src/handlers/<name>.mjs`, with no wrapper folders.

### 1.1 `createNotice`
- **Console Function Name**: `createNotice`
- **Zip Archive to Upload**: `notice-portal-backend/dist/createNotice.zip`
- **Runtime Verification**: `nodejs24.x` (Architecture: `arm64` or `x86_64`)
- **Handler Setting**: `index.handler`
- **Console Navigation Path**:
  1. Go to AWS Console > **AWS Lambda** > **Functions** > click **`createNotice`**.
  2. Under the **Code** tab, click **Upload from** (dropdown on the right) > select **.zip file**.
  3. Click **Upload**, choose `notice-portal-backend/dist/createNotice.zip`, and click **Save**.
  4. Scroll down to **Runtime settings** and verify **Handler** is set to `index.handler` and **Runtime** is `Node.js 24.x`.
- **Test Event (HTTP API v2.0 Payload)**:
  - In the Lambda console, click the **Test** tab.
  - Event name: `CreateNoticeHodTest`
  - Paste the following Event JSON and click **Test**:
```json
{
  "version": "2.0",
  "routeKey": "POST /notices",
  "rawPath": "/notices",
  "rawQueryString": "",
  "headers": {
    "content-type": "application/json"
  },
  "requestContext": {
    "http": {
      "method": "POST",
      "path": "/notices",
      "protocol": "HTTP/1.1",
      "sourceIp": "127.0.0.1",
      "userAgent": "console-test"
    },
    "authorizer": {
      "jwt": {
        "claims": {
          "sub": "2455956a-1011-700d-9b51-7ef3f24bf71b",
          "cognito:username": "testhod1@gmail.com",
          "email": "testhod1@gmail.com",
          "name": "Head of Department",
          "cognito:groups": ["HOD"]
        }
      }
    }
  },
  "body": "{\"title\":\"Department Notice Test\",\"body\":\"Testing createNotice Lambda from console.\",\"target_roles\":[\"FACULTY\"],\"department\":\"Computer Science\",\"priority\":\"REGULAR\"}",
  "isBase64Encoded": false
}
```
  - **Expected Result**: Status `201` with created notice object.

---

### 1.2 `listNotices`
- **Console Function Name**: `listNotices`
- **Zip Archive to Upload**: `notice-portal-backend/dist/listNotices.zip`
- **Runtime Verification**: `nodejs24.x`
- **Handler Setting**: `index.handler`
- **Console Navigation Path**:
  1. Go to AWS Console > **AWS Lambda** > **Functions** > click **`listNotices`**.
  2. Under the **Code** tab, click **Upload from** > **.zip file**.
  3. Upload `notice-portal-backend/dist/listNotices.zip` and click **Save**.
  4. Verify **Runtime settings**: Handler `index.handler`, Runtime `Node.js 24.x`.
- **Test Event (HTTP API v2.0 Payload)**:
  - In the Lambda console, click the **Test** tab.
  - Event name: `ListNoticesStudentTest`
  - Paste the following Event JSON and click **Test**:
```json
{
  "version": "2.0",
  "routeKey": "GET /notices",
  "rawPath": "/notices",
  "rawQueryString": "",
  "headers": {},
  "requestContext": {
    "http": {
      "method": "GET",
      "path": "/notices",
      "protocol": "HTTP/1.1",
      "sourceIp": "127.0.0.1",
      "userAgent": "console-test"
    },
    "authorizer": {
      "jwt": {
        "claims": {
          "sub": "9b12a84c-2041-700d-8a12-8ef3f24bf72c",
          "cognito:username": "teststudent1",
          "email": "teststudent1@example.com",
          "name": "Test Student",
          "cognito:groups": ["STUDENT"]
        }
      }
    }
  },
  "isBase64Encoded": false
}
```
  - **Expected Result**: Status `200` with array of sanitized notices (no `target_roles`, `author_id`, `author_role`, `status`).

---

### 1.3 `getNotice`
- **Console Function Name**: `getNotice`
- **Zip Archive to Upload**: `notice-portal-backend/dist/getNotice.zip`
- **Runtime Verification**: `nodejs24.x`
- **Handler Setting**: `index.handler`
- **Console Navigation Path**:
  1. Go to AWS Console > **AWS Lambda** > **Functions** > click **`getNotice`**.
  2. Under the **Code** tab, click **Upload from** > **.zip file**.
  3. Upload `notice-portal-backend/dist/getNotice.zip` and click **Save**.
  4. Verify **Runtime settings**: Handler `index.handler`, Runtime `Node.js 24.x`.
- **Test Event (HTTP API v2.0 Payload)**:
  - In the Lambda console, click the **Test** tab.
  - Event name: `GetNoticeByIdTest`
  - Paste the following Event JSON (replace `sample-notice-id` with an existing notice ID or test non-existent for 404):
```json
{
  "version": "2.0",
  "routeKey": "GET /notices/{id}",
  "rawPath": "/notices/non-existent-test-id",
  "rawQueryString": "",
  "pathParameters": {
    "id": "non-existent-test-id"
  },
  "headers": {},
  "requestContext": {
    "http": {
      "method": "GET",
      "path": "/notices/non-existent-test-id",
      "protocol": "HTTP/1.1",
      "sourceIp": "127.0.0.1",
      "userAgent": "console-test"
    },
    "authorizer": {
      "jwt": {
        "claims": {
          "sub": "2455956a-1011-700d-9b51-7ef3f24bf71b",
          "cognito:username": "testhod1@gmail.com",
          "email": "testhod1@gmail.com",
          "name": "Head of Department",
          "cognito:groups": ["HOD"]
        }
      }
    }
  },
  "isBase64Encoded": false
}
```
  - **Expected Result**: Status `404` for non-existent notice or `200` with notice details for an existing notice.

---

### 1.4 `updateNotice`
- **Console Function Name**: `updateNotice`
- **Zip Archive to Upload**: `notice-portal-backend/dist/updateNotice.zip`
- **Runtime Verification**: `nodejs24.x`
- **Handler Setting**: `index.handler`
- **Console Navigation Path**:
  1. Go to AWS Console > **AWS Lambda** > **Functions** > click **`updateNotice`**.
  2. Under the **Code** tab, click **Upload from** > **.zip file**.
  3. Upload `notice-portal-backend/dist/updateNotice.zip` and click **Save**.
  4. Verify **Runtime settings**: Handler `index.handler`, Runtime `Node.js 24.x`.
- **Test Event (HTTP API v2.0 Payload)**:
  - In the Lambda console, click the **Test** tab.
  - Event name: `UpdateNoticeNonAuthor403Test`
  - Paste the following Event JSON:
```json
{
  "version": "2.0",
  "routeKey": "PUT /notices/{id}",
  "rawPath": "/notices/test-notice-id",
  "rawQueryString": "",
  "pathParameters": {
    "id": "test-notice-id"
  },
  "headers": {
    "content-type": "application/json"
  },
  "requestContext": {
    "http": {
      "method": "PUT",
      "path": "/notices/test-notice-id",
      "protocol": "HTTP/1.1",
      "sourceIp": "127.0.0.1",
      "userAgent": "console-test"
    },
    "authorizer": {
      "jwt": {
        "claims": {
          "sub": "different-user-sub-00000000",
          "cognito:username": "otherfaculty",
          "email": "other@example.com",
          "name": "Other Faculty",
          "cognito:groups": ["FACULTY"]
        }
      }
    }
  },
  "body": "{\"title\":\"Unauthorized Modification Attempt\"}",
  "isBase64Encoded": false
}
```
  - **Expected Result**: Status `404` (if notice does not exist) or `403 Forbidden` (if caller is not the author).

---

### 1.5 `deleteNotice`
- **Console Function Name**: `deleteNotice`
- **Zip Archive to Upload**: `notice-portal-backend/dist/deleteNotice.zip`
- **Runtime Verification**: `nodejs24.x`
- **Handler Setting**: `index.handler`
- **Console Navigation Path**:
  1. Go to AWS Console > **AWS Lambda** > **Functions** > click **`deleteNotice`**.
  2. Under the **Code** tab, click **Upload from** > **.zip file**.
  3. Upload `notice-portal-backend/dist/deleteNotice.zip` and click **Save**.
  4. Verify **Runtime settings**: Handler `index.handler`, Runtime `Node.js 24.x`.
- **Test Event (HTTP API v2.0 Payload)**:
  - In the Lambda console, click the **Test** tab.
  - Event name: `DeleteNoticeTest`
  - Paste the following Event JSON:
```json
{
  "version": "2.0",
  "routeKey": "DELETE /notices/{id}",
  "rawPath": "/notices/test-notice-id",
  "rawQueryString": "",
  "pathParameters": {
    "id": "test-notice-id"
  },
  "headers": {},
  "requestContext": {
    "http": {
      "method": "DELETE",
      "path": "/notices/test-notice-id",
      "protocol": "HTTP/1.1",
      "sourceIp": "127.0.0.1",
      "userAgent": "console-test"
    },
    "authorizer": {
      "jwt": {
        "claims": {
          "sub": "non-author-sub-9999",
          "cognito:username": "nonauthor",
          "email": "nonauthor@example.com",
          "name": "Non Author",
          "cognito:groups": ["STUDENT"]
        }
      }
    }
  },
  "isBase64Encoded": false
}
```
  - **Expected Result**: Status `404` (if notice does not exist) or `403 Forbidden` (if caller is not author).

---

## 2. API Gateway Authorization Changes (Console, not code)

Navigate to **API Gateway** > **APIs** > **`notice-portal-api` (`j9evvf520h`)** > click **Routes** in the left sidebar.

Attach the existing JWT authorizer (`noticePortalAuthorizer`, ID: `97qkpi`) to the following four routes:

### 2.1 `GET /notices`
1. Under **Routes**, click `GET /notices`.
2. In the route details pane on the right, click **Attach authorization**.
3. Under **Authorizer**, select the existing JWT authorizer: **`noticePortalAuthorizer` (`97qkpi`)**.
4. Click **Attach authorizer**.

### 2.2 `GET /notices/{id}`
1. Under **Routes**, click `GET /notices/{id}`.
2. Click **Attach authorization**.
3. Select **`noticePortalAuthorizer` (`97qkpi`)**.
4. Click **Attach authorizer**.

### 2.3 `POST /notices/{id}/publish`
1. Under **Routes**, click `POST /notices/{id}/publish`.
2. Click **Attach authorization**.
3. Select **`noticePortalAuthorizer` (`97qkpi`)**.
4. Click **Attach authorizer**.

### 2.4 `POST /notices/{id}/read`
1. Under **Routes**, click `POST /notices/{id}/read`.
2. Click **Attach authorization**.
3. Select **`noticePortalAuthorizer` (`97qkpi`)**.
4. Click **Attach authorizer**.

### Frontend Authorization Audit (`noticeApi.ts`)
After attaching the JWT authorizer, API Gateway requires every request to these routes to include an `Authorization: Bearer <token>` header. 

Here is the current state of frontend notice calls in `frontend/src/lib/noticeApi.ts`:
- **Calls that ALREADY send `Authorization: Bearer <accessToken>`**:
  - `createDepartmentNotice(data, accessToken)` &rarr; `POST /notices` (Sends token)
  - `listDepartmentNotices(accessToken)` &rarr; `GET /notices` (Sends token)
  - `listPrincipalNotices(accessToken)` &rarr; `GET /notices?scope=my` (Sends token)
  - `listAuthoredNotices(accessToken)` &rarr; `GET /notices?scope=my` (Sends token)
  - `getDepartmentNoticeById(id, accessToken)` &rarr; `GET /notices/{id}` (Sends token)
  - `updateDepartmentNotice(id, data, accessToken)` &rarr; `PUT /notices/{id}` (Sends token)
  - `publishDepartmentNotice(notice, accessToken)` &rarr; `PUT /notices/{id}` (Sends token)
  - `deleteDepartmentNotice(id, accessToken)` &rarr; `DELETE /notices/{id}` (Sends token)
  - `publishNoticeById(noticeId, accessToken)` &rarr; `POST /notices/{id}/publish` (Sends token)

- **Calls that DO NOT currently send `Authorization` (Action Required if used)**:
  - `listNotices()` (line 226): Currently makes unauthenticated `fetch(`${API_BASE_URL}/notices`)`. Used only on the legacy archive route (`AdminRouteAdapters.tsx:270`).
  - `getNoticeById(noticeId)` (line 239): Currently makes unauthenticated `fetch(`${API_BASE_URL}/notices/${noticeId}`)`.
  - `markNoticeAsRead(noticeId, userId)` (line 448): Currently makes unauthenticated `fetch(`${API_BASE_URL}/notices/${noticeId}/read`)`. Called in `StudentRouteAdapters.tsx:192`.

---

## 3. Rollback Procedures

If any unexpected issues occur, restore the previous live function code using the backup archives saved in `notice-portal-backend/backups/`:

| Function | Backup File Location |
| :--- | :--- |
| `createNotice` | `notice-portal-backend/backups/createNotice-2026-11-18.zip` |
| `listNotices` | `notice-portal-backend/backups/listNotices-2026-11-18.zip` |
| `getNotice` | `notice-portal-backend/backups/getNotice-2026-11-18.zip` |
| `updateNotice` | `notice-portal-backend/backups/updateNotice-2026-11-18.zip` |
| `deleteNotice` | `notice-portal-backend/backups/deleteNotice-2026-11-18.zip` |

### Rollback Steps (per function)
1. Go to AWS Console > **AWS Lambda** > **Functions** > click the function name.
2. Under the **Code** tab, click **Upload from** > **.zip file**.
3. Choose the corresponding `.zip` from `notice-portal-backend/backups/`.
4. Click **Save**.
5. If route authorizers need to be detached in API Gateway:
   - Go to **API Gateway** > **`j9evvf520h`** > **Routes**.
   - Click the route (e.g. `GET /notices`) > Click **Edit** or click on authorization > Select **None** > Save.

---

## 4. Do Not Touch Checklist

Do **NOT** alter, reconfigure, or delete any of the following infrastructure components:

- **Remaining 11 Lambda Functions**:
  1. `healthCheck01` (`GET /health`)
  2. `getUploadUrl` (`POST /documents/upload-url`)
  3. `extractText` (`POST /documents/extract`)
  4. `publishNotice` (`POST /notices/{id}/publish`)
  5. `markRead` (`POST /notices/{id}/read`)
  6. `acknowledge` (`POST /notices/{id}/acknowledge`)
  7. `generateFromText` (`POST /notices/generate-from-text`)
  8. `generateVisual` (`POST /notices/generate-visual`)
  9. `manageUsers` (`GET /admin/users`, `POST /admin/users`)
  10. `getAnalytics` (`GET /admin/analytics`)
  11. `sendNotification`
- **DynamoDB**:
  - Table name: **`Notices`** (Primary Partition Key: `noticeId`)
  - Global Secondary Indexes (GSIs):
    - `authorId-createdAt-index`
    - `department-targetYear-index`
    - `status-publishAt-index`
  - Existing items/records in `Notices`.
- **Cognito**:
  - User Pool: `ap-south-1_a2KkiKxyL`
  - App Client: `vg03lfv1edc7gq2s9ncjhrn9j`
- **API Gateway**:
  - HTTP API: `j9evvf520h`
  - JWT Authorizer: `noticePortalAuthorizer` (ID: `97qkpi`, Issuer: `https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_a2KkiKxyL`)
- **IAM**:
  - Execution roles attached to Lambda functions (e.g. `service-role/createNotice-role-yfogbwsw`, etc.).
