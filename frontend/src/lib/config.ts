export const AWS_API_ORIGIN =
  "https://j9evvf520h.execute-api.ap-south-1.amazonaws.com";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "" : AWS_API_ORIGIN))
    .trim()
    .replace(/\/+$/, "");

export const EXPRESS_API_BASE_URL = API_BASE_URL;

export const COGNITO_REGION = "ap-south-1";

export const COGNITO_USER_POOL_ID = "ap-south-1_a2KkiKxyL";

export const COGNITO_CLIENT_ID = "vg03lfv1edc7gq2s9ncjhrn9j";

