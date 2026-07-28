import { NavLink, Outlet } from "react-router-dom";
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 220, borderRight: "1px solid #ddd", padding: "20px 0" }}>
        <div style={{ padding: "0 20px", fontWeight: 700, marginBottom: 24 }}>FoodCheck</div>
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                padding: "10px 20px",
                textDecoration: "none",
                color: isActive ? "#2E6B70" : "#333",
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "#eef5f5" : "transparent",
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
            borderBottom: "1px solid #ddd",
          }}
        >
          <span style={{ fontSize: 14 }}>
            {user?.name} ({user?.role})
          </span>
          <button onClick={logout} style={{ padding: "6px 12px" }}>
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
