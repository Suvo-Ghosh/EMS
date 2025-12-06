import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import Employees from "./pages/Employees.jsx";
import Profile from "./pages/Profile.jsx";
import Payroll from "./pages/Payroll.jsx";
import MyPayslips from "./pages/MyPayslips.jsx";
import ForgotPasswordModal from "./modals/ForgotPasswordModal.jsx";
import VerifyOtpModal from "./modals/VerifyOtpModal.jsx";
import ResetPasswordModal from "./modals/ResetPasswordModal.jsx";
import EmployeeEdit from "./pages/EmployeeEdit.jsx";
import RoleAccess from "./pages/RoleAccess.jsx";
import { Toaster } from "sonner";

// 🔹 Permission keys (must match backend)
const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  PROFILE_VIEW: "profile.view",
  SETTINGS_VIEW: "settings.view",
  MYPAYSLIPS_VIEW: "mypayslips.view",
  EMPLOYEES_VIEW: "employees.view",
  PAYROLL_VIEW: "payroll.view",
  ROLE_ACCESS_MANAGE: "roles.manage",
};

const App = () => {
  return (
    <>
      <Toaster richColors position="top-center" expand={false} />

      <Routes>
        {/* Public / auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgotPassword" element={<ForgotPasswordModal />} />
        <Route path="/verifyOtp" element={<VerifyOtpModal />} />
        <Route path="/reset" element={<ResetPasswordModal />} />

        {/* Dashboard */}
        <Route
          element={
            <ProtectedRoute
              requiredPermission={PERMISSIONS.DASHBOARD_VIEW}
            />
          }
        >
          <Route
            path="/"
            element={
              <AppShell>
                <Dashboard />
              </AppShell>
            }
          />
        </Route>

        {/* Profile */}
        <Route
          element={
            <ProtectedRoute
              requiredPermission={PERMISSIONS.PROFILE_VIEW}
            />
          }
        >
          <Route
            path="/profile"
            element={
              <AppShell>
                <Profile />
              </AppShell>
            }
          />
        </Route>

        {/* Settings */}
        <Route element={<ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS_VIEW} />}>
          <Route path="/settings" element={<AppShell> <Settings /> </AppShell>} />
        </Route>

        {/* My Payslips */}
        <Route element={<ProtectedRoute requiredPermission={PERMISSIONS.MYPAYSLIPS_VIEW} />} >
          <Route path="/my-payslips" element={<AppShell><MyPayslips /></AppShell>} />
        </Route>

        {/* Employees list + edit */}
        <Route element={<ProtectedRoute requiredPermission={PERMISSIONS.EMPLOYEES_VIEW} />} >
          <Route path="/employees" element={<AppShell><Employees /></AppShell>} />
          <Route path="/employee/edit/:id" element={<AppShell> <EmployeeEdit /> </AppShell>} />
        </Route>

        {/* Payroll */}
        <Route element={<ProtectedRoute requiredPermission={PERMISSIONS.PAYROLL_VIEW} />} >
          <Route path="/payroll" element={<AppShell><Payroll /></AppShell>} />
        </Route>

        {/* Role & Access – ONLY superAdmin + permission */}
        <Route element={<ProtectedRoute allowedRoles={["superAdmin"]} requiredPermission={PERMISSIONS.ROLE_ACCESS_MANAGE} />} >
          <Route path="/role-access" element={<AppShell><RoleAccess /></AppShell>} />
        </Route>
        
        <Route path="*" navigate="/" replace/>

      </Routes>
    </>
  );
};

export default App;
