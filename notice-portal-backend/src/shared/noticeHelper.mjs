/**
 * Shared Notice Data Helper and Single Write Function
 */

/**
 * Single write helper: writes both body and content, and authorId and author_id,
 * from the same value. Every handler uses this helper. No handler writes these names on its own.
 */
export function buildNoticeItem({
  noticeId,
  title,
  bodyText,
  authorId,
  authorName = "User",
  authorRole = "FACULTY",
  department = "All Departments",
  category = "GENERAL",
  priority = "REGULAR",
  targetRoles = [],
  status = "PUBLISHED",
  noticeDate,
  createdAt,
  updatedAt,
  template = "FORMAL_ACADEMIC",
  posterUrl = null,
  publishAt = null,
  expiresAt = null,
  targetYear = "All",
  targetSection = "All",
}) {
  const now = new Date().toISOString();
  const safeDate = noticeDate ? new Date(noticeDate).toISOString() : now;
  const safeCreated = createdAt || now;
  const safeUpdated = updatedAt || now;
  const safeStatus = (status || "PUBLISHED").toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISHED";
  const safePublishAt = publishAt || (safeStatus === "PUBLISHED" ? safeDate : null);

  const normalizedTargets = Array.isArray(targetRoles)
    ? targetRoles.map((r) => String(r).toUpperCase())
    : [];

  const item = {
    // Primary Key
    noticeId: String(noticeId),
    id: String(noticeId),

    // Title
    title: (title || "").trim(),

    // Dual-write body and content from the same value
    body: (bodyText || "").trim(),
    content: (bodyText || "").trim(),

    // Dual-write authorId and author_id from the same value
    authorId: String(authorId || ""),
    author_id: String(authorId || ""),

    // Author metadata
    authorName: authorName || "User",
    author_name: authorName || "User",
    authorRole: authorRole || "FACULTY",
    author_role: authorRole || "FACULTY",

    // Department & Category
    department: (department || "").trim() || "All Departments",
    category: (category || "GENERAL").toUpperCase(),

    // Priority
    priority: (priority || "REGULAR").toUpperCase() === "URGENT" ? "URGENT" : "REGULAR",

    // Dual-write target_roles and targetRoles from the same array
    target_roles: normalizedTargets,
    targetRoles: normalizedTargets,

    // Status
    status: safeStatus,

    // Notice Date & Timestamps
    noticeDate: safeDate,
    notice_date: safeDate,
    createdAt: safeCreated,
    created_at: safeCreated,
    updatedAt: safeUpdated,
    updated_at: safeUpdated,

    // Legacy fields for backward compatibility
    template: template || "FORMAL_ACADEMIC",
    targetYear: targetYear || "All",
    targetSection: targetSection || "All",
  };

  if (safePublishAt) {
    item.publishAt = safePublishAt;
  }
  if (expiresAt) {
    item.expiresAt = expiresAt;
  }
  if (posterUrl) {
    item.posterUrl = posterUrl;
    item.imageUrl = posterUrl;
  }

  return item;
}

/**
 * Normalizes any DynamoDB item safely.
 * Old data safety: existing DynamoDB items may lack target_roles, priority, authorRole, and noticeDate.
 * A missing target_roles is treated as an empty array [] (hidden from role inboxes, visible only to author).
 * Does not throw.
 */
export function normalizeDynamoNotice(item) {
  if (!item) return null;

  const id = item.noticeId || item.id || "";
  const body = item.body || item.content || "";
  const authorId = item.authorId || item.author_id || "";
  const authorName = item.authorName || item.author_name || "User";
  const authorRole = item.authorRole || item.author_role || "FACULTY";

  const rawTargets = item.target_roles ?? item.targetRoles ?? [];
  const targetRoles = Array.isArray(rawTargets) ? rawTargets : [];

  const priority = item.priority || "REGULAR";
  const category = item.category || "GENERAL";
  const status = item.status || "PUBLISHED";
  const noticeDate =
    item.noticeDate ||
    item.notice_date ||
    item.publishAt ||
    item.createdAt ||
    item.created_at ||
    new Date().toISOString();
  const createdAt = item.createdAt || item.created_at || new Date().toISOString();
  const updatedAt = item.updatedAt || item.updated_at || createdAt;
  const department = item.department || "All Departments";
  const posterUrl = item.posterUrl || item.imageUrl || null;

  return {
    id,
    noticeId: id,
    title: item.title || "",
    body,
    content: body,
    author_id: authorId,
    authorId,
    author_name: authorName,
    authorName,
    author_role: authorRole,
    authorRole,
    target_roles: targetRoles,
    targetRoles,
    priority,
    category,
    status,
    notice_date: noticeDate,
    noticeDate,
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt,
    department,
    posterUrl,
    imageUrl: posterUrl,
    targetYear: item.targetYear || null,
    targetSection: item.targetSection || null,
  };
}

/**
 * Strips sensitive internal fields for Student callers.
 * Excludes target_roles, author_id, author_role, status.
 */
export function sanitizeForStudent(notice) {
  if (!notice) return null;
  return {
    id: notice.id || notice.noticeId,
    noticeId: notice.noticeId || notice.id,
    title: notice.title,
    body: notice.body || notice.content,
    content: notice.content || notice.body,
    department: notice.department,
    category: notice.category,
    priority: notice.priority,
    notice_date: notice.notice_date || notice.noticeDate,
    noticeDate: notice.noticeDate || notice.notice_date,
    author_name: notice.author_name || notice.authorName,
    authorName: notice.authorName || notice.author_name,
    created_at: notice.created_at || notice.createdAt,
    createdAt: notice.createdAt || notice.created_at,
  };
}

/**
 * Standard CORS-enabled JSON response wrapper
 */
export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(payload),
  };
}
