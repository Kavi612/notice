import { RoleLoginForm } from "./RoleLoginForm";

export function HodLogin() {
  return (
    <RoleLoginForm
      identifierAutocomplete="email"
      identifierLabel="HOD Email ID"
      identifierPlaceholder="Enter your official email address"
      identifierType="email"
      role="HOD"
      title="HOD Sign In"
    />
  );
}
