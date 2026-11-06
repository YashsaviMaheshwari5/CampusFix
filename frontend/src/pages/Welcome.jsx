
import React from "react";
import universityLogo from "../assets/university-logo.png";
import "./Welcome.css";

function Welcome({ onSelectRole }) {
  return (
    <div className="welcome-page">
      <div className="welcome-wrapper">

        <header className="welcome-brand">
          <img src={universityLogo} alt="CampusFix Logo" />
          <div>
            <h1>CampusFix</h1>
            <p>Your Campus, Your Voice</p>
          </div>
        </header>

        <section className="welcome-heading">
          <span className="welcome-label">CAMPUSFIX PORTAL</span>
          <h2>Welcome to CampusFix</h2>
          <p>
            Making your campus better, one issue at a time.
            Select your account type to continue.
          </p>
        </section>

        <div className="role-selection">

          <article className="role-card">
            <div className="role-icon">🎓</div>
            <h3>Student Login</h3>
            <p>
              Report campus problems, submit complaints
              and track their progress easily.
            </p>
            <button
              type="button"
              onClick={() => onSelectRole("student")}
            >
              Login as Student <span>→</span>
            </button>
          </article>

          <article className="role-card">
            <div className="role-icon">👨‍💼</div>
            <h3>Staff Login</h3>
            <p>
              Manage student complaints, update their
              status and help resolve campus issues.
            </p>
            <button
              type="button"
              onClick={() => onSelectRole("staff")}
            >
              Login as Staff <span>→</span>
            </button>
          </article>

        </div>

        <footer className="welcome-footer">
          © 2026 CampusFix. All rights reserved.
        </footer>

      </div>
    </div>
  );
}

export default Welcome;
