import { useState } from "react";
import { apiRequest } from "../services/api";
function Settings({ darkMode, onDarkModeChange, user, onUserChange }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifications, setNotifications] = useState(() => {
    try { return user?.preferences?.notifications ?? JSON.parse(localStorage.getItem("campusFixSettings") || "{}").notifications !== false; }
    catch { return true; }
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const handleSave = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setSaved(false);
    localStorage.setItem("campusFixSettings", JSON.stringify({ darkMode }));
    window.dispatchEvent(new Event("campusFixSettingsChanged"));
    try {
      const result = await apiRequest("/auth/preferences", { method: "PATCH", body: { name, email, notifications } });
      onUserChange(result.user); setSaved(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <div className="settings-page">
    <div className="page-header"><div><span className="dashboard-label">CAMPUSFIX</span><h1>Settings ⚙️</h1><p>Manage your profile and preferences.</p></div></div>
    <div className="settings-card"><h2>Profile Information 👤</h2><p className="settings-description">Update your account details and preferences.</p>
      <form onSubmit={handleSave}>
        {error && <p role="alert" className="login-error">{error}</p>}
        <div className="form-group"><label htmlFor="settings-name">Full Name</label><input id="settings-name" type="text" minLength={2} maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} /></div>
        <div className="form-group"><label htmlFor="settings-email">Email Address</label><input id="settings-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div className="setting-row"><div><h3>Notifications 🔔</h3><p>Receive updates about your complaints.</p></div><label className="toggle"><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} /><span className="toggle-slider"></span></label></div>
        <div className="setting-row"><div><h3>Dark Mode 🌙</h3><p>Switch between light and dark appearance.</p></div><label className="toggle"><input type="checkbox" checked={darkMode} onChange={(event) => onDarkModeChange(event.target.checked)} /><span className="toggle-slider"></span></label></div>
        <button type="submit" className="submit-btn" disabled={saving}>{saving ? "Saving…" : "Save Settings"}</button>{saved && <p role="status">Profile and preferences saved.</p>}
      </form>
    </div>
  </div>;
}
export default Settings;
