import { type FormEvent, useEffect, useState } from "react";
import { LoaderCircle, Plus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateStudentInput } from "@/lib/userApi";
import type { User } from "@/types";

interface UserManagementProps {
  createError?: string | null;
  createSuccess?: string | null;
  isCreating?: boolean;
  isLoading?: boolean;
  loadError?: string | null;
  onAddUser: (input: CreateStudentInput) => void;
  users: User[];
}

const emptyForm: CreateStudentInput = {
  department: "",
  email: "",
  name: "",
  password: "",
  registerNumber: "",
  section: "",
  year: "",
};

function RequiredAsterisk() {
  return (
    <span aria-hidden="true" className="text-rose-500">
      {" "}
      *
    </span>
  );
}

export function UserManagement({
  createError = null,
  createSuccess = null,
  isCreating = false,
  isLoading = false,
  loadError = null,
  onAddUser,
  users,
}: UserManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<CreateStudentInput>(emptyForm);

  useEffect(() => {
    if (createSuccess) {
      setIsFormOpen(false);
      setForm(emptyForm);
    }
  }, [createSuccess]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddUser({
      ...form,
      department: form.department.trim(),
      email: form.email.trim(),
      name: form.name.trim(),
      registerNumber: form.registerNumber.trim(),
      section: form.section?.trim() || undefined,
      year: form.year?.trim() || undefined,
    });
  };

  const closeForm = () => {
    if (isCreating) {
      return;
    }

    setIsFormOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Access administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            User Management
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create a student account, set their password, and email the login
            details.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="lg" type="button">
          <Plus aria-hidden="true" className="size-4" />
          Add User
        </Button>
      </header>

      {createSuccess ? (
        <p className="text-sm font-medium text-emerald-700" role="status">
          {createSuccess}
        </p>
      ) : null}
      {createError ? (
        <p className="text-sm text-destructive" role="alert">
          {createError}
        </p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      {isFormOpen ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Add student
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                They will sign in on Student Sign In with the register number
                and password you set here.
              </p>
            </div>
            <Button
              disabled={isCreating}
              onClick={closeForm}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="student-name">
                Student name
                <RequiredAsterisk />
              </Label>
              <Input
                disabled={isCreating}
                id="student-name"
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
                value={form.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-register">
                Register number
                <RequiredAsterisk />
              </Label>
              <Input
                autoComplete="off"
                disabled={isCreating}
                id="student-register"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    registerNumber: event.target.value,
                  }))
                }
                placeholder="Used as their login ID"
                required
                value={form.registerNumber}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">
                Email
                <RequiredAsterisk />
              </Label>
              <Input
                disabled={isCreating}
                id="student-email"
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
                type="email"
                value={form.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-password">
                Password
                <RequiredAsterisk />
              </Label>
              <Input
                autoComplete="new-password"
                disabled={isCreating}
                id="student-password"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="At least 8 characters, A-z, number, symbol"
                required
                type="text"
                value={form.password}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-department">
                Department
                <RequiredAsterisk />
              </Label>
              <Input
                disabled={isCreating}
                id="student-department"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    department: event.target.value,
                  }))
                }
                required
                value={form.department}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-year">Year</Label>
                <Input
                  disabled={isCreating}
                  id="student-year"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, year: event.target.value }))
                  }
                  placeholder="e.g. 3"
                  value={form.year}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-section">Section</Label>
                <Input
                  disabled={isCreating}
                  id="student-section"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      section: event.target.value,
                    }))
                  }
                  placeholder="e.g. A"
                  value={form.section}
                />
              </div>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <Button
                disabled={isCreating}
                onClick={closeForm}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isCreating} type="submit">
                {isCreating ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
                {isCreating ? "Creating..." : "Create and email login"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section
        aria-label="Portal users"
        className="overflow-hidden rounded-lg border bg-card shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl border-collapse text-left">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Register number
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Department
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td className="px-5 py-14 text-center text-sm text-slate-400" colSpan={5}>
                    Loading students...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-5 py-14 text-center" colSpan={5}>
                    <Users
                      aria-hidden="true"
                      className="mx-auto size-6 text-muted-foreground"
                    />
                    <p className="mt-3 text-sm font-medium">
                      No students found
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add a student to create their login and email the
                      password.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr className="hover:bg-muted/30" key={user.id}>
                    <td className="px-5 py-4 text-sm font-medium">
                      {user.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {user.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                        {user.role.charAt(0) +
                          user.role.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {user.department || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
