import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/dashboard/companies", label: "Companies" },
  { to: "/dashboard/plants", label: "Plants" },
  { to: "/dashboard/products", label: "Products" },
  { to: "/dashboard/employees", label: "Employees" },
  { to: "/dashboard/analytics", label: "Analytics" },
];

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/logged-out");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <aside style={{ width: 220, borderRight: "1px solid var(--color-border)", padding: "20px 0" }}>
        <div style={{ padding: "0 20px", fontFamily: "var(--font-logo)", fontSize: 24, color: "var(--color-primary)", marginBottom: 24 }}>
          Foodscan
        </div>
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                padding: "10px 20px",
                textDecoration: "none",
                color: isActive ? "var(--color-primary)" : "var(--color-text)",
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "var(--color-bg)" : "transparent",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            padding: "12px 24px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <span style={{ fontSize: 14 }}>
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout} style={{ padding: "6px 12px" }}>
            Log out
          </button>
        </header>

        <main style={{ padding: 24, flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
