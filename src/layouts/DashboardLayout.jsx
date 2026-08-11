import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, TrendingUp, Building2, Tag, Factory, ShoppingCart, Layers, Users, ClipboardCheck, UserCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import "./DashboardLayout.css";

const navItems = [
  { to: "/dashboard/home", label: "Home", icon: Home },
  { to: "/dashboard/overview", label: "Dashboard", icon: TrendingUp },
  { to: "/dashboard/companies", label: "Companies", icon: Building2, hideFor: ["companyEmployee"] },
  { to: "/dashboard/brands", label: "Brands", icon: Tag },
  { to: "/dashboard/plants", label: "Plants", icon: Factory },
  { to: "/dashboard/products", label: "Products", icon: ShoppingCart },
  { to: "/dashboard/batches", label: "Batches", icon: Layers },
  { to: "/dashboard/employees", label: "Employees", icon: Users },
  { to: "/dashboard/analytics", label: "Analytics", icon: ClipboardCheck },
];

// Only sets an inline background for the ACTIVE state. Inactive/hover
// background is handled entirely by DashboardLayout.css (.nav-link:hover),
// since inline styles always win over CSS and would otherwise block hover.
function getLinkStyle(open) {
  return ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: open ? "flex-start" : "center",
    gap: 12,
    margin: open ? "2px 12px" : "2px 10px",
    padding: open ? "10px 14px" : "10px 0",
    borderRadius: "var(--radius)",
    textDecoration: "none",
    whiteSpace: "nowrap",
    color: isActive ? "var(--color-primary)" : "var(--color-text)",
    background: isActive ? "var(--color-primary-soft)" : undefined,
    fontWeight: isActive ? 600 : 500,
  });
}

function DashboardLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const sidebarWidth = open ? 220 : 72;
  const linkStyle = getLinkStyle(open);

  const visibleNavItems = navItems.filter((item) => !item.hideFor?.includes(user?.role));

  return (
    <div>
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: sidebarWidth,
          height: "100vh",
          transition: "width 0.15s ease",
          background: "var(--color-bg)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 10,
        }}
      >
        <div>
          <div
            style={{
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: open ? "flex-start" : "center",
              padding: open ? "0 24px" : "0",
              fontFamily: "var(--font-logo)",
              fontSize: open ? 26 : 22,
              color: "var(--color-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              borderBottom: "1px solid var(--color-border)",
              marginBottom: 8,
            }}
          >
            {open ? "Foodscan" : "F"}
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {visibleNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className="nav-link" style={linkStyle}>
                <Icon size={20} style={{ flexShrink: 0 }} />
                {open && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <NavLink to="/dashboard/settings" className="nav-link" style={linkStyle}>
            <UserCircle size={20} style={{ flexShrink: 0 }} />
            {open && <span>Settings</span>}
          </NavLink>

          <div style={{ display: "flex", justifyContent: open ? "flex-end" : "center", padding: "12px 20px" }}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="sidebar-toggle"
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            >
              {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <main
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 0.15s ease",
          minHeight: "100vh",
          padding: 24,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
