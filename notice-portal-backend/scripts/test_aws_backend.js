// Test runner for AWS Serverless Backend (API Gateway j9evvf520h + DynamoDB Notices)
// Tests: A1 to A9 + Health check

const COGNITO_REGION = "ap-south-1";
const COGNITO_CLIENT_ID = "vg03lfv1edc7gq2s9ncjhrn9j";
const API_BASE_URL = (
  process.env.API_BASE_URL ||
  "https://j9evvf520h.execute-api.ap-south-1.amazonaws.com"
).replace(/\/+$/, "");

const NOTICES_URL = `${API_BASE_URL}/notices`;
const HEALTH_URL = `${API_BASE_URL}/health`;

async function loginCognito(username, password) {
  const url = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.AuthenticationResult) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(data)}`);
  }

  // Return IdToken which matches the API Gateway Cognito Authorizer Audience
  return data.AuthenticationResult.IdToken;
}

async function runTests() {
  console.log("==================================================");
  console.log("AWS Serverless Backend Verification Suite (A1 - A9 + Health)");
  console.log(`Endpoint: ${API_BASE_URL}`);
  console.log("==================================================\n");

  console.log("=== Authenticating test accounts via Cognito ===");
  const principalToken = await loginCognito("testprincipal", "test1P@123");
  console.log("✓ Principal authenticated");
  const hodToken = await loginCognito("testhod1@gmail.com", "test1H@123");
  console.log("✓ HOD authenticated");
  const facultyToken = await loginCognito("testfaculty1", "test1F@123");
  console.log("✓ Faculty authenticated");
  const studentToken = await loginCognito("teststudent1", "test1S@123");
  console.log("✓ Student authenticated\n");

  const results = [];
  let hodDraftId = null;

  // Health Check: GET /health
  {
    console.log("--- [Health] Checking GET /health ---");
    const res = await fetch(HEALTH_URL);
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && (data.status === "ok" || data.message || res.ok);
    results.push({ test: "Health", desc: "GET /health returns ok", pass, status: res.status });
    console.log(`Status: ${res.status} (Expected 200)`);
    console.log(`Body: ${JSON.stringify(data)}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A1: HOD creates notice targeting Faculty -> 201
  {
    console.log("--- [A1] HOD creates notice targeting Faculty ---");
    const res = await fetch(NOTICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hodToken}`,
      },
      body: JSON.stringify({
        title: "A1: HOD notice for Faculty",
        body: "Department faculty meeting scheduled for Friday at 3 PM.",
        department: "Computer Science",
        category: "GENERAL",
        priority: "REGULAR",
        target_roles: ["FACULTY"],
        status: "PUBLISHED",
      }),
    });
    const data = await res.json().catch(() => ({}));
    const notice = data.notice || data;
    const pass = res.status === 201 && Boolean(notice.id || notice.noticeId);
    results.push({ test: "A1", desc: "HOD creates to FACULTY: 201", pass, status: res.status });
    console.log(`Status: ${res.status} (Expected 201)`);
    console.log(`Notice ID: ${notice.id || notice.noticeId}, Role: ${notice.author_role || notice.authorRole}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A2: HOD creates notice targeting HOD -> 400
  {
    console.log("--- [A2] HOD creates notice targeting HOD ---");
    const res = await fetch(NOTICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hodToken}`,
      },
      body: JSON.stringify({
        title: "A2: Invalid HOD target by HOD",
        body: "This should fail because HOD cannot target HOD.",
        target_roles: ["HOD"],
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 400;
    results.push({ test: "A2", desc: "HOD creates to HOD: 400", pass, status: res.status });
    console.log(`Status: ${res.status} (Expected 400)`);
    console.log(`Message: ${data.message || data.error}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A3: Faculty creates notice targeting Students -> 201
  {
    console.log("--- [A3] Faculty creates notice targeting Students ---");
    const res = await fetch(NOTICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        title: "A3: Faculty notice for Students",
        body: "Lab assignment submission deadline extended to Sunday midnight.",
        department: "Computer Science",
        category: "GENERAL",
        priority: "REGULAR",
        target_roles: ["STUDENT"],
        status: "PUBLISHED",
      }),
    });
    const data = await res.json().catch(() => ({}));
    const notice = data.notice || data;
    const pass = res.status === 201 && Boolean(notice.id || notice.noticeId);
    results.push({ test: "A3", desc: "FACULTY creates to STUDENT: 201", pass, status: res.status });
    console.log(`Status: ${res.status} (Expected 201)`);
    console.log(`Notice ID: ${notice.id || notice.noticeId}, Role: ${notice.author_role || notice.authorRole}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A4: Faculty creates notice targeting Faculty -> 400
  {
    console.log("--- [A4] Faculty creates notice targeting Faculty ---");
    const res = await fetch(NOTICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        title: "A4: Invalid Faculty target by Faculty",
        body: "This should fail because Faculty can only target Students.",
        target_roles: ["FACULTY"],
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 400;
    results.push({ test: "A4", desc: "FACULTY creates to FACULTY: 400", pass, status: res.status });
    console.log(`Status: ${res.status} (Expected 400)`);
    console.log(`Message: ${data.message || data.error}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A5: Student attempts to create -> 403
  {
    console.log("--- [A5] Student attempts to create notice ---");
    const res = await fetch(NOTICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "A5: Unauthorized Student notice",
        body: "Student should not be allowed to create notice.",
        target_roles: ["STUDENT"],
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 403;
    results.push({ test: "A5", desc: "STUDENT create: 403", pass, status: res.status });
    console.log(`Status: ${res.status} (Expected 403)`);
    console.log(`Message: ${data.message || data.error}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A6: Student GET /notices returns sanitized objects (no target_roles, author_id, author_role, status)
  {
    console.log("--- [A6] Student GET: no target_roles, author_id, author_role, status ---");
    const res = await fetch(NOTICES_URL, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    const notices = data.notices || [];
    let isSanitized = true;
    let forbiddenField = null;

    for (const n of notices) {
      if ("target_roles" in n || "targetRoles" in n) forbiddenField = "target_roles";
      if ("author_id" in n || "authorId" in n) forbiddenField = "author_id";
      if ("author_role" in n || "authorRole" in n) forbiddenField = "author_role";
      if ("status" in n) forbiddenField = "status";
      if (forbiddenField) {
        isSanitized = false;
        break;
      }
    }

    const pass = res.status === 200 && isSanitized;
    results.push({ test: "A6", desc: "STUDENT GET sanitized", pass, status: res.status });
    console.log(`Status: ${res.status} (Expected 200)`);
    console.log(`Returned notices count: ${notices.length}`);
    console.log(`Forbidden field detected: ${forbiddenField || "None (clean)"}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A7: HOD draft hidden from FACULTY: not in list, 403 by ID
  {
    console.log("--- [A7] HOD draft hidden from FACULTY ---");
    // Create HOD draft
    const draftRes = await fetch(NOTICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hodToken}`,
      },
      body: JSON.stringify({
        title: "A7: Confidential HOD Draft Notice",
        body: "Draft content only visible to author until published.",
        department: "Computer Science",
        category: "GENERAL",
        priority: "REGULAR",
        target_roles: ["FACULTY"],
        status: "DRAFT",
      }),
    });
    const draftData = await draftRes.json().catch(() => ({}));
    const draftNotice = draftData.notice || draftData;
    hodDraftId = draftNotice.id || draftNotice.noticeId;

    // Faculty lists notices - draft must NOT appear
    const listRes = await fetch(NOTICES_URL, {
      headers: {
        Authorization: `Bearer ${facultyToken}`,
      },
    });
    const listData = await listRes.json().catch(() => ({}));
    const facultyNotices = listData.notices || [];
    const draftInList = facultyNotices.some(
      (n) => String(n.id || n.noticeId) === String(hodDraftId),
    );

    // Faculty attempts to GET draft by ID -> 403
    const getRes = await fetch(`${NOTICES_URL}/${encodeURIComponent(hodDraftId)}`, {
      headers: {
        Authorization: `Bearer ${facultyToken}`,
      },
    });
    const getData = await getRes.json().catch(() => ({}));

    const pass = !draftInList && getRes.status === 403;
    results.push({ test: "A7", desc: "HOD draft hidden from FACULTY", pass, status: getRes.status });
    console.log(`HOD draft ID: ${hodDraftId}`);
    console.log(`Draft in Faculty list: ${draftInList ? "YES (FAIL)" : "NO (PASS)"}`);
    console.log(`Faculty GET draft by ID status: ${getRes.status} (Expected 403)`);
    console.log(`Faculty GET message: ${getData.message || getData.error}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A8: Author updates draft: 200; non-author: 403
  {
    console.log("--- [A8] Author updates draft: 200; non-author: 403 ---");
    // Non-author (Faculty) tries to update HOD's draft -> 403
    const facultyUpdateRes = await fetch(`${NOTICES_URL}/${encodeURIComponent(hodDraftId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        title: "Malicious Edit by Faculty",
      }),
    });
    const facultyUpdateData = await facultyUpdateRes.json().catch(() => ({}));

    // Author (HOD) updates their draft -> 200
    const authorUpdateRes = await fetch(`${NOTICES_URL}/${encodeURIComponent(hodDraftId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hodToken}`,
      },
      body: JSON.stringify({
        title: "A8: Updated HOD Draft Notice Title",
        body: "Updated draft body content by author.",
      }),
    });
    const authorUpdateData = await authorUpdateRes.json().catch(() => ({}));

    const nonAuthorBlocked = facultyUpdateRes.status === 403;
    const authorUpdated = authorUpdateRes.status === 200;
    const pass = nonAuthorBlocked && authorUpdated;
    results.push({
      test: "A8",
      desc: "Author updates draft: 200; non-author: 403",
      pass,
      status: `NonAuthor: ${facultyUpdateRes.status}, Author: ${authorUpdateRes.status}`,
    });
    console.log(`Non-author update status: ${facultyUpdateRes.status} (Expected 403)`);
    console.log(`Non-author message: ${facultyUpdateData.message || facultyUpdateData.error}`);
    console.log(`Author update status: ${authorUpdateRes.status} (Expected 200)`);
    console.log(`Author updated title: ${(authorUpdateData.notice || authorUpdateData).title}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A9: Principal publishes to HOD: HOD list shows it
  {
    console.log("--- [A9] Principal publishes to HOD: HOD list shows it ---");
    // Principal creates a notice targeting HOD
    const principalCreateRes = await fetch(NOTICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        title: "A9: Principal Directive to Department Heads",
        body: "All Department Heads are requested to submit the semester plan by Monday.",
        department: "Administration",
        category: "GENERAL",
        priority: "URGENT",
        target_roles: ["HOD"],
        status: "PUBLISHED",
      }),
    });
    const principalCreateData = await principalCreateRes.json().catch(() => ({}));
    const principalNotice = principalCreateData.notice || principalCreateData;
    const principalNoticeId = principalNotice.id || principalNotice.noticeId;

    // HOD lists notices -> published notice must appear in HOD list
    const hodListRes = await fetch(NOTICES_URL, {
      headers: {
        Authorization: `Bearer ${hodToken}`,
      },
    });
    const hodListData = await hodListRes.json().catch(() => ({}));
    const hodNotices = hodListData.notices || [];
    const foundInHodList = hodNotices.some(
      (n) => String(n.id || n.noticeId) === String(principalNoticeId),
    );

    const pass = principalCreateRes.status === 201 && Boolean(principalNoticeId) && foundInHodList;
    results.push({
      test: "A9",
      desc: "Principal publishes to HOD: HOD list shows it",
      pass,
      status: `Create: ${principalCreateRes.status}, HODFound: ${foundInHodList}`,
    });
    console.log(`Principal create status: ${principalCreateRes.status} (Expected 201)`);
    console.log(`Principal Notice ID: ${principalNoticeId}`);
    console.log(`Found in HOD inbox: ${foundInHodList ? "YES (PASS)" : "NO (FAIL)"}`);
    console.log(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // Summary
  console.log("==================================================");
  console.log("Test Summary (A1 - A9 + Health)");
  console.log("==================================================");
  let allPassed = true;
  for (const r of results) {
    console.log(`  ${r.pass ? "✓ PASS" : "✗ FAIL"} [${r.test}] ${r.desc} (${r.status})`);
    if (!r.pass) allPassed = false;
  }
  console.log("==================================================");
  console.log(allPassed ? "ALL TESTS PASSED!" : "SOME TESTS FAILED!");
  console.log("==================================================");

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
