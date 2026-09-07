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

export async function listNotices(): Promise<Notice[]> {
  const response = await fetch(`${API_BASE_URL}/notices`);

  if (!response.ok) {
    throw new Error("Couldn't load notices.");
  }

  const payload: unknown = await response.json();
  return unwrapNoticeList(payload)
    .map(normalizeNotice)
    .filter((notice): notice is Notice => notice !== null);
}

export async function getNoticeById(noticeId: string): Promise<Notice> {
  const response = await fetch(
    `${API_BASE_URL}/notices/${encodeURIComponent(noticeId)}`,
  );

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
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/notices/${encodeURIComponent(noticeId)}/read`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        noticeId,
        studentId: userId,
        userId,
      }),
    },
  );

  if (!response.ok && response.status !== 409) {
    throw new Error("Couldn't mark this notice as read.");
  }
}
