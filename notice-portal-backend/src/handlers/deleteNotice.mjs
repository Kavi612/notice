import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

import { readCaller } from "../shared/auth.mjs";
import { jsonResponse, normalizeDynamoNotice } from "../shared/noticeHelper.mjs";

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
        message: "You can only delete notices that you authored.",
      });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { noticeId },
      }),
    );

    return jsonResponse(200, {
      message: "Notice deleted successfully",
      deletedId: noticeId,
    });
  } catch (err) {
    console.error("deleteNotice failed", err);
    return jsonResponse(500, {
      error: "Server Error",
      message: "Failed to delete notice: " + (err instanceof Error ? err.message : String(err)),
    });
  }
};
