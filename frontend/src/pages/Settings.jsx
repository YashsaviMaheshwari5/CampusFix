// React form with controlled state: settings save event API ko PATCH bhejta hai.
// localStorage browser me chhoti preferences ko visits ke beech rakhta hai; JSON.stringify/parse convert karte hain.
import { useState } from "react";
import { apiRequest } from "../services/api";

function Settings({ darkMode, onDarkModeChange, user, onUserChange }) {
  const initialName = user?.name === "Campus Staff Coordinator" ? "Student" : (user?.name || "Student");
  const initialEmail = user?.email === "staff@campusfix.edu" ? "student@campusfix.edu" : (user?.email || "student@campusfix.edu");

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
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
          <span className="dashboard-label">CAMPUSFIX</span>
          <h1>Student Settings ⚙️</h1>
          <p>Manage your profile, academic details, and notification preferences.</p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="settings-card">
        <h2>Profile Information 👤</h2>
        <p className="settings-description">Update your student details and preferences.</p>

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

          {/* Section 1: Personal Details */}
          <div className="form-group">
            <label htmlFor="settings-name">Full Name *</label>
            <input
              id="settings-name"
              type="text"
              minLength={2}
              maxLength={100}
              required
              placeholder="e.g. Student"
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
              placeholder="student@campusfix.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          {/* Section 2: Campus & Academic Information */}
          <div className="form-group" style={{ marginTop: "18px" }}>
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

          {/* Section 3: Notification Preferences */}
          <div className="setting-row" style={{ marginTop: "16px" }}>
            <div>
              <h3>Notifications 🔔</h3>
              <p>Receive updates when staff reviews or resolves your complaints.</p>
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
              <p>Switch between light and dark appearance.</p>
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

          {/* Submit Button */}
          <div style={{ paddingTop: "20px" }}>
            <button
              type="submit"
              className="submit-btn"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
