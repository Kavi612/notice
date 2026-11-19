import { type FormEvent, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  LoaderCircle,
  Send,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import type { DemoSample } from "@/lib/demoSamples";
import { DEMO_SAMPLES } from "@/lib/demoSamples";
import { createDepartmentNotice, SESSION_EXPIRED_ERROR } from "@/lib/noticeApi";
import { cn } from "@/lib/utils";
import type { NoticeCategory, NoticeTemplate } from "@/types";
import { TARGET_ROLE_OPTIONS, type TargetRole } from "@/types/notice";

export interface CreateNoticeProps {
  role?: "PRINCIPAL" | "HOD" | "FACULTY";
  allowedTargetRoles?: TargetRole[];
  demoSamples?: readonly DemoSample[];
  defaultDepartment?: string;
  defaultContactName?: string;
  defaultContactEmail?: string;
  successRedirect?: string;
  headerBadge?: string;
  headerTitle?: string;
  headerDescription?: string;
}

interface PrincipalFormState {
  title: string;
  body: string;
  department: string;
  category: NoticeCategory | "";
  priority: "REGULAR" | "URGENT";
  noticeDate: string;
  targetRoles: TargetRole[];
  template: NoticeTemplate;
  venue: string;
  eventDate: string;
  eventTime: string;
  speakerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const initialFormState: PrincipalFormState = {
  title: "",
  body: "",
  department: "All Departments",
  category: "GENERAL",
  priority: "REGULAR",
  noticeDate: new Date().toISOString().slice(0, 10),
  targetRoles: ["HOD", "FACULTY", "STUDENT"],
  template: "FORMAL_ACADEMIC",
  venue: "",
  eventDate: "",
  eventTime: "",
  speakerName: "",
  contactName: "Office of the Principal",
  contactEmail: "principal@college.edu",
  contactPhone: "+91 9876543210",
};

const categoryOptions: { label: string; value: NoticeCategory }[] = [
  { label: "General", value: "GENERAL" },
  { label: "Examination", value: "EXAMINATION" },
  { label: "Workshop", value: "WORKSHOP" },
  { label: "Seminar", value: "SEMINAR" },
  { label: "Placement", value: "PLACEMENT" },
  { label: "Sports", value: "SPORTS" },
  { label: "Cultural", value: "CULTURAL" },
];

const templateOptions: { label: string; value: NoticeTemplate }[] = [
  { label: "Formal Academic", value: "FORMAL_ACADEMIC" },
  { label: "Circular", value: "CIRCULAR" },
  { label: "Event", value: "EVENT" },
  { label: "Placement", value: "PLACEMENT" },
];

export function CreatePrincipalNotice({
  role = "PRINCIPAL",
  allowedTargetRoles = ["HOD", "FACULTY", "STUDENT"],
  demoSamples = DEMO_SAMPLES,
  defaultDepartment = "All Departments",
  defaultContactName = "Office of the Principal",
  defaultContactEmail = "principal@college.edu",
  successRedirect = "/principal/notices",
  headerBadge = "Executive notice dispatch",
  headerTitle = "Create Notice",
  headerDescription = "Draft official notifications, target specific campus audiences, and dispatch institution-wide circulars.",
}: CreateNoticeProps = {}) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState<PrincipalFormState>(() => ({
    ...initialFormState,
    department: defaultDepartment,
    contactName: defaultContactName,
    contactEmail: defaultContactEmail,
    targetRoles: [...allowedTargetRoles],
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableTargetRoles = TARGET_ROLE_OPTIONS.filter((opt) =>
    allowedTargetRoles.includes(opt.value),
  );

  const updateField = <K extends keyof PrincipalFormState>(
    field: K,
    value: PrincipalFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (roleToToggle: TargetRole) => {
    const current = formState.targetRoles;
    const exists = current.includes(roleToToggle);
    // Don't allow unchecking if it's the only allowed target role
    if (exists && current.length === 1 && allowedTargetRoles.length === 1) {
      return;
    }
    const updated = exists
      ? current.filter((r) => r !== roleToToggle)
      : [...current, roleToToggle];
    updateField("targetRoles", updated);
  };

  const handleSelectSample = (sampleIndexStr: string) => {
    if (!sampleIndexStr) {
      return;
    }
    const index = parseInt(sampleIndexStr, 10);
    const sample = demoSamples[index];
    if (!sample) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      title: sample.title,
      body: sample.body,
      department: sample.department,
      category: sample.category,
      priority: sample.priority,
      targetRoles: sample.targetRoles.filter((r) => allowedTargetRoles.includes(r)),
      noticeDate: sample.noticeDate || new Date().toISOString().slice(0, 10),
    }));
  };

  const handleSubmit = async (e: FormEvent, status: "DRAFT" | "PUBLISHED") => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accessToken) {
      setErrorMessage(SESSION_EXPIRED_ERROR);
      navigate("/login");
      return;
    }

    if (!formState.title.trim()) {
      setErrorMessage("Please enter a notice title.");
      return;
    }

    if (!formState.body.trim()) {
      setErrorMessage("Please enter the notice body / description.");
      return;
    }

    if (formState.targetRoles.length === 0) {
      setErrorMessage("Please select at least one target audience.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build enriched body if category fields are provided
      let composedBody = formState.body.trim();
      const metaParts: string[] = [];

      if (formState.venue.trim()) {
        metaParts.push(`Venue: ${formState.venue.trim()}`);
      }
      if (formState.eventDate) {
        metaParts.push(`Date: ${formState.eventDate}`);
      }
      if (formState.eventTime) {
        metaParts.push(`Time: ${formState.eventTime}`);
      }
      if (formState.speakerName.trim()) {
        metaParts.push(`Speaker / Resource Person: ${formState.speakerName.trim()}`);
      }
      if (formState.contactName.trim()) {
        metaParts.push(`Contact: ${formState.contactName.trim()} (${formState.contactEmail} / ${formState.contactPhone})`);
      }

      if (metaParts.length > 0 && !composedBody.includes("Venue:")) {
        composedBody += "\n\n" + metaParts.join("\n");
      }

      await createDepartmentNotice(
        {
          title: formState.title.trim(),
          body: composedBody,
          department: formState.department.trim() || defaultDepartment,
          category: formState.category || "GENERAL",
          priority: formState.priority,
          notice_date: formState.noticeDate,
          status,
          target_roles: formState.targetRoles,
          author_role: role,
          author_name: formState.contactName.trim() || defaultContactName,
        },
        accessToken,
      );

      navigate(successRedirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create notice.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    sessionStorage.setItem("principal_preview_notice", JSON.stringify(formState));
    navigate("/principal/notice-preview");
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          {headerBadge}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {headerTitle}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          {headerDescription}
        </p>
      </header>

      {errorMessage && (
        <div
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="space-y-6" onSubmit={(e) => handleSubmit(e, "PUBLISHED")}>
        {import.meta.env.DEV && demoSamples.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-xs font-semibold text-indigo-950" htmlFor="demo-sample-select">
                Fill Demo Sample
              </Label>
              <p className="text-[0.7rem] text-indigo-600">
                Presentation helper to quickly demonstrate audience rules
              </p>
            </div>
            <select
              className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-950 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              defaultValue=""
              id="demo-sample-select"
              onChange={(e) => handleSelectSample(e.target.value)}
            >
              <option disabled value="">
                -- Select a Demo Sample --
              </option>
              {demoSamples.map((sample, idx) => (
                <option key={sample.label} value={idx}>
                  {sample.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Basic Details Section */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-5">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">
            Notice Details
          </h2>

          <div>
            <Label className="text-xs font-semibold text-slate-700" htmlFor="notice-title">
              Notice title <span className="text-destructive">*</span>
            </Label>
            <Input
              className="mt-1.5"
              disabled={isSubmitting}
              id="notice-title"
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g., Annual Academic Performance Review & Budget Allocation"
              required
              value={formState.title}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700" htmlFor="notice-dept">
                Issuing Department / Office
              </Label>
              <Input
                className="mt-1.5"
                disabled={isSubmitting}
                id="notice-dept"
                onChange={(e) => updateField("department", e.target.value)}
                placeholder="Office of the Principal / All Departments"
                value={formState.department}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700" htmlFor="notice-date">
                Notice Date
              </Label>
              <Input
                className="mt-1.5"
                disabled={isSubmitting}
                id="notice-date"
                onChange={(e) => updateField("noticeDate", e.target.value)}
                type="date"
                value={formState.noticeDate}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Category</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {categoryOptions.map((opt) => (
                  <button
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors",
                      formState.category === opt.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                    key={opt.value}
                    onClick={() => updateField("category", opt.value)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Priority</Label>
              <div className="mt-1.5 flex gap-2">
                {(["REGULAR", "URGENT"] as const).map((pr) => (
                  <button
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-semibold border transition-colors",
                      formState.priority === pr
                        ? pr === "URGENT"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                    key={pr}
                    onClick={() => updateField("priority", pr)}
                    type="button"
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Target Audience Section - Replaces Year/Section Selector */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="size-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-800">
                Target Audience <span className="text-destructive">*</span>
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Select which groups should receive and view this notice. Backend rules strictly enforce visibility based on your selection.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {availableTargetRoles.map((opt) => {
              const checked = formState.targetRoles.includes(opt.value);
              return (
                <label
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all text-xs font-medium",
                    checked
                      ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                  )}
                  key={opt.value}
                >
                  <input
                    checked={checked}
                    className="size-4 rounded text-indigo-600 focus:ring-indigo-500"
                    onChange={() => handleRoleToggle(opt.value)}
                    type="checkbox"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Notice Content Section */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-5">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">
            Content & Body
          </h2>

          <div>
            <Label className="text-xs font-semibold text-slate-700" htmlFor="notice-body">
              Notice Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              className="mt-1.5 min-h-48 text-sm"
              disabled={isSubmitting}
              id="notice-body"
              onChange={(e) => updateField("body", e.target.value)}
              placeholder="Write the full text of the circular, announcement, or instructions here..."
              required
              value={formState.body}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Display Template</Label>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-4">
              {templateOptions.map((tpl) => (
                <button
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all text-xs",
                    formState.template === tpl.value
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                  key={tpl.value}
                  onClick={() => updateField("template", tpl.value)}
                  type="button"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Optional Event Details */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays className="size-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-800">
              Event & Contact Details (Optional)
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700" htmlFor="event-venue">
                Venue
              </Label>
              <Input
                className="mt-1.5"
                disabled={isSubmitting}
                id="event-venue"
                onChange={(e) => updateField("venue", e.target.value)}
                placeholder="Auditorium / Board Room"
                value={formState.venue}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700" htmlFor="event-date">
                Event Date
              </Label>
              <Input
                className="mt-1.5"
                disabled={isSubmitting}
                id="event-date"
                onChange={(e) => updateField("eventDate", e.target.value)}
                type="date"
                value={formState.eventDate}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700" htmlFor="event-time">
                Event Time
              </Label>
              <Input
                className="mt-1.5"
                disabled={isSubmitting}
                id="event-time"
                onChange={(e) => updateField("eventTime", e.target.value)}
                type="time"
                value={formState.eventTime}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700" htmlFor="contact-name">
                Signatory / Contact Name
              </Label>
              <Input
                className="mt-1.5"
                disabled={isSubmitting}
                id="contact-name"
                onChange={(e) => updateField("contactName", e.target.value)}
                value={formState.contactName}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700" htmlFor="contact-email">
                Contact Email
              </Label>
              <Input
                className="mt-1.5"
                disabled={isSubmitting}
                id="contact-email"
                onChange={(e) => updateField("contactEmail", e.target.value)}
                type="email"
                value={formState.contactEmail}
              />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            disabled={isSubmitting}
            onClick={handlePreview}
            type="button"
            variant="outline"
          >
            Preview Notice
          </Button>

          <div className="flex items-center gap-3">
            <Button
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, "DRAFT")}
              type="button"
              variant="outline"
            >
              Save as Draft
            </Button>

            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Publish Notice
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
