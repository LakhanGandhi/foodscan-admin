import { useAuth } from "../auth/AuthContext";

function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 40 }}>
      <h1>FoodCheck Admin</h1>
      <p>
        Logged in as <b>{user.name}</b> ({user.role})
      </p>
      <button onClick={logout} style={{ padding: "8px 16px" }}>
        Log out
      </button>
    </div>
  );
}

export default DashboardPage;
