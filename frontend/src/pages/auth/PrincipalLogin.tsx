import { RoleLoginForm } from "./RoleLoginForm";

export function PrincipalLogin() {
  return (
    <RoleLoginForm
      identifierAutocomplete="username"
      identifierLabel="Principal ID"
      identifierPlaceholder="Enter your principal username or ID"
      identifierType="text"
      role="PRINCIPAL"
      title="Principal Sign In"
    />
  );
}
