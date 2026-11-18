import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Edit3,
  LoaderCircle,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { NoticeCanvasDownload } from "@/components/NoticeCanvasDownload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import {
  deleteDepartmentNotice,
  getDepartmentNoticeById,
  publishDepartmentNotice,
  SESSION_EXPIRED_ERROR,
  updateDepartmentNotice,
} from "@/lib/noticeApi";
import { cn } from "@/lib/utils";
import type { DepartmentNotice, TargetRole } from "@/types/notice";
import { TARGET_ROLE_OPTIONS } from "@/types/notice";

const audienceBadgeStyles: Record<TargetRole, string> = {
  HOD: "bg-indigo-50 text-indigo-700 border-indigo-200",
  FACULTY: "bg-blue-50 text-blue-700 border-blue-200",
  STUDENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function PrincipalNoticeDetails() {
  const params = useParams<{ id?: string; noticeId?: string }>();
  const noticeId = params.id || params.noticeId;
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [notice, setNotice] = useState<DepartmentNotice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editRoles, setEditRoles] = useState<TargetRole[]>([]);
  const [editStatus, setEditStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation State
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadNotice = async () => {
      if (!noticeId) {
        return;
      }

      if (!accessToken) {
        setErrorMessage(SESSION_EXPIRED_ERROR);
        navigate("/login");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await getDepartmentNoticeById(noticeId, accessToken);
        if (!isCancelled) {
          setNotice(data);
          setEditTitle(data.title);
          setEditBody(data.body);
          setEditRoles(data.target_roles || []);
          setEditStatus(data.status);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load notice details.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadNotice();

    return () => {
      isCancelled = true;
    };
  }, [noticeId, accessToken, navigate]);

  const handleUpdate = async () => {
    if (!noticeId || !accessToken) {
      return;
    }

    if (!editTitle.trim()) {
      setErrorMessage("Title cannot be empty.");
      return;
    }

    if (editRoles.length === 0) {
      setErrorMessage("At least one target role must be selected.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated = await updateDepartmentNotice(
        noticeId,
        {
          title: editTitle.trim(),
          body: editBody.trim(),
          target_roles: editRoles,
          status: editStatus,
        },
        accessToken,
      );

      setNotice(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update notice.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noticeId || !accessToken) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteDepartmentNotice(noticeId, accessToken);
      navigate("/principal/notices");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete notice.");
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const handlePublish = async () => {
    if (!notice || !accessToken) {
      return;
    }

    if (!notice.target_roles || notice.target_roles.length === 0) {
      setErrorMessage(
        "Target audience cannot be empty. Please select at least one role before publishing.",
      );
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const updated = await publishDepartmentNotice(notice, accessToken);
      setNotice(updated);
      setEditStatus("PUBLISHED");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to publish notice.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl py-20 text-center text-sm text-slate-500">
        <LoaderCircle className="mx-auto size-7 animate-spin text-indigo-600 mb-3" />
        Loading notice details...
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          to="/principal/notices"
        >
          <ArrowLeft className="size-4" />
          Back to notices
        </Link>
        <div className="rounded-2xl border bg-white p-12 text-center shadow-soft">
          <p className="text-base font-semibold text-slate-800">Notice Not Found</p>
          <p className="mt-1 text-xs text-slate-400">
            {errorMessage || "This notice does not exist or you do not have permission to view it."}
          </p>
        </div>
      </div>
    );
  }

  const displayDate = notice.notice_date || notice.created_at;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          to="/principal/notices"
        >
          <ArrowLeft className="size-4" />
          Back to all notices
        </Link>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <NoticeCanvasDownload
            body={notice.body}
            category={notice.category}
            department={notice.department}
            noticeDate={notice.notice_date}
            title={notice.title}
          />

          {notice.status === "DRAFT" && !isEditing && (
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={isPublishing}
              onClick={handlePublish}
              type="button"
            >
              {isPublishing ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Publish
                </>
              )}
            </Button>
          )}

          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              type="button"
              variant="outline"
            >
              <Edit3 className="size-4" />
              Edit Notice
            </Button>
          )}

          {!isConfirmingDelete ? (
            <Button
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setIsConfirmingDelete(true)}
              type="button"
              variant="outline"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-1.5">
              <span className="text-xs font-semibold text-destructive px-2">Confirm?</span>
              <Button
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={handleDelete}
                size="sm"
                type="button"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </Button>
              <Button
                disabled={isDeleting}
                onClick={() => setIsConfirmingDelete(false)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Notice Article */}
      <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <div className="h-2 bg-indigo-600" />

        <div className="p-7 sm:p-10 space-y-6">
          <header className="border-b border-slate-100 pb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {notice.category}
              </span>

              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  notice.status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200",
                )}
              >
                {notice.status}
              </span>

              {/* Target Audience Badges */}
              <div className="flex items-center gap-1.5 ml-auto">
                <Users className="size-3.5 text-slate-400" />
                <span className="text-[0.65rem] font-medium text-slate-400">Audience:</span>
                {notice.target_roles && notice.target_roles.map((role) => (
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold",
                      audienceBadgeStyles[role] || "bg-slate-50 text-slate-700",
                    )}
                    key={role}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Edit Title</Label>
                  <Input
                    className="mt-1"
                    onChange={(e) => setEditTitle(e.target.value)}
                    value={editTitle}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Status</Label>
                  <div className="mt-1 flex gap-2">
                    {(["PUBLISHED", "DRAFT"] as const).map((st) => (
                      <button
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors",
                          editStatus === st
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200",
                        )}
                        key={st}
                        onClick={() => setEditStatus(st)}
                        type="button"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Audience</Label>
                  <div className="mt-1 flex gap-2">
                    {TARGET_ROLE_OPTIONS.map((opt) => {
                      const checked = editRoles.includes(opt.value);
                      return (
                        <label
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer",
                            checked ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-white border-slate-200",
                          )}
                          key={opt.value}
                        >
                          <input
                            checked={checked}
                            className="size-3.5 rounded text-indigo-600"
                            onChange={() => {
                              setEditRoles((prev) =>
                                prev.includes(opt.value)
                                  ? prev.filter((r) => r !== opt.value)
                                  : [...prev, opt.value],
                              );
                            }}
                            type="checkbox"
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-950">
                {notice.title}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{notice.author_name}</span>
              <span>·</span>
              <span>{notice.department}</span>
              <span>·</span>
              <time dateTime={displayDate}>
                {dateFormatter.format(new Date(displayDate))}
              </time>
            </div>
          </header>

          {/* Body Content */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Edit Body Text</Label>
                <Textarea
                  className="mt-1 min-h-64 font-sans text-sm leading-relaxed"
                  onChange={(e) => setEditBody(e.target.value)}
                  value={editBody}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                  type="button"
                  variant="outline"
                >
                  <X className="size-4" />
                  Cancel
                </Button>
                <Button
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                  disabled={isSaving}
                  onClick={handleUpdate}
                  type="button"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap py-4 text-sm leading-8 text-slate-800">
              {notice.body}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
