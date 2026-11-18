// Test runner for tests A1 - A7
const COGNITO_REGION = "ap-south-1";
const COGNITO_CLIENT_ID = "vg03lfv1edc7gq2s9ncjhrn9j";
const BASE_URL = "http://localhost:5000/api/notices";

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

  // Return AccessToken or IdToken (backend supports both)
  return data.AuthenticationResult.IdToken || data.AuthenticationResult.AccessToken;
}

async function runTests() {
  console.log("=== Logging in test accounts via Cognito ===");
  const hodToken = await loginCognito("testhod1@gmail.com", "test1H@123");
  console.log("✓ HOD logged in");
  const facultyToken = await loginCognito("testfaculty1", "test1F@123");
  console.log("✓ Faculty logged in");
  const studentToken = await loginCognito("teststudent1", "test1S@123");
  console.log("✓ Student logged in");

  let hodDraftId = null;

  console.log("\n=== Executing Test Cases A1 - A7 ===\n");

  // A1: HOD creates notice targeting Faculty -> 201
  {
    const res = await fetch(BASE_URL, {
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
    const data = await res.json();
    const pass = res.status === 201 && data.notice?.id;
    console.log(`[A1] HOD creates notice targeting Faculty:`);
    console.log(`     Status: ${res.status} (Expected 201)`);
    console.log(`     Response notice id: ${data.notice?.id}, author_role: ${data.notice?.author_role}`);
    console.log(`     Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A2: HOD creates notice targeting HOD -> 400
  {
    const res = await fetch(BASE_URL, {
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
    const data = await res.json();
    const pass = res.status === 400;
    console.log(`[A2] HOD creates notice targeting HOD:`);
    console.log(`     Status: ${res.status} (Expected 400)`);
    console.log(`     Message: ${data.message || data.error}`);
    console.log(`     Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A3: Faculty creates notice targeting Students -> 201
  {
    const res = await fetch(BASE_URL, {
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
    const data = await res.json();
    const pass = res.status === 201 && data.notice?.id;
    console.log(`[A3] Faculty creates notice targeting Students:`);
    console.log(`     Status: ${res.status} (Expected 201)`);
    console.log(`     Response notice id: ${data.notice?.id}, author_role: ${data.notice?.author_role}`);
    console.log(`     Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A4: Faculty creates notice targeting Faculty -> 400
  {
    const res = await fetch(BASE_URL, {
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
    const data = await res.json();
    const pass = res.status === 400;
    console.log(`[A4] Faculty creates notice targeting Faculty:`);
    console.log(`     Status: ${res.status} (Expected 400)`);
    console.log(`     Message: ${data.message || data.error}`);
    console.log(`     Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A5: Student attempts to create -> 403
  {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "A5: Unauthorized Student notice",
        body: "Student should not be able to create notice.",
        target_roles: ["STUDENT"],
      }),
    });
    const data = await res.json();
    const pass = res.status === 403;
    console.log(`[A5] Student attempts to create notice:`);
    console.log(`     Status: ${res.status} (Expected 403)`);
    console.log(`     Message: ${data.message || data.error}`);
    console.log(`     Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A6: Student GET /api/notices returns sanitized objects without target_roles, author_id, author_role, status
  {
    const res = await fetch(BASE_URL, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    const data = await res.json();
    const notices = data.notices || [];
    let isSanitized = notices.length > 0;
    let forbiddenFieldFound = null;

    for (const n of notices) {
      if ("target_roles" in n) forbiddenFieldFound = "target_roles";
      if ("author_id" in n) forbiddenFieldFound = "author_id";
      if ("author_role" in n) forbiddenFieldFound = "author_role";
      if ("status" in n) forbiddenFieldFound = "status";
      if (forbiddenFieldFound) {
        isSanitized = false;
        break;
      }
    }

    const sampleNotice = notices[0] || {};
    const pass = res.status === 200 && isSanitized;
    console.log(`[A6] Student GET /api/notices sanitization check:`);
    console.log(`     Status: ${res.status} (Expected 200)`);
    console.log(`     Notices count: ${notices.length}`);
    console.log(`     Sample notice keys: ${Object.keys(sampleNotice).join(", ")}`);
    console.log(`     Forbidden fields found: ${forbiddenFieldFound || "None (clean)"}`);
    console.log(`     Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  // A7: HOD draft not returned in Faculty list; Faculty GET /api/notices/:id on that draft returns 403
  {
    // First, HOD creates a draft notice targeting Faculty
    const createDraftRes = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hodToken}`,
      },
      body: JSON.stringify({
        title: "A7: Confidential HOD Draft Notice",
        body: "Confidential agenda points only visible to author until published.",
        department: "Computer Science",
        category: "GENERAL",
        priority: "REGULAR",
        target_roles: ["FACULTY"],
        status: "DRAFT",
      }),
    });
    const draftData = await createDraftRes.json();
    hodDraftId = draftData.notice?.id;

    // Faculty lists notices (should NOT contain the HOD draft)
    const listRes = await fetch(BASE_URL, {
      headers: {
        Authorization: `Bearer ${facultyToken}`,
      },
    });
    const listData = await listRes.json();
    const facultyNotices = listData.notices || [];
    const draftFoundInList = facultyNotices.some((n) => String(n.id) === String(hodDraftId));

    // Faculty tries to fetch the draft notice by ID directly -> 403
    const getRes = await fetch(`${BASE_URL}/${encodeURIComponent(hodDraftId)}`, {
      headers: {
        Authorization: `Bearer ${facultyToken}`,
      },
    });
    const getData = await getRes.json();

    const pass = !draftFoundInList && getRes.status === 403;
    console.log(`[A7] HOD draft isolation from Faculty:`);
    console.log(`     HOD draft created: id=${hodDraftId}, status=${draftData.notice?.status}`);
    console.log(`     Found in Faculty list: ${draftFoundInList ? "YES (FAILED)" : "NO (CORRECT)"}`);
    console.log(`     Faculty GET by ID status: ${getRes.status} (Expected 403)`);
    console.log(`     Faculty GET by ID message: ${getData.message || getData.error}`);
    console.log(`     Result: ${pass ? "PASS" : "FAIL"}\n`);
  }

  console.log("=== All A1 - A7 Tests Completed ===");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
