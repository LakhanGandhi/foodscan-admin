import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoggedOutPage() {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-tagline">International Product Verification Platform</div>
        <h1 className="login-logo">Foodscan</h1>
      </div>

      <div className="login-right">
        <div className="login-card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-primary)", fontWeight: 600, letterSpacing: "0.04em" }}>
            You have successfully logged out of portal.
          </p>
          <p style={{ color: "var(--color-primary)", fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Click here to login again
          </p>
          <button className="login-button" onClick={() => navigate("/login")}>
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoggedOutPage;
