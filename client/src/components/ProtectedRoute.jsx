import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    Array.isArray(allowedRoles) &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center">
        <h1 className="text-center text-2xl font-semibold mb-2">Not Authorized</h1>
        <p className="text-center">You do not have permission to access this page.</p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
