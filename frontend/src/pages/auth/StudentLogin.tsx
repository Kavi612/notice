import { RoleLoginForm } from "./RoleLoginForm";

export function StudentLogin() {
  return (
    <RoleLoginForm
      identifierAutocomplete="username"
      identifierLabel="Register Number"
      identifierPlaceholder="Enter your register number"
      identifierType="text"
      role="STUDENT"
      title="Student Sign In"
    />
  );
}
