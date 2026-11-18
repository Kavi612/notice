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
import { PrincipalLayout } from "@/layouts/PrincipalLayout";
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
import { PrincipalLogin } from "@/pages/auth/PrincipalLogin";
import { StudentLogin } from "@/pages/auth/StudentLogin";
import { CreateFacultyNotice } from "@/pages/faculty/CreateFacultyNotice";
import { EditDraftRoute } from "@/pages/faculty/EditDraftRoute";
import { FacultyDashboardRoute } from "@/pages/faculty/FacultyDashboardRoute";
import { FacultyNoticesRoute } from "@/pages/faculty/FacultyNoticesRoute";
import { GeneratedNoticeRoute } from "@/pages/faculty/GeneratedNoticeRoute";
import { NoticePreviewRoute } from "@/pages/faculty/NoticePreviewRoute";
import { CreateHodNotice } from "@/pages/hod/CreateHodNotice";
import { FacultyInbox, HodInbox, StudentInbox } from "@/pages/inbox/RoleInbox";
import { CreatePrincipalNotice } from "@/pages/principal/CreatePrincipalNotice";
import { PrincipalDashboard } from "@/pages/principal/PrincipalDashboard";
import { PrincipalNoticeDetails } from "@/pages/principal/PrincipalNoticeDetails";
import { PrincipalNotices } from "@/pages/principal/PrincipalNotices";
import { PrincipalPreview } from "@/pages/principal/PrincipalPreview";
import {
  AllNoticesRoute,
  NoticeDetailsRoute,
  StudentDashboardRoute,
} from "@/pages/student/StudentRouteAdapters";

const PRINCIPAL_ROLES = ["PRINCIPAL"] as const;
const HOD_ROLES = ["HOD", "ADMIN"] as const;
const FACULTY_ROLES = ["FACULTY"] as const;
const STUDENT_ROLES = ["STUDENT"] as const;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Login />} path="/login" />
          <Route element={<PrincipalLogin />} path="/login/principal" />
          <Route element={<HodLogin />} path="/login/hod" />
          <Route element={<FacultyLogin />} path="/login/faculty" />
          <Route element={<StudentLogin />} path="/login/student" />

          <Route
            element={<ProtectedRoute allowedRoles={PRINCIPAL_ROLES} />}
            path="/principal"
          >
            <Route element={<PrincipalLayout />}>
              <Route element={<PrincipalDashboard />} index />
              <Route element={<CreatePrincipalNotice />} path="create-notice" />
              <Route element={<PrincipalNotices />} path="notices" />
              <Route element={<PrincipalNoticeDetails />} path="notices/:id" />
              <Route element={<PrincipalNoticeDetails />} path="notices/:noticeId" />
              <Route element={<PrincipalPreview />} path="preview" />
              <Route element={<PrincipalPreview />} path="notice-preview" />
            </Route>
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={FACULTY_ROLES} />}
            path="/faculty"
          >
            <Route element={<FacultyLayout />}>
              <Route element={<FacultyDashboardRoute />} index />
              <Route element={<FacultyInbox />} path="inbox" />
              <Route element={<FacultyNoticesRoute />} path="notices" />
              <Route element={<EditDraftRoute />} path="notices/:noticeId" />
              <Route element={<EditDraftRoute />} path="notices/:noticeId/edit" />
              <Route element={<CreateFacultyNotice />} path="create-notice" />
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
              <Route element={<StudentInbox />} path="inbox" />
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
              <Route element={<HodInbox />} path="inbox" />
              <Route element={<UserManagementRoute />} path="users" />
              <Route
                element={<NoticeManagementRoute />}
                path="notices"
              />
              <Route element={<EditDraftRoute />} path="notices/:noticeId" />
              <Route element={<EditDraftRoute />} path="notices/:noticeId/edit" />
              <Route element={<CreateHodNotice />} path="create-notice" />
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
              <Route element={<HodInbox />} path="inbox" />
              <Route element={<UserManagementRoute />} path="users" />
              <Route
                element={<NoticeManagementRoute />}
                path="notices"
              />
              <Route element={<EditDraftRoute />} path="notices/:noticeId" />
              <Route element={<EditDraftRoute />} path="notices/:noticeId/edit" />
              <Route element={<CreateHodNotice />} path="create-notice" />
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
