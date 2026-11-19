import { API_BASE_URL } from "@/lib/config";
import type { Notice, NoticeCategory, NoticeStatus, NoticeTemplate } from "@/types";

export const SESSION_EXPIRED_ERROR =
  "Your session expired, please log in again";

export class SessionExpiredError extends Error {
  constructor() {
    super(SESSION_EXPIRED_ERROR);
    this.name = "SessionExpiredError";
  }
}

async function parseResponseOrThrow<T = any>(
  response: Response,
  requestUrl: string,
  defaultErrorMessage = "Request failed",
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `The API at ${requestUrl} returned a web page instead of data. Check VITE_API_BASE_URL and that the backend is deployed.`,
    );
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || defaultErrorMessage);
  }
  return data as T;
}

export interface PublishedNoticeResponse {
  publishAt?: string | null;
  status?: string;
}

export async function publishNoticeById(
  noticeId: string,
  accessToken: string,
  options?: { expiresAt?: string | null; publishAt?: string | null },
): Promise<PublishedNoticeResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  const hasSchedule = Boolean(options?.publishAt || options?.expiresAt);

  if (hasSchedule) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(
    `${API_BASE_URL}/notices/${encodeURIComponent(noticeId)}/publish`,
    {
      method: "POST",
      headers,
      body: hasSchedule
        ? JSON.stringify({
          expiresAt: options?.expiresAt ?? undefined,
          publishAt: options?.publishAt ?? undefined,
        })
        : undefined,
    },
  );

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    throw new Error("Couldn't publish this notice, please try again.");
  }

  return (await response.json()) as PublishedNoticeResponse;
}

export function getPublishSuccessMessage(
  payload: PublishedNoticeResponse,
): string {
  if (payload.status === "SCHEDULED") {
    const scheduledFor = payload.publishAt
      ? new Date(payload.publishAt).toLocaleString()
      : "the scheduled time";
    return `Notice scheduled for ${scheduledFor}`;
  }

  return "Notice published";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function unwrapRecord(payload: unknown): Record<string, unknown> {
  const record = asRecord(payload);
  if (!record) {
    return {};
  }

  if (typeof record.body === "string") {
    try {
      return asRecord(JSON.parse(record.body)) ?? record;
    } catch {
      return record;
    }
  }

  const nestedBody = asRecord(record.body);
  return nestedBody ?? record;
}

function readString(
  record: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function unwrapNoticeList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const candidates = [
    record.notices,
    record.items,
    record.Items,
    record.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

const noticeStatuses: readonly NoticeStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "EXPIRED",
  "ARCHIVED",
];

const noticeCategories: readonly NoticeCategory[] = [
  "EXAMINATION",
  "WORKSHOP",
  "SEMINAR",
  "PLACEMENT",
  "SPORTS",
  "CULTURAL",
  "GENERAL",
];

function normalizeStatus(value: string): NoticeStatus {
  const status = value.trim().toUpperCase();
  return noticeStatuses.find((item) => item === status) ?? "DRAFT";
}

function normalizeCategory(value: string): NoticeCategory {
  const category = value.trim().toUpperCase();
  return noticeCategories.find((item) => item === category) ?? "GENERAL";
}

export function normalizeNotice(raw: unknown): Notice | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const noticeId = readString(record, ["noticeId", "id", "notice_id"]);
  if (!noticeId) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    noticeId,
    title: readString(record, ["title"]) || "Untitled notice",
    content: readString(record, ["content", "noticeBody", "body"]),
    authorId: readString(record, ["authorId", "author_id", "userId"]),
    department: readString(record, ["department"]) || "General",
    category: normalizeCategory(readString(record, ["category"])),
    targetYear: readString(record, ["targetYear", "target_year"]) || null,
    targetSection:
      readString(record, ["targetSection", "target_section"]) || null,
    publishAt: readString(record, ["publishAt", "publish_at"]) || null,
    expiresAt: readString(record, ["expiresAt", "expires_at"]) || null,
    status: normalizeStatus(readString(record, ["status"]) || "DRAFT"),
    template: (readString(record, ["template"]) ||
      null) as NoticeTemplate | null,
    createdAt: readString(record, ["createdAt", "created_at"]) || now,
    updatedAt: readString(record, ["updatedAt", "updated_at"]) || now,
    posterUrl:
      readString(record, [
        "posterUrl",
        "poster_url",
        "imageUrl",
        "image_url",
        "attachmentUrl",
        "attachment_url",
      ]) || null,
  };
}

export async function listNotices(accessToken: string): Promise<Notice[]> {
  const response = await fetch(`${API_BASE_URL}/notices`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    throw new Error("Couldn't load notices.");
  }

  const payload: unknown = await response.json();
  return unwrapNoticeList(payload)
    .map(normalizeNotice)
    .filter((notice): notice is Notice => notice !== null);
}

export async function getNoticeById(
  noticeId: string,
  accessToken: string,
): Promise<Notice> {
  const response = await fetch(
    `${API_BASE_URL}/notices/${encodeURIComponent(noticeId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    throw new Error("Couldn't load this notice.");
  }

  const payload: unknown = await response.json();
  const record = unwrapRecord(payload);
  const nested =
    asRecord(record.notice) ??
    asRecord(record.item) ??
    asRecord(record.data) ??
    record;
  const notice = normalizeNotice(nested) ?? normalizeNotice(payload);

  if (!notice) {
    throw new Error("Couldn't load this notice.");
  }

  return notice;
}

export function noticesForAuthor(
  notices: Notice[],
  userIds: readonly string[],
): Notice[] {
  const ids = new Set(userIds.filter((id) => id.length > 0));
  if (ids.size === 0) {
    return notices;
  }

  const owned = notices.filter((notice) => ids.has(notice.authorId));
  return owned.length > 0 ? owned : notices;
}

function toPosterFileType(file: File): string {
  if (file.type === "image/png") {
    return "image/png";
  }

  if (file.type === "application/pdf") {
    return "application/pdf";
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "png") {
    return "image/png";
  }

  if (extension === "pdf") {
    return "application/pdf";
  }

  return "image/jpeg";
}

export async function requestPosterUploadUrl(
  file: File,
): Promise<{ fileUrl: string; uploadUrl: string }> {
  const fileType = toPosterFileType(file);
  const response = await fetch(`${API_BASE_URL}/documents/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentType: fileType,
      fileName: file.name,
      fileType,
      filename: file.name,
    }),
  });

  if (!response.ok) {
    throw new Error("Couldn't start the poster upload.");
  }

  const payload = unwrapRecord(await response.json());
  const uploadUrl = readString(payload, [
    "uploadUrl",
    "upload_url",
    "url",
    "presignedUrl",
  ]);
  const fileUrl = readString(payload, [
    "fileUrl",
    "file_url",
    "downloadUrl",
    "download_url",
    "publicUrl",
    "objectUrl",
    "object_url",
  ]);
  const objectKey = readString(payload, ["key", "s3Key", "s3_key"]);

  if (!uploadUrl) {
    throw new Error("Couldn't start the poster upload.");
  }

  const resolvedFileUrl =
    fileUrl ||
    (objectKey.startsWith("http")
      ? objectKey
      : objectKey
        ? `https://notice-portal-documents-kavii.s3.ap-south-1.amazonaws.com/${objectKey}`
        : uploadUrl.split("?")[0] || uploadUrl);

  return {
    uploadUrl,
    fileUrl: resolvedFileUrl,
  };
}

export async function uploadPosterFile(file: File): Promise<string> {
  const { fileUrl, uploadUrl } = await requestPosterUploadUrl(file);
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Couldn't upload the poster.");
  }

  return fileUrl;
}

export async function updateNotice(
  noticeId: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/notices/${encodeURIComponent(noticeId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    throw new Error("Couldn't update this notice.");
  }
}

export async function archiveNotice(
  noticeId: string,
  accessToken: string,
): Promise<void> {
  try {
    await updateNotice(noticeId, accessToken, {
      status: "ARCHIVED",
    });
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      throw error;
    }

    throw new Error("Couldn't archive this notice.");
  }
}

export async function unarchiveNotice(
  noticeId: string,
  accessToken: string,
): Promise<void> {
  try {
    await updateNotice(noticeId, accessToken, {
      status: "PUBLISHED",
    });
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      throw error;
    }

    throw new Error("Couldn't unarchive this notice.");
  }
}

export async function updateNoticePoster(
  noticeId: string,
  accessToken: string,
  posterUrl: string,
): Promise<void> {
  try {
    await updateNotice(noticeId, accessToken, {
      imageUrl: posterUrl,
      posterUrl,
    });
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      throw error;
    }

    throw new Error("Couldn't attach the poster to this notice.");
  }
}

export async function markNoticeAsRead(
  noticeId: string,
  userId: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/notices/${encodeURIComponent(noticeId)}/read`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        noticeId,
        studentId: userId,
        userId,
      }),
    },
  );

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  if (!response.ok && response.status !== 409) {
    throw new Error("Couldn't mark this notice as read.");
  }
}

export interface CreateDepartmentNoticeInput {
  title: string;
  body: string;
  department?: string;
  category?: string;
  priority?: "REGULAR" | "URGENT";
  notice_date?: string;
  status?: "DRAFT" | "PUBLISHED";
  target_roles: import("@/types/notice").TargetRole[];
  author_role?: string;
  author_name?: string;
}

export interface CallerIdentity {
  userId: string;
  username: string;
  name: string;
  role: string;
  identifiers: Set<string>;
}

export function extractCallerIdentity(accessToken: string): CallerIdentity {
  const identifiers = new Set<string>();
  let userId = "";
  let username = "";
  let name = "";
  let role = "";

  // 1. Try reading storedAuth from sessionStorage (contains exact user profile and idToken)
  try {
    const rawStored = typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("notice-portal-auth")
      : null;
    if (rawStored) {
      const parsed = JSON.parse(rawStored);
      if (parsed.currentUser) {
        if (parsed.currentUser.sub) {
          userId = String(parsed.currentUser.sub).trim();
          identifiers.add(userId.toLowerCase());
        }
        if (parsed.currentUser.username) {
          username = String(parsed.currentUser.username).trim();
          identifiers.add(username.toLowerCase());
        }
        if (parsed.currentUser.role) {
          role = String(parsed.currentUser.role).toUpperCase();
        }
      }
      if (parsed.idToken && typeof parsed.idToken === "string") {
        const idParts = parsed.idToken.split(".");
        if (idParts.length === 3 && typeof idParts[1] === "string") {
          const padded = idParts[1].replace(/-/g, "+").replace(/_/g, "/");
          const padLength = (4 - (padded.length % 4)) % 4;
          const b64 = padded + "=".repeat(padLength);
          const idClaims = JSON.parse(atob(b64));
          if (idClaims.sub) identifiers.add(String(idClaims.sub).toLowerCase());
          if (idClaims["cognito:username"]) identifiers.add(String(idClaims["cognito:username"]).toLowerCase());
          if (idClaims.username) identifiers.add(String(idClaims.username).toLowerCase());
          if (idClaims.email) identifiers.add(String(idClaims.email).toLowerCase());
          if (idClaims.name && !name) name = String(idClaims.name);
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. Parse passed token (accessToken or idToken)
  try {
    const raw = accessToken.replace(/^Bearer\s+/i, "").trim();
    const parts = raw.split(".");
    if (parts.length === 3 && typeof parts[1] === "string") {
      const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padLength = (4 - (padded.length % 4)) % 4;
      const b64 = padded + "=".repeat(padLength);
      const claims = JSON.parse(atob(b64));

      if (claims.sub) {
        if (!userId) userId = String(claims.sub).trim();
        identifiers.add(String(claims.sub).toLowerCase());
      }
      if (claims["cognito:username"]) {
        if (!username) username = String(claims["cognito:username"]).trim();
        identifiers.add(String(claims["cognito:username"]).toLowerCase());
      }
      if (claims.username) {
        if (!username) username = String(claims.username).trim();
        identifiers.add(String(claims.username).toLowerCase());
      }
      if (claims.email) {
        identifiers.add(String(claims.email).toLowerCase());
      }
      if (claims.name && !name) {
        name = String(claims.name);
      }
      if (!role) {
        const rawGroups = claims["cognito:groups"] ?? [];
        if (Array.isArray(rawGroups) && rawGroups.length > 0) {
          role = String(rawGroups[0]).toUpperCase();
        } else if (claims["custom:role"]) {
          role = String(claims["custom:role"]).toUpperCase();
        }
      }
    }
  } catch {
    // ignore
  }

  if (!name) {
    name = username || "User";
  }

  return {
    userId: userId || username,
    username,
    name,
    role,
    identifiers,
  };
}

export function normalizeDepartmentNotice(
  raw: unknown,
): import("@/types/notice").DepartmentNotice {
  if (!raw || typeof raw !== "object") {
    return raw as import("@/types/notice").DepartmentNotice;
  }
  const item = (raw as Record<string, unknown>).notice ?? (raw as Record<string, unknown>).item ?? raw;
  const record = item as Record<string, unknown>;
  const id = String(record.id || record.noticeId || "");
  const body = String(record.body || record.content || "");
  const authorId = String(record.author_id || record.authorId || "");
  const authorName = String(record.author_name || record.authorName || "User");
  const authorRole = String(record.author_role || record.authorRole || "PRINCIPAL");

  // Extract target roles from target_roles, targetRoles, or fallback targetSection
  let targetRoles: import("@/types/notice").TargetRole[] = [];
  if (Array.isArray(record.target_roles) && record.target_roles.length > 0) {
    targetRoles = record.target_roles as import("@/types/notice").TargetRole[];
  } else if (Array.isArray(record.targetRoles) && record.targetRoles.length > 0) {
    targetRoles = record.targetRoles as import("@/types/notice").TargetRole[];
  } else if (typeof record.targetSection === "string" && record.targetSection.length > 0) {
    if (record.targetSection === "All" || record.targetSection === "ALL") {
      targetRoles = ["HOD", "FACULTY", "STUDENT"];
    } else {
      targetRoles = record.targetSection
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => ["HOD", "FACULTY", "STUDENT"].includes(s)) as import("@/types/notice").TargetRole[];
      if (targetRoles.length === 0) {
        targetRoles = ["HOD", "FACULTY", "STUDENT"];
      }
    }
  } else {
    targetRoles = ["HOD", "FACULTY", "STUDENT"];
  }

  const status = (record.status === "DRAFT" ? "DRAFT" : "PUBLISHED") as "DRAFT" | "PUBLISHED";
  const priority = (record.priority === "URGENT" ? "URGENT" : "REGULAR") as "REGULAR" | "URGENT";
  const category = String(record.category || "GENERAL");
  const now = new Date().toISOString();
  const noticeDate = String(record.notice_date || record.noticeDate || record.createdAt || now);
  const createdAt = String(record.created_at || record.createdAt || now);
  const updatedAt = String(record.updated_at || record.updatedAt || createdAt);
  const department = String(record.department || "All Departments");

  return {
    id,
    title: String(record.title || ""),
    body,
    department,
    author_id: authorId,
    author_name: authorName,
    author_role: authorRole,
    target_roles: targetRoles,
    status,
    priority,
    category,
    notice_date: noticeDate,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export async function createDepartmentNotice(
  data: CreateDepartmentNoticeInput,
  accessToken: string,
): Promise<import("@/types/notice").DepartmentNotice> {
  const url = `${API_BASE_URL}/notices`;
  const identity = extractCallerIdentity(accessToken);

  const authorId = identity.userId || "usr_author";
  const authorName = data.author_name || identity.name || identity.username || "User";
  const authorRole = data.author_role || identity.role || "PRINCIPAL";
  const authorUsername = identity.username || "";
  const rolesString = Array.isArray(data.target_roles) && data.target_roles.length > 0
    ? data.target_roles.join(",")
    : "All";

  const payload = {
    ...data,
    // Dual-send for full compatibility with both legacy and new backend
    content: data.body,
    body: data.body,
    authorId: authorId,
    author_id: authorId,
    authorName: authorName,
    author_name: authorName,
    authorRole: authorRole,
    author_role: authorRole,
    authorUsername: authorUsername,
    author_username: authorUsername,
    targetRoles: data.target_roles,
    target_roles: data.target_roles,
    targetSection: rolesString,
    targetYear: "All",
    status: data.status || "PUBLISHED",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  const responseData = await parseResponseOrThrow<unknown>(
    response,
    url,
    "Failed to create notice.",
  );
  let created = normalizeDepartmentNotice(responseData);

  // If user requested PUBLISHED but backend defaulted/forced DRAFT (legacy backend behavior),
  // immediately update the status to PUBLISHED.
  if (data.status === "PUBLISHED" && created.status === "DRAFT") {
    try {
      created = await updateDepartmentNotice(
        created.id,
        {
          ...data,
          target_roles: data.target_roles,
          status: "PUBLISHED",
        },
        accessToken,
      );
    } catch {
      // ignore
    }
  }

  return created;
}

function extractCallerAudiencesFromToken(accessToken: string): { isPrincipal: boolean; audiences: string[] } {
  const identity = extractCallerIdentity(accessToken);
  const role = identity.role;

  if (role === "PRINCIPAL") {
    return { isPrincipal: true, audiences: [] };
  }

  const audiences: string[] = [];
  if (role === "ADMIN" || role === "HOD") {
    audiences.push("HOD");
  } else if (role === "FACULTY") {
    audiences.push("FACULTY");
  } else {
    audiences.push("STUDENT");
  }

  return { isPrincipal: false, audiences };
}

export async function listDepartmentNotices(
  accessToken: string,
): Promise<import("@/types/notice").DepartmentNotice[]> {
  const url = `${API_BASE_URL}/notices`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  const payload = await parseResponseOrThrow<unknown>(
    response,
    url,
    "Failed to load notices.",
  );
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.notices)
      ? (payload as any).notices
      : Array.isArray((payload as any)?.items)
        ? (payload as any).items
        : Array.isArray((payload as any)?.Items)
          ? (payload as any).Items
          : [];

  const allNotices: import("@/types/notice").DepartmentNotice[] =
    items.map(normalizeDepartmentNotice);

  // Client-side audience filtering safeguard (in addition to backend filtering)
  const { isPrincipal, audiences } = extractCallerAudiencesFromToken(accessToken);
  if (isPrincipal) {
    return allNotices;
  }

  return allNotices.filter((notice: import("@/types/notice").DepartmentNotice) => {
    // Only PUBLISHED notices appear in role inboxes (drafts are only in author's view)
    if (notice.status === "DRAFT") {
      return false;
    }
    // Check if notice targets the caller's audience role
    const roles: string[] = Array.isArray(notice.target_roles)
      ? notice.target_roles.map((r: string) => String(r).toUpperCase())
      : [];
    return roles.some((r: string) => audiences.includes(r));
  });
}

export async function listPrincipalNotices(
  accessToken: string,
): Promise<import("@/types/notice").DepartmentNotice[]> {
  const url = `${API_BASE_URL}/notices?scope=my`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  const payload = await parseResponseOrThrow<unknown>(
    response,
    url,
    "Failed to load notices.",
  );
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.notices)
      ? (payload as any).notices
      : Array.isArray((payload as any)?.items)
        ? (payload as any).items
        : Array.isArray((payload as any)?.Items)
          ? (payload as any).Items
          : [];
  const allNotices: import("@/types/notice").DepartmentNotice[] =
    items.map(normalizeDepartmentNotice);

  // Filter so each role/user sees ONLY the notices sent/authored by them
  const identity = extractCallerIdentity(accessToken);
  if (identity.identifiers.size === 0) {
    return [];
  }

  return allNotices.filter((notice) => {
    const authorId = (notice.author_id || "").toLowerCase();
    const noticeAuthorName = (notice.author_name || "").toLowerCase();
    const authorUsername = (
      (notice as any).author_username ||
      (notice as any).authorUsername ||
      ""
    ).toLowerCase();

    return (
      (authorId && identity.identifiers.has(authorId)) ||
      (authorUsername && identity.identifiers.has(authorUsername)) ||
      (noticeAuthorName && identity.identifiers.has(noticeAuthorName))
    );
  });
}

export async function listAuthoredNotices(
  accessToken: string,
): Promise<import("@/types/notice").DepartmentNotice[]> {
  return listPrincipalNotices(accessToken);
}

export async function getDepartmentNoticeById(
  id: string,
  accessToken: string,
): Promise<import("@/types/notice").DepartmentNotice> {
  const url = `${API_BASE_URL}/notices/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  const payload = await parseResponseOrThrow<unknown>(
    response,
    url,
    "Failed to load notice.",
  );
  return normalizeDepartmentNotice(payload);
}

export async function updateDepartmentNotice(
  id: string,
  data: Partial<CreateDepartmentNoticeInput>,
  accessToken: string,
): Promise<import("@/types/notice").DepartmentNotice> {
  const url = `${API_BASE_URL}/notices/${encodeURIComponent(id)}`;
  const identity = extractCallerIdentity(accessToken);
  const userId = identity.userId;
  const name = identity.name;
  const rolesString = Array.isArray(data.target_roles) && data.target_roles.length > 0
    ? data.target_roles.join(",")
    : undefined;

  const payload = {
    ...data,
    ...(data.body !== undefined ? { content: data.body, body: data.body } : {}),
    ...(data.target_roles !== undefined
      ? {
          targetRoles: data.target_roles,
          target_roles: data.target_roles,
          targetSection: rolesString,
        }
      : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(userId ? { authorId: userId, author_id: userId, authorName: name, author_name: name } : {}),
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  const responseData = await parseResponseOrThrow<unknown>(
    response,
    url,
    "Failed to update notice.",
  );
  return normalizeDepartmentNotice(responseData);
}

export async function publishDepartmentNotice(
  notice: import("@/types/notice").DepartmentNotice,
  accessToken: string,
): Promise<import("@/types/notice").DepartmentNotice> {
  const targetRoles =
    notice.target_roles && notice.target_roles.length > 0
      ? notice.target_roles
      : (["HOD", "FACULTY", "STUDENT"] as import("@/types/notice").TargetRole[]);

  const updated = await updateDepartmentNotice(
    notice.id,
    {
      title: notice.title,
      body: notice.body,
      department: notice.department,
      category: notice.category,
      priority: notice.priority,
      notice_date: notice.notice_date,
      target_roles: targetRoles,
      status: "PUBLISHED",
    },
    accessToken,
  );

  return {
    ...updated,
    target_roles:
      updated.target_roles && updated.target_roles.length > 0
        ? updated.target_roles
        : targetRoles,
    status: "PUBLISHED",
  };
}

export async function deleteDepartmentNotice(
  id: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE_URL}/notices/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  await parseResponseOrThrow(response, url, "Failed to delete notice.");
}

