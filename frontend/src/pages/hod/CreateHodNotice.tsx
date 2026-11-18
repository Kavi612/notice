import { HOD_DEMO_SAMPLES } from "@/lib/roleDemoSamples";
import { CreatePrincipalNotice } from "@/pages/principal/CreatePrincipalNotice";

export function CreateHodNotice() {
  return (
    <CreatePrincipalNotice
      allowedTargetRoles={["FACULTY", "STUDENT"]}
      defaultContactEmail="hod.cse@college.edu"
      defaultContactName="Head of Department"
      defaultDepartment="Computer Science and Engineering"
      demoSamples={HOD_DEMO_SAMPLES}
      headerBadge="Department Notice Dispatch"
      headerDescription="Draft departmental circulars, faculty instructions, and student notices."
      headerTitle="Create Department Notice"
      role="HOD"
      successRedirect="/hod/inbox"
    />
  );
}
