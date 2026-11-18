import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

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
    const caller = readCaller(event);
    if (!caller || !caller.userId) {
      return jsonResponse(401, {
        error: "Unauthorized",
        message: "Missing or invalid caller authentication claims.",
      });
    }

    const callerRole = caller.role.toUpperCase();
    const callerRoles = caller.roles.map((r) => String(r).toUpperCase());

    const hasPrincipal = callerRoles.includes("PRINCIPAL") || callerRole === "PRINCIPAL";
    const hasHodOrAdmin =
      callerRoles.includes("HOD") ||
      callerRoles.includes("ADMIN") ||
      callerRole === "HOD" ||
      callerRole === "ADMIN";
    const hasFaculty = callerRoles.includes("FACULTY") || callerRole === "FACULTY";

    // Reject STUDENT or unauthenticated callers
    if (callerRole === "STUDENT" || (!hasPrincipal && !hasHodOrAdmin && !hasFaculty)) {
      return jsonResponse(403, {
        error: "Forbidden",
        message: "Students are not allowed to create notices.",
      });
    }

    let body = {};
    if (event.body) {
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;
      body = typeof raw === "string" ? JSON.parse(raw) : raw;
    }

    const title = (body.title || "").trim();
    const bodyText = (body.body || body.content || "").trim();

    if (!title) {
      return jsonResponse(400, {
        error: "Validation Error",
        message: "Title is required",
      });
    }

    if (!bodyText) {
      return jsonResponse(400, {
        error: "Validation Error",
        message: "Body is required",
      });
    }

    const rawRoles = body.target_roles !== undefined ? body.target_roles : body.targetRoles;
    if (!Array.isArray(rawRoles) || rawRoles.length === 0) {
      return jsonResponse(400, {
        error: "Validation Error",
        message: "target_roles is required and must be a non-empty array.",
      });
    }

    const normalizedRoles = rawRoles.map((r) => String(r).toUpperCase());
    const invalidRoles = normalizedRoles.filter((r) => !ALLOWED_TARGET_ROLES.includes(r));
    if (invalidRoles.length > 0) {
      return jsonResponse(400, {
        error: "Validation Error",
        message: `Invalid target role(s): ${invalidRoles.join(", ")}. Only HOD, FACULTY, and STUDENT are allowed.`,
      });
    }

    // Enforce audience constraints based on creator's role
    if (!hasPrincipal) {
      if (hasHodOrAdmin) {
        if (normalizedRoles.includes("HOD")) {
          return jsonResponse(400, {
            error: "Validation Error",
            message: "HODs cannot target HODs. Allowed targets: FACULTY, STUDENT.",
          });
        }
      } else if (hasFaculty) {
        if (normalizedRoles.includes("HOD") || normalizedRoles.includes("FACULTY")) {
          return jsonResponse(400, {
            error: "Validation Error",
            message: "Faculty can only target Students.",
          });
        }
      }
    }

    const authorRole = hasPrincipal ? "PRINCIPAL" : hasHodOrAdmin ? "HOD" : "FACULTY";
    const authorName = caller.name || (hasPrincipal ? "Office of the Principal" : authorRole);
    const authorId = caller.userId || `usr_${authorRole.toLowerCase()}`;

    // Single write helper writes body & content, and authorId & author_id
    const noticeItem = buildNoticeItem({
      noticeId: randomUUID(),
      title,
      bodyText,
      authorId,
      authorName,
      authorRole,
      department: body.department,
      category: body.category,
      priority: body.priority,
      targetRoles: normalizedRoles,
      status: body.status || "PUBLISHED",
      noticeDate: body.notice_date || body.noticeDate,
      posterUrl: body.posterUrl || body.imageUrl,
    });

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: noticeItem,
      }),
    );

    const normalized = normalizeDynamoNotice(noticeItem);

    return jsonResponse(201, {
      message: "Notice created successfully",
      notice: normalized,
      ...normalized,
    });
  } catch (err) {
    console.error("createNotice failed", err);
    return jsonResponse(500, {
      error: "Server Error",
      message: "Failed to create notice: " + (err instanceof Error ? err.message : String(err)),
    });
  }
};
