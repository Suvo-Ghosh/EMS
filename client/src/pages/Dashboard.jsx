// src/pages/Dashboard.jsx
import { useAuth } from "../contexts/AuthContext.jsx";

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role || "employee";

  const isManagement = ["superAdmin", "admin", "hr"].includes(role);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-1">
        Welcome, {user.fullName}
      </h2>
      <p className="text-sm text-slate-700 dark:text-slate-200 mb-4">
        You are logged in as{" "}
        <strong className="uppercase tracking-wide">{user.role}</strong>.
      </p>

      {role === "superAdmin" && (
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="System Overview"
            value="—"
            description="High-level metrics across all employees & payroll."
          />
          <DashboardCard
            title="Total Users"
            value="—"
            description="Admins, HR, and employees with system access."
          />
          <DashboardCard
            title="Pending Approvals"
            value="—"
            description="Leaves, employees, or payroll items waiting for action."
          />
        </div>
      )}

      {role === "admin" && (
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Employees"
            value="—"
            description="View and manage employee records."
          />
          <DashboardCard
            title="Current Payroll Cycle"
            value="—"
            description="Review salaries before finalizing payouts."
          />
          <DashboardCard
            title="Pending HR Actions"
            value="—"
            description="Onboarding, offboarding, and updates."
          />
        </div>
      )}

      {role === "hr" && (
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardCard
            title="Onboarding"
            value="—"
            description="New employees to set up."
          />
          <DashboardCard
            title="Leave Requests"
            value="—"
            description="Requests awaiting HR review."
          />
        </div>
      )}

      {role === "employee" && (
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardCard
            title="My Attendance"
            value="—"
            description="Check your attendance summary (coming soon)."
          />
          <DashboardCard
            title="My Payslips"
            value="—"
            description="View and download your monthly payslips (coming soon)."
          />
        </div>
      )}

      {isManagement && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Tip: from the sidebar, you can navigate to Employees, Payroll, and
          Settings. This dashboard will later show live stats once APIs are
          connected.
        </p>
      )}
    </div>
  );
};

const DashboardCard = ({ title, value, description }) => (
  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
    <h3 className="text-sm font-semibold mb-1">{title}</h3>
    <div className="text-2xl font-bold mb-1">{value}</div>
    <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

export default Dashboard;
