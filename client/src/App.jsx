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
import { Toaster } from "sonner";

const App = () => {
  return (
    <>
      <Toaster richColors position="top-center" expand={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgotPassword" element={<ForgotPasswordModal />} />
        <Route path="/verifyOtp" element={<VerifyOtpModal />} />
        <Route path="/reset" element={<ResetPasswordModal />} />

        <Route element={<ProtectedRoute allowedRoles={["superAdmin", "admin", "hr", "employee"]} />}>
          <Route path="/" element={<AppShell><Dashboard /></AppShell>} />
          <Route path="/profile" element={<AppShell><Profile /></AppShell>} />
          <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
          <Route path="/my-payslips" element={<AppShell><MyPayslips /></AppShell>} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["superAdmin", "admin", "hr"]} />}>
          <Route path="/employees" element={<AppShell><Employees /></AppShell>} />
          <Route path="/employee/edit/:id" element={<AppShell><EmployeeEdit /></AppShell>} />
          <Route path="/payroll" element={<AppShell><Payroll /></AppShell>} />

        </Route>
      </Routes>
    </>
  );
};

export default App;
