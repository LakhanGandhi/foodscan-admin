import { useAuth } from "../auth/AuthContext";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <p>Role: {user.role}</p>
      <p>Use the sidebar to manage companies, plants, products, employees, and view analytics.</p>
    </div>
  );
}

export default DashboardPage;
