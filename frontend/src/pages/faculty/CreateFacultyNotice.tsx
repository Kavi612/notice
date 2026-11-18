import { FACULTY_DEMO_SAMPLES } from "@/lib/roleDemoSamples";
import { CreatePrincipalNotice } from "@/pages/principal/CreatePrincipalNotice";

export function CreateFacultyNotice() {
  return (
    <CreatePrincipalNotice
      allowedTargetRoles={["STUDENT"]}
      defaultContactEmail="faculty@college.edu"
      defaultContactName="Faculty In-charge"
      defaultDepartment="Department of Computer Science"
      demoSamples={FACULTY_DEMO_SAMPLES}
      headerBadge="Course Notice Dispatch"
      headerDescription="Draft class notices, academic announcements, and assignment updates for students."
      headerTitle="Create Course Notice"
      role="FACULTY"
      successRedirect="/faculty/inbox"
    />
  );
}
