// Target audience roles that can be targeted when publishing a notice
export type TargetRole = "HOD" | "FACULTY" | "STUDENT";

// Department Notice matching the backend PostgreSQL and Express API response shape
export interface DepartmentNotice {
  id: string;
  title: string;
  body: string;
  department: string;
  author_id: string;
  author_name: string;
  author_role: string;
  target_roles: TargetRole[];
  status: "DRAFT" | "PUBLISHED";
  priority: "REGULAR" | "URGENT";
  category: string;
  notice_date: string;
  created_at: string;
  updated_at: string;
}

// Checkbox configuration item for audience targeting
export interface AudienceOption {
  value: TargetRole;
  label: string;
}

// Available audience choices in required order: HODs, Faculty, Students
export const TARGET_ROLE_OPTIONS: AudienceOption[] = [
  { value: "HOD", label: "Heads of Department (HODs)" },
  { value: "FACULTY", label: "Faculty Members" },
  { value: "STUDENT", label: "Students" },
];
