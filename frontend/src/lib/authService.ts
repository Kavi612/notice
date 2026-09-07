import { COGNITO_CLIENT_ID, COGNITO_REGION } from "@/lib/config";

export interface CognitoLoginResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DecodedIdToken {
  sub: string;
  username: string;
  groups: string[];
}

interface CognitoAuthenticationResult {
  AccessToken?: string;
  IdToken?: string;
  RefreshToken?: string;
  ExpiresIn?: number;
}

interface CognitoInitiateAuthResponse {
  AuthenticationResult?: CognitoAuthenticationResult;
  __type?: string;
  message?: string;
}

const GENERIC_LOGIN_ERROR = "Login failed, please try again";
const INVALID_CREDENTIALS_ERROR = "Incorrect username or password";

function getCognitoIdpUrl(): string {
  return `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;
}

function readCognitoErrorType(payload: CognitoInitiateAuthResponse): string {
  return payload.__type ?? "";
}

function toUserFacingLoginError(payload: CognitoInitiateAuthResponse): Error {
  const errorType = readCognitoErrorType(payload);

  if (errorType.includes("NotAuthorizedException")) {
    return new Error(INVALID_CREDENTIALS_ERROR);
  }

  return new Error(GENERIC_LOGIN_ERROR);
}

export async function login(
  username: string,
  password: string,
): Promise<CognitoLoginResult> {
  let payload: CognitoInitiateAuthResponse;

  try {
    const response = await fetch(getCognitoIdpUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      },
      body: JSON.stringify({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      }),
    });

    payload = (await response.json()) as CognitoInitiateAuthResponse;

    if (!response.ok || payload.__type) {
      throw toUserFacingLoginError(payload);
    }
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_CREDENTIALS_ERROR) {
      throw error;
    }

    if (error instanceof Error && error.message === GENERIC_LOGIN_ERROR) {
      throw error;
    }

    throw new Error(GENERIC_LOGIN_ERROR);
  }

  const authenticationResult = payload.AuthenticationResult;
  const accessToken = authenticationResult?.AccessToken;
  const idToken = authenticationResult?.IdToken;
  const refreshToken = authenticationResult?.RefreshToken;
  const expiresIn = authenticationResult?.ExpiresIn;

  if (!accessToken || !idToken || !refreshToken || typeof expiresIn !== "number") {
    throw new Error(GENERIC_LOGIN_ERROR);
  }

  return {
    accessToken,
    idToken,
    refreshToken,
    expiresIn,
  };
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);

  return atob(base64);
}

export function decodeIdToken(idToken: string): DecodedIdToken {
  const payloadSegment = idToken.split(".")[1];

  if (!payloadSegment) {
    throw new Error(GENERIC_LOGIN_ERROR);
  }

  const claims = JSON.parse(decodeBase64Url(payloadSegment)) as Record<
    string,
    unknown
  >;

  const groupsClaim = claims["cognito:groups"];
  const groups = Array.isArray(groupsClaim)
    ? groupsClaim.filter((group): group is string => typeof group === "string")
    : [];

  const usernameClaim = claims["cognito:username"] ?? claims.username;
  const sub = typeof claims.sub === "string" ? claims.sub : "";
  const username = typeof usernameClaim === "string" ? usernameClaim : "";

  return {
    sub,
    username,
    groups,
  };
}
