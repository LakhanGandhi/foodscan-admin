import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/auth/LoginPage";

function AppShell() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <p style={{ fontFamily: "system-ui, sans-serif", padding: 40 }}>Loading...</p>;
  }

  if (!user) {
    return <LoginPage />;
  }

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

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
