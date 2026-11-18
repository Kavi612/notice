// Test runner for tests T1 - T4
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

  return data.AuthenticationResult.IdToken || data.AuthenticationResult.AccessToken;
}

async function runTests() {
  console.log("=== Logging in test accounts via Cognito ===");
  const principalToken = await loginCognito("testprincipal", "test1P@123");
  console.log("✓ Principal logged in");
  const hodToken = await loginCognito("testhod1@gmail.com", "test1H@123");
  console.log("✓ HOD logged in");
  const facultyToken = await loginCognito("testfaculty1", "test1F@123");
  console.log("✓ Faculty logged in");

  console.log("\n=== Executing Test Cases T1 - T4 ===\n");

  const results = { T1: false, T2: false, T3: false, T4: false };

  // T1: Faculty creates draft; Drafts tab shows it; Edit saves; Publish moves to Published.
  {
    console.log("[T1] Faculty draft lifecycle: create draft -> fetch in drafts -> edit -> publish");
    // 1. Create draft
    const createRes = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        title: "T1 Faculty Initial Draft",
        body: "Initial content for student announcement.",
        department: "Computer Science",
        category: "GENERAL",
        priority: "REGULAR",
        target_roles: ["STUDENT"],
        status: "DRAFT",
      }),
    });
    const createData = await createRes.json();
    const draftId = createData.notice?.id;
    console.log(`     Draft created: status=${createRes.status}, id=${draftId}, notice_status=${createData.notice?.status}`);

    // 2. Fetch via scope=my (Drafts view)
    const listRes = await fetch(`${BASE_URL}?scope=my`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const listData = await listRes.json();
    const inDrafts = listData.notices?.some((n) => n.id === draftId && n.status === "DRAFT");
    console.log(`     Present in Faculty 'scope=my' drafts list: ${inDrafts}`);

    // 3. Edit draft
    const editRes = await fetch(`${BASE_URL}/${draftId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        title: "T1 Faculty Edited Draft",
        body: "Updated content for student announcement.",
        category: "GENERAL",
        target_roles: ["STUDENT"],
        status: "DRAFT",
      }),
    });
    const editData = await editRes.json();
    const isEdited = editRes.status === 200 && editData.notice?.title === "T1 Faculty Edited Draft" && editData.notice?.status === "DRAFT";
    console.log(`     Draft edited successfully: ${isEdited}`);

    // 4. Publish draft
    const pubRes = await fetch(`${BASE_URL}/${draftId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        title: "T1 Faculty Edited Draft",
        body: "Updated content for student announcement.",
        category: "GENERAL",
        target_roles: ["STUDENT"],
        status: "PUBLISHED",
      }),
    });
    const pubData = await pubRes.json();
    const isPublished = pubRes.status === 200 && pubData.notice?.status === "PUBLISHED";
    console.log(`     Notice published: ${isPublished}`);

    // 5. Check in published list
    const finalListRes = await fetch(`${BASE_URL}?scope=my`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const finalListData = await finalListRes.json();
    const inPublished = finalListData.notices?.some((n) => n.id === draftId && n.status === "PUBLISHED");
    console.log(`     Present as PUBLISHED in 'scope=my': ${inPublished}`);

    results.T1 = Boolean(draftId && inDrafts && isEdited && isPublished && inPublished);
    console.log(`     Result: ${results.T1 ? "PASS" : "FAIL"}\n`);
  }

  // T2: HOD creates draft; Drafts tab shows it; Drafts dashboard card opens Drafts tab.
  let hodDraftId = null;
  {
    console.log("[T2] HOD creates draft; Drafts tab shows it");
    const createRes = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hodToken}`,
      },
      body: JSON.stringify({
        title: "T2 HOD Department Draft",
        body: "Draft policy notes for departmental review.",
        department: "Computer Science",
        category: "GENERAL",
        priority: "REGULAR",
        target_roles: ["FACULTY", "STUDENT"],
        status: "DRAFT",
      }),
    });
    const createData = await createRes.json();
    hodDraftId = createData.notice?.id;
    console.log(`     HOD draft created: status=${createRes.status}, id=${hodDraftId}`);

    const listRes = await fetch(`${BASE_URL}?scope=my`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const listData = await listRes.json();
    const inHodDrafts = listData.notices?.some((n) => n.id === hodDraftId && n.status === "DRAFT");
    console.log(`     Present in HOD 'scope=my' drafts list: ${inHodDrafts}`);

    results.T2 = Boolean(createRes.status === 201 && inHodDrafts);
    console.log(`     Result: ${results.T2 ? "PASS" : "FAIL"}\n`);
  }

  // T3: Principal publishes notice targeting HOD; HOD Received list displays it after refresh.
  {
    console.log("[T3] Principal publishes notice targeting HOD; HOD Received inbox displays it");
    const pubRes = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        title: "T3 Principal Circular to HODs",
        body: "Annual academic curriculum review meeting schedule.",
        department: "Office of the Principal",
        category: "GENERAL",
        priority: "URGENT",
        target_roles: ["HOD"],
        status: "PUBLISHED",
      }),
    });
    const pubData = await pubRes.json();
    const noticeId = pubData.notice?.id;
    console.log(`     Principal notice created & published: status=${pubRes.status}, id=${noticeId}`);

    // HOD fetches inbox (GET /api/notices)
    const inboxRes = await fetch(BASE_URL, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const inboxData = await inboxRes.json();
    const inInbox = inboxData.notices?.some((n) => n.id === noticeId);
    console.log(`     Present in HOD Received list (inbox): ${inInbox}`);

    results.T3 = Boolean(noticeId && inInbox);
    console.log(`     Result: ${results.T3 ? "PASS" : "FAIL"}\n`);
  }

  // T4: Faculty Drafts tab does not show HOD drafts.
  {
    console.log("[T4] Faculty Drafts tab does not show HOD drafts");
    const facRes = await fetch(`${BASE_URL}?scope=my`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const facData = await facRes.json();
    const hodDraftInFac = facData.notices?.some((n) => n.id === hodDraftId);
    console.log(`     HOD draft (${hodDraftId}) visible in Faculty scope=my: ${hodDraftInFac} (Expected false)`);

    results.T4 = Boolean(!hodDraftInFac);
    console.log(`     Result: ${results.T4 ? "PASS" : "FAIL"}\n`);
  }

  console.log("=== FINAL RESULTS ===");
  console.log(`T1: ${results.T1 ? "PASS" : "FAIL"}`);
  console.log(`T2: ${results.T2 ? "PASS" : "FAIL"}`);
  console.log(`T3: ${results.T3 ? "PASS" : "FAIL"}`);
  console.log(`T4: ${results.T4 ? "PASS" : "FAIL"}`);
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
