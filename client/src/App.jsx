import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import Employees from "./pages/Employees.jsx";
import Profile from "./pages/Profile.jsx";
import ForgotPasswordModal from "./modals/ForgotPasswordModal.jsx";
import VerifyOtpModal from "./modals/VerifyOtpModal.jsx";
import ResetPasswordModal from "./modals/ResetPasswordModal.jsx";
import EmployeeEdit from "./pages/EmployeeEdit.jsx";
import { Toaster } from "sonner";
import PayrollList from "./pages/payroll/PayrollList.jsx";
import CreatePayroll from "./pages/payroll/CreatePayroll.jsx";
import PayrollDetails from "./pages/payroll/PayrollDetails.jsx";

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
          <Route path="/payroll" element={<PayrollList />} />
          <Route path="/payroll/create" element={<CreatePayroll />} />
          <Route path="/payroll/:id" element={<PayrollDetails />} />

        </Route>
        <Route element={<ProtectedRoute allowedRoles={["superAdmin", "admin", "hr"]} />}>
          <Route path="/employees" element={<AppShell><Employees /></AppShell>} />
          <Route path="/employee/edit/:id" element={<AppShell><EmployeeEdit /></AppShell>} />

          {/* Add other routes (employees, payroll, etc.) similarly */}
        </Route>
      </Routes>
    </>
  );
};

export default App;
