import { useState } from "react";
import universityLogo from "../assets/university-logo.png";
import { authService } from "../services/authService";

function Login({ onLogin, initialError = "" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(initialError);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleLogin = async (event) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (registering && (trimmedName.length < 2 || trimmedName.length > 100)) {
      setError("Please enter a name between 2 and 100 characters.");
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
    if (registering && (password.length < 8 || password.length > 128)) {
      setError("Password must be 8–128 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = registering
        ? await authService.register({ name: trimmedName, email: trimmedEmail, password })
        : await authService.login({ email: trimmedEmail, password });
      onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // LOGIN PAGE
  // ==========================================

  return (

    <div className="login-page">


      {/* =================================================
          LEFT SIDE
          ================================================= */}

      <div className="login-left">


        {/* BRAND */}

        <div className="login-brand">


          {/* UNIVERSITY LOGO */}

          <div className="login-brand-logo">

            <img
              src={universityLogo}
              alt="University Logo"
              className="login-university-logo"
            />

          </div>


          {/* CAMPUSFIX */}

          <h1>
            CampusFix
          </h1>


          <p>
            Making your campus better,
            one issue at a time.
          </p>

        </div>


        {/* =================================================
            FEATURES
            ================================================= */}


        {/* FEATURE 1 */}

        <div className="login-feature">

          <div>
            📝
          </div>

          <div>

            <h3>
              Report Issues
            </h3>

            <p>
              Report campus problems quickly
              and easily.
            </p>

          </div>

        </div>


        {/* FEATURE 2 */}

        <div className="login-feature">

          <div>
            📊
          </div>

          <div>

            <h3>
              Track Progress
            </h3>

            <p>
              Stay updated on the status of
              your complaints.
            </p>

          </div>

        </div>


        {/* FEATURE 3 */}

        <div className="login-feature">

          <div>
            💡
          </div>

          <div>

            <h3>
              Improve Campus
            </h3>

            <p>
              Work together to create a
              better campus experience.
            </p>

          </div>

        </div>


      </div>


      {/* =================================================
          RIGHT SIDE
          ================================================= */}

      <div className="login-right">


        <div className="login-card">


          {/* =================================================
              HEADER
              ================================================= */}

          <div className="login-header">

            <span>
              WELCOME BACK
            </span>

            <h2>{registering ? "Create your account" : "Login to CampusFix"}</h2>

            <p>
              Enter your details to continue.
            </p>

          </div>


          {/* =================================================
              LOGIN FORM
              ================================================= */}

          <form onSubmit={handleLogin}>

            {registering && (
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            )}


            {/* EMAIL */}

            <div className="form-group">

              <label>
                Email Address
              </label>

              <input
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label>
                Password
              </label>


              <div className="password-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete={registering ? "new-password" : "current-password"}
                  minLength={registering ? 8 : undefined}
                  maxLength={registering ? 128 : undefined}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword
                    ? "🙈"
                    : "👁️"}

                </button>

              </div>

            </div>


            {/* =================================================
                ERROR MESSAGE
                ================================================= */}

            {error && (

              <div className="login-error">

                ⚠️ {error}

              </div>

            )}


            {/* =================================================
                LOGIN BUTTON
                ================================================= */}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >

              {loading ? "Please wait…" : registering ? "Create account →" : "Login →"}

            </button>


          </form>


          {/* =================================================
              DEMO INFORMATION
              ================================================= */}

          <button type="button" className="forgot-password" onClick={() => { setRegistering((value) => !value); setError(""); }}>
            {registering ? "Already have an account? Sign in" : "New to CampusFix? Create an account"}
          </button>

          <div className="demo-login">

            <strong>🎓 CampusFix Account</strong>
            <p>Sign in or create an account to continue.</p>

          </div>


          {/* =================================================
              FOOTER
              ================================================= */}

          <div className="login-footer">

            <p>
              © 2026 CampusFix
            </p>

          </div>


        </div>

      </div>


    </div>

  );

}

export default Login;
