import type { NoticeCategory } from "@/types";
import type { TargetRole } from "@/types/notice";

export interface DemoSample {
  label: string;
  title: string;
  body: string;
  department: string;
  category: NoticeCategory;
  priority: "REGULAR" | "URGENT";
  targetRoles: TargetRole[];
  noticeDate?: string;
}

export const DEMO_SAMPLES: readonly DemoSample[] = [
  {
    label: "1. HODs only (Attendance Reports)",
    title: "Submission of Semester Attendance Reports",
    body: "All Heads of Department must submit the consolidated attendance reports for their departments to the principal's office by Friday, 4 PM. Late submissions will not be accepted.",
    department: "Computer Science and Engineering",
    category: "EXAMINATION",
    priority: "URGENT",
    targetRoles: ["HOD"],
  },
  {
    label: "2. Faculty only (Meeting)",
    title: "Faculty Meeting on Internal Assessment Schedule",
    body: "All faculty members are requested to attend the meeting in the seminar hall at 2:30 PM on Monday. The internal assessment timetable will be finalised.",
    department: "All Departments",
    category: "SEMINAR",
    priority: "REGULAR",
    targetRoles: ["FACULTY"],
  },
  {
    label: "3. Everyone (Symposium)",
    title: "Annual Technical Symposium Registration Open",
    body: "Students can register for the Annual Technical Symposium on the college portal. Registration closes on the 30th of this month. Seats are limited.",
    department: "All Departments",
    category: "CULTURAL",
    priority: "REGULAR",
    targetRoles: ["HOD", "FACULTY", "STUDENT"],
  },
];

export interface RoleDemoSample {
  label: string;
  senderRole: "PRINCIPAL";
  title: string;
  body: string;
  department: string;
  category: NoticeCategory;
  priority: "REGULAR" | "URGENT";
  targetRoles: TargetRole[];
  note: string;
}

export interface DemoRoleSamples {
  PRINCIPAL: readonly RoleDemoSample[];
  HOD: readonly RoleDemoSample[];
  FACULTY: readonly RoleDemoSample[];
  STUDENT: readonly RoleDemoSample[];
}

const principalRoleSamples: readonly RoleDemoSample[] = [
  {
    label: "1. HODs only (Attendance Reports)",
    senderRole: "PRINCIPAL",
    title: "Submission of Semester Attendance Reports",
    body: "All Heads of Department must submit the consolidated attendance reports for their departments to the principal's office by Friday, 4 PM. Late submissions will not be accepted.",
    department: "Computer Science and Engineering",
    category: "EXAMINATION",
    priority: "URGENT",
    targetRoles: ["HOD"],
    note: "Principal creates an urgent submission notice addressed exclusively to HODs.",
  },
  {
    label: "2. Faculty only (Meeting)",
    senderRole: "PRINCIPAL",
    title: "Faculty Meeting on Internal Assessment Schedule",
    body: "All faculty members are requested to attend the meeting in the seminar hall at 2:30 PM on Monday. The internal assessment timetable will be finalised.",
    department: "All Departments",
    category: "SEMINAR",
    priority: "REGULAR",
    targetRoles: ["FACULTY"],
    note: "Principal creates a departmental meeting notice targeted solely to faculty members.",
  },
  {
    label: "3. Everyone (Symposium)",
    senderRole: "PRINCIPAL",
    title: "Annual Technical Symposium Registration Open",
    body: "Students can register for the Annual Technical Symposium on the college portal. Registration closes on the 30th of this month. Seats are limited.",
    department: "All Departments",
    category: "CULTURAL",
    priority: "REGULAR",
    targetRoles: ["HOD", "FACULTY", "STUDENT"],
    note: "Principal creates a campus-wide circular visible across all roles.",
  },
];

const studentPlacementSample: RoleDemoSample = {
  label: "Placement Drive Registration",
  senderRole: "PRINCIPAL",
  title: "Placement Drive Registration",
  body: "Final-year students must register for the placement drive on the college portal before the 28th. Bring updated resumes to the placement cell.",
  department: "Career Guidance & Placement Cell",
  category: "PLACEMENT",
  priority: "URGENT",
  targetRoles: ["STUDENT"],
  note: "Student sees all-audience items plus dedicated student placement notices.",
};

export const DEMO_ROLE_SAMPLES: DemoRoleSamples = {
  PRINCIPAL: principalRoleSamples,
  HOD: principalRoleSamples
    .filter((sample) => sample.targetRoles.includes("HOD"))
    .map((sample) => ({
      ...sample,
      note: "HOD sees only items addressed to HODs.",
    })),
  FACULTY: principalRoleSamples
    .filter((sample) => sample.targetRoles.includes("FACULTY"))
    .map((sample) => ({
      ...sample,
      note: "Faculty sees Faculty and all-audience items.",
    })),
  STUDENT: [
    ...principalRoleSamples
      .filter((sample) => sample.targetRoles.includes("STUDENT"))
      .map((sample) => ({
        ...sample,
        note: "Student sees all-audience items plus dedicated student placement notices.",
      })),
    studentPlacementSample,
  ],
};
