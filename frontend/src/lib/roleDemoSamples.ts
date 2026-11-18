import type { NoticeCategory } from "@/types";
import type { TargetRole } from "@/types/notice";
import type { DemoSample } from "./demoSamples";

const today = new Date().toISOString().slice(0, 10);

export const HOD_DEMO_SAMPLES: readonly DemoSample[] = [
  {
    label: "1. Exam Timetable (Faculty & Students)",
    title: "End-Semester Practical and Viva Examination Timetable",
    body: "The department practical laboratory exams and project viva schedules for all semesters have been published. Laboratory instructors and internal examiners must ensure lab readiness by Thursday. Students must arrive with their signed observation notebooks.",
    department: "Computer Science and Engineering",
    category: "EXAMINATION" as NoticeCategory,
    priority: "URGENT",
    targetRoles: ["FACULTY", "STUDENT"] as TargetRole[],
    noticeDate: today,
  },
  {
    label: "2. Department Meeting (Faculty only)",
    title: "Curriculum Review and Continuous Internal Assessment Meeting",
    body: "All department faculty members are requested to assemble in the Department Conference Room on Monday at 3:00 PM. Agenda items include CIA question bank moderation, outcome-based education attainment sheets, and research seminar planning.",
    department: "Computer Science and Engineering",
    category: "SEMINAR" as NoticeCategory,
    priority: "REGULAR",
    targetRoles: ["FACULTY"] as TargetRole[],
    noticeDate: today,
  },
  {
    label: "3. Technical Workshop (Students only)",
    title: "Three-Day Hands-on Workshop on Cloud Native Architecture",
    body: "The Department of Computer Science is organizing an intensive three-day technical workshop on Cloud Native Architecture, Containers, and Kubernetes. Practical sessions will be conducted in Systems Lab 2. All registered 3rd and 4th year students must attend.",
    department: "Computer Science and Engineering",
    category: "WORKSHOP" as NoticeCategory,
    priority: "REGULAR",
    targetRoles: ["STUDENT"] as TargetRole[],
    noticeDate: today,
  },
  {
    label: "4. Lab Circular (Faculty & Students)",
    title: "Guidelines for Advanced Computing Laboratory Access & Equipment Usage",
    body: "Standard operating procedures for access to high-performance GPUs and servers in the Advanced Computing Laboratory are now updated. Faculty guides must approve batch access requests. Students are reminded that network monitoring and safety guidelines apply at all times.",
    department: "Computer Science and Engineering",
    category: "GENERAL" as NoticeCategory,
    priority: "REGULAR",
    targetRoles: ["FACULTY", "STUDENT"] as TargetRole[],
    noticeDate: today,
  },
];

export const FACULTY_DEMO_SAMPLES: readonly DemoSample[] = [
  {
    label: "1. Class Test Notice (Students only)",
    title: "Unit Test II Announcement - Distributed Systems (CS701)",
    body: "The second internal unit test for CS701 Distributed Systems will be held next Tuesday during the 2nd period in Room 304. The syllabus covers Modules 3 and 4: Distributed Consensus (Paxos/Raft) and Cloud Storage Engines. Attendance is mandatory.",
    department: "Department of Computer Science",
    category: "EXAMINATION" as NoticeCategory,
    priority: "URGENT",
    targetRoles: ["STUDENT"] as TargetRole[],
    noticeDate: today,
  },
  {
    label: "2. Assignment Deadline (Students only)",
    title: "Mini-Project Source Code & Architecture Report Submission",
    body: "All student teams registered for the Software Engineering Mini-Project must push their final Git repository links and upload the architectural design document to the portal by Sunday, 11:59 PM. Late pull requests will incur grade deductions.",
    department: "Department of Computer Science",
    category: "GENERAL" as NoticeCategory,
    priority: "URGENT",
    targetRoles: ["STUDENT"] as TargetRole[],
    noticeDate: today,
  },
  {
    label: "3. Project Review (Students only)",
    title: "Capstone Project Interim Review and Code Walkthrough Schedule",
    body: "Phase 1 capstone project evaluation slots are allocated in the departmental seminar room this Thursday from 10:00 AM onwards. Each student team will have 15 minutes for live code demonstration and 5 minutes for technical Q&A with the panel.",
    department: "Department of Computer Science",
    category: "WORKSHOP" as NoticeCategory,
    priority: "REGULAR",
    targetRoles: ["STUDENT"] as TargetRole[],
    noticeDate: today,
  },
  {
    label: "4. Seminar Invite (Students only)",
    title: "Guest Lecture: Production Microservices & Distributed Tracing",
    body: "Students enrolled in Web Technologies and Distributed Computing are invited to a guest lecture delivered by industry architects on Saturday at 11:00 AM in Audi-2. The session covers OpenTelemetry, Kafka streaming, and observability in production clusters.",
    department: "Department of Computer Science",
    category: "SEMINAR" as NoticeCategory,
    priority: "REGULAR",
    targetRoles: ["STUDENT"] as TargetRole[],
    noticeDate: today,
  },
];
