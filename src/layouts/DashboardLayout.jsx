import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, TrendingUp, Building2, Factory, ShoppingCart, Users, ClipboardCheck, UserCircle, ChevronRight, ChevronLeft } from "lucide-react";

const navItems = [
  { to: "/dashboard/home", label: "Home", icon: Home },
  { to: "/dashboard/overview", label: "Dashboard", icon: TrendingUp },
  { to: "/dashboard/companies", label: "Companies", icon: Building2 },
  { to: "/dashboard/plants", label: "Plants", icon: Factory },
  { to: "/dashboard/products", label: "Products", icon: ShoppingCart },
  { to: "/dashboard/employees", label: "Employees", icon: Users },
  { to: "/dashboard/analytics", label: "Analytics", icon: ClipboardCheck },
];

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 24px",
  textDecoration: "none",
  whiteSpace: "nowrap",
  color: isActive ? "var(--color-primary)" : "var(--color-text)",
});

function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const sidebarWidth = open ? 220 : 72;

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          background: "var(--color-bg)",
          padding: "16px 0",
          textAlign: "center",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h1 style={{ fontFamily: "var(--font-logo)", color: "var(--color-primary)", fontSize: 32, margin: 0 }}>
          Foodscan
        </h1>
      </header>

      <div style={{ display: "flex" }}>
        <aside
          style={{
            width: sidebarWidth,
            transition: "width 0.15s ease",
            background: "var(--color-bg)",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "calc(100vh - 65px)",
            padding: "20px 0",
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} style={linkStyle}>
                <Icon size={22} style={{ flexShrink: 0 }} />
                {open && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div>
            <NavLink to="/dashboard/settings" style={linkStyle}>
              <UserCircle size={22} style={{ flexShrink: 0 }} />
              {open && <span>Settings</span>}
            </NavLink>

            <div style={{ display: "flex", justifyContent: open ? "flex-end" : "center", padding: "8px 24px" }}>
              <button
                onClick={() => setOpen((prev) => !prev)}
                style={{
                  border: "1px solid var(--color-primary)",
                  background: "#fff",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--color-primary)",
                }}
                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
