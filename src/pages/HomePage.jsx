import { useAuth } from "../auth/AuthContext";

function HomePage() {
  const { user } = useAuth();

  return (
    <div style={{ textAlign: "center", marginTop: 80 }}>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary)", fontSize: 14 }}>
        Hello
      </p>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary)", fontSize: 16, fontWeight: 600 }}>
        {user?.name}
      </p>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", fontSize: 14, marginTop: 20 }}>
        Welcome to the International Product Verification Platform
      </p>
    </div>
  );
}

export default HomePage;
