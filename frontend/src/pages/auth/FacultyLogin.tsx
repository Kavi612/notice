import { RoleLoginForm } from "./RoleLoginForm";

export function FacultyLogin() {
  return (
    <RoleLoginForm
      identifierAutocomplete="username"
      identifierLabel="Staff ID"
      identifierPlaceholder="Enter your staff ID"
      identifierType="text"
      role="FACULTY"
      title="Faculty Sign In"
    />
  );
}
