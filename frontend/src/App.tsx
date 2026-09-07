import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminLayout } from "@/layouts/AdminLayout";
import { FacultyLayout } from "@/layouts/FacultyLayout";
import { StudentLayout } from "@/layouts/StudentLayout";
import { Login } from "@/pages/Login";
import {
  AdminDashboardRoute,
  ArchiveViewRoute,
  NoticeManagementRoute,
  UserManagementRoute,
} from "@/pages/admin/AdminRouteAdapters";
import { FacultyLogin } from "@/pages/auth/FacultyLogin";
import { HodLogin } from "@/pages/auth/HodLogin";
import { StudentLogin } from "@/pages/auth/StudentLogin";
import { CreateNotice } from "@/pages/faculty/CreateNotice";
import { EditDraftRoute } from "@/pages/faculty/EditDraftRoute";
import { FacultyDashboardRoute } from "@/pages/faculty/FacultyDashboardRoute";
import { FacultyNoticesRoute } from "@/pages/faculty/FacultyNoticesRoute";
import { GeneratedNoticeRoute } from "@/pages/faculty/GeneratedNoticeRoute";
import { NoticePreviewRoute } from "@/pages/faculty/NoticePreviewRoute";
import {
  AllNoticesRoute,
  NoticeDetailsRoute,
  StudentDashboardRoute,
} from "@/pages/student/StudentRouteAdapters";

const HOD_ROLES = ["HOD", "ADMIN"] as const;
const FACULTY_ROLES = ["FACULTY"] as const;
const STUDENT_ROLES = ["STUDENT"] as const;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Login />} path="/login" />
          <Route element={<HodLogin />} path="/login/hod" />
          <Route element={<FacultyLogin />} path="/login/faculty" />
          <Route element={<StudentLogin />} path="/login/student" />

          <Route
            element={<ProtectedRoute allowedRoles={FACULTY_ROLES} />}
            path="/faculty"
          >
            <Route element={<FacultyLayout />}>
              <Route element={<FacultyDashboardRoute />} index />
              <Route element={<FacultyNoticesRoute />} path="notices" />
              <Route element={<EditDraftRoute />} path="notices/:noticeId" />
              <Route element={<EditDraftRoute />} path="notices/:noticeId/edit" />
              <Route element={<CreateNotice />} path="create-notice" />
              <Route
                element={<GeneratedNoticeRoute />}
                path="generated-notice"
              />
              <Route
                element={<NoticePreviewRoute />}
                path="notice-preview"
              />
            </Route>
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={STUDENT_ROLES} />}
            path="/student"
          >
            <Route element={<StudentLayout />}>
              <Route element={<StudentDashboardRoute />} index />
              <Route element={<AllNoticesRoute />} path="notices" />
              <Route
                element={<NoticeDetailsRoute />}
                path="notices/:noticeId"
              />
            </Route>
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={HOD_ROLES} />}
            path="/admin"
          >
            <Route element={<AdminLayout />}>
              <Route element={<AdminDashboardRoute />} index />
              <Route element={<UserManagementRoute />} path="users" />
              <Route
                element={<NoticeManagementRoute />}
                path="notices"
              />
              <Route element={<EditDraftRoute />} path="notices/:noticeId" />
              <Route element={<EditDraftRoute />} path="notices/:noticeId/edit" />
              <Route element={<CreateNotice />} path="create-notice" />
              <Route
                element={<GeneratedNoticeRoute />}
                path="generated-notice"
              />
              <Route
                element={<NoticePreviewRoute />}
                path="notice-preview"
              />
              <Route element={<ArchiveViewRoute />} path="archive" />
            </Route>
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={HOD_ROLES} />}
            path="/hod"
          >
            <Route element={<AdminLayout />}>
              <Route element={<AdminDashboardRoute />} index />
              <Route element={<UserManagementRoute />} path="users" />
              <Route
                element={<NoticeManagementRoute />}
                path="notices"
              />
              <Route element={<EditDraftRoute />} path="notices/:noticeId" />
              <Route element={<EditDraftRoute />} path="notices/:noticeId/edit" />
              <Route element={<CreateNotice />} path="create-notice" />
              <Route
                element={<GeneratedNoticeRoute />}
                path="generated-notice"
              />
              <Route
                element={<NoticePreviewRoute />}
                path="notice-preview"
              />
              <Route element={<ArchiveViewRoute />} path="archive" />
            </Route>
          </Route>

          <Route element={<Navigate replace to="/login" />} path="*" />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
