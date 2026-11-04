import { useState } from "react";
import { apiRequest } from "../services/api";

function Settings({ darkMode, onDarkModeChange, user, onUserChange }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [studentId, setStudentId] = useState(() => localStorage.getItem("campusFixStudentId") || "");
  const [department, setDepartment] = useState(() => localStorage.getItem("campusFixDepartment") || "");
  const [hostel, setHostel] = useState(() => localStorage.getItem("campusFixHostel") || "");

  const [notifications, setNotifications] = useState(() => {
    try {
      return (
        user?.preferences?.notifications ??
        JSON.parse(localStorage.getItem("campusFixSettings") || "{}").notifications !== false
      );
    } catch {
      return true;
    }
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const initials = (name || user?.name || "Student")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setSaved(false);

    // Save student local preferences
    localStorage.setItem("campusFixSettings", JSON.stringify({ darkMode, notifications }));
    localStorage.setItem("campusFixStudentId", studentId.trim());
    localStorage.setItem("campusFixDepartment", department.trim());
    localStorage.setItem("campusFixHostel", hostel.trim());
    localStorage.setItem("userName", name.trim());
    window.dispatchEvent(new Event("campusFixSettingsChanged"));

    try {
      // Save core user profile to MongoDB backend
      const result = await apiRequest("/auth/preferences", {
        method: "PATCH",
        body: { name: name.trim(), email: email.trim(), notifications }
      });
      onUserChange(result.user);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <span className="dashboard-label">CAMPUSFIX STUDENT PORTAL</span>
          <h1>Student Settings ⚙️</h1>
          <p>Manage your student profile, campus details, and notification preferences.</p>
        </div>
      </div>

      {/* Student Profile Identity Card */}
      <div className="settings-card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div
            className="profile-avatar"
            style={{
              width: "68px",
              height: "68px",
              fontSize: "24px",
              borderRadius: "50%",
              background: "#5b3fd3",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700"
            }}
          >
            {initials || "ST"}
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px" }}>{name || user?.name || "Student"}</h2>
            <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}>{email || user?.email}</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span
                style={{
                  background: "#eff6ff",
                  color: "#2563eb",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                🎓 Student Account
              </span>
              <span
                style={{
                  background: "#ecfdf5",
                  color: "#059669",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
              >
                ● Connected to Database
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="settings-card">
        <form onSubmit={handleSave}>
          {error && (
            <div role="alert" className="login-error" style={{ marginBottom: "20px" }}>
              ⚠️ {error}
            </div>
          )}

          {saved && (
            <div
              role="status"
              style={{
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>✅</span> Student profile and settings have been saved successfully!
            </div>
          )}

          {/* Section 1: Account & Profile Details */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px", color: "inherit" }}>
              👤 Personal & Account Information
            </h3>
            <p style={{ fontSize: "13px", color: "#777", marginBottom: "16px" }}>
              Your name and contact email for campus issues.
            </p>

            <div className="form-group">
              <label htmlFor="settings-name">Full Name *</label>
              <input
                id="settings-name"
                type="text"
                minLength={2}
                maxLength={100}
                required
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="settings-email">Student Email Address *</label>
              <input
                id="settings-email"
                type="email"
                required
                placeholder="your.email@campusfix.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Campus & Academic Information */}
          <div style={{ marginBottom: "24px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px", color: "inherit" }}>
              🏫 Campus & Academic Details
            </h3>
            <p style={{ fontSize: "13px", color: "#777", marginBottom: "16px" }}>
              Helps campus maintenance locate you and verify your issue reports.
            </p>

            <div className="form-group">
              <label htmlFor="settings-studentid">Student ID / Roll Number</label>
              <input
                id="settings-studentid"
                type="text"
                maxLength={50}
                placeholder="e.g. STU-2026-4402"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label htmlFor="settings-dept">Department / Faculty</label>
                <input
                  id="settings-dept"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-hostel">Hostel / Campus Block</label>
                <input
                  id="settings-hostel"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Block B, Room 204 or Day Scholar"
                  value={hostel}
                  onChange={(event) => setHostel(event.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Notification Preferences */}
          <div style={{ marginBottom: "20px", paddingTop: "20px", borderTop: "1px solid #eee" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px", color: "inherit" }}>
              🔔 Notifications & Alerts
            </h3>
            <p style={{ fontSize: "13px", color: "#777", marginBottom: "16px" }}>
              Choose how you want to be notified about complaint status changes.
            </p>

            <div className="setting-row">
              <div>
                <h3>Complaint Updates & Activity</h3>
                <p>Receive notifications when staff reviews, assigns, or resolves your complaints.</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(event) => setNotifications(event.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div>
                <h3>Dark Mode 🌙</h3>
                <p>Switch between light and dark themes for comfortable viewing.</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(event) => onDarkModeChange(event.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ paddingTop: "16px", borderTop: "1px solid #eee" }}>
            <button
              type="submit"
              className="submit-btn"
              disabled={saving}
              style={{ padding: "12px 24px", fontSize: "15px", fontWeight: "600" }}
            >
              {saving ? "Saving Changes… ⏳" : "Save Student Settings 💾"}
            </button>
          </div>
        </form>
      </div>

      {/* Helpful Student Information Card */}
      <div
        className="settings-card"
        style={{
          marginTop: "24px",
          background: "#faf8ff",
          border: "1px solid #e0d7ff"
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "24px" }}>💡</span>
          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#5b3fd3" }}>
              Tips for Fast Complaint Resolution
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#555", lineHeight: "1.6" }}>
              Always provide accurate locations (e.g. <em>Library 2nd Floor, Room 204</em>) and clear descriptions.
              When reporting issues with photos, campus maintenance staff can diagnose and fix problems significantly faster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
