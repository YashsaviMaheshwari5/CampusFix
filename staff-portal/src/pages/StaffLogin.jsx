import { useState } from "react";
import { authService } from "../services/authService.js";

export default function StaffLogin({ onLogin, initialError = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your staff email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login({ email: trimmedEmail, password });
      if (result.user.role !== "staff" && result.user.role !== "admin") {
        setError(
          `Logged in as '${result.user.role}'. This portal requires Staff or Admin privileges. Please use the Student Portal at http://localhost:5173`
        );
        authService.logout().catch(() => {});
        return;
      }
      onLogin(result.user);
    } catch (err) {
      setError(err.message || "Failed to sign in. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const prefillStaff = () => {
    setEmail("staff@campusfix.edu");
    setPassword("password123");
    setError("");
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <div className="staff-login-header">
          <div className="login-logo-circle">🛠️</div>
          <h1>CampusFix Staff Portal</h1>
          <p className="login-subtitle">
            Operations & Complaints Management Center
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-field">
            <label htmlFor="staff-email">Staff Email Address</label>
            <input
              id="staff-email"
              type="email"
              required
              placeholder="e.g. staff@campusfix.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="staff-password">Password</label>
            <div className="password-input-wrap">
              <input
                id="staff-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && <div className="login-error-alert">⚠️ {error}</div>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Authenticating…" : "Sign In to Staff Operations →"}
          </button>
        </form>

        <div className="login-demo-section">
          <span>Quick Testing:</span>
          <button
            type="button"
            className="demo-btn-staff"
            onClick={prefillStaff}
          >
            👨‍💼 Use Demo Staff Account
          </button>
        </div>

        <div className="login-switch-footer">
          <span>Are you a student looking to file an issue?</span>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="student-portal-link"
          >
            🎓 Go to CampusFix Student Portal (Port 5173) ↗
          </a>
        </div>
      </div>
    </div>
  );
}
