/**
 * Shared Authentication and Audience Resolution Helper for AWS Lambda Handlers
 */

/**
 * Extracts caller identity and roles strictly from API Gateway requestContext authorizer claims.
 * If claims are missing or invalid, returns null (handler returns 401).
 * Does not trust any identity from the request body or raw headers.
 */
export function readCaller(event) {
  const claims =
    event?.requestContext?.authorizer?.jwt?.claims ??
    event?.requestContext?.authorizer?.claims ??
    null;

  if (!claims || typeof claims !== "object" || Object.keys(claims).length === 0) {
    return null;
  }

  const userId = claims.sub || claims.username || "";
  if (!userId) {
    return null;
  }

  const rawGroups = claims["cognito:groups"] ?? [];
  let groups = [];
  if (Array.isArray(rawGroups)) {
    groups = rawGroups.map((g) => String(g).toUpperCase());
  } else if (typeof rawGroups === "string" && rawGroups.length > 0) {
    groups = rawGroups
      .replace(/[\[\]]/g, "")
      .split(",")
      .map((g) => g.trim().toUpperCase())
      .filter(Boolean);
  }

  // Determine primary role with PRINCIPAL given precedence
  let role = "STUDENT";
  if (groups.includes("PRINCIPAL")) {
    role = "PRINCIPAL";
  } else if (groups.includes("ADMIN")) {
    role = "ADMIN";
  } else if (groups.includes("HOD")) {
    role = "HOD";
  } else if (groups.includes("FACULTY")) {
    role = "FACULTY";
  } else if (groups.includes("STUDENT")) {
    role = "STUDENT";
  } else if (claims["custom:role"]) {
    role = String(claims["custom:role"]).toUpperCase();
  }

  return {
    userId,
    username: claims["cognito:username"] || claims.username || claims.sub || "user",
    email: claims.email || "",
    name: claims.name || claims["cognito:username"] || claims.username || "User",
    role,
    roles: groups.length > 0 ? groups : [role],
  };
}

/**
 * Maps caller role and groups to the target audiences they are permitted to view.
 * - PRINCIPAL (checked first): returns null (no audience restriction, author view).
 * - ADMIN or HOD: maps to "HOD".
 * - FACULTY: maps to "FACULTY".
 * - STUDENT: maps to "STUDENT".
 */
export function resolveCallerAudiences(callerRole, callerRoles = []) {
  const allRoles = new Set(
    [callerRole, ...(Array.isArray(callerRoles) ? callerRoles : [callerRoles])]
      .filter(Boolean)
      .map((r) => String(r).toUpperCase()),
  );

  // PRINCIPAL checked first: caller has PRINCIPAL (even if also ADMIN) -> no audience filter
  if (allRoles.has("PRINCIPAL")) {
    return null;
  }

  const audiences = new Set();
  if (allRoles.has("ADMIN") || allRoles.has("HOD")) {
    audiences.add("HOD");
  }
  if (allRoles.has("FACULTY")) {
    audiences.add("FACULTY");
  }
  if (allRoles.has("STUDENT")) {
    audiences.add("STUDENT");
  }

  return Array.from(audiences);
}
