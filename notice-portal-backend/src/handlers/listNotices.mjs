import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

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
    const scope = (event?.queryStringParameters?.scope || "").toLowerCase();

    const callerAudiences = resolveCallerAudiences(callerRole, callerRoles);
    const isPrincipal = callerAudiences === null;
    const isStudentCaller =
      callerRole === "STUDENT" &&
      !callerRoles.some((r) => ["PRINCIPAL", "ADMIN", "HOD", "FACULTY"].includes(r));

    // Author / Sent / Drafts scope: query by authorId-createdAt-index
    if ((scope === "my" && !isStudentCaller) || (isPrincipal && scope !== "inbox")) {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "authorId-createdAt-index",
          KeyConditionExpression: "authorId = :authorId",
          ExpressionAttributeValues: {
            ":authorId": callerId,
          },
          ScanIndexForward: false, // Newest first
        }),
      );

      const notices = (result.Items || []).map(normalizeDynamoNotice);
      return jsonResponse(200, { notices });
    }

    // Role inboxes: callers with empty audience receive empty list
    if (!callerAudiences || callerAudiences.length === 0) {
      return jsonResponse(200, { notices: [] });
    }

    // Query published notices using status-publishAt-index
    // Note: Using a FilterExpression on status-publishAt-index is fine for a small college database
    // and must be replaced with a proper index if the table grows past a few thousand items.
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "status-publishAt-index",
        KeyConditionExpression: "#status = :published",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":published": "PUBLISHED",
        },
        ScanIndexForward: false, // Newest first
      }),
    );

    // Old data safety: existing DynamoDB items may lack target_roles.
    // normalizeDynamoNotice treats missing target_roles as [], keeping them hidden from role inboxes.
    const matchedNotices = (result.Items || [])
      .map(normalizeDynamoNotice)
      .filter((notice) => {
        const roles = Array.isArray(notice.target_roles) ? notice.target_roles : [];
        return (
          isPrincipal ||
          roles.some((r) => callerAudiences.includes(String(r).toUpperCase()))
        );
      });

    const output = isStudentCaller
      ? matchedNotices.map(sanitizeForStudent)
      : matchedNotices;

    return jsonResponse(200, { notices: output });
  } catch (err) {
    console.error("listNotices failed", err);
    return jsonResponse(500, {
      error: "Server Error",
      message: "Failed to retrieve notices: " + (err instanceof Error ? err.message : String(err)),
    });
  }
};
