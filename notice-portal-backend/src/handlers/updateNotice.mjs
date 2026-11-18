import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

import { readCaller } from "../shared/auth.mjs";
import {
  buildNoticeItem,
  jsonResponse,
  normalizeDynamoNotice,
} from "../shared/noticeHelper.mjs";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "Notices";
const ALLOWED_TARGET_ROLES = ["HOD", "FACULTY", "STUDENT"];

export const handler = async (event) => {
  try {
    const noticeId = event.pathParameters?.id;
    if (!noticeId) {
      return jsonResponse(400, {
        error: "Validation Error",
        message: "Notice ID is required in the path.",
      });
    }

    const caller = readCaller(event);
    if (!caller || !caller.userId) {
      return jsonResponse(401, {
        error: "Unauthorized",
        message: "Missing or invalid caller authentication claims.",
      });
    }

    const callerId = String(caller.userId || "");

    const getResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { noticeId },
      }),
    );

    if (!getResult.Item) {
      return jsonResponse(404, {
        error: "Not Found",
        message: "Notice not found",
      });
    }

    const existing = normalizeDynamoNotice(getResult.Item);
    const isAuthor =
      String(existing.author_id) === callerId || String(existing.authorId) === callerId;

    if (!isAuthor) {
      return jsonResponse(403, {
        error: "Forbidden",
        message: "You can only edit notices that you authored.",
      });
    }

    let body = {};
    if (event.body) {
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      body = typeof raw === "string" ? JSON.parse(raw) : raw;
    }

    // Validate title if supplied
    if (body.title !== undefined) {
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return jsonResponse(400, {
          error: "Validation Error",
          message: "Title cannot be empty.",
        });
      }
    }

    // Validate target_roles if supplied
    const rawRoles = body.target_roles !== undefined ? body.target_roles : body.targetRoles;
    let targetRoles = existing.target_roles;
    if (rawRoles !== undefined) {
      if (!Array.isArray(rawRoles) || rawRoles.length === 0) {
        return jsonResponse(400, {
          error: "Validation Error",
          message:
            "target_roles must be a non-empty array containing at least one of HOD, FACULTY, STUDENT.",
        });
      }
      const normalized = rawRoles.map((r) => String(r).toUpperCase());
      const invalid = normalized.filter((r) => !ALLOWED_TARGET_ROLES.includes(r));
      if (invalid.length > 0) {
        return jsonResponse(400, {
          error: "Validation Error",
          message: `Invalid target role(s): ${invalid.join(", ")}. Only HOD, FACULTY, and STUDENT are allowed.`,
        });
      }
      targetRoles = normalized;
    }

    const title = body.title !== undefined ? body.title : existing.title;
    const bodyText =
      body.body !== undefined
        ? body.body
        : body.content !== undefined
          ? body.content
          : existing.body;
    const department = body.department !== undefined ? body.department : existing.department;
    const status = body.status !== undefined ? body.status : existing.status;
    const priority = body.priority !== undefined ? body.priority : existing.priority;
    const category = body.category !== undefined ? body.category : existing.category;
    const noticeDate =
      body.notice_date !== undefined
        ? body.notice_date
        : body.noticeDate !== undefined
          ? body.noticeDate
          : existing.notice_date;
    const posterUrl =
      body.posterUrl !== undefined
        ? body.posterUrl
        : body.imageUrl !== undefined
          ? body.imageUrl
          : existing.posterUrl;

    // Single write helper ensures dual-write consistency and preserves original author identity
    const updatedItem = buildNoticeItem({
      noticeId,
      title,
      bodyText,
      authorId: existing.authorId,
      authorName: existing.authorName,
      authorRole: existing.authorRole,
      department,
      category,
      priority,
      targetRoles,
      status,
      noticeDate,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      posterUrl,
      targetYear: existing.targetYear,
      targetSection: existing.targetSection,
    });

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedItem,
      }),
    );

    const normalized = normalizeDynamoNotice(updatedItem);

    return jsonResponse(200, {
      message: "Notice updated successfully",
      notice: normalized,
      ...normalized,
    });
  } catch (err) {
    console.error("updateNotice failed", err);
    return jsonResponse(500, {
      error: "Server Error",
      message: "Failed to update notice: " + (err instanceof Error ? err.message : String(err)),
    });
  }
};
