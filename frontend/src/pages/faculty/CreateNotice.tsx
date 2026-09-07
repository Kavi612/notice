import { type FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Clock3,
  GraduationCap,
  LoaderCircle,
  MapPin,
  Phone,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { NoticeCategory, NoticeTemplate } from "@/types";

interface WriteNoticeFormState {
  about: string;
  applicationDeadline: string;
  category: NoticeCategory | "";
  companyName: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  culturalEventKind: string;
  duration: string;
  eligibility: string;
  eventDate: string;
  eventMode: string;
  eventTime: string;
  examHall: string;
  examType: string;
  expiryDate: string;
  itemsToCarry: readonly string[];
  jobRole: string;
  participationType: string;
  prizeDetails: string;
  registrationDeadline: string;
  registrationRequired: string;
  reportingTime: string;
  speakerName: string;
  sportOrEventType: string;
  subject: string;
  targetSection: string;
  targetYear: string;
  template: NoticeTemplate | "";
  title: string;
  venue: string;
}

interface ChoiceOption<T extends string> {
  label: string;
  value: T;
}

const MINIMUM_ABOUT_CHARACTERS = 10;
const MINIMUM_QUICK_DESCRIPTION_CHARACTERS = 10;
const AI_FILL_ERROR =
  "Couldn't generate details, please try again or fill the form manually.";
const GENERATE_NOTICE_ERROR =
  "Couldn't generate the notice, please try again.";
const SESSION_EXPIRED_ERROR =
  "Your session expired, please log in again";

const emptyCategoryExtras: Omit<
  WriteNoticeFormState,
  | "about"
  | "category"
  | "eventDate"
  | "eventTime"
  | "expiryDate"
  | "targetSection"
  | "targetYear"
  | "template"
  | "title"
  | "venue"
> = {
  applicationDeadline: "",
  companyName: "",
  contactEmail: "",
  contactName: "",
  contactPhone: "",
  culturalEventKind: "",
  duration: "",
  eligibility: "",
  eventMode: "",
  examHall: "",
  examType: "",
  itemsToCarry: [],
  jobRole: "",
  participationType: "",
  prizeDetails: "",
  registrationDeadline: "",
  registrationRequired: "",
  reportingTime: "",
  speakerName: "",
  sportOrEventType: "",
  subject: "",
};

const initialWriteFormState: WriteNoticeFormState = {
  about: "",
  category: "",
  eventDate: "",
  eventTime: "",
  expiryDate: "",
  targetSection: "ALL",
  targetYear: "ALL",
  template: "FORMAL_ACADEMIC",
  title: "",
  venue: "",
  ...emptyCategoryExtras,
};

const categoryOptions: readonly ChoiceOption<NoticeCategory>[] = [
  { label: "Examination", value: "EXAMINATION" },
  { label: "Workshop", value: "WORKSHOP" },
  { label: "Seminar", value: "SEMINAR" },
  { label: "Placement", value: "PLACEMENT" },
  { label: "Sports", value: "SPORTS" },
  { label: "Cultural", value: "CULTURAL" },
  { label: "General", value: "GENERAL" },
];

interface GeneratedResourcePerson {
  name?: string;
  designation?: string;
}

interface GenerateFromTextResponse {
  title: string;
  category:
    | "Examination"
    | "Workshop"
    | "Seminar"
    | "Placement"
    | "Sports"
    | "Cultural"
    | "General";
  noticeBody: string;
  department?: string;
  date?: string;
  time?: string;
  venue?: string;
  subjects?: { subject: string; date: string; time: string }[];
  resourcePersons?: GeneratedResourcePerson[];
  companyName?: string;
  eligibility?: string;
  coordinators?: { name: string; role: string }[];
}

function mapGeneratedCategory(
  category: GenerateFromTextResponse["category"] | string,
): NoticeCategory | null {
  const match = categoryOptions.find((option) => option.label === category);
  return match?.value ?? null;
}

function toDateInputValue(raw: string): string | null {
  const trimmed = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const isoDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) {
    return isoDate[1] ?? null;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return null;
  }

  const date = new Date(parsed);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(raw: string): string | null {
  const trimmed = raw.trim();
  const twentyFourHour = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (twentyFourHour) {
    return `${twentyFourHour[1]}:${twentyFourHour[2]}`;
  }

  const match = trimmed.match(
    /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i,
  );

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = match[2] ?? "00";
  const meridiem = match[3]?.replaceAll(".", "").toLowerCase();

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }

  if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  if (Number.isNaN(hours) || hours > 23) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function applyGeneratedNoticeToForm(
  current: WriteNoticeFormState,
  payload: GenerateFromTextResponse,
): WriteNoticeFormState {
  const mappedCategory = payload.category
    ? mapGeneratedCategory(payload.category)
    : null;

  let next: WriteNoticeFormState = { ...current };

  if (mappedCategory && mappedCategory !== current.category) {
    next = {
      ...next,
      ...emptyCategoryExtras,
      category: mappedCategory,
    };
  } else if (mappedCategory) {
    next = { ...next, category: mappedCategory };
  }

  if (typeof payload.title === "string" && payload.title.trim().length > 0) {
    next.title = payload.title.trim();
  }

  if (
    typeof payload.noticeBody === "string" &&
    payload.noticeBody.trim().length > 0
  ) {
    next.about = payload.noticeBody.trim();
  }

  const resourcePersonName = payload.resourcePersons?.[0]?.name;
  if (
    typeof resourcePersonName === "string" &&
    resourcePersonName.trim().length > 0
  ) {
    next.speakerName = resourcePersonName.trim();
  }

  if (typeof payload.date === "string") {
    const eventDate = toDateInputValue(payload.date);
    if (eventDate) {
      next.eventDate = eventDate;
    }
  }

  if (typeof payload.time === "string") {
    const eventTime = toTimeInputValue(payload.time);
    if (eventTime) {
      next.eventTime = eventTime;
    }
  }

  if (typeof payload.venue === "string" && payload.venue.trim().length > 0) {
    next.venue = payload.venue.trim();
  }

  return next;
}

function buildNoticeGenerationText(form: WriteNoticeFormState): string {
  const entries: readonly (readonly [string, string])[] = [
    ["Title", form.title],
    ["Category", form.category],
    ["About the notice", form.about],
    ["Date", form.eventDate],
    ["Time", form.eventTime],
    ["Venue", form.venue],
    ["Expiry date", form.expiryDate],
    ["Resource person", form.speakerName],
    ["Company", form.companyName],
    ["Eligibility", form.eligibility],
    ["Subject", form.subject],
    ["Exam type", form.examType],
    ["Exam hall", form.examHall],
    ["Duration", form.duration],
    ["Target year", form.targetYear],
    ["Target section", form.targetSection],
    ["Contact person", form.contactName],
    ["Contact phone", form.contactPhone],
    ["Contact email", form.contactEmail],
    ["Event mode", form.eventMode],
    ["Job role", form.jobRole],
  ];

  return entries
    .filter(([, value]) => value.trim().length > 0)
    .map(([label, value]) => `${label}: ${value.trim()}`)
    .join("\n");
}

const templateOptions: readonly ChoiceOption<NoticeTemplate>[] = [
  { label: "Formal Academic", value: "FORMAL_ACADEMIC" },
  { label: "Circular", value: "CIRCULAR" },
  { label: "Event", value: "EVENT" },
  { label: "Placement", value: "PLACEMENT" },
];

const yearOptions: readonly ChoiceOption<string>[] = [
  { label: "All years", value: "ALL" },
  { label: "I Year", value: "I" },
  { label: "II Year", value: "II" },
  { label: "III Year", value: "III" },
  { label: "IV Year", value: "IV" },
];

const sectionOptions: readonly ChoiceOption<string>[] = [
  { label: "All sections", value: "ALL" },
  { label: "Section A", value: "A" },
  { label: "Section B", value: "B" },
  { label: "Section C", value: "C" },
  { label: "Section D", value: "D" },
];

const examTypeOptions: readonly ChoiceOption<string>[] = [
  { label: "Internal Assessment", value: "INTERNAL" },
  { label: "Mid-term", value: "MIDTERM" },
  { label: "University Exam", value: "UNIVERSITY" },
  { label: "Practical", value: "PRACTICAL" },
  { label: "Viva", value: "VIVA" },
];

const durationOptions: readonly ChoiceOption<string>[] = [
  { label: "1 hour", value: "1_HOUR" },
  { label: "1.5 hours", value: "1_5_HOURS" },
  { label: "2 hours", value: "2_HOURS" },
  { label: "3 hours", value: "3_HOURS" },
];

const examCarryOptions: readonly ChoiceOption<string>[] = [
  { label: "ID card", value: "ID_CARD" },
  { label: "Hall ticket", value: "HALL_TICKET" },
  { label: "Calculator allowed", value: "CALCULATOR" },
  { label: "No electronic devices", value: "NO_ELECTRONICS" },
];

const eventModeOptions: readonly ChoiceOption<string>[] = [
  { label: "Offline", value: "OFFLINE" },
  { label: "Online", value: "ONLINE" },
  { label: "Hybrid", value: "HYBRID" },
];

const yesNoOptions: readonly ChoiceOption<string>[] = [
  { label: "Yes", value: "YES" },
  { label: "No", value: "NO" },
];

const participationOptions: readonly ChoiceOption<string>[] = [
  { label: "Individual", value: "INDIVIDUAL" },
  { label: "Team", value: "TEAM" },
  { label: "Both", value: "BOTH" },
];

const culturalKindOptions: readonly ChoiceOption<string>[] = [
  { label: "Competition", value: "COMPETITION" },
  { label: "Performance", value: "PERFORMANCE" },
  { label: "Celebration", value: "CELEBRATION" },
];

const placementModeOptions: readonly ChoiceOption<string>[] = [
  { label: "On campus", value: "ON_CAMPUS" },
  { label: "Off campus", value: "OFF_CAMPUS" },
  { label: "Virtual", value: "VIRTUAL" },
];

function getCategoryExtraRequirements(
  formState: WriteNoticeFormState,
): readonly boolean[] {
  switch (formState.category) {
    case "EXAMINATION":
      return [
        formState.examType.length > 0,
        formState.subject.trim().length > 0,
      ];
    case "WORKSHOP":
    case "SEMINAR":
      return [formState.contactName.trim().length > 0];
    case "PLACEMENT":
      return [
        formState.companyName.trim().length > 0,
        formState.contactName.trim().length > 0,
      ];
    case "SPORTS":
    case "CULTURAL":
      return [formState.contactName.trim().length > 0];
    default:
      return [];
  }
}

const fieldClassName =
  "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

function RequiredAsterisk() {
  return (
    <span aria-hidden="true" className="ml-0.5 font-semibold text-red-500">
      *
    </span>
  );
}

function ChoiceGroup<T extends string>({
  disabled,
  label,
  onChange,
  options,
  required = false,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: T) => void;
  options: readonly ChoiceOption<T>[];
  required?: boolean;
  value: T | "";
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-slate-800">
        {label}
        {required ? <RequiredAsterisk /> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "rounded-lg border px-3 py-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                isSelected
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/40",
              )}
              disabled={disabled}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function MultiChoiceGroup({
  disabled,
  label,
  onChange,
  options,
  values,
}: {
  disabled: boolean;
  label: string;
  onChange: (values: readonly string[]) => void;
  options: readonly ChoiceOption<string>[];
  values: readonly string[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-slate-800">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = values.includes(option.value);

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "rounded-lg border px-3 py-2 text-[0.7rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                isSelected
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/40",
              )}
              disabled={disabled}
              key={option.value}
              onClick={() => {
                onChange(
                  isSelected
                    ? values.filter((value) => value !== option.value)
                    : [...values, option.value],
                );
              }}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FormTextField({
  disabled,
  id,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "date" | "time";
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-800" htmlFor={id}>
        {label}
        {required ? <RequiredAsterisk /> : null}
      </Label>
      <Input
        className={fieldClassName}
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </div>
  );
}

function ContactFields({
  disabled,
  formState,
  onChange,
  required,
}: {
  disabled: boolean;
  formState: WriteNoticeFormState;
  onChange: <Key extends keyof WriteNoticeFormState>(
    key: Key,
    value: WriteNoticeFormState[Key],
  ) => void;
  required: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <FormTextField
        disabled={disabled}
        id="contact-name"
        label="Contact person"
        onChange={(value) => onChange("contactName", value)}
        placeholder="Faculty or coordinator name"
        required={required}
        value={formState.contactName}
      />
      <FormTextField
        disabled={disabled}
        id="contact-phone"
        label="Contact number"
        onChange={(value) => onChange("contactPhone", value)}
        placeholder="Phone number"
        type="tel"
        value={formState.contactPhone}
      />
      <FormTextField
        disabled={disabled}
        id="contact-email"
        label="Contact email"
        onChange={(value) => onChange("contactEmail", value)}
        placeholder="department@college.edu"
        type="email"
        value={formState.contactEmail}
      />
    </div>
  );
}

function CategoryDetailsSection({
  disabled,
  formState,
  onChange,
}: {
  disabled: boolean;
  formState: WriteNoticeFormState;
  onChange: <Key extends keyof WriteNoticeFormState>(
    key: Key,
    value: WriteNoticeFormState[Key],
  ) => void;
}) {
  if (formState.category === "") {
    return (
      <section className="rounded-xl border border-dashed bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-slate-800">
          Additional details
        </p>
        <p className="mt-1 text-[0.65rem] text-slate-400">
          Select a category above to see the extra fields for that notice type.
        </p>
      </section>
    );
  }

  const heading =
    formState.category === "EXAMINATION"
      ? {
          icon: GraduationCap,
          title: "Examination details",
          description:
            "Subject, hall, duration, and what students should carry.",
        }
      : formState.category === "PLACEMENT"
        ? {
            icon: Briefcase,
            title: "Placement details",
            description:
              "Company, role, eligibility, and who students should contact.",
          }
        : formState.category === "SPORTS" || formState.category === "CULTURAL"
          ? {
              icon: Trophy,
              title: "Event & contact details",
              description:
                "Registration and a coordinator students can reach for queries.",
            }
          : {
              icon: Phone,
              title: "Additional details",
              description:
                "Speaker or organiser information and who to contact.",
            };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <heading.icon aria-hidden="true" className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-800">{heading.title}</p>
          <p className="text-[0.65rem] text-slate-400">{heading.description}</p>
        </div>
      </div>

      {formState.category === "EXAMINATION" ? (
        <div className="space-y-5">
          <ChoiceGroup
            disabled={disabled}
            label="Exam type"
            onChange={(value) => onChange("examType", value)}
            options={examTypeOptions}
            required
            value={formState.examType}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              disabled={disabled}
              id="exam-subject"
              label="Subject / paper"
              onChange={(value) => onChange("subject", value)}
              placeholder="Subject or paper name"
              required
              value={formState.subject}
            />
            <FormTextField
              disabled={disabled}
              id="exam-hall"
              label="Exam hall / room"
              onChange={(value) => onChange("examHall", value)}
              placeholder="Hall number or room"
              value={formState.examHall}
            />
          </div>
          <ChoiceGroup
            disabled={disabled}
            label="Duration"
            onChange={(value) => onChange("duration", value)}
            options={durationOptions}
            value={formState.duration}
          />
          <FormTextField
            disabled={disabled}
            id="reporting-time"
            label="Reporting time"
            onChange={(value) => onChange("reportingTime", value)}
            type="time"
            value={formState.reportingTime}
          />
          <MultiChoiceGroup
            disabled={disabled}
            label="What students should carry"
            onChange={(values) => onChange("itemsToCarry", values)}
            options={examCarryOptions}
            values={formState.itemsToCarry}
          />
        </div>
      ) : null}

      {formState.category === "WORKSHOP" || formState.category === "SEMINAR" ? (
        <div className="space-y-5">
          <FormTextField
            disabled={disabled}
            id="speaker-name"
            label={
              formState.category === "WORKSHOP"
                ? "Resource person"
                : "Speaker name"
            }
            onChange={(value) => onChange("speakerName", value)}
            placeholder="Name of the speaker or trainer"
            value={formState.speakerName}
          />
          <ChoiceGroup
            disabled={disabled}
            label="Mode"
            onChange={(value) => onChange("eventMode", value)}
            options={eventModeOptions}
            value={formState.eventMode}
          />
          <ChoiceGroup
            disabled={disabled}
            label="Registration required"
            onChange={(value) => onChange("registrationRequired", value)}
            options={yesNoOptions}
            value={formState.registrationRequired}
          />
          <ContactFields
            disabled={disabled}
            formState={formState}
            onChange={onChange}
            required
          />
        </div>
      ) : null}

      {formState.category === "PLACEMENT" ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              disabled={disabled}
              id="company-name"
              label="Company name"
              onChange={(value) => onChange("companyName", value)}
              placeholder="Recruiting company"
              required
              value={formState.companyName}
            />
            <FormTextField
              disabled={disabled}
              id="job-role"
              label="Role / profile"
              onChange={(value) => onChange("jobRole", value)}
              placeholder="Intern, software engineer, etc."
              value={formState.jobRole}
            />
          </div>
          <FormTextField
            disabled={disabled}
            id="eligibility"
            label="Eligibility"
            onChange={(value) => onChange("eligibility", value)}
            placeholder="CGPA, year, department, or backlogs"
            value={formState.eligibility}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              disabled={disabled}
              id="application-deadline"
              label="Last date to apply"
              onChange={(value) => onChange("applicationDeadline", value)}
              type="date"
              value={formState.applicationDeadline}
            />
          </div>
          <ChoiceGroup
            disabled={disabled}
            label="Drive mode"
            onChange={(value) => onChange("eventMode", value)}
            options={placementModeOptions}
            value={formState.eventMode}
          />
          <ContactFields
            disabled={disabled}
            formState={formState}
            onChange={onChange}
            required
          />
        </div>
      ) : null}

      {formState.category === "SPORTS" || formState.category === "CULTURAL" ? (
        <div className="space-y-5">
          {formState.category === "CULTURAL" ? (
            <ChoiceGroup
              disabled={disabled}
              label="Event type"
              onChange={(value) => onChange("culturalEventKind", value)}
              options={culturalKindOptions}
              value={formState.culturalEventKind}
            />
          ) : (
            <FormTextField
              disabled={disabled}
              id="sport-type"
              label="Sport / game"
              onChange={(value) => onChange("sportOrEventType", value)}
              placeholder="Cricket, athletics, indoor games, etc."
              value={formState.sportOrEventType}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <ChoiceGroup
              disabled={disabled}
              label="Participation"
              onChange={(value) => onChange("participationType", value)}
              options={participationOptions}
              value={formState.participationType}
            />
            <FormTextField
              disabled={disabled}
              id="registration-deadline"
              label="Registration deadline"
              onChange={(value) => onChange("registrationDeadline", value)}
              type="date"
              value={formState.registrationDeadline}
            />
          </div>
          <FormTextField
            disabled={disabled}
            id="prize-details"
            label="Prizes / certificates"
            onChange={(value) => onChange("prizeDetails", value)}
            placeholder="Optional prize or certificate details"
            value={formState.prizeDetails}
          />
          <ContactFields
            disabled={disabled}
            formState={formState}
            onChange={onChange}
            required
          />
        </div>
      ) : null}

      {formState.category === "GENERAL" ? (
        <div className="space-y-5">
          <ContactFields
            disabled={disabled}
            formState={formState}
            onChange={onChange}
            required={false}
          />
        </div>
      ) : null}
    </section>
  );
}

export function CreateNotice() {
  const { accessToken, role } = useAuth();
  const navigate = useNavigate();
  const dashboardPath =
    role === "ADMIN" ? "/admin" : role === "HOD" ? "/hod" : "/faculty";
  const generatedNoticePath =
    role === "ADMIN"
      ? "/admin/generated-notice"
      : role === "HOD"
        ? "/hod/generated-notice"
        : "/faculty/generated-notice";
  const [formState, setFormState] =
    useState<WriteNoticeFormState>(initialWriteFormState);
  const [quickDescription, setQuickDescription] = useState("");
  const [isFillingWithAi, setIsFillingWithAi] = useState(false);
  const [aiFillError, setAiFillError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const extraRequirements = getCategoryExtraRequirements(formState);
  const extraFieldsComplete = extraRequirements.every(Boolean);
  const canFillWithAi =
    quickDescription.trim().length >= MINIMUM_QUICK_DESCRIPTION_CHARACTERS;

  const requiredChecks = [
    formState.title.trim().length > 0,
    formState.category !== "",
    formState.expiryDate.length > 0,
    formState.about.trim().length > MINIMUM_ABOUT_CHARACTERS,
    ...extraRequirements,
  ];

  const requiredFieldsComplete =
    requiredChecks.every(Boolean) && extraFieldsComplete;

  const completedRequiredCount = requiredChecks.filter(Boolean).length;

  const updateField = <Key extends keyof WriteNoticeFormState>(
    key: Key,
    value: WriteNoticeFormState[Key],
  ) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const handleFillWithAi = async () => {
    const trimmedDescription = quickDescription.trim();

    if (trimmedDescription.length < MINIMUM_QUICK_DESCRIPTION_CHARACTERS) {
      setAiFillError(
        `Enter at least ${MINIMUM_QUICK_DESCRIPTION_CHARACTERS} characters to fill with AI.`,
      );
      return;
    }

    if (isFillingWithAi) {
      return;
    }

    if (!accessToken) {
      setAiFillError(SESSION_EXPIRED_ERROR);
      return;
    }

    setAiFillError(null);
    setIsFillingWithAi(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/notices/generate-from-text`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: trimmedDescription }),
        },
      );

      if (response.status === 401) {
        setAiFillError(SESSION_EXPIRED_ERROR);
        return;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          "generate-from-text failed",
          response.status,
          errorBody,
        );
        setAiFillError(AI_FILL_ERROR);
        return;
      }

      const payload = (await response.json()) as GenerateFromTextResponse;

      console.log("AI generate-from-text unmapped fields", {
        subjects: payload.subjects,
        companyName: payload.companyName,
        eligibility: payload.eligibility,
        coordinators: payload.coordinators,
      });

      setFormState((current) => applyGeneratedNoticeToForm(current, payload));
    } catch (error) {
      console.error("generate-from-text request failed", error);
      setAiFillError(AI_FILL_ERROR);
    } finally {
      setIsFillingWithAi(false);
    }
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!requiredFieldsComplete || isGenerating) {
      return;
    }

    if (formState.category === "") {
      return;
    }

    if (!accessToken) {
      setGenerateError(SESSION_EXPIRED_ERROR);
      return;
    }

    const requestUrl = `${API_BASE_URL}/notices/generate-from-text`;
    const requestBody = { text: buildNoticeGenerationText(formState) };

    setGenerateError(null);
    setIsGenerating(true);

    try {
      console.log("About to call API", { url: requestUrl, body: requestBody });

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        setGenerateError(SESSION_EXPIRED_ERROR);
        return;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.log("API call failed", response.status, errorBody);
        setGenerateError(GENERATE_NOTICE_ERROR);
        return;
      }

      const payload = (await response.json()) as GenerateFromTextResponse;
      console.log("API call succeeded", payload);

      const generatedTitle =
        payload.title?.trim() || formState.title.trim();
      const generatedContent =
        payload.noticeBody?.trim() || formState.about.trim();
      const suggestedCategory =
        mapGeneratedCategory(payload.category) ?? formState.category;

      if (!generatedTitle || !generatedContent || !suggestedCategory) {
        setGenerateError(GENERATE_NOTICE_ERROR);
        return;
      }

      navigate(generatedNoticePath, {
        state: {
          generatedContent,
          generatedTitle,
          imageUrl: null,
          suggestedCategory,
          department: payload.department?.trim() || "General",
          targetYear: formState.targetYear,
          targetSection: formState.targetSection,
          template: formState.template || "FORMAL_ACADEMIC",
          extractedFields: {
            companyName: payload.companyName,
            coordinators: payload.coordinators,
            date: payload.date,
            eligibility: payload.eligibility,
            resourcePersons: payload.resourcePersons,
            subjects: payload.subjects,
            time: payload.time,
            venue: payload.venue,
          },
        },
      });
    } catch (error) {
      console.log("API call failed", error);
      setGenerateError(GENERATE_NOTICE_ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/80 px-6 py-6 shadow-soft">
        <div
          aria-hidden="true"
          className="absolute right-8 top-1 grid grid-cols-3 gap-2 opacity-20"
        >
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              className="size-1 rounded-full bg-indigo-500"
              key={index}
            />
          ))}
        </div>
        <Link
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          to={dashboardPath}
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to dashboard
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          AI Notice Creator
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Create a notice
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
          Fill in the event details or describe it in your own words. Required
          fields are marked with a red asterisk.
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleGenerate}>
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-xs font-semibold text-slate-800">
                Quick description (optional)
              </p>
              <p className="mt-0.5 text-[0.65rem] text-slate-400">
                Describe the event in your own words and we'll fill in the
                details below — you can still edit everything after.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <Textarea
                disabled={isFillingWithAi}
                id="quick-description"
                onChange={(event) => {
                  setAiFillError(null);
                  setQuickDescription(event.target.value);
                }}
                placeholder="e.g. Workshop on Python Full Stack Development on 19 August, 10am to 3:40pm, DSP VLSI Lab, resource persons Mr. Hameed Husain and Mr. Senthil Pandi..."
                rows={4}
                value={quickDescription}
              />

              {quickDescription.trim().length > 0 &&
              quickDescription.trim().length <
                MINIMUM_QUICK_DESCRIPTION_CHARACTERS ? (
                <p className="text-[0.65rem] text-slate-400">
                  Enter at least {MINIMUM_QUICK_DESCRIPTION_CHARACTERS}{" "}
                  characters to fill with AI.
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  className="bg-linear-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
                  disabled={!canFillWithAi || isFillingWithAi}
                  onClick={() => {
                    void handleFillWithAi();
                  }}
                  type="button"
                >
                  {isFillingWithAi ? (
                    <>
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles aria-hidden="true" className="size-4" />
                      Fill with AI
                    </>
                  )}
                </Button>

                {aiFillError ? (
                  <p
                    className="flex items-start gap-2 text-xs text-destructive"
                    role="alert"
                  >
                    <AlertCircle
                      aria-hidden="true"
                      className="mt-0.5 size-3.5 shrink-0"
                    />
                    {aiFillError}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Event details
                </p>
                <p className="mt-0.5 text-[0.65rem] text-slate-400">
                  These fields will be sent to Groq to draft the notice.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[0.65rem] font-semibold text-indigo-700">
                {completedRequiredCount}/{requiredChecks.length} required
              </span>
            </div>

            <div className="space-y-5 p-5">
              <div className="space-y-2">
                <Label
                  className="text-xs font-semibold text-slate-800"
                  htmlFor="event-name"
                >
                  Event / notice name
                  <RequiredAsterisk />
                </Label>
                <Input
                  className={fieldClassName}
                  disabled={isGenerating}
                  id="event-name"
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Enter the event or notice title"
                  required
                  value={formState.title}
                />
              </div>

              <ChoiceGroup
                disabled={isGenerating}
                label="Category"
                onChange={(value) => {
                  setFormState((current) => ({
                    ...current,
                    ...emptyCategoryExtras,
                    category: value,
                  }));
                }}
                options={categoryOptions}
                required
                value={formState.category}
              />

              <div className="space-y-2">
                <Label
                  className="text-xs font-semibold text-slate-800"
                  htmlFor="notice-about"
                >
                  About the notice
                  <RequiredAsterisk />
                </Label>
                <Textarea
                  disabled={isGenerating}
                  id="notice-about"
                  onChange={(event) => updateField("about", event.target.value)}
                  placeholder="Describe what students or faculty need to know."
                  rows={5}
                  value={formState.about}
                />
                <p className="text-[0.65rem] text-slate-400">
                  Add more than {MINIMUM_ABOUT_CHARACTERS} characters so Groq
                  has enough context.
                </p>
              </div>
            </div>
          </section>

          <CategoryDetailsSection
            disabled={isGenerating}
            formState={formState}
            onChange={updateField}
          />

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Users aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Audience
                  </p>
                  <p className="text-[0.65rem] text-slate-400">
                    Choose who should receive this notice.
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <ChoiceGroup
                  disabled={isGenerating}
                  label="Target year"
                  onChange={(value) => updateField("targetYear", value)}
                  options={yearOptions}
                  value={formState.targetYear}
                />
                <ChoiceGroup
                  disabled={isGenerating}
                  label="Target section"
                  onChange={(value) => updateField("targetSection", value)}
                  options={sectionOptions}
                  value={formState.targetSection}
                />
                <ChoiceGroup
                  disabled={isGenerating}
                  label="Template"
                  onChange={(value) => updateField("template", value)}
                  options={templateOptions}
                  value={formState.template}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <CalendarDays aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Schedule
                  </p>
                  <p className="text-[0.65rem] text-slate-400">
                    Date, time, venue, and expiry for the notice.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    className="text-xs font-semibold text-slate-800"
                    htmlFor="event-date"
                  >
                    Event date
                  </Label>
                  <Input
                    className={fieldClassName}
                    disabled={isGenerating}
                    id="event-date"
                    onChange={(event) =>
                      updateField("eventDate", event.target.value)
                    }
                    type="date"
                    value={formState.eventDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    className="text-xs font-semibold text-slate-800"
                    htmlFor="event-time"
                  >
                    Event time
                  </Label>
                  <div className="relative">
                    <Clock3
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      className={cn(fieldClassName, "pl-9")}
                      disabled={isGenerating}
                      id="event-time"
                      onChange={(event) =>
                        updateField("eventTime", event.target.value)
                      }
                      type="time"
                      value={formState.eventTime}
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    className="text-xs font-semibold text-slate-800"
                    htmlFor="event-venue"
                  >
                    Venue
                  </Label>
                  <div className="relative">
                    <MapPin
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      className={cn(fieldClassName, "pl-9")}
                      disabled={isGenerating}
                      id="event-venue"
                      onChange={(event) =>
                        updateField("venue", event.target.value)
                      }
                      placeholder="Seminar hall, lab, or campus location"
                      value={formState.venue}
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    className="text-xs font-semibold text-slate-800"
                    htmlFor="expiry-date"
                  >
                    Expiry date
                    <RequiredAsterisk />
                  </Label>
                  <Input
                    className={fieldClassName}
                    disabled={isGenerating}
                    id="expiry-date"
                    min={formState.eventDate || undefined}
                    onChange={(event) =>
                      updateField("expiryDate", event.target.value)
                    }
                    required
                    type="date"
                    value={formState.expiryDate}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.65rem] leading-5 text-slate-400">
              Groq will turn this structured information into a professional
              departmental notice. Extra fields change with the category you
              pick.
            </p>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {generateError ? (
                <p
                  className="flex items-start gap-2 text-xs text-destructive"
                  role="alert"
                >
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0"
                  />
                  {generateError}
                </p>
              ) : null}
              <Button
                className="bg-linear-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
                disabled={!requiredFieldsComplete || isGenerating}
                size="lg"
                type="submit"
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles aria-hidden="true" className="size-4" />
                    Generate Notice
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
}
