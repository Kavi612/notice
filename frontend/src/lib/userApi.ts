import { API_BASE_URL } from "@/lib/config";
import { SessionExpiredError } from "@/lib/noticeApi";
import type { User } from "@/types";

export interface CreateStudentInput {
  department: string;
  email: string;
  name: string;
  password: string;
  registerNumber: string;
  section?: string;
  year?: string;
}

export interface CreateStudentResult {
  emailSent: boolean;
  message: string;
  user: User;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readErrorMessage(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  const message = record?.message;
  return typeof message === "string" && message.length > 0 ? message : fallback;
}

export async function listStudents(accessToken: string): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, "Couldn't load students."));
  }

  const record = asRecord(payload);
  const users = record?.users;
  return Array.isArray(users) ? (users as User[]) : [];
}

export async function createStudent(
  accessToken: string,
  input: CreateStudentInput,
): Promise<CreateStudentResult> {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    throw new SessionExpiredError();
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      readErrorMessage(payload, "Couldn't create this student, please try again."),
    );
  }

  const record = asRecord(payload);
  const user = record?.user as User | undefined;

  if (!user) {
    throw new Error("Couldn't create this student, please try again.");
  }

  return {
    emailSent: record?.emailSent === true,
    message:
      typeof record?.message === "string"
        ? record.message
        : "Student created.",
    user,
  };
}
