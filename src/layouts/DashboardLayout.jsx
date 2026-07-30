import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, TrendingUp, Building2, Factory, ShoppingCart, Users, ClipboardCheck, UserCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/dashboard/home", label: "Home", icon: Home },
  { to: "/dashboard/overview", label: "Dashboard", icon: TrendingUp },
  { to: "/dashboard/companies", label: "Companies", icon: Building2 },
  { to: "/dashboard/plants", label: "Plants", icon: Factory },
  { to: "/dashboard/products", label: "Products", icon: ShoppingCart },
  { to: "/dashboard/employees", label: "Employees", icon: Users },
  { to: "/dashboard/analytics", label: "Analytics", icon: ClipboardCheck },
];

function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/logged-out");
  }

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
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 24px",
                  textDecoration: "none",
                  color: isActive ? "var(--color-primary)" : "var(--color-text)",
                })}
              >
                <Icon size={22} />
                {open && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 24px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-primary)",
                width: "100%",
              }}
              title="Log out"
            >
              <UserCircle size={22} />
              {open && <span>Log out</span>}
            </button>
            <div style={{ display: "flex", justifyContent: open ? "flex-end" : "center", padding: "8px 24px" }}>
              <button
                onClick={() => setOpen(!open)}
                style={{
                  border: "1px solid var(--color-primary)",
                  background: "#fff",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--color-primary)",
                }}
              >
                {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
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
