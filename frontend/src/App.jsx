
import { useEffect, useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Welcome from "./pages/welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import ReportIssue from "./pages/ReportIssue";
import ComplaintDetails from "./pages/ComplaintDetails";
import Notifications from "./pages/Notifications";
import KnowledgeBase from "./pages/KnowledgeBase";
import Feedback from "./pages/Feedback";
import Settings from "./pages/Settings";

import { authService } from "./services/authService";
import { complaintService } from "./services/complaintService";
import { canManageComplaints } from "./utils/complaintStatus.js";

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const [error, setError] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("campusFixSettings") || "{}"
      ).darkMode === true;
    } catch {
      return false;
    }
  });

  // Restore the actual authenticated user from backend.
  useEffect(() => {
    const controller = new AbortController();

    authService.me(controller.signal)
      .then(({ user: currentUser }) => {
        if (!currentUser?.role) {
          throw new Error("Invalid user session.");
        }

        setUser(currentUser);
        setIsLoggedIn(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError" && err.status !== 401) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAuthLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  // Load complaints after successful authentication.
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    const controller = new AbortController();

    complaintService.list(
      { limit: 50 },
      controller.signal
    )
      .then(({ complaints: rows }) => {
        setComplaints(rows);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDataLoading(false);
        }
      });

    return () => controller.abort();
  }, [isLoggedIn]);

  // Listen for theme updates.
  useEffect(() => {
    const update = () => {
      try {
        setDarkMode(
          JSON.parse(
            localStorage.getItem("campusFixSettings") || "{}"
          ).darkMode === true
        );
      } catch {
        setDarkMode(false);
      }
    };

    window.addEventListener("campusFixSettingsChanged", update);

    return () => {
      window.removeEventListener(
        "campusFixSettingsChanged",
        update
      );
    };
  }, []);

  // Called only after Login.jsx verifies the backend role.
  const handleLogin = (nextUser) => {
    setUser(nextUser);
    setDataLoading(true);
    setIsLoggedIn(true);
    setActivePage("dashboard");
    setSelectedComplaint(null);
    setSelectedRole(null);
    setShowLogin(false);
    setError("");
  };

  // Return to the common welcome screen.
  const handleBackToWelcome = () => {
    setSelectedRole(null);
    setShowLogin(false);
    setError("");
  };

  // Logout.
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (logoutError) {
      setError(logoutError.message);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      setComplaints([]);
      setSelectedComplaint(null);
      setActivePage("dashboard");
      setSelectedRole(null);
      setShowLogin(false);
      setDataLoading(true);
    }
  };

  // Update complaint in local state.
  const handleComplaintUpdated = (updatedComplaint) => {
    setComplaints((current) =>
      current.map((item) =>
        item._id === updatedComplaint._id
          ? updatedComplaint
          : item
      )
    );

    setSelectedComplaint(updatedComplaint);
  };

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-card">
          Connecting to CampusFix...
        </div>
      </div>
    );
  }

  // Stage 1: Common role selection page.
  if (!isLoggedIn && !showLogin) {
    return (
      <Welcome
        onSelectRole={(role) => {
          setSelectedRole(role);
          setShowLogin(true);
          setError("");
        }}
      />
    );
  }

  // Stage 2: Existing login page.
  if (!isLoggedIn) {
    return (
      <Login
        selectedRole={selectedRole || "student"}
        onLogin={handleLogin}
        onBack={handleBackToWelcome}
        initialError={error}
      />
    );
  }

  const isStaff = canManageComplaints(user?.role);

  const commonProps = {
    complaints,
    onSelectComplaint: setSelectedComplaint
  };

  // Stage 3: Role-specific pages.
  const pages = {
    dashboard: (
      <Dashboard
        {...commonProps}
        user={user}
      />
    ),

    notifications: <Notifications />,

    knowledge: <KnowledgeBase />,

    feedback: <Feedback />,

    settings: (
      <Settings
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        user={user}
        onUserChange={setUser}
      />
    )
  };

  if (isStaff) {
    // Staff/admin only.
    pages["staff-complaints"] = (
      <Complaints
        {...commonProps}
        loading={dataLoading}
        staffView
        user={user}
      />
    );
  } else {
    // Student only.
    pages.complaints = (
      <Complaints
        {...commonProps}
        loading={dataLoading}
      />
    );

    pages.report = (
      <ReportIssue
        onCreated={(complaint) => {
          setComplaints((old) => [
            complaint,
            ...old
          ]);
        }}
      />
    );
  }

  // Prevent rendering pages not available to this role.
  const currentPage = pages[activePage]
    ? pages[activePage]
    : pages.dashboard;

  return (
    <div className={darkMode ? "app dark-mode" : "app"}>

      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          if (pages[page]) {
            setActivePage(page);
            setSelectedComplaint(null);
          }
        }}
        onLogout={handleLogout}
        user={user}
      />

      <main className="main-content">

        {error && (
          <div role="alert" className="login-error">
            {error}
            <button onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}

        {selectedComplaint ? (
          <ComplaintDetails
            complaint={selectedComplaint}
            user={user}
            onUpdated={handleComplaintUpdated}
            onBack={() => setSelectedComplaint(null)}
          />
        ) : (
          currentPage
        )}

      </main>
    </div>
  );
}

export default App;
