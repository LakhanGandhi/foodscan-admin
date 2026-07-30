import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function UserSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/logged-out");
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>User Settings</h2>
      <p><b>Name:</b> {user?.name}</p>
      <p><b>Email:</b> {user?.email}</p>
      <p><b>Role:</b> {user?.role}</p>

      <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 20 }}>
        Change password and mobile number will be added here later.
      </p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: 24,
          padding: "10px 20px",
          border: "none",
          borderRadius: "999px",
          background: "var(--color-primary)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Log Out
      </button>
    </div>
  );
}

export default UserSettingsPage;
