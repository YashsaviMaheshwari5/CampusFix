import { useState } from "react";

function Settings({ darkMode, onDarkModeChange }) {

  const savedSettings =
    localStorage.getItem("campusFixSettings");

  const initialSettings = savedSettings
    ? JSON.parse(savedSettings)
    : {
        name: "Student",
        email: "student@example.com",
        notifications: true,
        darkMode: false
      };


  const [name, setName] =
    useState(initialSettings.name);

  const [email, setEmail] =
    useState(initialSettings.email);

  const [notifications, setNotifications] =
    useState(initialSettings.notifications);

  const handleSave = (e) => {

    e.preventDefault();


    const settings = {
      name,
      email,
      notifications,
      darkMode
    };


    localStorage.setItem(
      "campusFixSettings",
      JSON.stringify(settings)
    );


    // Notify this tab after persisting the updated preferences.
    // The native `storage` event only fires in other tabs and App listens
    // for this application-specific event.
    window.dispatchEvent(
      new Event("campusFixSettingsChanged")
    );


    alert("Settings saved successfully! ✅");

  };


  return (

    <div className="settings-page">

      <div className="page-header">

        <div>

          <span className="dashboard-label">
            CAMPUSFIX
          </span>

          <h1>
            Settings ⚙️
          </h1>

          <p>
            Manage your profile and preferences.
          </p>

        </div>

      </div>


      <div className="settings-card">

        <h2>
          Profile Information 👤
        </h2>

        <p className="settings-description">
          Update your personal information.
        </p>


        <form onSubmit={handleSave}>

          <div className="form-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>


          <div className="setting-row">

            <div>

              <h3>
                Notifications 🔔
              </h3>

              <p>
                Receive updates about your complaints.
              </p>

            </div>


            <label className="toggle">

              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) =>
                  setNotifications(e.target.checked)
                }
              />

              <span className="toggle-slider"></span>

            </label>

          </div>


          <div className="setting-row">

            <div>

              <h3>
                Dark Mode 🌙
              </h3>

              <p>
                Switch between light and dark appearance.
              </p>

            </div>


            <label className="toggle">

              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) =>
                  onDarkModeChange(e.target.checked)
                }
              />

              <span className="toggle-slider"></span>

            </label>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >
            Save Settings
          </button>

        </form>

      </div>

    </div>

  );
}

export default Settings;
