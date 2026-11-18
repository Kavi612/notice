import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

import { readCaller, resolveCallerAudiences } from "../shared/auth.mjs";
import {
  jsonResponse,
  normalizeDynamoNotice,
  sanitizeForStudent,
} from "../shared/noticeHelper.mjs";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "Notices";

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

    const callerRole = (caller.role || "STUDENT").toUpperCase();
    const callerRoles = caller.roles.map((r) => String(r).toUpperCase());
    const callerId = String(caller.userId || "");

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { noticeId },
      }),
    );

    if (!result.Item) {
      return jsonResponse(404, {
        error: "Not Found",
        message: "Notice not found",
      });
    }

    // Old data safety: handles missing target_roles gracefully
    const notice = normalizeDynamoNotice(result.Item);
    const isAuthor =
      String(notice.author_id) === callerId || String(notice.authorId) === callerId;
    const callerAudiences = resolveCallerAudiences(callerRole, callerRoles);
    const isPrincipal = callerAudiences === null;
    const isStudentCaller =
      callerRole === "STUDENT" &&
      !callerRoles.some((r) => ["PRINCIPAL", "ADMIN", "HOD", "FACULTY"].includes(r));

    // Draft notices are only accessible to their author
    if (notice.status === "DRAFT" && !isAuthor) {
      return jsonResponse(403, {
        error: "Forbidden",
        message: "Draft notices can only be viewed by their author.",
      });
    }

    // Non-authors require PUBLISHED status and audience overlap
    if (!isAuthor) {
      if (notice.status !== "PUBLISHED") {
        return jsonResponse(403, {
          error: "Forbidden",
          message: "Draft notices can only be viewed by their author.",
        });
      }

      const matchesAudience =
        isPrincipal ||
        (Array.isArray(notice.target_roles) &&
          Array.isArray(callerAudiences) &&
          notice.target_roles.some((r) =>
            callerAudiences.includes(String(r).toUpperCase()),
          ));

      if (!matchesAudience) {
        return jsonResponse(403, {
          error: "Forbidden",
          message: "You do not have permission to view this notice.",
        });
      }
    }

    if (isStudentCaller) {
      return jsonResponse(200, { notice: sanitizeForStudent(notice) });
    }

    return jsonResponse(200, { notice });
  } catch (err) {
    console.error("getNotice failed", err);
    return jsonResponse(500, {
      error: "Server Error",
      message: "Failed to retrieve notice: " + (err instanceof Error ? err.message : String(err)),
    });
  }
};
