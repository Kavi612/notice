const {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
  UsernameExistsException,
} = require("@aws-sdk/client-cognito-identity-provider");
const { DynamoDBClient, PutItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const cognito = new CognitoIdentityProviderClient({});
const dynamo = new DynamoDBClient({});
const ses = new SESClient({});

const USER_POOL_ID = process.env.USER_POOL_ID || "ap-south-1_a2KkiKxyL";
const USERS_TABLE = process.env.USERS_TABLE || "Users";
const FROM_EMAIL = process.env.FROM_EMAIL || "kavirathna125@gmail.com";
const LOGIN_URL =
  process.env.STUDENT_LOGIN_URL || "http://localhost:5173/login/student";
const ALLOWED_ROLES = new Set(["HOD", "ADMIN"]);

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

function readGroups(event) {
  const claims =
    event.requestContext?.authorizer?.jwt?.claims ??
    event.requestContext?.authorizer?.claims ??
    {};
  const rawGroups = claims["cognito:groups"];

  if (Array.isArray(rawGroups)) {
    return rawGroups;
  }

  if (typeof rawGroups === "string" && rawGroups.length > 0) {
    return rawGroups.replace(/[\[\]]/g, "").split(",").map((group) => group.trim());
  }

  return [];
}

function callerIsHod(event) {
  return readGroups(event).some((group) => ALLOWED_ROLES.has(group));
}

function parseBody(event) {
  if (!event.body) {
    return {};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  return JSON.parse(raw);
}

function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function attributeValue(attributes, name) {
  const match = (attributes ?? []).find((item) => item.Name === name);
  return match?.Value ?? "";
}

function dynamoString(item, key) {
  return item?.[key]?.S ?? "";
}

async function listStoredStudents() {
  try {
    const response = await dynamo.send(
      new ScanCommand({ TableName: USERS_TABLE }),
    );
    const stored = {};

    for (const item of response.Items ?? []) {
      const id = dynamoString(item, "userId");
      if (!id) {
        continue;
      }

      stored[id] = {
        department: dynamoString(item, "department"),
        email: dynamoString(item, "email"),
        name: dynamoString(item, "name"),
        section: dynamoString(item, "section") || null,
        year: dynamoString(item, "year") || null,
      };
    }

    return stored;
  } catch (error) {
    console.error("Couldn't read Users table", error);
    return {};
  }
}

async function listStudents() {
  const [stored, cognitoUsers] = await Promise.all([
    listStoredStudents(),
    (async () => {
      const users = [];
      let nextToken;

      do {
        const response = await cognito.send(
          new ListUsersInGroupCommand({
            GroupName: "STUDENT",
            Limit: 60,
            NextToken: nextToken,
            UserPoolId: USER_POOL_ID,
          }),
        );

        for (const user of response.Users ?? []) {
          users.push({
            email: attributeValue(user.Attributes, "email"),
            id: user.Username ?? "",
            name: attributeValue(user.Attributes, "name") || user.Username || "",
          });
        }

        nextToken = response.NextToken;
      } while (nextToken);

      return users;
    })(),
  ]);

  const users = cognitoUsers.map((user) => {
    const extra = stored[user.id] ?? {};
    return {
      department: extra.department || "",
      email: extra.email || user.email,
      id: user.id,
      name: extra.name || user.name,
      role: "STUDENT",
      section: extra.section || null,
      year: extra.year || null,
    };
  });

  users.sort((left, right) => left.name.localeCompare(right.name));
  return users;
}

async function sendWelcomeEmail({ email, name, password, registerNumber }) {
  await ses.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Body: {
          Text: {
            Data: [
              `Hello ${name},`,
              "",
              "Your student account for the Department Notice Portal is ready.",
              "",
              `Register number: ${registerNumber}`,
              `Password: ${password}`,
              "",
              `Sign in here: ${LOGIN_URL}`,
              "",
              "Use Student Sign In, then enter your register number and password.",
            ].join("\n"),
          },
        },
        Subject: {
          Data: "Your Notice Portal student login",
        },
      },
      Source: FROM_EMAIL,
    }),
  );
}

async function createStudent(body) {
  const name = readString(body.name);
  const registerNumber = readString(body.registerNumber);
  const email = readString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const department = readString(body.department);
  const year = readString(body.year);
  const section = readString(body.section);

  if (!name || !registerNumber || !email || !password || !department) {
    return jsonResponse(400, {
      message: "Name, register number, email, password, and department are required.",
    });
  }

  if (/\s/.test(registerNumber)) {
    return jsonResponse(400, {
      message: "Register number cannot contain spaces.",
    });
  }

  if (!isValidEmail(email)) {
    return jsonResponse(400, { message: "Enter a valid student email." });
  }

  if (!isValidPassword(password)) {
    return jsonResponse(400, {
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.",
    });
  }

  try {
    await cognito.send(
      new AdminCreateUserCommand({
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: name },
        ],
        UserPoolId: USER_POOL_ID,
        Username: registerNumber,
      }),
    );
  } catch (error) {
    if (error instanceof UsernameExistsException || error.name === "UsernameExistsException") {
      return jsonResponse(409, {
        message: "A student with this register number already exists.",
      });
    }

    throw error;
  }

  await cognito.send(
    new AdminSetUserPasswordCommand({
      Password: password,
      Permanent: true,
      UserPoolId: USER_POOL_ID,
      Username: registerNumber,
    }),
  );

  await cognito.send(
    new AdminAddUserToGroupCommand({
      GroupName: "STUDENT",
      UserPoolId: USER_POOL_ID,
      Username: registerNumber,
    }),
  );

  try {
    await dynamo.send(
      new PutItemCommand({
        Item: {
          createdAt: { S: new Date().toISOString() },
          department: { S: department },
          email: { S: email },
          name: { S: name },
          role: { S: "STUDENT" },
          section: section ? { S: section } : { NULL: true },
          userId: { S: registerNumber },
          year: year ? { S: year } : { NULL: true },
        },
        TableName: USERS_TABLE,
      }),
    );
  } catch (error) {
    console.error("Couldn't save student to DynamoDB", error);
  }

  let emailSent = true;
  let emailError = null;

  try {
    await sendWelcomeEmail({
      email,
      name,
      password,
      registerNumber,
    });
  } catch (error) {
    emailSent = false;
    emailError =
      error instanceof Error ? error.message : "Couldn't send the login email.";
    console.error("Couldn't send student welcome email", error);
  }

  return jsonResponse(201, {
    emailError,
    emailSent,
    message: emailSent
      ? "Student created and login details emailed."
      : "Student created, but the login email could not be sent.",
    user: {
      department,
      email,
      id: registerNumber,
      name,
      role: "STUDENT",
      section: section || null,
      year: year || null,
    },
  });
}

exports.handler = async (event) => {
  try {
    if (!callerIsHod(event)) {
      return jsonResponse(403, {
        message: "Only HOD accounts can manage students.",
      });
    }

    const method =
      event.requestContext?.http?.method ?? event.httpMethod ?? "GET";

    if (method === "GET") {
      const users = await listStudents();
      return jsonResponse(200, { users });
    }

    if (method === "POST") {
      return await createStudent(parseBody(event));
    }

    return jsonResponse(405, { message: "Method not allowed." });
  } catch (error) {
    console.error("manageUsers failed", error);
    return jsonResponse(500, {
      message: "Couldn't complete this user request.",
    });
  }
};
