import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ fontFamily: "system-ui, sans-serif", padding: 40 }}>Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <p style={{ fontFamily: "system-ui, sans-serif", padding: 40 }}>You don't have access to this page.</p>;
  }
  return children;
}

export default ProtectedRoute;
