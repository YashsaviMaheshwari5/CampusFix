
import { useState } from "react";
import universityLogo from "../assets/university-logo.png";
import { authService } from "../services/authService";

function Login({
  onLogin,
  onBack,
  selectedRole = "student",
  initialError = ""
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const isStaffLogin = selectedRole === "staff";

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (registering && isStaffLogin) {
      setError("Staff registration is not publicly available.");
      return;
    }

    if (
      registering &&
      (trimmedName.length < 2 || trimmedName.length > 100)
    ) {
      setError("Name must contain 2–100 characters.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (
      registering &&
      (password.length < 8 || password.length > 128)
    ) {
      setError("Password must be 8–128 characters.");
      return;
    }

    setLoading(true);

    try {
      const result = registering
        ? await authService.register({
            name: trimmedName,
            email: trimmedEmail,
            password
          })
        : await authService.login({
            email: trimmedEmail,
            password
          });

      // Always trust the role returned by the backend.
      const actualRole = String(
        result?.user?.role || ""
      ).toLowerCase();

      const validRole =
        isStaffLogin
          ? ["staff", "admin"].includes(actualRole)
          : actualRole === "student";

      if (!validRole) {
        // Clear the session created by the wrong-role login.
        try {
          await authService.logout();
        } catch {
          // Do not grant frontend access if logout request fails.
        }

        setError(
          isStaffLogin
            ? "Unauthorized access! This account is not registered as Staff."
            : "Unauthorized access! This account is not registered as a Student."
        );

        return;
      }

      if (!result?.user) {
        setError("Invalid authentication response from server.");
        return;
      }

      onLogin(result.user);

    } catch (requestError) {
      setError(
        requestError.message ||
        "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT BRANDING SECTION */}
      <div className="login-left">

        <div className="login-brand">

          <div className="login-brand-logo">
            <img
              src={universityLogo}
              alt="CampusFix Logo"
              className="login-university-logo"
            />
          </div>

          <h1>CampusFix</h1>

          <p>
            Making your campus better,
            one issue at a time.
          </p>

        </div>

        <div className="login-feature">
          <div>📝</div>
          <div>
            <h3>Report Issues</h3>
            <p>
              Report campus problems quickly
              and easily.
            </p>
          </div>
        </div>

        <div className="login-feature">
          <div>📊</div>
          <div>
            <h3>Track Progress</h3>
            <p>
              Stay updated on complaint status
              and progress.
            </p>
          </div>
        </div>

        <div className="login-feature">
          <div>💡</div>
          <div>
            <h3>Improve Campus</h3>
            <p>
              Work together to create a
              better campus experience.
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT LOGIN SECTION */}
      <div className="login-right">

        <div className="login-card">

          <button
            type="button"
            className="login-back"
            onClick={onBack}
          >
            ← Back to role selection
          </button>

          <div className="login-header">

            <span>
              {isStaffLogin
                ? "STAFF PORTAL"
                : "STUDENT PORTAL"}
            </span>

            <h2>
              {registering
                ? "Create your account"
                : isStaffLogin
                  ? "Staff Login"
                  : "Student Login"}
            </h2>

            <p>
              {isStaffLogin
                ? "Sign in with your authorized staff account."
                : "Enter your details to continue to CampusFix."}
            </p>

          </div>

          <form onSubmit={handleLogin}>

            {registering && !isStaffLogin && (
              <div className="form-group">

                <label htmlFor="signup-name">
                  Full Name
                </label>

                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />

              </div>
            )}

            <div className="form-group">

              <label htmlFor="login-email">
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />

            </div>

            <div className="form-group">

              <label htmlFor="login-password">
                Password
              </label>

              <div className="password-wrapper">

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    registering
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={registering ? 8 : undefined}
                  maxLength={registering ? 128 : undefined}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>

              </div>

            </div>

            {error && (
              <div role="alert" className="login-error">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : registering
                  ? "Create Account →"
                  : "Login →"}
            </button>

          </form>

          {/* Only students can register publicly. */}
          {!isStaffLogin && (
            <button
              type="button"
              className="forgot-password"
              onClick={() => {
                setRegistering((value) => !value);
                setError("");
              }}
            >
              {registering
                ? "Already have an account? Sign in"
                : "New to CampusFix? Create an account"}
            </button>
          )}

          <div className="demo-login">
            <strong>
              {isStaffLogin
                ? "🛠️ Authorized Staff Access"
                : "🎓 Student Account"}
            </strong>

            <p>
              {isStaffLogin
                ? "Only existing staff and administrator accounts can access this portal."
                : "Sign in or create your student account to continue."}
            </p>
          </div>

          <div className="login-footer">
            <p>© 2026 CampusFix</p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
