export type UserRole = "HOD" | "ADMIN" | "FACULTY" | "STUDENT";

export type NoticeCategory =
  | "EXAMINATION"
  | "WORKSHOP"
  | "SEMINAR"
  | "PLACEMENT"
  | "SPORTS"
  | "CULTURAL"
  | "GENERAL";

export type NoticeTemplate =
  | "FORMAL_ACADEMIC"
  | "CIRCULAR"
  | "EVENT"
  | "PLACEMENT";

export type NoticeStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHED"
  | "EXPIRED"
  | "ARCHIVED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  year: string | null;
  section: string | null;
}

export interface Notice {
  noticeId: string;
  title: string;
  content: string;
  authorId: string;
  department: string;
  category: NoticeCategory;
  targetYear: string | null;
  targetSection: string | null;
  publishAt: string | null;
  expiresAt: string | null;
  status: NoticeStatus;
  template: NoticeTemplate | null;
  createdAt: string;
  updatedAt: string;
  posterUrl: string | null;
}

export interface StudentNotice extends Notice {
  authorName: string;
  imageUrl: string | null;
  isAcknowledged: boolean;
  isRead: boolean;
  requiresAcknowledgement: boolean;
}
